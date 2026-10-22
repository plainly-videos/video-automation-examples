import { Languages } from "lucide-react";
import { ColorInput, MediaInput, TextInput } from "@/components/form-inputs";
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
import { Spinner } from "@/components/ui/spinner";
import type { Localizer } from "@/components/use-localizer";
import { LANGUAGES, LIMITS } from "@/lib/languages";
import { copySchema, DEFAULT_DESIGN, designSchema } from "@/lib/localization";

const english = copySchema("latin").shape;

// Step 1: the English ad, its images and colors, and the languages to translate into
export function ComposeCard({
  localizer: {
    form,
    translating,
    translateError,
    translateAll,
    toggleLanguage,
  },
}: {
  localizer: Localizer;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Write the ad in English</CardTitle>
        <CardDescription>
          The text is translated, the images and colors stay the same in every
          language.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1fr_14rem] lg:grid-cols-[1fr_16rem]">
        <div className="grid content-start grid-cols-2 gap-4 lg:grid-cols-4">
          <form.Field
            name="copy.headline"
            validators={{ onChange: english.headline }}
          >
            {(field) => (
              <TextInput
                field={field}
                label="Headline"
                max={LIMITS.latin.headline}
                className="col-span-full"
              />
            )}
          </form.Field>
          <form.Field
            name="copy.subheadline"
            validators={{ onChange: english.subheadline }}
          >
            {(field) => (
              <TextInput
                field={field}
                label="Subheadline"
                max={LIMITS.latin.subheadline}
                className="col-span-full"
              />
            )}
          </form.Field>
          {/* The button text is short, the two colors fit next to it */}
          <form.Field name="copy.cta" validators={{ onChange: english.cta }}>
            {(field) => (
              <TextInput
                field={field}
                label="Button"
                max={LIMITS.latin.cta}
                className="col-span-full lg:col-span-2"
              />
            )}
          </form.Field>
          <form.Field
            name="design.colorBackground"
            validators={{ onChange: designSchema.shape.colorBackground }}
          >
            {(field) => <ColorInput field={field} label="Background" />}
          </form.Field>
          <form.Field
            name="design.colorButton"
            validators={{ onChange: designSchema.shape.colorButton }}
          >
            {(field) => <ColorInput field={field} label="Button color" />}
          </form.Field>
          <form.Field
            name="design.productImage"
            validators={{ onChange: designSchema.shape.productImage }}
          >
            {(field) => (
              <MediaInput
                field={field}
                label="Product image"
                projectFile={DEFAULT_DESIGN.productImage}
                className="col-span-full"
              />
            )}
          </form.Field>
          <form.Field
            name="design.logo"
            validators={{ onChange: designSchema.shape.logo }}
          >
            {(field) => (
              <MediaInput
                field={field}
                label="Logo"
                projectFile={DEFAULT_DESIGN.logo}
                className="col-span-full"
              />
            )}
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
      {translateError && (
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Translation failed</AlertTitle>
            <AlertDescription>{translateError}</AlertDescription>
          </Alert>
        </CardContent>
      )}
      <CardFooter className="flex-wrap items-end justify-between gap-3">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Translate into</legend>
          <form.Subscribe selector={(state) => state.values.languages}>
            {(languages) => (
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((language) => (
                  <Button
                    key={language.code}
                    type="button"
                    size="sm"
                    variant={
                      languages.includes(language.code) ? "default" : "outline"
                    }
                    aria-pressed={languages.includes(language.code)}
                    // The translation writes the languages picked when it started
                    disabled={translating}
                    onClick={() => toggleLanguage(language.code)}
                  >
                    {language.name}
                  </Button>
                ))}
              </div>
            )}
          </form.Subscribe>
        </fieldset>
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
  );
}
