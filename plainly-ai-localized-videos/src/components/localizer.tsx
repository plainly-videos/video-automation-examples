import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Languages, RefreshCw } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ApiRequest, type RenderTarget } from "@/components/api-request";
import { PlayingPreview } from "@/components/localized-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type FontFields,
  replaceVersions,
  type VersionFields,
} from "@/lib/form";
import {
  type Font,
  LANGUAGES,
  LIMITS,
  languageOf,
  SOURCE,
} from "@/lib/languages";
import {
  type Copy,
  copySchema,
  type Design,
  designSchema,
  fontSchema,
  type Localization,
} from "@/lib/localization";
import { translate } from "@/lib/openai";
import { createLocalization } from "@/lib/plainly";

export type Initial = { copy: Copy; design: Design; languages: string[] };

type Values = Initial & { versions: VersionFields[] };

const toFont = ({ url, name }: FontFields): Font | undefined =>
  url.trim()
    ? { url: url.trim(), ...(name.trim() && { name: name.trim() }) }
    : undefined;

const fontFields = (font?: Font): FontFields => ({
  url: font?.url ?? "",
  name: font?.name ?? "",
});

// What createLocalization receives: English from the compose step, then the
// reviewed translations
const toLocalization = ({ copy, design, versions }: Values): Localization => ({
  design,
  versions: [
    { language: SOURCE.code, copy },
    ...versions.map(({ language, copy, font }) => ({
      language,
      copy,
      font: toFont(font),
    })),
  ],
});

const fontUrl = z.union([z.literal(""), fontSchema.shape.url]);

export function Localizer({
  initial,
  localizationId,
  target,
}: {
  initial: Initial;
  // Shown in the API request card, the server makes its own when rendering
  localizationId: string;
  target?: RenderTarget;
}) {
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
        setRenderError(err instanceof Error ? err.message : String(err));
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
      setTranslateError(err instanceof Error ? err.message : String(err));
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

  // One translation: its preview, its text and its font
  const versionCard = (
    index: number,
    version: VersionFields,
    design: Design,
  ) => {
    const language = languageOf(version.language);
    const script = language?.script ?? "latin";
    const font = toFont(version.font);
    return (
      <LanguageCard
        name={language?.name ?? version.language}
        note={font ? "Custom font" : undefined}
      >
        <PlayingPreview copy={version.copy} design={design} font={font} />
        {(["headline", "subheadline", "cta"] as const).map((key) => (
          <form.Field
            key={key}
            name={`versions[${index}].copy.${key}`}
            validators={{
              // Translations can come back too long, so they are checked as
              // soon as they show up
              onMount: copySchema(script).shape[key],
              onChange: copySchema(script).shape[key],
            }}
          >
            {(field) => (
              <TextInput
                field={field}
                label={LABELS[key]}
                max={LIMITS[script][key]}
                showErrors
              />
            )}
          </form.Field>
        ))}
        <details className="text-sm" open={Boolean(language?.font)}>
          <summary className="cursor-pointer text-muted-foreground">
            Font
          </summary>
          <div className="mt-3 grid gap-3">
            <form.Field
              name={`versions[${index}].font.url`}
              validators={{ onChange: fontUrl }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  label="Font URL"
                  description="A .ttf or .otf file. Empty keeps the template fonts."
                />
              )}
            </form.Field>
            <form.Field name={`versions[${index}].font.name`}>
              {(field) => (
                <TextInput
                  field={field}
                  label="Font name"
                  description="PostScript name, picks one weight of a variable font."
                />
              )}
            </form.Field>
          </div>
        </details>
      </LanguageCard>
    );
  };

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>1. Write the ad in English</CardTitle>
          <CardDescription>
            The text is translated, the images and colors stay the same in every
            language.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <form.Field
              name="copy.headline"
              validators={{ onChange: copySchema("latin").shape.headline }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  label="Headline"
                  max={LIMITS.latin.headline}
                  className="sm:col-span-2"
                />
              )}
            </form.Field>
            <form.Field
              name="copy.subheadline"
              validators={{ onChange: copySchema("latin").shape.subheadline }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  label="Subheadline"
                  max={LIMITS.latin.subheadline}
                  className="sm:col-span-2"
                />
              )}
            </form.Field>
            <form.Field
              name="copy.cta"
              validators={{ onChange: copySchema("latin").shape.cta }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  label="Button"
                  max={LIMITS.latin.cta}
                  className="sm:col-span-2"
                />
              )}
            </form.Field>
            <form.Field
              name="design.productImage"
              validators={{ onChange: designSchema.shape.productImage }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  label="Product image"
                  description="An https:// URL, or a file in the project"
                />
              )}
            </form.Field>
            <form.Field
              name="design.logo"
              validators={{ onChange: designSchema.shape.logo }}
            >
              {(field) => (
                <TextInput
                  field={field}
                  label="Logo"
                  description="An https:// URL, or a file in the project"
                />
              )}
            </form.Field>
            <form.Field name="design.colorBackground">
              {(field) => <ColorInput field={field} label="Background" />}
            </form.Field>
            <form.Field name="design.colorButton">
              {(field) => <ColorInput field={field} label="Button color" />}
            </form.Field>
          </div>
          <form.Subscribe selector={(state) => state.values}>
            {({ copy, design }) => (
              <figure className="grid content-start gap-1.5">
                <PlayingPreview copy={copy} design={design} />
                <figcaption className="text-xs text-muted-foreground">
                  Rough preview, the final look comes from After Effects.
                </figcaption>
              </figure>
            )}
          </form.Subscribe>
        </CardContent>
        <CardContent className="grid gap-2 border-t pt-(--card-spacing)">
          <p className="text-sm font-medium">Translate into</p>
          <form.Subscribe selector={(state) => state.values.languages}>
            {(languages) => (
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => (
                  <Button
                    key={language.code}
                    type="button"
                    size="sm"
                    variant={
                      languages.includes(language.code) ? "default" : "outline"
                    }
                    aria-pressed={languages.includes(language.code)}
                    onClick={() => toggleLanguage(language.code)}
                  >
                    {language.name}
                  </Button>
                ))}
              </div>
            )}
          </form.Subscribe>
          {translateError && (
            <Alert variant="destructive">
              <AlertTitle>Translation failed</AlertTitle>
              <AlertDescription>{translateError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <form.Subscribe
            selector={(state) =>
              state.values.languages.length > 0 &&
              copySchema("latin").safeParse(state.values.copy).success
            }
          >
            {(ready) => (
              <Button
                type="button"
                disabled={!ready || translating}
                onClick={translateAll}
              >
                {translating ? <Spinner /> : <Languages />}
                {translating ? "Translating…" : "Translate with ChatGPT"}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>

      <form.Subscribe
        selector={(state) => ({
          versions: state.values.versions,
          languages: state.values.languages,
        })}
      >
        {({ versions, languages }) =>
          versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Review the translations</CardTitle>
                <CardDescription>
                  Fix anything that reads wrong or runs too long, then render.
                  Nothing is rendered before you click Render.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <form.Subscribe selector={(state) => state.values}>
                  {({ copy, design }) => (
                    <LanguageCard name={SOURCE.name} note="Edit it above">
                      <PlayingPreview copy={copy} design={design} />
                    </LanguageCard>
                  )}
                </form.Subscribe>
                {versions.map((version, i) => (
                  <form.Subscribe
                    key={version.language}
                    selector={(state) => ({
                      version: state.values.versions[i],
                      design: state.values.design,
                    })}
                  >
                    {({ version, design }) =>
                      version && versionCard(i, version, design)
                    }
                  </form.Subscribe>
                ))}
              </CardContent>
              {renderError && (
                <CardContent>
                  <Alert variant="destructive">
                    <AlertTitle>Failed to create renders</AlertTitle>
                    <AlertDescription>{renderError}</AlertDescription>
                  </Alert>
                </CardContent>
              )}
              <CardFooter className="flex-wrap justify-end gap-2">
                {languages
                  .filter((code) => !versions.some((v) => v.language === code))
                  .map((code) => (
                    <p
                      key={code}
                      className="mr-auto text-sm text-muted-foreground"
                    >
                      Translate again to add {languageOf(code)?.name}.
                    </p>
                  ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={translating}
                  onClick={translateAll}
                >
                  {translating ? <Spinner /> : <RefreshCw />}
                  Translate again
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, submitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || submitting || translating}
                    >
                      {submitting && <Spinner />}
                      {submitting
                        ? "Creating renders…"
                        : `Render ${versions.length + 1} videos`}
                    </Button>
                  )}
                </form.Subscribe>
              </CardFooter>
            </Card>
          )
        }
      </form.Subscribe>

      <Card>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <ApiRequest
              localization={toLocalization(values)}
              localizationId={localizationId}
              target={target}
            />
          )}
        </form.Subscribe>
      </Card>
    </form>
  );
}

