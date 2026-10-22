import { languageOf, SOURCE } from "@/lib/languages";
import {
  type Copy,
  DEFAULT_DESIGN,
  type Design,
  designSchema,
} from "@/lib/localization";

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
