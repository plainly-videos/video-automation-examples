import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import {
  LocalizationStatusBadge,
  RenderBadge,
  RenderFrame,
} from "@/components/render-frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { languageOf } from "@/lib/languages";
import { getLocalization } from "@/lib/plainly";
import {
  expectedLanguages,
  groupLocalizations,
  isLocalizationFinished,
  latestPerLanguage,
  type Render,
} from "@/lib/renders";
import { cn, formatDate } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;

export const Route = createFileRoute("/video/$localizationId")({
  loader: ({ params }) => getLocalization({ data: params.localizationId }),
  component: VideoPage,
  errorComponent: VideoError,
  notFoundComponent: VideoNotFound,
});

function VideoPage() {
  const renders = Route.useLoaderData();
  const { localizationId } = Route.useParams();

  return (
    <Videos
      key={localizationId}
      localizationId={localizationId}
      initial={renders}
    />
  );
}

// Polls the localization until every language is finished. Polling happens
// here instead of re-running the route loader, so a failed poll keeps the last
// renders on screen instead of swapping them for the error component.
function Videos({
  localizationId,
  initial,
}: {
  localizationId: string;
  initial: Render[];
}) {
  const [renders, setRenders] = useState(initial);
  const [pollFailed, setPollFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // The loader runs again once everything is finished, start over from its data
    setRenders(initial);
    if (isLocalizationFinished(initial)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    // The next poll is scheduled only after the previous one settles,
    // so slow responses never overlap or cancel each other
    const poll = async () => {
      try {
        const next = await getLocalization({ data: localizationId });
        if (!active) return;
        setRenders(next);
        setPollFailed(false);
        if (isLocalizationFinished(next)) {
          // Refreshes Recent videos with the final states. Only the root loader,
          // a failed reload of this route would swap the videos for the error
          router.invalidate({ filter: (m) => m.routeId === "__root__" });
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
  }, [localizationId, initial, router]);

  const latest = latestPerLanguage(renders);
  const languages = expectedLanguages(renders);
  // The loader throws notFound for a localization without renders, so there is one
  const [summary] = groupLocalizations(renders);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 w-fit",
          )}
        >
          <ArrowLeft />
          Back
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
              {summary.headline || "Untitled"}
              <LocalizationStatusBadge summary={summary} />
            </h1>
            {/* Server and browser can format dates in different time zones */}
            <p
              className="text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              <code>{localizationId.slice(0, 8)}</code> · Created{" "}
              {formatDate(summary.createdDate)}
            </p>
          </div>
          <Link
            to="/"
            search={{ from: localizationId }}
            // cn resolves the variant classes, like the Button component does
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil />
            Start from this video
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Videos</CardTitle>
          <CardDescription>
            {summary.done} of {languages.length} languages done.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {pollFailed && (
            <Alert>
              <AlertTitle>Could not refresh renders</AlertTitle>
              <AlertDescription>Retrying in a few seconds.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {languages.map((code) => (
              <figure key={code} className="grid min-w-0 gap-1.5">
                <figcaption className="flex items-center justify-between gap-1 text-xs font-medium">
                  {languageOf(code)?.name ?? code}
                  <RenderBadge render={latest[code]} />
                </figcaption>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <RenderFrame render={latest[code]} />
                </div>
              </figure>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VideoError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not load videos</AlertTitle>
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

function VideoNotFound() {
  return (
    <Alert>
      <AlertTitle>Video not found</AlertTitle>
      <AlertDescription>
        <Link to="/" className="underline">
          Localize a new video
        </Link>
      </AlertDescription>
    </Alert>
  );
}
