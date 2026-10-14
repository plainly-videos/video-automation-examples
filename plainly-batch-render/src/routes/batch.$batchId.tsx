import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RenderGrid } from "@/components/render-grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isBatchFinished, type Render } from "@/lib/batch";
import { getBatchRenders } from "@/lib/plainly";

const POLL_INTERVAL_MS = 5000;

export const Route = createFileRoute("/batch/$batchId")({
  loader: ({ params }) => getBatchRenders({ data: params.batchId }),
  component: Batch,
  errorComponent: BatchError,
  notFoundComponent: BatchNotFound,
});

function Batch() {
  const renders = Route.useLoaderData();
  const { batchId } = Route.useParams();

  return <BatchRenders key={batchId} batchId={batchId} initial={renders} />;
}

// Polls the batch until every render is finished. Polling happens here instead of
// re-running the route loader, so a failed poll keeps the last renders on screen
// instead of swapping them for the error component.
function BatchRenders({
  batchId,
  initial,
}: {
  batchId: string;
  initial: Render[];
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
        const next = await getBatchRenders({ data: batchId });
        if (!active) return;
        setRenders(next);
        setPollFailed(false);
        if (isBatchFinished(next)) return;
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
  }, [batchId, initial]);

  return (
    <>
      {pollFailed && (
        <Alert>
          <AlertTitle>Could not refresh batch</AlertTitle>
          <AlertDescription>Retrying in a few seconds.</AlertDescription>
        </Alert>
      )}
      <RenderGrid batchId={batchId} renders={renders} />
    </>
  );
}

function BatchError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not load batch</AlertTitle>
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

function BatchNotFound() {
  return (
    <Alert>
      <AlertTitle>Batch not found</AlertTitle>
      <AlertDescription>
        <Link to="/" className="underline">
          Start a new batch
        </Link>
      </AlertDescription>
    </Alert>
  );
}
