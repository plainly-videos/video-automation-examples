import { z } from "zod";
import { TextInput } from "@/components/form-inputs";
import { PlayingPreview } from "@/components/localized-preview";
import type { LocalizerForm } from "@/components/use-localizer";
import { toFont } from "@/lib/form";
import { type Font, LIMITS, languageOf, type Script } from "@/lib/languages";
import { copySchema, fontSchema } from "@/lib/localization";

const LABELS = {
  headline: "Headline",
  subheadline: "Subheadline",
  cta: "Button",
};

// Empty keeps the template fonts
const fontUrl = z.union([z.literal(""), fontSchema.shape.url]);

// One language per row: its content, the preview next to it like in the
// compose step
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
    <section className="grid gap-4 md:grid-cols-[1fr_14rem] lg:grid-cols-[1fr_16rem]">
      <div className="grid content-start gap-3">
        <h3 className="flex items-baseline justify-between gap-2 font-medium">
          {name}
          {note && (
            <span className="text-xs font-normal text-muted-foreground">
              {note}
            </span>
          )}
        </h3>
        {children}
      </div>
      <div className="w-full max-w-64 justify-self-center md:max-w-none">
        {preview}
      </div>
    </section>
  );
}

// Headline, subheadline and button of one language. The headline and
// subheadline wrap, so long translations can be read in full
function CopyFields({
  form,
  prefix,
  script,
}: {
  form: LocalizerForm;
  prefix: "copy" | `versions[${number}].copy`;
  script: Script;
}) {
  return (["headline", "subheadline", "cta"] as const).map((key) => (
    <form.Field
      key={key}
      name={`${prefix}.${key}`}
      validators={{
        // Translations can come back too long, so they are checked as soon
        // as they show up
        onMount: copySchema(script).shape[key],
        onChange: copySchema(script).shape[key],
      }}
    >
      {(field) => (
        <TextInput
          field={field}
          label={LABELS[key]}
          max={LIMITS[script][key]}
          multiline={key !== "cta"}
          showErrors
        />
      )}
    </form.Field>
  ));
}

// Starts collapsed, most languages keep the template fonts
function FontInputs({
  form,
  prefix,
}: {
  form: LocalizerForm;
  prefix: "font" | `versions[${number}].font`;
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground">Font</summary>
      <div className="mt-3 grid gap-3">
        <form.Field name={`${prefix}.url`} validators={{ onChange: fontUrl }}>
          {(field) => (
            <TextInput
              field={field}
              label="Font URL"
              description="A .ttf or .otf file. Empty keeps the template fonts."
            />
          )}
        </form.Field>
        <form.Field name={`${prefix}.name`}>
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
  );
}

// The English version, the same text fields as the compose step
export function SourceCard({ form }: { form: LocalizerForm }) {
  return (
    <form.Subscribe selector={(state) => state.values}>
      {({ copy, design, font: fields }) => {
        const font = toFont(fields);
        return (
          <LanguageCard
            name="English"
            note={font ? "Source, custom font" : "Source"}
            preview={<PlayingPreview copy={copy} design={design} font={font} />}
          >
            <CopyFields form={form} prefix="copy" script="latin" />
            <FontInputs form={form} prefix="font" />
          </LanguageCard>
        );
      }}
    </form.Subscribe>
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
            <CopyFields
              form={form}
              prefix={`versions[${index}].copy`}
              script={script}
            />
            <FontInputs form={form} prefix={`versions[${index}].font`} />
          </LanguageCard>
        );
      }}
    </form.Subscribe>
  );
}
