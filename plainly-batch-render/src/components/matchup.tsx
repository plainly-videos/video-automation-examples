import type { Team } from "@/fixtures";

export function Matchup({ home, away }: { home: Team; away: Team }) {
  return (
    <span className="flex items-center gap-2 text-sm font-medium">
      <img
        src={home.logo}
        alt=""
        referrerPolicy="no-referrer"
        className="size-6 object-contain"
      />
      {home.name}
      <span className="text-muted-foreground">vs</span>
      <img
        src={away.logo}
        alt=""
        referrerPolicy="no-referrer"
        className="size-6 object-contain"
      />
      {away.name}
    </span>
  );
}
