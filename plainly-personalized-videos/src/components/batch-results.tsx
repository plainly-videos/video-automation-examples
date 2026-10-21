import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientsTable } from "@/components/clients-table";
import { RenderCell } from "@/components/render-cell";
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
        <CardTitle className="flex items-center gap-2">
          {campaign.name}
          {campaign.draft && <Badge variant="secondary">Draft</Badge>}
        </CardTitle>
        <CardDescription>
          {finished}/{renders.length} finished
        </CardDescription>
        <CardAction>
          <Link to="/" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft />
            New campaign
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {pollFailed && (
          <Alert>
            <AlertTitle>Could not refresh the campaign</AlertTitle>
            <AlertDescription>Retrying in a few seconds.</AlertDescription>
          </Alert>
        )}
        {campaign.draft && done && (
          <Alert>
            <AlertTitle>These are drafts</AlertTitle>
            <AlertDescription>
              Drafts are half resolution. Turn off Draft preview and render
              again for the final videos.
            </AlertDescription>
          </Alert>
        )}
        <ClientsTable
          clients={[...renders].sort(byCsvOrder).map((render) => ({
            key: render.id,
            headshot: render.attributes?.headshot,
            // Renders always carry their client, unless they were changed by hand in Plainly
            name: render.attributes?.name ?? "Unknown client",
            title: render.attributes?.title,
            company: render.attributes?.company,
            video: <RenderCell render={render} />,
          }))}
        />
      </CardContent>
    </Card>
  );
}
