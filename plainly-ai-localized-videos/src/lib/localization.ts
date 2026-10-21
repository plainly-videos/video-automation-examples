import { z } from "zod";
import {
  COLORS,
  colorParameter,
  type Font,
  LIMITS,
  languageOf,
  type Script,
  SOURCE,
} from "@/lib/languages";

// Tags every render made by this example, so the app can list them again
export const EXAMPLE = "ai-localized-videos";

// The text on screen, the only part that is translated
export type Copy = { headline: string; subheadline: string; cta: string };

// The same in every language
export type Design = {
  productImage: string;
  logo: string;
  colorBackground: string;
  colorButton: string;
};

// One video: a language, its text, and a font when the template fonts can't
// show it
export type Version = { language: string; copy: Copy; font?: Font };

// English is always the first version
export type Localization = { design: Design; versions: Version[] };

// The template capitalizes the headline and the button itself
export const DEFAULT_COPY: Copy = {
  headline: "Rejuvenating cream",
  subheadline: "Hydrates and restores a youthful glow, every single day.",
  cta: "Buy now",
};

// Files inside the uploaded project, so the example works without any URLs
export const DEFAULT_DESIGN: Design = {
  productImage: "(Footage)/01_ASSETS/Image/product.png",
  logo: "(Footage)/01_ASSETS/Image/logo.png",
  colorBackground: COLORS.background,
  colorButton: COLORS.button,
};

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} can be at most ${max} characters`);

export const copySchema = (script: Script) =>
  z.object({
    headline: text("Headline", LIMITS[script].headline),
    subheadline: text("Subheadline", LIMITS[script].subheadline),
    cta: text("Button", LIMITS[script].cta),
  });

// Plainly downloads the font, so only public https links
export const fontSchema = z.object({
  url: z.url({ protocol: /^https$/, message: "Use an https:// font URL" }),
  name: z.string().trim().max(100).optional(),
});

// A public https URL, or a file inside the uploaded project
const media = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        z.url({ protocol: /^https$/ }).safeParse(value).success ||
        (value.startsWith("(Footage)/") && !value.includes("..")),
      `${label} must be an https:// URL or a (Footage)/ path`,
    );

const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color");

export const designSchema = z.object({
  productImage: media("Product image"),
  logo: media("Logo"),
  colorBackground: color,
  colorButton: color,
});

// Used by the form and again on the server, where the browser can send anything.
// Limits depend on each version's language, so the copy is checked per version
export const localizationSchema = z
  .object({
    design: designSchema,
    versions: z.array(
      z.object({
        language: z.string(),
        copy: z.object({
          headline: z.string(),
          subheadline: z.string(),
          cta: z.string(),
        }),
        font: fontSchema.optional(),
      }),
    ),
  })
  .superRefine(({ versions }, ctx) => {
    if (versions[0]?.language !== SOURCE.code) {
      ctx.addIssue({
        code: "custom",
        path: ["versions"],
        message: "English comes first",
      });
    }
    if (versions.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["versions"],
        message: "Pick at least one language",
      });
    }
    versions.forEach((version, i) => {
      const language = languageOf(version.language);
      if (!language) {
        ctx.addIssue({
          code: "custom",
          path: ["versions", i, "language"],
          message: "Unknown language",
        });
        return;
      }
      if (versions.findIndex((v) => v.language === version.language) < i) {
        ctx.addIssue({
          code: "custom",
          path: ["versions", i, "language"],
          message: `${language.name} is already in the list`,
        });
      }
      const copy = copySchema(language.script).safeParse(version.copy);
      for (const issue of copy.error?.issues ?? []) {
        ctx.addIssue({
          code: "custom",
          path: ["versions", i, "copy", ...issue.path],
          message: issue.message,
        });
      }
    });
  });

