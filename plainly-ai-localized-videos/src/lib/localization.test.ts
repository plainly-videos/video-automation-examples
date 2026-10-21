import { expect, test } from "vitest";
import { LIMITS } from "@/lib/languages";
import {
  copySchema,
  DEFAULT_COPY,
  DEFAULT_DESIGN,
  designSchema,
  fontSchema,
  localizationSchema,
  renderBody,
  toCurl,
  toParameters,
  toProperties,
  type Version,
} from "@/lib/localization";

const design = DEFAULT_DESIGN;
const ja: Version = {
  language: "ja",
  copy: {
    headline: "若返りクリーム",
    subheadline: "毎日のケアに",
    cta: "今すぐ購入",
  },
  font: { url: "https://example.com/NotoSansJP.ttf", name: "NotoSansJP-Bold" },
};
const en: Version = { language: "en", copy: DEFAULT_COPY };

test("toParameters maps every template parameter", () => {
  const parameters = toParameters(design, en.copy);
  expect(Object.keys(parameters).sort()).toEqual([
    "CTA",
    "ColorBackground",
    "ColorButton",
    "Headline",
    "Logo",
    "ProductImage",
    "Subheadline",
  ]);
  // The template reads colors as hex digits without the #
  expect(parameters.ColorButton).toBe("E97314");
  expect(parameters.Headline).toBe(DEFAULT_COPY.headline);
});

test("toProperties sets the font on all three text layers, or nothing", () => {
  const font = {
    fontUrl: "https://example.com/NotoSansJP.ttf",
    font: "NotoSansJP-Bold",
  };
  expect(toProperties(ja.font)).toEqual({
    Headline: font,
    Subheadline: font,
    CTA: font,
  });
  expect(toProperties(undefined)).toBeUndefined();
  expect(toProperties({ url: "https://example.com/a.ttf" })?.Headline).toEqual({
    fontUrl: "https://example.com/a.ttf",
  });
});

test("renderBody tags the render and leaves out properties without a font", () => {
  const args = {
    projectId: "p",
    templateId: "t",
    localizationId: "id",
    languages: ["en", "ja"],
    design,
  };
  const body = renderBody({ ...args, version: ja });
  expect(body.attributes).toEqual({
    example: "ai-localized-videos",
    localizationId: "id",
    language: "ja",
    languages: "en,ja",
  });
  expect(body.properties?.CTA.fontUrl).toBe(
    "https://example.com/NotoSansJP.ttf",
  );
  expect(renderBody({ ...args, version: en })).not.toHaveProperty("properties");
});

test("fontSchema accepts only https URLs", () => {
  expect(
    fontSchema.safeParse({ url: "http://example.com/a.ttf" }).success,
  ).toBe(false);
  expect(fontSchema.safeParse({ url: "not a url" }).success).toBe(false);
  expect(
    fontSchema.safeParse({ url: "https://example.com/a.ttf" }).success,
  ).toBe(true);
});

test("localizationSchema requires English first and unique languages", () => {
  expect(
    localizationSchema.safeParse({ design, versions: [en, ja] }).success,
  ).toBe(true);
  expect(
    localizationSchema.safeParse({ design, versions: [ja, en] }).success,
  ).toBe(false);
  expect(
    localizationSchema.safeParse({ design, versions: [en, ja, ja] }).success,
  ).toBe(false);
  expect(
    localizationSchema.safeParse({
      design,
      versions: [en, { ...ja, language: "xx" }],
    }).success,
  ).toBe(false);
  // At least one translation
  expect(localizationSchema.safeParse({ design, versions: [en] }).success).toBe(
    false,
  );
});

test("limits depend on the script", () => {
  const long = "あ".repeat(LIMITS.cjk.headline + 1);
  const result = localizationSchema.safeParse({
    design,
    versions: [en, { ...ja, copy: { ...ja.copy, headline: long } }],
  });
  expect(result.success).toBe(false);
  // The error sits on the field of that card
  expect(result.error?.issues[0].path).toEqual([
    "versions",
    1,
    "copy",
    "headline",
  ]);
  expect(
    copySchema("latin").safeParse({
      ...en.copy,
      headline: "A".repeat(LIMITS.latin.headline),
    }).success,
  ).toBe(true);
});

test("designSchema rejects non-hex colors and unknown media", () => {
  expect(designSchema.safeParse(design).success).toBe(true);
  expect(
    designSchema.safeParse({ ...design, colorButton: "orange" }).success,
  ).toBe(false);
  expect(
    designSchema.safeParse({ ...design, logo: "https://example.com/logo.png" })
      .success,
  ).toBe(true);
  expect(
    designSchema.safeParse({ ...design, logo: "../secret.png" }).success,
  ).toBe(false);
});

test("toCurl escapes apostrophes", () => {
  expect(toCurl(JSON.stringify({ a: "l'été" }))).toContain(`l'\\''été`);
});
