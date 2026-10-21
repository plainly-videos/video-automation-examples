// "latin" languages render with the template's own fonts, "cjk" ones need a
// font with their glyphs and have wider characters
export type Script = "latin" | "cjk";

// A font file Plainly downloads for the render. `name` is the PostScript name,
// needed to pick one weight of a variable font or one font of a collection
export type Font = { url: string; name?: string };

export type Language = {
  code: string;
  name: string;
  script: Script;
  // Used for every text layer when set, otherwise the template fonts stay
  font?: Font;
};

// Google Fonts only work as raw .ttf links from the google/fonts repository.
// These are variable fonts, the default weight is Thin, so a name picks Bold
const notoSans = (family: string): Font => ({
  url: `https://raw.githubusercontent.com/google/fonts/main/ofl/${family.toLowerCase()}/${family}%5Bwght%5D.ttf`,
  name: `${family}-Bold`,
});

// The source language, always rendered
export const SOURCE: Language = {
  code: "en",
  name: "English",
  script: "latin",
};

// Anton, Jost and DIN Condensed in the template cover every Latin language
// here. Cyrillic and Greek are missing from Anton, so they are not offered
export const LANGUAGES: Language[] = [
  { code: "de", name: "German", script: "latin" },
  { code: "es", name: "Spanish", script: "latin" },
  { code: "fr", name: "French", script: "latin" },
  { code: "it", name: "Italian", script: "latin" },
  { code: "pt", name: "Portuguese", script: "latin" },
  { code: "nl", name: "Dutch", script: "latin" },
  { code: "pl", name: "Polish", script: "latin" },
  { code: "ja", name: "Japanese", script: "cjk", font: notoSans("NotoSansJP") },
  {
    code: "zh",
    name: "Chinese (Simplified)",
    script: "cjk",
    font: notoSans("NotoSansSC"),
  },
  { code: "ko", name: "Korean", script: "cjk", font: notoSans("NotoSansKR") },
];

export const languageOf = (code: string) =>
  [SOURCE, ...LANGUAGES].find((language) => language.code === code);

// Characters that fit, measured on renders of the template. The headline and
// the subheadline both fit on two lines, longer text runs into the product
export const LIMITS: Record<
  Script,
  { headline: number; subheadline: number; cta: number }
> = {
  latin: { headline: 34, subheadline: 80, cta: 20 },
  cjk: { headline: 18, subheadline: 36, cta: 8 },
};

// The template's default colors, read off a render
export const COLORS = { background: "#035B29", button: "#E97314" };

// The template turns its color layers' text into a color with
// hexToColor("0x" + text), so it takes the hex digits without the #
export const colorParameter = (hex: string) =>
  hex.replace(/^#/, "").toUpperCase();
