import { expect, test } from "vitest";
import {
  isBatchFinished,
  isBatchId,
  isFinished,
  pickGames,
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

test("pickGames keeps the games in order", () => {
  const games = [
    { home: "bulls", away: "celtics" },
    { home: "nuggets", away: "lakers" },
  ];
  expect(pickGames(games)).toEqual(games);
});

test("pickGames rejects empty, unknown and half-filled games", () => {
  expect(() => pickGames([])).toThrow("Schedule at least one game");
  expect(() => pickGames([{ home: "lakers", away: "nope" }])).toThrow(
    "Unknown team: nope",
  );
  expect(() => pickGames([{ home: "lakers" }])).toThrow(
    "Unknown team: undefined",
  );
});

test("pickGames lets each team play only once", () => {
  expect(() => pickGames([{ home: "lakers", away: "lakers" }])).toThrow(
    "The LAKERS already play tonight",
  );
  expect(() =>
    pickGames([
      { home: "lakers", away: "celtics" },
      { home: "heat", away: "celtics" },
    ]),
  ).toThrow("The CELTICS already play tonight");
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
