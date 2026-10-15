import {
  isProductId,
  type ProductCopy,
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
  FORMATS.includes(value as Format);

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
export function templatesByFormat(
  templates: Template[],
): Record<Format, string> {
  const found: Partial<Record<Format, string>> = {};
  for (const template of templates) {
    const format = formatOf(template.resolution);
    if (format && !found[format]) found[format] = template.id;
  }
  for (const format of FORMATS) {
    if (!found[format]) throw new Error(`Project has no ${format} template`);
  }
  return found as Record<Format, string>;
}

export type Ad = { productId: ProductId } & ProductCopy;
export type TextField = keyof ProductCopy;

export const LABELS: Record<TextField, string> = {
  headline: "Headline",
  offer: "Offer",
  price: "Price",
  oldPrice: "Old price",
  cta: "Call to action",
};

// Short enough to fit the narrow 9:16 format
export const LIMITS: Record<TextField, number> = {
  headline: 40,
  offer: 15,
  price: 10,
  oldPrice: 10,
  cta: 15,
};

export const OPTIONAL_FIELDS: TextField[] = ["oldPrice"];

export const adFor = (productId: ProductId): Ad => ({
  productId,
  ...products[productId].copy,
});

// Runs on the server: the browser can send anything, so check every field
export function pickAd(input: unknown): Ad {
  const data = (input ?? {}) as Record<string, unknown>;
  if (!isProductId(data.productId)) {
    throw new Error(`Unknown product: ${data.productId}`);
  }
  const text = (field: TextField) => {
    const raw = data[field];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value && !OPTIONAL_FIELDS.includes(field)) {
      throw new Error(`${LABELS[field]} is required`);
    }
    if (value.length > LIMITS[field]) {
      throw new Error(
        `${LABELS[field]} can be at most ${LIMITS[field]} characters`,
      );
    }
    return value;
  };
  return {
    productId: data.productId,
    headline: text("headline"),
    offer: text("offer"),
    price: text("price"),
    oldPrice: text("oldPrice"),
    cta: text("cta"),
  };
}

// The only place that knows the template's parameter names
export const toParameters = (ad: Ad): Record<string, string> => ({
  plainlyEditHeadline: ad.headline,
  plainlyEditOffer: ad.offer,
  plainlyEditPrice: ad.price,
  plainlyEditOldPrice: ad.oldPrice,
  plainlyEditCta: ad.cta,
  plainlyEditImage: products[ad.productId].image,
});

// Reverse of toParameters, prefills the form from an existing render
// Any render in the org can carry our attributes, so values are not trusted to be text
export function fromParameters(params: Record<string, unknown>): Ad {
  const text = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };
  return {
    productId: productIdOf(params.plainlyEditImage) ?? productIds[0],
    headline: text("plainlyEditHeadline"),
    offer: text("plainlyEditOffer"),
    price: text("plainlyEditPrice"),
    oldPrice: text("plainlyEditOldPrice"),
    cta: text("plainlyEditCta"),
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

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  createdDate: string;
  // null when the render was created without custom attributes
  attributes: { adId?: string; format?: string } | null;
  // This example only sends text parameters
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