// The only place that knows the template's parameter names
export const toParameters = (
  design: Design,
  copy: Copy,
): Record<string, string> => ({
  Headline: copy.headline,
  Subheadline: copy.subheadline,
  CTA: copy.cta,
  ProductImage: design.productImage,
  Logo: design.logo,
  ColorBackground: colorParameter(design.colorBackground),
  ColorButton: colorParameter(design.colorButton),
});

type LayerFont = { fontUrl: string; font?: string };

// Render properties are keyed like the parameters. The font goes on all three
// text layers, no font means the template fonts
export function toProperties(
  font?: Font,
): Record<"Headline" | "Subheadline" | "CTA", LayerFont> | undefined {
  if (!font) return undefined;
  const layer: LayerFont = font.name
    ? { fontUrl: font.url, font: font.name }
    : { fontUrl: font.url };
  return { Headline: layer, Subheadline: layer, CTA: layer };
}

// Request body of POST /renders, one per language
export const renderBody = ({
  projectId,
  templateId,
  localizationId,
  languages,
  design,
  version,
}: {
  projectId: string;
  templateId: string;
  localizationId: string;
  languages: string[];
  design: Design;
  version: Version;
}) => {
  const properties = toProperties(version.font);
  return {
    projectId,
    templateId,
    parameters: toParameters(design, version.copy),
    ...(properties && { properties }),
    // Custom attributes let the app find this render again with the attribute
    // filter. `languages` tells the results page which videos to expect
    attributes: {
      example: EXAMPLE,
      localizationId,
      language: version.language,
      languages: languages.join(","),
    },
  };
};

export const RENDERS_URL = "https://api.plainlyvideos.com/api/v2/renders";

// The body sits in single quotes, so the shell expands nothing in the text.
// A quote in the text closes the string, adds an escaped quote and reopens it
export const toCurl = (body: string) =>
  [
    `curl -X POST ${RENDERS_URL} \\`,
    `  -u "$PLAINLY_API_KEY:" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${body.replaceAll("'", "'\\''")}'`,
  ].join("\n");

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  projectId?: string;
  templateId?: string;
  createdDate: string;
  // null when the render was created without custom attributes
  attributes: {
    localizationId?: string;
    language?: string;
    languages?: string;
  } | null;
  parameters?: Record<string, string>;
  output?: string;
  thumbnailUris?: string[];
  expired?: boolean;
  error?: { message?: string };
};

const IN_PROGRESS_STATES = ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"];

// Anything else (DONE, INVALID, FAILED, CANCELLED) is final
export const isFinished = (render: Pick<Render, "state">) =>
  !IN_PROGRESS_STATES.includes(render.state);

// The API returns much more (project zip URL, webhook, creator), keep only
// what the page shows, so nothing else reaches the browser
export const toRender = (render: Render): Render => ({
  id: render.id,
  state: render.state,
  projectId: render.projectId,
  templateId: render.templateId,
  createdDate: render.createdDate,
  attributes: render.attributes,
  parameters: render.parameters,
  output: render.output,
  thumbnailUris: render.thumbnailUris,
  expired: render.expired,
  error: render.error && { message: render.error.message },
});

// IN_PROGRESS -> "In progress"
export const stateLabel = (state: string) =>
  state.charAt(0) + state.slice(1).toLowerCase().replaceAll("_", " ");

// Localization ids are UUIDs, anything else never reaches the API
export const isLocalizationId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// A UUID v4. crypto.randomUUID only exists on https and localhost
export function newLocalizationId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const newest = (a: Render, b: Render) =>
  Date.parse(b.createdDate) > Date.parse(a.createdDate) ? b : a;

// A copied curl run twice gives two renders for one language. The newest counts
export function latestPerLanguage(renders: Render[]): Record<string, Render> {
  const latest: Record<string, Render> = {};
  for (const render of renders) {
    const language = render.attributes?.language;
    if (!language || !languageOf(language)) continue;
    latest[language] = latest[language]
      ? newest(latest[language], render)
      : render;
  }
  return latest;
}

