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
import { SourceCard, VersionCard } from "@/components/version-card";
import { languageOf } from "@/lib/languages";

// Step 2: every translation with its preview, then render them all.
// Shows up once there is a translation
export function ReviewCard({
  localizer: { form, translating, renderError },
}: {
  localizer: Localizer;
}) {
  return (
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
                Fix anything that reads wrong or runs too long, English
                included, then render. Nothing is rendered before you click
                Render.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 [&>section+section]:border-t [&>section+section]:pt-6">
              <SourceCard form={form} />
              {versions.map((version, i) => (
                <VersionCard key={version.language} form={form} index={i} />
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
                    Translate with ChatGPT to add {languageOf(code)?.name}.
                  </p>
                ))}
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, submitting]) => (
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit()}
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
  );
}
