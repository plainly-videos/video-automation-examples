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
  headline: "Rejuvenating face cream",
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

// Plainly reads media parameters starting with this from the uploaded project
export const PROJECT_FOLDER = "(Footage)/";
export const isProjectFile = (value: string) =>
  value.startsWith(PROJECT_FOLDER);

const httpsUrl = z.url({ protocol: /^https$/ });

// A file inside the uploaded project, or a public https URL. The prefix picks
// which one, so the form and the server check the same thing
const media = (label: string) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (isProjectFile(value)) {
        const path = value.slice(PROJECT_FOLDER.length);
        if (!path || path.includes("..")) {
          ctx.addIssue({
            code: "custom",
            message: `${label} needs a file path`,
          });
        }
      } else if (!httpsUrl.safeParse(value).success) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be an https:// URL`,
        });
      }
    });

const color = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, `Use a hex color like ${COLORS.button}`);

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
          headline: z.string().trim(),
          subheadline: z.string().trim(),
          cta: z.string().trim(),
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
