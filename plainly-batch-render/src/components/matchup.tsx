import type { Team } from "@/fixtures";

// Broadcast-style row: [LOGO] HOME   vs   AWAY [LOGO], with "vs" always centered
export function Matchup({ home, away }: { home: Team; away: Team }) {
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
