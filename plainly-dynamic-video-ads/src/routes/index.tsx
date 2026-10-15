import { createFileRoute } from "@tanstack/react-router";
import { AdEditor } from "@/components/ad-editor";
import { PreviewCard } from "@/components/ad-preview";
import { adFor } from "@/lib/ad";
import { getRenderTarget } from "@/lib/plainly";

export const Route = createFileRoute("/")({
  loader: async () => ({
    // One id for all three formats, so their curls make one ad together
    adId: crypto.randomUUID(),
    // Without a configured project the card keeps its placeholders, the
    // same error shows up in Recent ads and when rendering
    target: await getRenderTarget().catch(() => undefined),
  }),
  component: Home,
});

function Home() {
  const { adId, target } = Route.useLoaderData();
  return (
    <AdEditor
      initial={adFor("sneakers")}
      aside={(ad) => <PreviewCard ad={ad} adId={adId} target={target} />}
    />
  );
}
