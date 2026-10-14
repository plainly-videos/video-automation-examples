import { expect, test } from "vitest";
import {
  type Draft,
  isComplete,
  pickGames,
  placeTeam,
  removeTeam,
} from "@/lib/game";

test("placeTeam fills the first open side, then starts a new game", () => {
  let games = placeTeam([], "lakers");
  games = placeTeam(games, "celtics");
  games = placeTeam(games, "heat");
  expect(games).toEqual([
    { home: "lakers", away: "celtics" },
    { home: "heat", away: undefined },
  ]);
});

test("placeTeam fills a missing home team first", () => {
  const games = placeTeam([{ away: "celtics" }], "lakers");
  expect(games).toEqual([{ home: "lakers", away: "celtics" }]);
});

test("removeTeam frees the slot and drops games with no teams left", () => {
  const games: Draft[] = [
    { home: "lakers", away: "celtics" },
    { home: "heat" },
  ];
  expect(removeTeam(games, "celtics")).toEqual([
    { home: "lakers", away: undefined },
    { home: "heat", away: undefined },
  ]);
  expect(removeTeam(games, "heat")).toEqual([
    { home: "lakers", away: "celtics" },
  ]);
});

test("isComplete needs both teams", () => {
  expect(isComplete({ home: "lakers", away: "celtics" })).toBe(true);
  expect(isComplete({ home: "lakers" })).toBe(false);
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
