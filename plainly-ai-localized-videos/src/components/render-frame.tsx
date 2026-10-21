import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  isFinished,
  type LocalizationSummary,
  localizationStatus,
  type Render,
  stateLabel,
} from "@/lib/localization";

const BADGE_VARIANT = {
  done: "default",
  rendering: "secondary",
  failed: "destructive",
} as const;

export function LocalizationStatusBadge({
  summary,
}: {
  summary: LocalizationSummary;
}) {
  const status = localizationStatus(summary);
  return <Badge variant={BADGE_VARIANT[status.tone]}>{status.label}</Badge>;
}

export function RenderBadge({ render }: { render?: Render }) {
  if (!render) return <Badge variant="destructive">Not created</Badge>;
  if (render.state === "DONE") return <Badge>Done</Badge>;
  return (
    <Badge variant={isFinished(render) ? "destructive" : "secondary"}>
      {stateLabel(render.state)}
    </Badge>
  );
}

export function RenderFrame({ render }: { render?: Render }) {
  if (render?.state === "DONE" && render.expired) {
    return <p className="text-sm text-muted-foreground">Output expired</p>;
  }
  if (render?.state === "DONE" && render.output) {
    return (
      <video
        src={render.output}
        poster={render.thumbnailUris?.[0]}
        controls
        // Browsers only autoplay muted videos, viewers can unmute with the controls
        autoPlay
        muted
        playsInline
        className="size-full object-cover"
      />
    );
  }
  if (render?.state === "DONE") {
    return <p className="text-sm text-muted-foreground">No preview</p>;
  }
  if (render && !isFinished(render)) {
    return (
      <LoaderCircle
        role="status"
        aria-label="Rendering"
        className="size-6 animate-spin text-muted-foreground"
      />
    );
  }

  // Failed, invalid, cancelled, or the create call failed
  return (
    <div className="grid justify-items-center gap-2 p-3 text-center">
      <p className="text-sm text-destructive">
        {render ? "Render failed" : "Not created"}
      </p>
      {render?.error?.message && (
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {render.error.message}
        </p>
      )}
    </div>
  );
}
