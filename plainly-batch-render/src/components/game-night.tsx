import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createBatch } from "@/lib/plainly";
import {
  type Draft,
  isComplete,
  placeTeam,
  removeTeam,
  type Side,
  type Slot,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import {
  type Conference,
  isTeamId,
  type TeamId,
  teamIds,
  teams,
} from "@/teams";

export function GameNight() {
  const [games, setGames] = useState<Draft[]>([]);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const createBatchFn = useServerFn(createBatch);
  const navigate = useNavigate();

  const playing = new Set(games.flatMap((g) => [g.home, g.away]));
  const complete = games.filter(isComplete);
  const place = (team: TeamId, slot?: Slot) =>
    setGames((prev) => placeTeam(prev, team, slot));
  const remove = (team: TeamId) => setGames((prev) => removeTeam(prev, team));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);

    try {
      // One request creates a render for every complete game
      const { id } = await createBatchFn({ data: complete });
      setGames([]);
      await navigate({ to: "/", search: { batch: id } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DragDropProvider
      onDragEnd={({ canceled, operation: { source, target } }) => {
        if (canceled || !target || !isTeamId(source?.id)) return;
        place(source.id, target.data as Slot);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[13rem_1fr_13rem]">
        <ConferenceList
          title="Western Conference"
          conference="west"
          playing={playing}
          onPick={place}
        />
        <Card className="order-first lg:order-none lg:self-start">
          <CardHeader>
            <CardTitle>Game night</CardTitle>
            <CardDescription>
              Drag teams in (or tap them) to set up tonight's games. All games
              are sent in a single batch request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Failed to create batch</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                {games.map((game, index) => (
                  <GameRow
                    // Games only get added at the end or removed, so the index is stable enough
                    // biome-ignore lint/suspicious/noArrayIndexKey: games have no id of their own
                    key={index}
                    game={game}
                    index={index}
                    onRemove={remove}
                  />
                ))}
                {/* Everyone plays once, so 30 teams make at most 15 games */}
                {playing.size < teamIds.length && (
                  <GameRow game={{}} index={games.length} onRemove={remove} />
                )}
              </div>
              <div className="flex gap-2">
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
              </div>
            </form>
          </CardContent>
        </Card>
        <ConferenceList
          title="Eastern Conference"
          conference="east"
          playing={playing}
          onPick={place}
        />
      </div>
    </DragDropProvider>
  );
}

function ConferenceList({
  title,
  conference,
  playing,
  onPick,
}: {
  title: string;
  conference: Conference;
  playing: Set<TeamId | undefined>;
  onPick: (team: TeamId) => void;
}) {
  return (
    <section className="grid content-start gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {teamIds
          .filter((id) => teams[id].conference === conference)
          .map((id) => (
            <TeamTile
              key={id}
              team={id}
              playing={playing.has(id)}
              onPick={() => onPick(id)}
            />
          ))}
      </div>
    </section>
  );
}

function TeamTile({
  team,
  playing,
  onPick,
}: {
  team: TeamId;
  playing: boolean;
  onPick: () => void;
}) {
  const { ref, isDragging } = useDraggable({ id: team, disabled: playing });

  return (
    <button
      ref={ref}
      type="button"
      disabled={playing}
      onClick={onPick}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm font-medium",
        playing
          ? "opacity-30"
          : "cursor-grab hover:bg-muted active:cursor-grabbing",
        isDragging && "shadow-lg",
      )}
    >
      <TeamLabel team={team} />
    </button>
  );
}

function GameRow({
  game,
  index,
  onRemove,
}: {
  game: Draft;
  index: number;
  onRemove: (team: TeamId) => void;
}) {
  return (
    // "vs" sits in the middle, both teams get the same width on each side
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <GameSlot
        team={game.home}
        slot={{ game: index, side: "home" }}
        onRemove={onRemove}
      />
      <span className="text-sm text-muted-foreground">vs</span>
      <GameSlot
        team={game.away}
        slot={{ game: index, side: "away" }}
        onRemove={onRemove}
      />
    </div>
  );
}

function GameSlot({
  team,
  slot,
  onRemove,
}: {
  team?: TeamId;
  slot: Slot;
  onRemove: (team: TeamId) => void;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `${slot.game}-${slot.side}`,
    data: slot,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-11 min-w-0 items-center justify-between gap-2 rounded-lg border pr-1 pl-3 text-sm font-medium",
        slot.side === "away" && "flex-row-reverse pr-3 pl-1",
        !team && "border-dashed px-3 text-muted-foreground",
        isDropTarget && "border-primary bg-muted",
      )}
    >
      {team ? (
        <>
          <TeamLabel team={team} reverse={slot.side === "away"} />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${teams[team].name}`}
            onClick={() => onRemove(team)}
          >
            <X />
          </Button>
        </>
      ) : (
        <span className="truncate">{sideLabel[slot.side]}</span>
      )}
    </div>
  );
}

const sideLabel: Record<Side, string> = {
  home: "Home team",
  away: "Away team",
};

function TeamLabel({ team, reverse }: { team: TeamId; reverse?: boolean }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2",
        reverse && "flex-row-reverse",
      )}
    >
      <img src={teams[team].logo} alt="" className="size-6 object-contain" />
      <span className="truncate">{teams[team].name}</span>
    </span>
  );
}
