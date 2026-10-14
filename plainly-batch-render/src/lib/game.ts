import { isTeamId, type TeamId, teams } from "@/teams";

export type Game = { home: TeamId; away: TeamId };
// A game on the board, either side can still be waiting for a team
export type Draft = { home?: TeamId; away?: TeamId };
export type Side = "home" | "away";

// Puts a team into the first open slot, or starts a new game when all are full
export function placeTeam(games: Draft[], team: TeamId): Draft[] {
  const open = games.findIndex((g) => !g.home || !g.away);
  if (open === -1) return [...games, { home: team }];
  const side: Side = games[open].home ? "away" : "home";
  return games.map((game, i) =>
    i === open ? { ...game, [side]: team } : game,
  );
}

// Sends a team back to its conference, a game with no teams left disappears
export const removeTeam = (games: Draft[], team: TeamId) =>
  games
    .map(({ home, away }) => ({
      home: home === team ? undefined : home,
      away: away === team ? undefined : away,
    }))
    .filter((game) => game.home || game.away);

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