// The languages the localization was made with. Renders made outside the app
// may miss the attribute or send something else than text, then the languages
// that are there count
export function expectedLanguages(renders: Render[]): string[] {
  const listed = renders.reduce<Render | undefined>(
    (found, render) =>
      typeof render.attributes?.languages === "string"
        ? found
          ? newest(found, render)
          : render
        : found,
    undefined,
  )?.attributes?.languages;
  const codes = listed
    ? listed.split(",")
    : Object.keys(latestPerLanguage(renders));
  return [...new Set(codes)].filter((code) => languageOf(code));
}

// Languages that were never created have nothing to wait for
export const isLocalizationFinished = (renders: Render[]) =>
  Object.values(latestPerLanguage(renders)).every(isFinished);

export type LocalizationSummary = {
  localizationId: string;
  createdDate: string;
  headline: string;
  languages: string[];
  done: number;
  failed: number;
  rendering: number;
};

export function groupLocalizations(renders: Render[]): LocalizationSummary[] {
  const byId = new Map<string, Render[]>();
  for (const render of renders) {
    const id = render.attributes?.localizationId;
    if (!isLocalizationId(id)) continue;
    byId.set(id, [...(byId.get(id) ?? []), render]);
  }

  return [...byId]
    .map(([localizationId, group]) => {
      const languages = expectedLanguages(group);
      const latest = latestPerLanguage(group);
      const present = languages.flatMap((code) => latest[code] ?? []);
      const done = present.filter((render) => render.state === "DONE").length;
      const rendering = present.filter((render) => !isFinished(render)).length;
      const english = latest[SOURCE.code];
      return {
        localizationId,
        // The first render marks when the localization was created
        createdDate: group.reduce(
          (first, render) =>
            Date.parse(render.createdDate) < Date.parse(first)
              ? render.createdDate
              : first,
          group[0].createdDate,
        ),
        headline: english?.parameters?.Headline ?? "",
        languages,
        done,
        rendering,
        // Failed, invalid, cancelled and never created languages
        failed: languages.length - done - rendering,
      };
    })
    .sort((a, b) => Date.parse(b.createdDate) - Date.parse(a.createdDate));
}

export function localizationStatus({
  done,
  failed,
  rendering,
  languages,
}: Pick<LocalizationSummary, "done" | "failed" | "rendering" | "languages">) {
  if (rendering > 0) return { label: "Rendering", tone: "rendering" } as const;
  if (failed > 0) return { label: `${failed} failed`, tone: "failed" } as const;
  return { label: `${done}/${languages.length} done`, tone: "done" } as const;
}

// Starts a new localization from an existing one: the English text, the design
// and the languages. Translations are made again. Any render in the org can
// carry our attributes, so values are checked and fall back to the defaults
export function fromRenders(renders: Render[]): {
  copy: Copy;
  design: Design;
  languages: string[];
} {
  const params: Record<string, unknown> =
    latestPerLanguage(renders)[SOURCE.code]?.parameters ?? {};
  const value = (key: string) => {
    const found = params[key];
    return typeof found === "string" ? found : "";
  };
  // Each design field falls back on its own when it doesn't pass the schema
  const field = <K extends keyof Design>(key: K, raw: string) => {
    const checked = designSchema.shape[key].safeParse(raw);
    return checked.success ? checked.data : DEFAULT_DESIGN[key];
  };
  return {
    copy: {
      headline: value("Headline"),
      subheadline: value("Subheadline"),
      cta: value("CTA"),
    },
    design: {
      productImage: field("productImage", value("ProductImage")),
      logo: field("logo", value("Logo")),
      colorBackground: field("colorBackground", `#${value("ColorBackground")}`),
      colorButton: field("colorButton", `#${value("ColorButton")}`),
    },
    languages: expectedLanguages(renders).filter(
      (code) => code !== SOURCE.code,
    ),
  };
}
