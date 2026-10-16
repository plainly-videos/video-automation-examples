import { z } from "zod";
import {
  isProductId,
  type ProductId,
  productIdOf,
  productIds,
  products,
} from "@/products";

// Tags every render made by this example, so the app can list them again
export const EXAMPLE = "dynamic-video-ads";

export const FORMATS = ["16:9", "9:16", "1:1"] as const;
export type Format = (typeof FORMATS)[number];

export const isFormat = (value: unknown): value is Format =>
  FORMATS.some((format) => format === value);

// Width divided by height
const RATIOS: Record<Format, number> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
};

export function formatOf(resolution?: {
  width?: number;
  height?: number;
}): Format | undefined {
  if (!resolution?.width || !resolution?.height) return undefined;
  const ratio = resolution.width / resolution.height;
  // Small tolerance, so sizes like 1366x768 still count as 16:9
  return FORMATS.find((format) => Math.abs(RATIOS[format] - ratio) < 0.01);
}

export type Template = {
  id: string;
  resolution?: { width?: number; height?: number };
};

// One template per format, matched by the size of its rendered composition.
// The first match wins, other templates in the project are ignored.
export function findTemplates(
  templates: Template[],
): Partial<Record<Format, string>> {
  const found: Partial<Record<Format, string>> = {};
  for (const format of FORMATS) {
    found[format] = templates.find(
      (t) => formatOf(t.resolution) === format,
    )?.id;
  }
  return found;
}

// Rendering needs all three formats
export function templatesByFormat(
  templates: Template[],
): Record<Format, string> {
  const found = findTemplates(templates);
  const idOf = (format: Format) => {
    const id = found[format];
    if (!id) throw new Error(`Project has no ${format} template`);
    return id;
  };
  return { "16:9": idOf("16:9"), "9:16": idOf("9:16"), "1:1": idOf("1:1") };
}

// One product slide of the video: the picked product's image, with a name
// and price that can be edited
export type Slot = { productId: ProductId; name: string; price: string };
// The button sits on every product slide
export type Ad = { hook: string; button: string; cta: string; slots: Slot[] };

export const slotFor = (productId: ProductId): Slot => ({
  productId,
  name: products[productId].name,
  price: products[productId].price,
});

// The template shows exactly three products
export const DEFAULT_AD: Ad = {
  hook: "New season picks",
  button: "Shop now",
  cta: "Shop the collection",
  slots: productIds.slice(0, 3).map(slotFor),
};

