import { createFileRoute } from "@tanstack/react-router";
import { AdEditor } from "@/components/ad-editor";
import { PreviewCard } from "@/components/ad-preview";
import { DEFAULT_AD, fromParameters, isAdId } from "@/lib/ad";
import { getAdRenders, getRenderTarget } from "@/lib/plainly";

export const Route = createFileRoute("/")({
  // ?from=<adId> starts the form from an existing ad
  validateSearch: (search): { from?: string } =>
    isAdId(search.from) ? { from: search.from } : {},
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: { from } }) => ({
    // A missing or unreadable ad falls back to the default ad
    initial: from
      ? await getAdRenders({ data: from })
          .then((renders) =>
            fromParameters(
              renders.find((render) => render.parameters)?.parameters ?? {},
            ),
          )
          .catch(() => DEFAULT_AD)
      : DEFAULT_AD,
    // One id for all three formats, so their curls make one ad together
    adId: crypto.randomUUID(),
    // Without a configured project the card keeps its placeholders, the
    // same error shows up in Recent ads and when rendering
    target: await getRenderTarget().catch(() => undefined),
  }),
  component: Home,
});

function Home() {
  const { adId, target, initial } = Route.useLoaderData();
  return (
    <AdEditor
      // A new key resets the form when ?from changes
      key={adId}
      initial={initial}
      aside={(ad) => <PreviewCard ad={ad} adId={adId} target={target} />}
    />
  );
}
