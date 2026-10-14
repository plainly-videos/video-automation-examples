import { expect, test } from "vitest";
import { type Draft, isComplete, placeTeam, removeTeam } from "@/lib/schedule";

test("placeTeam without a slot fills the first open side, then starts a new game", () => {
  let games = placeTeam([], "lakers");
  games = placeTeam(games, "celtics");
  games = placeTeam(games, "heat");
  expect(games).toEqual([
    { home: "lakers", away: "celtics" },
    { home: "heat", away: undefined },
  ]);
});

test("placeTeam into an occupied slot replaces that team", () => {
  const games = placeTeam([{ home: "lakers", away: "celtics" }], "heat", {
    game: 0,
    side: "away",
  });
  expect(games).toEqual([{ home: "lakers", away: "heat" }]);
});

test("placeTeam moves a team that already plays and drops emptied games", () => {
  const games = placeTeam(
    [{ home: "lakers", away: "celtics" }, { home: "heat" }],
    "heat",
    { game: 0, side: "home" },
  );
  expect(games).toEqual([{ home: "heat", away: "celtics" }]);
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
