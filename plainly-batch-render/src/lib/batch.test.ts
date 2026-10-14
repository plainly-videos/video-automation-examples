import { expect, test } from "vitest";
import {
  isBatchFinished,
  isBatchId,
  isFinished,
  stateLabel,
  toBatchData,
} from "@/lib/batch";

test("isFinished treats every state except the in-progress ones as final", () => {
  for (const state of ["DONE", "INVALID", "FAILED", "CANCELLED"]) {
    expect(isFinished({ state }), state).toBe(true);
  }
  for (const state of ["PENDING", "THROTTLED", "QUEUED", "IN_PROGRESS"]) {
    expect(isFinished({ state }), state).toBe(false);
  }
});

test("isBatchId only accepts UUIDs", () => {
  expect(isBatchId("97226b64-8b8a-437d-a76e-f014d3845c42")).toBe(true);
  for (const id of ["..", "", "a/b", "abc"]) {
    expect(isBatchId(id), id).toBe(false);
  }
});

test("isBatchFinished needs at least one render and all of them final", () => {
  expect(isBatchFinished([])).toBe(false);
  expect(isBatchFinished([{ state: "DONE" }, { state: "QUEUED" }])).toBe(false);
  expect(isBatchFinished([{ state: "DONE" }, { state: "FAILED" }])).toBe(true);
});

test("toBatchData maps a game to the template parameters", () => {
  const [entry] = toBatchData([{ home: "nuggets", away: "lakers" }]);
  expect(entry).toEqual({
    attributes: { home: "nuggets", away: "lakers" },
    parameters: {
      plainlyEditTeam1: "NUGGETS",
      plainlyEditLogo1: "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
      plainlyEditTeam2: "LAKERS",
      plainlyEditLogo2: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    },
  });
});

test("stateLabel turns API states into readable text", () => {
  expect(stateLabel("DONE")).toBe("Done");
  expect(stateLabel("IN_PROGRESS")).toBe("In progress");
});
