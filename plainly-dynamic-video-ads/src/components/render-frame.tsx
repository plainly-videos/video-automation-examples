import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFinished, type Render, stateLabel } from "@/lib/ad";

export function RenderBadge({ render }: { render?: Render }) {
  if (!render) return <Badge variant="destructive">Not created</Badge>;
  if (render.state === "DONE") return <Badge>Done</Badge>;
  return (
    <Badge variant={isFinished(render) ? "destructive" : "secondary"}>
      {stateLabel(render.state)}
    </Badge>
  );
}

export function RenderFrame({
  render,
  retrying,
  onRetry,
}: {
  render?: Render;
  retrying: boolean;
  onRetry: () => void;
}) {
  if (render?.state === "DONE" && render.expired) {
    return <p className="text-sm text-muted-foreground">Output expired</p>;
  }
  if (render?.state === "DONE" && render.output) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: generated ad video has no captions
      <video
        src={render.output}
        poster={render.thumbnailUris?.[0]}
        controls
        preload="metadata"
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
      <Button size="sm" variant="outline" disabled={retrying} onClick={onRetry}>
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}
