import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { LANGUAGES } from "@/lib/languages";
import { copySchema } from "@/lib/localization";
import {
  MODEL,
  parseTranslation,
  translationInstructions,
  translationSchema,
} from "@/lib/translate";

// The key is read per request and never reaches the browser
const openai = createServerOnlyFn(() => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Copy .env.example to .env and add your API key.",
    );
  }
  return new OpenAI({ apiKey });
});

const translateInput = z.object({
  copy: copySchema("latin"),
  languages: z
    .array(
      z
        .string()
        .refine(
          (code) => LANGUAGES.some((language) => language.code === code),
          "Unknown language",
        ),
    )
    .min(1, "Pick at least one language")
    .refine(
      (codes) => new Set(codes).size === codes.length,
      "Duplicate language",
    ),
});

// One call for all languages. Structured output makes the model answer with
// JSON that matches the schema, one entry per language code
export const translate = createServerFn({ method: "POST" })
  .validator(translateInput)
  .handler(async ({ data: { copy, languages } }) => {
    const response = await openai().responses.parse({
      model: MODEL,
      instructions: translationInstructions(languages),
      input: JSON.stringify(copy),
      text: {
        format: zodTextFormat(translationSchema(languages), "translations"),
      },
    });
    return parseTranslation(languages, response.output_parsed);
  });
