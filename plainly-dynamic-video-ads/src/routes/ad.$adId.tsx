import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { AdFrames } from "@/components/ad-frames";
import { ApiRequest } from "@/components/api-request";
import {
  AdStatusBadge,
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
import {
  type Ad,
  FORMATS,
  groupAds,
  isAdFinished,
  latestParameters,
  latestPerFormat,
  type Render,
  type RenderTarget,
} from "@/lib/ad";
import { getAdRenders } from "@/lib/plainly";
import { cn, formatDate } from "@/lib/utils";
import { products } from "@/products";

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
  const router = useRouter();

  useEffect(() => {
    // The loader runs again once the ad is finished, start over from its data
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

  const latest = latestPerFormat(renders);
  // The loader throws notFound for an ad without renders, so there is one
  const [summary] = groupAds(renders);
  // The request each render was made with, even if .env changed since
  const projectId = renders.find((render) => render.projectId)?.projectId;
  const target: RenderTarget | undefined = projectId
    ? {
        projectId,
        templates: Object.fromEntries(
          FORMATS.flatMap((format) => {
            const templateId = latest[format]?.templateId;
            return templateId ? [[format, templateId]] : [];
          }),
        ),
      }
    : undefined;

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
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              Ad <code>{adId.slice(0, 8)}</code>
              <AdStatusBadge summary={summary} />
            </h1>
            {/* Server and browser can format dates in different time zones */}
            <p
              className="text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              Created {formatDate(summary.createdDate)}
            </p>
          </div>
          <Link
            to="/"
            search={{ from: adId }}
            // cn resolves the variant classes, like the Button component does
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil />
            Edit as new ad
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Renders</CardTitle>
          <CardDescription>
            {summary.done} of {FORMATS.length} formats done.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {pollFailed && (
            <Alert>
              <AlertTitle>Could not refresh renders</AlertTitle>
              <AlertDescription>Retrying in a few seconds.</AlertDescription>
            </Alert>
          )}
          <AdFrames
            badge={(format) => <RenderBadge render={latest[format]} />}
            frame={(format) => <RenderFrame render={latest[format]} />}
          />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <AdDetails ad={summary.ad} />
        <Card>
          <ApiRequest
            // As sent, not rebuilt from the ad, so older ads show their own parameters
            parameters={latestParameters(renders)}
            adId={adId}
            target={target}
          />
        </Card>
      </div>
    </div>
  );
}

// Older ads or renders made outside the app can miss a value
const orDash = (text: string) => text || "-";

// The ad as it was sent, edits happen in a new ad
function AdDetails({ ad }: { ad: Ad }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad</CardTitle>
        <CardDescription>The same values in all three formats.</CardDescription>
      </CardHeader>
      {/* flex-1 fills the card, which matches the API request height on lg */}
      <CardContent className="flex-1">
        <dl className="grid h-full gap-4 text-sm sm:grid-cols-3 lg:grid-cols-1 lg:content-between">
          <Detail label="Hook">{orDash(ad.hook)}</Detail>
          <Detail label="Button">{orDash(ad.button)}</Detail>
          <Detail label="Call to action">{orDash(ad.cta)}</Detail>
          <Detail label="Products" className="col-span-full">
            <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {ad.slots.map((slot, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the slots never move
                <li key={i} className="flex items-center gap-3">
                  <img
                    src={products[slot.productId].image}
                    alt=""
                    className="size-12 rounded-md object-cover lg:size-18"
                  />
                  <span className="grid min-w-0">
                    <span className="truncate">{orDash(slot.name)}</span>
                    <span className="font-medium">{orDash(slot.price)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Detail>
        </dl>
      </CardContent>
    </Card>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
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