function LanguageCard({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid content-start gap-3 rounded-lg border p-3">
      <h3 className="flex items-baseline justify-between gap-2 text-sm font-medium">
        {name}
        {note && (
          <span className="text-xs font-normal text-muted-foreground">
            {note}
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

const LABELS = {
  headline: "Headline",
  subheadline: "Subheadline",
  cta: "Button",
};

function TextInput({
  field,
  label,
  max,
  description,
  className,
  showErrors,
}: {
  field: AnyFieldApi;
  label: string;
  max?: number;
  description?: string;
  className?: string;
  // Errors show right away instead of after the field was touched
  showErrors?: boolean;
}) {
  // Field names like versions[0].copy.headline are not valid in a selector
  const id = `field-${field.name.replace(/\W+/g, "-")}`;
  const invalid =
    (showErrors || field.state.meta.isTouched) && !field.state.meta.isValid;
  const length = String(field.state.value).length;

  return (
    <Field data-invalid={invalid} className={`gap-1.5 ${className ?? ""}`}>
      <FieldLabel htmlFor={id} className="justify-between">
        {label}
        {max && (
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {length}/{max}
          </span>
        )}
      </FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        aria-invalid={invalid}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {description && !invalid && (
        <FieldDescription className="text-xs">{description}</FieldDescription>
      )}
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function ColorInput({ field, label }: { field: AnyFieldApi; label: string }) {
  const id = `field-${field.name.replace(/\W+/g, "-")}`;
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <code className="text-xs text-muted-foreground">
          {field.state.value}
        </code>
      </div>
    </Field>
  );
}
