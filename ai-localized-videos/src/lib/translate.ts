import { z } from "zod";
import { LIMITS, languageOf } from "@/lib/languages";
import type { Copy } from "@/lib/localization";

// A small, fast model is enough for three short texts per language
export const MODEL = "gpt-5.4-mini";

const copy = z.object({
  headline: z.string().trim(),
  subheadline: z.string().trim(),
  cta: z.string().trim(),
});

// Structured output: one object per language code, all of them required.
// Lengths are not enforced here, the review step shows text that is too long
export const translationSchema = (codes: string[]) =>
  z.object(Object.fromEntries(codes.map((code) => [code, copy])));

const nameOf = (code: string) => languageOf(code)?.name ?? code;

export const translationInstructions = (codes: string[]) =>
  [
    "You translate the on-screen text of a short square product video ad from English.",
    "Translate the meaning and keep the tone, not word for word. The headline is short and punchy, the call to action is a short imperative for a button.",
    "Never add quotes, emojis or text that is not in the original.",
    "Stay within these character limits, they are what fits on screen:",
    ...codes.map((code) => {
      const language = languageOf(code);
      const limits = LIMITS[language?.script ?? "latin"];
      return `- ${code} (${nameOf(code)}): headline ${limits.headline}, subheadline ${limits.subheadline}, cta ${limits.cta}`;
    }),
    "Return one entry per language code.",
  ].join("\n");

// The model can still skip a language, every requested one must be there
export function parseTranslation(
  codes: string[],
  data: unknown,
): Record<string, Copy> {
  const found = (data ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    codes.map((code) => {
      const parsed = copy.safeParse(found[code]);
      if (!parsed.success) {
        throw new Error(`ChatGPT did not return ${nameOf(code)}`);
      }
      return [code, parsed.data];
    }),
  );
}
