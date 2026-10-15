import { expect, test } from "vitest";
import {
  adFor,
  formatOf,
  fromParameters,
  pickAd,
  renderBody,
  templatesByFormat,
  toParameters,
} from "@/lib/ad";

const valid = {
  productId: "sneakers",
  headline: "Run further. Recover faster.",
  offer: "20% OFF",
  price: "$79",
  oldPrice: "$99",
  cta: "Shop now",
};

test("formatOf maps resolutions to aspect ratios", () => {
  expect(formatOf({ width: 1920, height: 1080 })).toBe("16:9");
  expect(formatOf({ width: 1080, height: 1920 })).toBe("9:16");
  expect(formatOf({ width: 1080, height: 1080 })).toBe("1:1");
  // Not exactly 16:9, but close enough to be used as one
  expect(formatOf({ width: 1366, height: 768 })).toBe("16:9");
  expect(formatOf({ width: 800, height: 600 })).toBeUndefined();
  expect(formatOf({ width: 1920, height: 0 })).toBeUndefined();
  expect(formatOf(undefined)).toBeUndefined();
});

test("templatesByFormat picks the first template per format", () => {
  expect(
    templatesByFormat([
      { id: "wide", resolution: { width: 1920, height: 1080 } },
      { id: "wide-4k", resolution: { width: 3840, height: 2160 } },
      { id: "no-resolution" },
      { id: "tall", resolution: { width: 1080, height: 1920 } },
      { id: "old-tv", resolution: { width: 800, height: 600 } },
      { id: "square", resolution: { width: 1080, height: 1080 } },
    ]),
  ).toEqual({ "16:9": "wide", "9:16": "tall", "1:1": "square" });
});

test("templatesByFormat names the missing format", () => {
  expect(() =>
    templatesByFormat([
      { id: "wide", resolution: { width: 1920, height: 1080 } },
      { id: "square", resolution: { width: 1080, height: 1080 } },
    ]),
  ).toThrow("Project has no 9:16 template");
  expect(() => templatesByFormat([])).toThrow("Project has no 16:9 template");
});

test("adFor fills an ad with the product's copy", () => {
  expect(adFor("sneakers")).toEqual(valid);
});

test("pickAd trims fields and allows an empty old price", () => {
  expect(
    pickAd({
      ...valid,
      headline: "  Run further. Recover faster.  ",
      oldPrice: "",
    }),
  ).toEqual({ ...valid, oldPrice: "" });
});

test("pickAd rejects unknown products", () => {
  expect(() => pickAd({ ...valid, productId: "boat" })).toThrow(
    "Unknown product: boat",
  );
  // Inherited object keys are not products
  expect(() => pickAd({ ...valid, productId: "toString" })).toThrow(
    "Unknown product",
  );
  expect(() => pickAd(null)).toThrow("Unknown product");
});

test("pickAd requires every field except old price", () => {
  expect(() => pickAd({ ...valid, headline: "   " })).toThrow(
    "Headline is required",
  );
  expect(() => pickAd({ ...valid, offer: undefined })).toThrow(
    "Offer is required",
  );
  // The browser can send anything, a number is not text
  expect(() => pickAd({ ...valid, cta: 42 })).toThrow(
    "Call to action is required",
  );
});

test("pickAd enforces length limits", () => {
  expect(() => pickAd({ ...valid, headline: "x".repeat(41) })).toThrow(
    "Headline can be at most 40 characters",
  );
  expect(pickAd({ ...valid, headline: "x".repeat(40) }).headline).toHaveLength(
    40,
  );
  expect(() => pickAd({ ...valid, oldPrice: "x".repeat(11) })).toThrow(
    "Old price can be at most 10 characters",
  );
});

test("toParameters maps an ad to the template parameters", () => {
  expect(toParameters(adFor("sneakers"))).toEqual({
    plainlyEditHeadline: "Run further. Recover faster.",
    plainlyEditOffer: "20% OFF",
    plainlyEditPrice: "$79",
    plainlyEditOldPrice: "$99",
    plainlyEditCta: "Shop now",
    plainlyEditImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&q=80",
  });
});

test("fromParameters reverses toParameters", () => {
  const ad = adFor("watch");
  expect(fromParameters(toParameters(ad))).toEqual(ad);
});

test("fromParameters falls back for unknown images and missing values", () => {
  expect(
    fromParameters({ plainlyEditImage: "https://example.com/boat.png" }),
  ).toEqual({
    productId: "sneakers",
    headline: "",
    offer: "",
    price: "",
    oldPrice: "",
    cta: "",
  });
});

test("renderBody tags the render with the example, ad and format", () => {
  expect(
    renderBody({
      projectId: "project",
      templateId: "template",
      adId: "ad",
      format: "9:16",
      parameters: { plainlyEditHeadline: "Hi" },
    }),
  ).toEqual({
    projectId: "project",
    templateId: "template",
    parameters: { plainlyEditHeadline: "Hi" },
    attributes: { example: "dynamic-video-ads", adId: "ad", format: "9:16" },
  });
});
