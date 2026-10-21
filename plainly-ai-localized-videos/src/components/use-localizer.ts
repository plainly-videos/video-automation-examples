import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  fontFields,
  type Initial,
  replaceVersions,
  toLocalization,
  type Values,
} from "@/lib/form";
import { LANGUAGES, languageOf } from "@/lib/languages";
import { translate } from "@/lib/openai";
import { createLocalization } from "@/lib/plainly";

const messageOf = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

// The form and its two actions: translate the English copy, and render every
// language once the translations are reviewed
export function useLocalizer(initial: Initial) {
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string>();
  const [renderError, setRenderError] = useState<string>();
  const translateFn = useServerFn(translate);
  const createFn = useServerFn(createLocalization);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { ...initial, versions: [] } as Values,
    onSubmit: async ({ value }) => {
      setRenderError(undefined);
      try {
        // The server checks the same schema again
        const { localizationId } = await createFn({
          data: toLocalization(value),
        });
        await navigate({
          to: "/video/$localizationId",
          params: { localizationId },
        });
      } catch (err) {
        setRenderError(messageOf(err));
      }
    },
  });

  // One call for all picked languages. Replaces earlier translations and edits
  const translateAll = async () => {
    const { copy, languages } = form.state.values;
    setTranslateError(undefined);
    setTranslating(true);
    try {
      const translated = await translateFn({ data: { copy, languages } });
      replaceVersions(
        form,
        languages.map((language) => ({
          language,
          copy: translated[language],
          font: fontFields(languageOf(language)?.font),
        })),
      );
    } catch (err) {
      setTranslateError(messageOf(err));
    } finally {
      setTranslating(false);
    }
  };

  // Turning a language off drops its translation, turning one on needs a new
  // translation. The list keeps the order of LANGUAGES
  const toggleLanguage = (code: string) => {
    const { languages, versions } = form.state.values;
    if (languages.includes(code)) {
      form.setFieldValue(
        "languages",
        languages.filter((c) => c !== code),
      );
      const index = versions.findIndex((v) => v.language === code);
      if (index >= 0) form.removeFieldValue("versions", index);
    } else {
      form.setFieldValue(
        "languages",
        LANGUAGES.map((l) => l.code).filter(
          (c) => c === code || languages.includes(c),
        ),
      );
    }
  };

  return {
    form,
    translating,
    translateError,
    renderError,
    translateAll,
    toggleLanguage,
  };
}

export type Localizer = ReturnType<typeof useLocalizer>;
export type LocalizerForm = Localizer["form"];
