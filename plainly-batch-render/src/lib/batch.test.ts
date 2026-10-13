import { expect, test } from "vitest";
import { fixtures } from "@/fixtures";
import {
  isBatchFinished,
  isFinished,
  pickFixtures,
  toBatchData,
} from "@/lib/batch";

test("isFinished treats DONE, FAILED and INVALID as final", () => {
  for (const state of ["DONE", "FAILED", "INVALID"]) {
    expect(isFinished({ state }), state).toBe(true);
  }
  for (const state of ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"]) {
    expect(isFinished({ state }), state).toBe(false);
  }
});

test("isBatchFinished needs at least one render and all of them final", () => {
  expect(isBatchFinished([])).toBe(false);
  expect(isBatchFinished([{ state: "DONE" }, { state: "QUEUED" }])).toBe(false);
  expect(isBatchFinished([{ state: "DONE" }, { state: "FAILED" }])).toBe(true);
});

test("pickFixtures returns fixtures in the requested order", () => {
  const picked = pickFixtures(["bulls-celtics", "nuggets-lakers"]);
  expect(picked.map((f) => f.id)).toEqual(["bulls-celtics", "nuggets-lakers"]);
});

test("pickFixtures rejects empty and unknown ids", () => {
  expect(() => pickFixtures([])).toThrow("Select at least one matchup");
  expect(() => pickFixtures(["nuggets-lakers", "nope"])).toThrow(
    "Unknown matchup: nope",
  );
});

test("toBatchData maps a fixture to the template parameters", () => {
  const [entry] = toBatchData([fixtures[0]]);
  expect(entry).toEqual({
    parameters: {
      plainlyEditTeam1: fixtures[0].home.name,
      plainlyEditLogo1: fixtures[0].home.logo,
      plainlyEditTeam2: fixtures[0].away.name,
      plainlyEditLogo2: fixtures[0].away.logo,
    },
  });
});
