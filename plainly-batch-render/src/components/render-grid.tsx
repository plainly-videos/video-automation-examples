import { LoaderCircle } from "lucide-react";
import { Matchup } from "@/components/matchup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isFinished, type Render } from "@/lib/batch";

function stateVariant(state: string) {
  if (state === "DONE") return "default";
  if (state === "FAILED" || state === "INVALID") return "destructive";
  return "secondary";
}

function RenderPreview({ render }: { render: Render }) {
  if (render.state === "DONE" && render.expired) {
    return <p className="text-sm text-muted-foreground">Output expired</p>;
  }
  if (render.state === "DONE" && render.output) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: generated preview video has no captions
      <video
        src={render.output}
        poster={render.thumbnailUris?.[0]}
        controls
        preload="metadata"
        className="size-full rounded-md object-cover"
      />
    );
  }
  if (isFinished(render)) {
    return (
      <p className="text-sm text-destructive">
        {render.error?.message ?? "Render failed"}
      </p>
    );
  }
  return <LoaderCircle className="size-6 animate-spin text-muted-foreground" />;
}

export function RenderGrid({
  batchId,
  renders,
}: {
  batchId: string;
  renders: Render[];
}) {
  const finished = renders.filter(isFinished).length;

  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-medium">
        Batch <code className="text-sm">{batchId.slice(0, 8)}</code> —{" "}
        {finished}/{renders.length} finished
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {renders.map((render) => (
          <Card key={render.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <Matchup
                home={{
                  name: render.parameters.plainlyEditTeam1,
                  logo: render.parameters.plainlyEditLogo1,
                }}
                away={{
                  name: render.parameters.plainlyEditTeam2,
                  logo: render.parameters.plainlyEditLogo2,
                }}
              />
              <Badge variant={stateVariant(render.state)}>{render.state}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex aspect-video items-center justify-center rounded-md bg-muted">
                <RenderPreview render={render} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
