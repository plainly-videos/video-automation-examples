import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isFinished, type Render, stateLabel } from "@/lib/batch";
import { isTeamId, type Team, teams } from "@/teams";

function Matchup({ home, away }: { home: Team; away: Team }) {
  return (
    <span className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-medium">
      <span className="flex min-w-0 items-center gap-2">
        <img src={home.logo} alt="" className="size-6 object-contain" />
        <span className="truncate">{home.name}</span>
      </span>
      <span className="text-muted-foreground">vs</span>
      <span className="flex min-w-0 items-center justify-end gap-2">
        <span className="truncate">{away.name}</span>
        <img src={away.logo} alt="" className="size-6 object-contain" />
      </span>
    </span>
  );
}

function stateVariant(state: string) {
  if (state === "DONE") return "default";
  if (!isFinished({ state })) return "secondary";
  return "destructive";
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
  if (render.state === "DONE") {
    return <p className="text-sm text-muted-foreground">No preview</p>;
  }
  if (isFinished(render)) {
    return <p className="text-sm text-destructive">Render failed</p>;
  }
  return (
    <LoaderCircle
      role="status"
      aria-label="Rendering"
      className="size-6 animate-spin text-muted-foreground"
    />
  );
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
        {renders.map((render) => {
          const { home, away } = render.attributes ?? {};
          return (
            <Card key={render.id}>
              <CardHeader className="flex flex-row items-center">
                {isTeamId(home) && isTeamId(away) ? (
                  <Matchup home={teams[home]} away={teams[away]} />
                ) : (
                  <code className="text-sm">{render.id.slice(0, 8)}</code>
                )}
              </CardHeader>
              <CardContent>
                <div className="relative flex aspect-video items-center justify-center rounded-md bg-muted">
                  <Badge
                    variant={stateVariant(render.state)}
                    className="absolute top-2 right-2 z-10"
                  >
                    {stateLabel(render.state)}
                  </Badge>
                  <RenderPreview render={render} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
