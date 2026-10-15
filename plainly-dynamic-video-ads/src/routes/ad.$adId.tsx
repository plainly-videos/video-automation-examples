import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdEditor } from "@/components/ad-editor";
import { AdFrames } from "@/components/ad-frames";
import { RenderBadge, RenderFrame } from "@/components/render-frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FORMATS,
  type Format,
  fromParameters,
  isAdFinished,
  latestPerFormat,
  type Render,
} from "@/lib/ad";
import { getAdRenders, retryFormat } from "@/lib/plainly";

const POLL_INTERVAL_MS = 5000;

export const Route = createFileRoute("/ad/$adId")({
  loader: ({ params }) => getAdRenders({ data: params.adId }),
  component: AdPage,
  errorComponent: AdError,
  notFoundComponent: AdNotFound,
});

function AdPage() {
  const renders = Route.useLoaderData();
  const { adId } = Route.useParams();

  return <AdRenders key={adId} adId={adId} initial={renders} />;
}

// Polls the ad until every format is finished. Polling happens here instead of
// re-running the route loader, so a failed poll keeps the last renders on screen
// instead of swapping them for the error component.
function AdRenders({ adId, initial }: { adId: string; initial: Render[] }) {
  const [renders, setRenders] = useState(initial);
  const [pollFailed, setPollFailed] = useState(false);
  const [retrying, setRetrying] = useState<Format>();
  const [retryError, setRetryError] = useState<string>();
  const retryFormatFn = useServerFn(retryFormat);
  const router = useRouter();

  useEffect(() => {
    // The loader runs again after a retry, start over from its data
    setRenders(initial);
    if (isAdFinished(initial)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    // The next poll is scheduled only after the previous one settles,
    // so slow responses never overlap or cancel each other
    const poll = async () => {
      try {
        const next = await getAdRenders({ data: adId });
        if (!active) return;
        setRenders(next);
        setPollFailed(false);
        if (isAdFinished(next)) {
          // Refreshes the loaders, so other views see the final states
          router.invalidate();
          return;
        }
      } catch {
        if (!active) return;
        setPollFailed(true);
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };
    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [adId, initial, router]);

  const retry = async (format: Format) => {
    setRetrying(format);
    setRetryError(undefined);
    try {
      await retryFormatFn({ data: { adId, format } });
      // Reloads the renders, which also restarts polling
      await router.invalidate();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : String(err));
    } finally {
      setRetrying(undefined);
    }
  };

  const latest = latestPerFormat(renders);
  const done = FORMATS.filter((f) => latest[f]?.state === "DONE").length;
  // The form starts from the ad's own values, submitting creates a new ad
  const ad = fromParameters(
    initial.find((render) => render.parameters)?.parameters ?? {},
  );

  return (
    <AdEditor
      initial={ad}
      aside={() => (
        <Card>
          <CardHeader>
            <CardTitle>Renders</CardTitle>
            <CardDescription>
              {done} of {FORMATS.length} formats done · ad{" "}
              <code>{adId.slice(0, 8)}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {pollFailed && (
              <Alert>
                <AlertTitle>Could not refresh renders</AlertTitle>
                <AlertDescription>Retrying in a few seconds.</AlertDescription>
              </Alert>
            )}
            {retryError && (
              <Alert variant="destructive">
                <AlertTitle>Retry failed</AlertTitle>
                <AlertDescription>{retryError}</AlertDescription>
              </Alert>
            )}
            <AdFrames
              badge={(format) => <RenderBadge render={latest[format]} />}
              frame={(format) => (
                <RenderFrame
                  render={latest[format]}
                  retrying={retrying === format}
                  disabled={retrying !== undefined}
                  onRetry={() => retry(format)}
                />
              )}
            />
          </CardContent>
        </Card>
      )}
    />
  );
}

function AdError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not load ad</AlertTitle>
      <AlertDescription className="grid gap-2">
        {error instanceof Error ? error.message : String(error)}
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => router.invalidate()}
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function AdNotFound() {
  return (
    <Alert>
      <AlertTitle>Ad not found</AlertTitle>
      <AlertDescription>
        <Link to="/" className="underline">
          Create a new ad
        </Link>
      </AlertDescription>
    </Alert>
  );
}
