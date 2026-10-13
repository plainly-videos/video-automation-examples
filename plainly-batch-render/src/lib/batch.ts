import { type Fixture, fixtures } from "@/fixtures";

// Subset of the render object returned by the Plainly API
export type Render = {
  id: string;
  state: string;
  attributes: { fixtureId?: string };
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
    // Custom attributes come back on every render in the batch,
    // so we can tell which matchup a render belongs to
    attributes: { fixtureId: fixture.id },
    parameters: {
      plainlyEditTeam1: fixture.home.name,
      plainlyEditLogo1: fixture.home.logo,
      plainlyEditTeam2: fixture.away.name,
      plainlyEditLogo2: fixture.away.logo,
    },
  }));
