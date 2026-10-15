import { createFileRoute } from "@tanstack/react-router";

// Replaced by the ad editor in a later task
export const Route = createFileRoute("/")({
  component: () => <p>Dynamic video ads</p>,
});
