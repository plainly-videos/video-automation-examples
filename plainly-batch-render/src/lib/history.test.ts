import { expect, test } from "vitest";
import { parseHistory } from "@/lib/history";

const valid = {
  id: "97226b64-8b8a-437d-a76e-f014d3845c42",
  games: [{ home: "nuggets", away: "lakers" }],
  createdAt: 1760000000000,
};

test("parseHistory keeps valid batches", () => {
  expect(parseHistory(JSON.stringify([valid]))).toEqual([valid]);
});

test("parseHistory drops malformed entries", () => {
  const list = [
    valid,
    null,
    { ...valid, id: "../admin" },
    { ...valid, createdAt: "yesterday" },
    { ...valid, games: [{ home: "nuggets", away: "nope" }] },
  ];
  expect(parseHistory(JSON.stringify(list))).toEqual([valid]);
});

test("parseHistory survives empty or broken storage", () => {
  expect(parseHistory(null)).toEqual([]);
  expect(parseHistory("{not json")).toEqual([]);
  expect(parseHistory('{"id":1}')).toEqual([]);
});
