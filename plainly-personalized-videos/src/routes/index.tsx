import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { BatchResults } from "@/components/batch-results";
import { CampaignForm } from "@/components/campaign-form";
import { PastCampaigns } from "@/components/past-campaigns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type Campaign, isBatchId } from "@/lib/batch";
import { getBatch, listCampaigns } from "@/lib/plainly";

export const Route = createFileRoute("/")({
  // The open campaign lives in the URL, so reloads and shared links keep it.
  // An invalid id must be set to undefined, leaving it out keeps the raw value
  validateSearch: (search: Record<string, unknown>): { batch?: string } => ({
    batch:
      typeof search.batch === "string" && isBatchId(search.batch)
        ? search.batch
        : undefined,
  }),
  loaderDeps: ({ search }) => ({ batch: search.batch }),
  loader: async ({ deps }) => {
    const [campaigns, result] = await Promise.all([
      // A failed list shows in its card instead of hiding the whole page
      listCampaigns().then(
        (campaigns): { campaigns: Campaign[]; campaignsError?: string } => ({
          campaigns,
        }),
        (err) => ({
          campaigns: [],
          campaignsError: err instanceof Error ? err.message : String(err),
        }),
      ),
      deps.batch ? getBatch({ data: deps.batch }) : undefined,
    ]);
    return { ...campaigns, result };
  },
  component: Home,
  errorComponent: HomeError,
  notFoundComponent: CampaignNotFound,
});

function Home() {
  const { campaigns, campaignsError, result } = Route.useLoaderData();

  return (
    <>
      {result ? (
        <BatchResults
          key={result.campaign.id}
          campaign={result.campaign}
          renders={result.renders}
        />
      ) : (
        <CampaignForm />
      )}
      <PastCampaigns campaigns={campaigns} error={campaignsError} />
    </>
  );
}

function HomeError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not load campaign</AlertTitle>
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

function CampaignNotFound() {
  return (
    <Alert>
      <AlertTitle>Campaign not found</AlertTitle>
      <AlertDescription>
        <Link to="/" className="underline">
          Start a new campaign
        </Link>
      </AlertDescription>
    </Alert>
  );
}