// Short enough to fit the narrow 9:16 format
export const LIMITS = { hook: 24, button: 12, cta: 24, name: 20, price: 6 };

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} can be at most ${max} characters`);

// Used by the form and again on the server, where the browser can send anything
export const adSchema = z.object({
  hook: text("Hook", LIMITS.hook),
  button: text("Button", LIMITS.button),
  cta: text("Call to action", LIMITS.cta),
  slots: z
    .array(
      z.object({
        productId: z.custom<ProductId>(isProductId, "Unknown product"),
        name: text("Name", LIMITS.name),
        price: text("Price", LIMITS.price),
      }),
    )
    .length(DEFAULT_AD.slots.length, "An ad has three products"),
});

// The only place that knows the template's parameter names. Product1, Price1
// and Image1 make the first product slide, and so on. ButtonSwitch is left
// out, its default shows the button
export const toParameters = (ad: Ad): Record<string, string> => ({
  Hook: ad.hook,
  ButtonCTA: ad.button,
  CTA: ad.cta,
  ...Object.fromEntries(
    ad.slots.flatMap((slot, i) => [
      [`Product${i + 1}`, slot.name],
      [`Price${i + 1}`, slot.price],
      [`Image${i + 1}`, products[slot.productId].image],
    ]),
  ),
});

// Reverse of toParameters, prefills the form from an existing render
// Any render in the org can carry our attributes, so values are not trusted to be text
export function fromParameters(params: Record<string, unknown>): Ad {
  const text = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };
  return {
    hook: text("Hook"),
    button: text("ButtonCTA"),
    cta: text("CTA"),
    slots: DEFAULT_AD.slots.map((fallback, i) => ({
      productId: productIdOf(params[`Image${i + 1}`]) ?? fallback.productId,
      name: text(`Product${i + 1}`),
      price: text(`Price${i + 1}`),
    })),
  };
}

// Request body of POST /renders. The three renders of an ad differ only in
// templateId and the format attribute
export const renderBody = ({
  projectId,
  templateId,
  adId,
  format,
  parameters,
}: {
  projectId: string;
  templateId: string;
  adId: string;
  format: Format;
  parameters: Record<string, string>;
}) => ({
  projectId,
  templateId,
  parameters,
  // Custom attributes let the app find this render again with the attribute filter
  attributes: { example: EXAMPLE, adId, format },
});

// What the API request card needs from the server to show a runnable request
export type RenderTarget = {
  projectId: string;
  // Formats without a template are missing
  templates: Partial<Record<Format, string>>;
};

export const RENDERS_URL = "https://api.plainlyvideos.com/api/v2/renders";

// The body sits in single quotes, so the shell expands nothing in the ad
// text. A quote in the text closes the string, adds an escaped quote and reopens it
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
  createdDate: string;
  // null when the render was created without custom attributes
  attributes: { adId?: string; format?: string } | null;
  // Text and image URLs, all strings
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

// Only failed or never created formats are rendered again. Anything else
// would create a duplicate render, and every render costs credits
export const canRetry = (render?: Pick<Render, "state">) =>
  !render || (isFinished(render) && render.state !== "DONE");

// The API returns much more (project zip URL, webhook, creator), keep only
// what the page shows, so nothing else reaches the browser
export const toRender = (render: Render): Render => ({
  id: render.id,
  state: render.state,
  createdDate: render.createdDate,
  attributes: render.attributes,
  parameters: render.parameters,
  output: render.output,
  thumbnailUris: render.thumbnailUris,
  expired: render.expired,
  error: render.error && { message: render.error.message },
});

// IN_PROGRESS -> "In progress", for people instead of the API
export const stateLabel = (state: string) =>
  state.charAt(0) + state.slice(1).toLowerCase().replaceAll("_", " ");

// Ad ids are UUIDs, anything else never reaches the API
export const isAdId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// A retry adds a new render with the same attributes, and the API's sort
// order is not documented, so compare createdDate ourselves
export function latestPerFormat(
  renders: Render[],
): Partial<Record<Format, Render>> {
  const latest: Partial<Record<Format, Render>> = {};
  for (const render of renders) {
    const format = render.attributes?.format;
    if (!isFormat(format)) continue;
    const current = latest[format];
    if (
      !current ||
      Date.parse(render.createdDate) > Date.parse(current.createdDate)
    ) {
      latest[format] = render;
    }
  }
  return latest;
}

// Formats that were never created have nothing to wait for
export const isAdFinished = (renders: Render[]) => {
  const latest = latestPerFormat(renders);
  return FORMATS.every((format) => {
    const render = latest[format];
    return !render || isFinished(render);
  });
};

export type AdSummary = {
  adId: string;
  createdDate: string;
  ad: Ad;
  done: number;
  failed: number;
  rendering: number;
};

export function groupAds(renders: Render[]): AdSummary[] {
  const byAd = new Map<string, Render[]>();
  for (const render of renders) {
    const adId = render.attributes?.adId;
    if (!isAdId(adId)) continue;
    byAd.set(adId, [...(byAd.get(adId) ?? []), render]);
  }

  return [...byAd]
    .map(([adId, group]) => {
      const latest = latestPerFormat(group);
      const present = FORMATS.flatMap((format) => latest[format] ?? []);
      const done = present.filter((render) => render.state === "DONE").length;
      const rendering = present.filter((render) => !isFinished(render)).length;
      return {
        adId,
        // The first render marks when the ad was created, retries come later
        createdDate: group.reduce(
          (first, render) =>
            Date.parse(render.createdDate) < Date.parse(first)
              ? render.createdDate
              : first,
          group[0].createdDate,
        ),
        ad: fromParameters(group.find((r) => r.parameters)?.parameters ?? {}),
        done,
        rendering,
        // Failed, invalid, cancelled and never created formats
        failed: FORMATS.length - done - rendering,
      };
    })
    .sort((a, b) => Date.parse(b.createdDate) - Date.parse(a.createdDate));
}

export function adStatus({
  done,
  failed,
  rendering,
}: Pick<AdSummary, "done" | "failed" | "rendering">) {
  if (rendering > 0) return { label: "Rendering", tone: "rendering" } as const;
  if (failed > 0) return { label: `${failed} failed`, tone: "failed" } as const;
  return { label: `${done}/${FORMATS.length} done`, tone: "done" } as const;
}
