import { Button } from "@/components/ui/button";
import { type Conference, type TeamId, teamIds, teams } from "@/teams";

export function ConferenceList({
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
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
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
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={playing}
      onClick={onPick}
      className="min-w-0 justify-start"
    >
      <img
        src={teams[team].logo}
        alt=""
        data-icon="inline-start"
        className="size-6 object-contain"
      />
      <span className="truncate">{teams[team].name}</span>
    </Button>
  );
}
