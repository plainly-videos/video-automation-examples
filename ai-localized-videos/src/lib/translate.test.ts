import { expect, test } from "vitest";
import { LIMITS } from "@/lib/languages";
import {
  parseTranslation,
  translationInstructions,
  translationSchema,
} from "@/lib/translate";

const copy = {
  headline: "Verjüngende Creme",
  subheadline: "Jeden Tag",
  cta: "Jetzt kaufen",
};

test("translationInstructions names each language with its limits", () => {
  const text = translationInstructions(["de", "ja"]);
  expect(text).toContain("German");
  expect(text).toContain("Japanese");
  expect(text).toContain(`${LIMITS.latin.headline}`);
  expect(text).toContain(`${LIMITS.cjk.headline}`);
});

test("translationSchema requires every language", () => {
  expect(translationSchema(["de"]).safeParse({ de: copy }).success).toBe(true);
  expect(translationSchema(["de", "ja"]).safeParse({ de: copy }).success).toBe(
    false,
  );
});

test("parseTranslation rejects missing languages", () => {
  expect(() => parseTranslation(["de", "ja"], { de: copy })).toThrow(
    "ChatGPT did not return Japanese",
  );
  expect(() => parseTranslation(["de"], null)).toThrow(
    "ChatGPT did not return German",
  );
});

test("parseTranslation drops extra keys and trims", () => {
  expect(
    parseTranslation(["de"], {
      de: { ...copy, cta: " Jetzt kaufen " },
      fr: copy,
    }),
  ).toEqual({ de: copy });
});
