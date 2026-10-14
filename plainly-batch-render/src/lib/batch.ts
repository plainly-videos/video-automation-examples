import { isTeamId, type TeamId, teams } from "@/teams";

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  attributes: { home?: string; away?: string };
  output?: string;
  thumbnailUris?: string[];
  expired?: boolean;
};

const IN_PROGRESS_STATES = ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"];

// Anything else (DONE, INVALID, FAILED, CANCELLED) is final
export const isFinished = (render: Pick<Render, "state">) =>
  !IN_PROGRESS_STATES.includes(render.state);

// Plainly batch ids are UUIDs, anything else never reaches the API
export const isBatchId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// An empty list means Plainly has not returned the renders yet, so keep polling
export const isBatchFinished = (renders: Pick<Render, "state">[]) =>
  renders.length > 0 && renders.every(isFinished);

export type Game = { home: TeamId; away: TeamId };

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

// One batch data entry per game, each entry becomes its own render
export const toBatchData = (games: Game[]) =>
  games.map(({ home, away }) => ({
    // Custom attributes come back on every render in the batch,
    // so we can tell which game a render belongs to
    attributes: { home, away },
    parameters: {
      plainlyEditTeam1: teams[home].name,
      plainlyEditLogo1: teams[home].logo,
      plainlyEditTeam2: teams[away].name,
      plainlyEditLogo2: teams[away].logo,
    },
  }));
