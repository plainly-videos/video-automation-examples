import { type Fixture, fixtures } from "@/fixtures";

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  parameters: Record<string, string>;
  output?: string;
  thumbnailUris?: string[];
  expired?: boolean;
  error?: { message?: string };
};

const FINISHED_STATES = ["DONE", "FAILED", "INVALID"];

export const isFinished = (render: Pick<Render, "state">) =>
  FINISHED_STATES.includes(render.state);

// An empty list means Plainly has not returned the renders yet, so keep polling
export const isBatchFinished = (renders: Pick<Render, "state">[]) =>
  renders.length > 0 && renders.every(isFinished);

export function pickFixtures(ids: string[]): Fixture[] {
  if (ids.length === 0) throw new Error("Select at least one matchup");
  return ids.map((id) => {
    const fixture = fixtures.find((f) => f.id === id);
    if (!fixture) throw new Error(`Unknown matchup: ${id}`);
    return fixture;
  });
}

// One batch data entry per fixture, each entry becomes its own render
export const toBatchData = (selected: Fixture[]) =>
  selected.map((fixture) => ({
    parameters: {
      plainlyEditTeam1: fixture.home.name,
      plainlyEditLogo1: fixture.home.logo,
      plainlyEditTeam2: fixture.away.name,
      plainlyEditLogo2: fixture.away.logo,
    },
  }));
