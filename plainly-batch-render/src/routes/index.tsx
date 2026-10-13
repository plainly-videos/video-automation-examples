import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { FixturePicker } from "@/components/fixture-picker";
import { RenderGrid } from "@/components/render-grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isBatchFinished } from "@/lib/batch";
import { getBatchRenders } from "@/lib/plainly";

const POLL_INTERVAL_MS = 5000;

export const Route = createFileRoute("/")({
  // The batch id lives in the URL (/?batch=<id>), so a refresh keeps the view
  validateSearch: (search: Record<string, unknown>): { batch?: string } => ({
    batch:
      typeof search.batch === "string" && search.batch
        ? search.batch
        : undefined,
  }),
  loaderDeps: ({ search }) => ({ batch: search.batch }),
  loader: ({ deps }) =>
    deps.batch ? getBatchRenders({ data: deps.batch }) : null,
  component: Home,
  errorComponent: BatchError,
  notFoundComponent: BatchNotFound,
});

function Home() {
  const renders = Route.useLoaderData();
  const { batch } = Route.useSearch();
  const router = useRouter();
  const polling = renders !== null && !isBatchFinished(renders);

  // Re-run the loader until every render in the batch is finished
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => router.invalidate(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [polling, router]);

  return (
    <>
      <FixturePicker />
      {batch && renders && <RenderGrid batchId={batch} renders={renders} />}
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
        <Link to="/" search={{}} className="underline">
          Start a new batch
        </Link>
      </AlertDescription>
    </Alert>
  );
}
