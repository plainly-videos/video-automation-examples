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
export const fromParameters = (params: Record<string, string>): Ad => ({
  productId: productIdOf(params.plainlyEditImage) ?? productIds[0],
  headline: params.plainlyEditHeadline ?? "",
  offer: params.plainlyEditOffer ?? "",
  price: params.plainlyEditPrice ?? "",
  oldPrice: params.plainlyEditOldPrice ?? "",
  cta: params.plainlyEditCta ?? "",
});

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
