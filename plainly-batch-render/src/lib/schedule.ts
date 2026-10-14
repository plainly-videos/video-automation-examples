import type { TeamId } from "@/teams";

// A game on the board, either side can still be waiting for a team
export type Draft = { home?: TeamId; away?: TeamId };
export type Side = "home" | "away";
export type Slot = { game: number; side: Side };

// Puts a team into a slot. A slot past the last game starts a new game.
// Without a slot, the team takes the first open one.
export function placeTeam(games: Draft[], team: TeamId, slot?: Slot): Draft[] {
  // Each team plays only once per night, so free it from any other slot
  const next = games.map(({ home, away }) => ({
    home: home === team ? undefined : home,
    away: away === team ? undefined : away,
  }));

  const target = slot ?? openSlot(next);
  // Whoever held the slot before goes back to their conference
  next[target.game] = { ...next[target.game], [target.side]: team };

  return next.filter((game) => game.home || game.away);
}

function openSlot(games: Draft[]): Slot {
  const game = games.findIndex((g) => !g.home || !g.away);
  if (game === -1) return { game: games.length, side: "home" };
  return { game, side: games[game].home ? "away" : "home" };
}

export const isComplete = (game: Draft): game is Required<Draft> =>
  Boolean(game.home && game.away);
