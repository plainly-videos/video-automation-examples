import type { Game } from "@/lib/game";
import { teams } from "@/teams";

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  // null when the render was created without custom attributes
  attributes: { home?: string; away?: string } | null;
  output?: string;
  thumbnailUris?: string[];
  expired?: boolean;
};

const IN_PROGRESS_STATES = ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"];

// Anything else (DONE, INVALID, FAILED, CANCELLED) is final
export const isFinished = (render: Pick<Render, "state">) =>
  !IN_PROGRESS_STATES.includes(render.state);

// IN_PROGRESS -> "In progress", for people instead of the API
export const stateLabel = (state: string) =>
  state.charAt(0) + state.slice(1).toLowerCase().replaceAll("_", " ");

// Plainly batch ids are UUIDs, anything else never reaches the API
export const isBatchId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Batch creation is synchronous, so an empty list will never fill up: stop polling
export const isBatchFinished = (renders: Pick<Render, "state">[]) =>
  renders.every(isFinished);

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
