import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { useState } from "react";
import { ConferenceList } from "@/components/conference-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  type Draft,
  isComplete,
  placeTeam,
  removeTeam,
  type Side,
} from "@/lib/game";
import { saveBatch } from "@/lib/history";
import { createBatch } from "@/lib/plainly";
import { cn } from "@/lib/utils";
import { type TeamId, teamIds, teams } from "@/teams";

export function GameNight() {
  const [games, setGames] = useState<Draft[]>([]);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const createBatchFn = useServerFn(createBatch);
  const navigate = useNavigate();

  const playing = new Set(games.flatMap((g) => [g.home, g.away]));
  const complete = games.filter(isComplete);
  const place = (team: TeamId) => setGames((prev) => placeTeam(prev, team));
  const remove = (team: TeamId) => setGames((prev) => removeTeam(prev, team));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);

    try {
      const { id } = await createBatchFn({ data: complete });
      saveBatch({ id, games: complete, createdAt: Date.now() });
      setGames([]);
      await navigate({ to: "/batch/$batchId", params: { batchId: id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr_18rem]">
      <ConferenceList
        title="Western Conference"
        conference="west"
        playing={playing}
        onPick={place}
      />
      <section className="order-first grid grid-rows-[auto_1fr] gap-2 lg:order-none">
        <h2 className="text-center text-sm font-medium text-muted-foreground">
          Game night
        </h2>
        <Card>
          <CardHeader>
            <CardDescription>
              Pick teams to set up tonight's games. Videos for all games are
              created in a single batch request.
            </CardDescription>
          </CardHeader>
          <form className="contents" onSubmit={handleSubmit}>
            <CardContent className="grid flex-1 content-start gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Failed to create batch</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                {games.map((game, index) => (
                  <GameRow
                    // biome-ignore lint/suspicious/noArrayIndexKey: games have no id of their own
                    key={index}
                    game={game}
                    onRemove={remove}
                  />
                ))}
                {playing.size < teamIds.length && (
                  <GameRow game={{}} onRemove={remove} />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col-reverse gap-2 *:w-full sm:flex-row sm:justify-end sm:*:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={games.length === 0}
                onClick={() => setGames([])}
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={complete.length === 0 || submitting}
              >
                {submitting
                  ? "Creating batch…"
                  : `Render ${complete.length} video${complete.length === 1 ? "" : "s"}`}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>
      <ConferenceList
        title="Eastern Conference"
        conference="east"
        playing={playing}
        onPick={place}
      />
    </div>
  );
}

function GameRow({
  game,
  onRemove,
}: {
  game: Draft;
  onRemove: (team: TeamId) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <GameSlot team={game.home} side="home" onRemove={onRemove} />
      <span className="text-sm text-muted-foreground">vs</span>
      <GameSlot team={game.away} side="away" onRemove={onRemove} />
    </div>
  );
}

function GameSlot({
  team,
  side,
  onRemove,
}: {
  team?: TeamId;
  side: Side;
  onRemove: (team: TeamId) => void;
}) {
  const away = side === "away";

  if (!team) {
    return (
      <div
        className={cn(
          "flex h-9 min-w-0 items-center rounded-lg border border-dashed px-3 text-sm font-medium text-muted-foreground",
          away && "justify-end",
        )}
      >
        <span className="truncate">{sideLabel[side]}</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      aria-label={`Remove ${teams[team].name}`}
      onClick={() => onRemove(team)}
      className={cn("min-w-0 justify-between", away && "flex-row-reverse")}
    >
      <span
        className={cn(
          "flex min-w-0 items-center gap-1.5",
          away && "flex-row-reverse",
        )}
      >
        <img src={teams[team].logo} alt="" className="size-6 object-contain" />
        <span className="truncate">{teams[team].name}</span>
      </span>
      <X />
    </Button>
  );
}

const sideLabel: Record<Side, string> = {
  home: "Home team",
  away: "Away team",
};
