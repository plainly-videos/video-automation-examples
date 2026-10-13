import { createFileRoute } from "@tanstack/react-router";
import { FixturePicker } from "@/components/fixture-picker";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { batch?: string } => ({
    batch:
      typeof search.batch === "string" && search.batch
        ? search.batch
        : undefined,
  }),
  component: FixturePicker,
});
