import { expect, test } from "vitest";
import {
  COLORS,
  colorParameter,
  LANGUAGES,
  LIMITS,
  languageOf,
  SOURCE,
} from "@/lib/languages";

test("language codes are unique and include the source", () => {
  const codes = [SOURCE, ...LANGUAGES].map((l) => l.code);
  expect(new Set(codes).size).toBe(codes.length);
  expect(languageOf("en")).toBe(SOURCE);
  expect(languageOf("xx")).toBeUndefined();
});

test("default fonts are https and non-Latin languages have one", () => {
  for (const l of LANGUAGES) {
    if (l.font) expect(l.font.url).toMatch(/^https:\/\//);
    if (l.script === "cjk") expect(l.font).toBeDefined();
  }
  expect(LANGUAGES.map((l) => l.code)).toEqual(
    expect.arrayContaining(["de", "ja", "zh", "ko"]),
  );
});

test("CJK limits are stricter than Latin ones", () => {
  for (const key of ["headline", "subheadline", "cta"] as const) {
    expect(LIMITS.cjk[key]).toBeLessThan(LIMITS.latin[key]);
  }
});

test("colorParameter maps template defaults", () => {
  // The template reads the color as hex digits without the #
  expect(colorParameter(COLORS.button)).toBe("E97314");
  expect(colorParameter("#1e3a8a")).toBe("1E3A8A");
});
