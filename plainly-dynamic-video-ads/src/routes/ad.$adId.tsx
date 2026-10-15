import { createFileRoute } from "@tanstack/react-router";
import { getAdRenders } from "@/lib/plainly";

// Replaced by the full ad page in the next task
export const Route = createFileRoute("/ad/$adId")({
  loader: ({ params }) => getAdRenders({ data: params.adId }),
  component: () => <p>{Route.useLoaderData().length} renders</p>,
});
