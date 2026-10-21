import { createFileRoute } from "@tanstack/react-router";
import { type Initial, Localizer } from "@/components/localizer";
import {
  DEFAULT_COPY,
  DEFAULT_DESIGN,
  fromRenders,
  isLocalizationId,
  newLocalizationId,
} from "@/lib/localization";
import { getLocalization, getRenderTarget } from "@/lib/plainly";

const DEFAULT: Initial = {
  copy: DEFAULT_COPY,
  design: DEFAULT_DESIGN,
  languages: ["de", "ja"],
};

export const Route = createFileRoute("/")({
  // ?from=<localizationId> starts the form from an existing localization
  validateSearch: (search): { from?: string } =>
    isLocalizationId(search.from) ? { from: search.from } : {},
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: { from } }) => {
    const [initial, target] = await Promise.all([
      // A missing or unreadable localization falls back to the defaults
      from
        ? getLocalization({ data: from })
            .then(fromRenders)
            .catch(() => DEFAULT)
        : DEFAULT,
      // Without a configured project the card keeps its placeholders, the
      // same error shows up in Recent videos and when rendering
      getRenderTarget().catch(() => undefined),
    ]);
    return { initial, localizationId: newLocalizationId(), target };
  },
  component: Home,
});

function Home() {
  const { initial, localizationId, target } = Route.useLoaderData();
  return (
    <Localizer
      // A new key resets the form when ?from changes
      key={localizationId}
      initial={initial}
      localizationId={localizationId}
      target={target}
    />
  );
}
