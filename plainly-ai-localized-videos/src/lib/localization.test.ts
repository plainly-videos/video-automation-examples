import { expect, test } from "vitest";
import { LIMITS } from "@/lib/languages";
import {
  copySchema,
  DEFAULT_COPY,
  DEFAULT_DESIGN,
  designSchema,
  expectedLanguages,
  fontSchema,
  fromRenders,
  groupLocalizations,
  isLocalizationFinished,
  isLocalizationId,
  latestPerLanguage,
  localizationSchema,
  localizationStatus,
  newLocalizationId,
  type Render,
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

const ID = "0b5e1c1e-6a4f-4c3e-9f3a-2d8e8f1a7b10";
const OTHER = "6f1d2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b";

const render = (
  language: string,
  state: string,
  createdDate: string,
  extra: Partial<Render> = {},
): Render => ({
  id: `${language}-${createdDate}`,
  state,
  createdDate,
  attributes: { localizationId: ID, language, languages: "en,ja,de" },
  parameters: { Headline: `${language} headline` },
  ...extra,
});

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

test("localization ids are UUIDs", () => {
  expect(isLocalizationId(newLocalizationId())).toBe(true);
  expect(isLocalizationId("..")).toBe(false);
  expect(isLocalizationId(undefined)).toBe(false);
});

test("latestPerLanguage keeps the newest render per language", () => {
  const latest = latestPerLanguage([
    render("en", "FAILED", "2026-10-21T10:00:00Z"),
    render("en", "DONE", "2026-10-21T11:00:00Z"),
    render("ja", "DONE", "2026-10-21T10:30:00Z"),
  ]);
  expect(latest.en.state).toBe("DONE");
  expect(latest.ja.state).toBe("DONE");
});

test("expectedLanguages reads the languages attribute", () => {
  expect(
    expectedLanguages([render("en", "DONE", "2026-10-21T10:00:00Z")]),
  ).toEqual(["en", "ja", "de"]);
});

test("expectedLanguages falls back to present renders without a languages attribute", () => {
  const bare = (language: string) =>
    render(language, "DONE", "2026-10-21T10:00:00Z", {
      attributes: { localizationId: ID, language },
    });
  expect(expectedLanguages([bare("en"), bare("ja"), bare("xx")])).toEqual([
    "en",
    "ja",
  ]);
});

test("isLocalizationFinished ignores languages that were never created", () => {
  expect(
    isLocalizationFinished([render("en", "DONE", "2026-10-21T10:00:00Z")]),
  ).toBe(true);
  expect(
    isLocalizationFinished([
      render("en", "DONE", "2026-10-21T10:00:00Z"),
      render("ja", "QUEUED", "2026-10-21T10:00:00Z"),
    ]),
  ).toBe(false);
});

test("groupLocalizations ignores renders with bad attributes", () => {
  const summaries = groupLocalizations([
    render("en", "DONE", "2026-10-21T10:00:00Z", {
      parameters: { Headline: "Glow" },
    }),
    render("ja", "IN_PROGRESS", "2026-10-21T10:00:01Z"),
    {
      id: "x",
      state: "DONE",
      createdDate: "2026-10-21T09:00:00Z",
      attributes: null,
    },
    render("en", "DONE", "2026-10-21T09:00:00Z", {
      attributes: { localizationId: "not-a-uuid", language: "en" },
    }),
    render("xx", "DONE", "2026-10-21T10:00:02Z"),
  ]);
  expect(summaries).toEqual([
    {
      localizationId: ID,
      createdDate: "2026-10-21T10:00:00Z",
      headline: "Glow",
      languages: ["en", "ja", "de"],
      done: 1,
      rendering: 1,
      // German was never created
      failed: 1,
    },
  ]);
});

test("groupLocalizations sorts newest first", () => {
  const summaries = groupLocalizations([
    render("en", "DONE", "2026-10-21T10:00:00Z"),
    render("en", "DONE", "2026-10-21T12:00:00Z", {
      attributes: { localizationId: OTHER, language: "en", languages: "en,de" },
    }),
  ]);
  expect(summaries.map((s) => s.localizationId)).toEqual([OTHER, ID]);
});

test("localizationStatus summarizes the counts", () => {
  expect(
    localizationStatus({
      done: 2,
      failed: 0,
      rendering: 1,
      languages: ["en", "de", "ja"],
    }).label,
  ).toBe("Rendering");
  expect(
    localizationStatus({
      done: 2,
      failed: 1,
      rendering: 0,
      languages: ["en", "de", "ja"],
    }).label,
  ).toBe("1 failed");
  expect(
    localizationStatus({
      done: 3,
      failed: 0,
      rendering: 0,
      languages: ["en", "de", "ja"],
    }).label,
  ).toBe("3/3 done");
});

test("fromRenders restores the compose step from the English render", () => {
  const restored = fromRenders([
    render("ja", "DONE", "2026-10-21T10:00:00Z", {
      parameters: { Headline: "若返り" },
    }),
    render("en", "DONE", "2026-10-21T10:00:00Z", {
      parameters: {
        ...toParameters(design, en.copy),
        ColorButton: "1E3A8A",
      },
    }),
  ]);
  expect(restored.copy).toEqual(DEFAULT_COPY);
  expect(restored.design.colorButton).toBe("#1E3A8A");
  expect(restored.languages).toEqual(["ja", "de"]);
});

test("fromRenders falls back to defaults for odd values", () => {
  const restored = fromRenders([
    render("en", "DONE", "2026-10-21T10:00:00Z", {
      parameters: { Headline: "Glow", ColorButton: "orange" },
    }),
  ]);
  expect(restored.copy.headline).toBe("Glow");
  expect(restored.design.colorButton).toBe(DEFAULT_DESIGN.colorButton);
  expect(restored.design.logo).toBe(DEFAULT_DESIGN.logo);
});

test("groupLocalizations survives a languages attribute that is not text", () => {
  const odd = render("en", "DONE", "2026-10-21T10:00:00Z", {
    // A copied curl can send any JSON value as an attribute
    attributes: {
      localizationId: ID,
      language: "en",
      languages: ["en", "de"] as unknown as string,
    },
  });
  expect(groupLocalizations([odd])[0].languages).toEqual(["en"]);
});
