import { Link } from "@tanstack/react-router";
import { CircleAlert, Info, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { RenderCard } from "@/components/render-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  type Campaign,
  isBatchFinished,
  isFinished,
  type Render,
} from "@/lib/batch";
import { getBatch } from "@/lib/plainly";

const POLL_INTERVAL_MS = 5000;

// The API returns newest first, the CSV order is easier to follow
const byCsvOrder = (a: Render, b: Render) =>
  (a.attributes?.batchRenderDataEntryNo ?? 0) -
  (b.attributes?.batchRenderDataEntryNo ?? 0);

// Polls the campaign until every render is finished. Polling happens here instead
// of re-running the route loader, so a failed poll keeps the last renders on screen
// instead of swapping them for the error component.
export function BatchResults({
  campaign,
  renders: initial,
}: {
  campaign: Campaign;
  renders: Render[];
}) {
  const [renders, setRenders] = useState(initial);
  const [pollFailed, setPollFailed] = useState(false);

  useEffect(() => {
    if (isBatchFinished(initial)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    // The next poll is scheduled only after the previous one settles,
    // so slow responses never overlap or cancel each other
    const poll = async () => {
      try {
        const next = await getBatch({ data: campaign.id });
        if (!active) return;
        setRenders(next.renders);
        setPollFailed(false);
        if (isBatchFinished(next.renders)) return;
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
  }, [campaign.id, initial]);

  const finished = renders.filter(isFinished).length;
  const done = finished === renders.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {campaign.name}
          {campaign.draft && <Badge variant="secondary">Draft</Badge>}
        </CardTitle>
        <CardDescription>
          {done
            ? `${renders.length} ${renders.length === 1 ? "video" : "videos"}`
            : `Rendering, ${finished} of ${renders.length} finished`}
        </CardDescription>
        <CardAction>
          <Link to="/" className={buttonVariants({ variant: "outline" })}>
            <Plus />
            <span className="max-sm:sr-only">New campaign</span>
          </Link>
        </CardAction>
        {!done && (
          <Progress
            value={finished}
            max={renders.length}
            aria-label="Videos finished"
            className="col-span-full mt-3"
          />
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {pollFailed && (
          <Alert>
            <CircleAlert />
            <AlertTitle>Could not refresh the campaign</AlertTitle>
            <AlertDescription>Retrying in a few seconds.</AlertDescription>
          </Alert>
        )}
        {campaign.draft && done && (
          <Alert>
            <Info />
            <AlertTitle>These are drafts</AlertTitle>
            <AlertDescription>
              Drafts are half resolution. Turn off Draft preview and render
              again for the final videos.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {[...renders].sort(byCsvOrder).map((render) => (
            <RenderCard key={render.id} render={render} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
