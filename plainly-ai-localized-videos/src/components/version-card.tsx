import { z } from "zod";
import { TextInput } from "@/components/form-inputs";
import { PlayingPreview } from "@/components/localized-preview";
import type { LocalizerForm } from "@/components/use-localizer";
import { toFont } from "@/lib/form";
import { type Font, LIMITS, languageOf } from "@/lib/languages";
import { type Copy, copySchema, fontSchema } from "@/lib/localization";

const LABELS = {
  headline: "Headline",
  subheadline: "Subheadline",
  cta: "Button",
};

// Empty keeps the template fonts
const fontUrl = z.union([z.literal(""), fontSchema.shape.url]);

// One language: the preview next to its content
export function LanguageCard({
  name,
  note,
  preview,
  children,
}: {
  name: string;
  note?: string;
  preview: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid content-start gap-3 rounded-lg border p-3 sm:grid-cols-[10rem_1fr]">
      <h3 className="col-span-full flex items-baseline justify-between gap-2 text-sm font-medium">
        {name}
        {note && (
          <span className="text-xs font-normal text-muted-foreground">
            {note}
          </span>
        )}
      </h3>
      <div className="w-full max-w-60 justify-self-center sm:max-w-none">
        {preview}
      </div>
      <div className="grid content-start gap-3">{children}</div>
    </section>
  );
}

// The English version, edited in the compose step
export function SourceCard({
  copy,
  design,
}: Pick<Parameters<typeof PlayingPreview>[0], "copy" | "design">) {
  return (
    <LanguageCard
      name="English"
      note="Edit it above"
      preview={<PlayingPreview copy={copy} design={design} />}
    >
      <dl className="grid gap-3 text-sm">
        {(Object.keys(LABELS) as (keyof Copy)[]).map((key) => (
          <div key={key} className="grid gap-1">
            <dt className="text-muted-foreground">{LABELS[key]}</dt>
            <dd>{copy[key]}</dd>
          </div>
        ))}
      </dl>
    </LanguageCard>
  );
}

// One translation: its preview, its text and its font
export function VersionCard({
  form,
  index,
}: {
  form: LocalizerForm;
  index: number;
}) {
  return (
    <form.Subscribe
      selector={(state) => ({
        version: state.values.versions[index],
        design: state.values.design,
      })}
    >
      {({ version, design }) => {
        if (!version) return null;
        const language = languageOf(version.language);
        const script = language?.script ?? "latin";
        const font: Font | undefined = toFont(version.font);
        return (
          <LanguageCard
            name={language?.name ?? version.language}
            note={font ? "Custom font" : undefined}
            preview={
              <PlayingPreview copy={version.copy} design={design} font={font} />
            }
          >
            {(["headline", "subheadline", "cta"] as const).map((key) => (
              <form.Field
                key={key}
                name={`versions[${index}].copy.${key}`}
                validators={{
                  // Translations can come back too long, so they are checked
                  // as soon as they show up
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
            <details className="text-sm">
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
      }}
    </form.Subscribe>
  );
}
