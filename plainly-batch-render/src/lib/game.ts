import { isTeamId, type TeamId, teams } from "@/teams";

export type Game = { home: TeamId; away: TeamId };
// A game on the board, either side can still be waiting for a team
export type Draft = { home?: TeamId; away?: TeamId };
export type Side = "home" | "away";
export type Slot = { game: number; side: Side };

// Puts a team into a slot. A slot past the last game starts a new game.
// Without a slot, the team takes the first open one.
export function placeTeam(games: Draft[], team: TeamId, slot?: Slot): Draft[] {
  // Each team plays only once per night, so free it from any other slot
  const next = free(games, team);

  const target = slot ?? openSlot(next);
  // Whoever held the slot before goes back to their conference
  next[target.game] = { ...next[target.game], [target.side]: team };

  return dropEmpty(next);
}

// Sends a team back to its conference, a game with no teams left disappears
export const removeTeam = (games: Draft[], team: TeamId) =>
  dropEmpty(free(games, team));

const free = (games: Draft[], team: TeamId) =>
  games.map(({ home, away }) => ({
    home: home === team ? undefined : home,
    away: away === team ? undefined : away,
  }));

const dropEmpty = (games: Draft[]) =>
  games.filter((game) => game.home || game.away);

function openSlot(games: Draft[]): Slot {
  const game = games.findIndex((g) => !g.home || !g.away);
  if (game === -1) return { game: games.length, side: "home" };
  return { game, side: games[game].home ? "away" : "home" };
}

export const isComplete = (game: Draft): game is Game =>
  Boolean(game.home && game.away);

// Runs on the server: the browser can send anything, so check every team
export function pickGames(games: { home?: unknown; away?: unknown }[]): Game[] {
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error("Schedule at least one game");
  }
  const playing = new Set<TeamId>();
  const pick = (team: unknown) => {
    if (!isTeamId(team)) throw new Error(`Unknown team: ${team}`);
    // Each team plays only once per night
    if (playing.has(team)) {
      throw new Error(`The ${teams[team].name} already play tonight`);
    }
    playing.add(team);
    return team;
  };
  return games.map((game) => ({
    home: pick(game?.home),
    away: pick(game?.away),
  }));
}
