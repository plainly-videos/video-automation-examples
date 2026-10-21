import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY: replaced in Task 7
export const Route = createFileRoute("/video/$localizationId")({
  component: () => <p>Video page</p>,
});
