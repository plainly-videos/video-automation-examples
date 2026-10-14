import { useSyncExternalStore } from "react";
import { isBatchId } from "@/lib/batch";
import type { Game } from "@/lib/game";
import { isTeamId } from "@/teams";

export type PastBatch = { id: string; games: Game[]; createdAt: number };

const KEY = "batch-history";
const LIMIT = 20;
const EMPTY: PastBatch[] = [];

const isPastBatch = (batch: {
  id?: unknown;
  games?: unknown;
  createdAt?: unknown;
}): batch is PastBatch =>
  isBatchId(String(batch?.id)) &&
  typeof batch.createdAt === "number" &&
  Array.isArray(batch.games) &&
  batch.games.every((game) => isTeamId(game?.home) && isTeamId(game?.away));

// localStorage can hold anything (old formats, manual edits), keep only valid batches
export function parseHistory(raw: string | null): PastBatch[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? list.filter(isPastBatch) : EMPTY;
  } catch {
    return EMPTY;
  }
}

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    // Storage can be blocked (private mode, disabled cookies)
    return null;
  }
};

// useSyncExternalStore needs the same array back until storage changes
let raw: string | null = null;
let snapshot = EMPTY;
const getSnapshot = () => {
  const next = read();
  if (next !== raw) {
    raw = next;
    snapshot = parseHistory(next);
  }
  return snapshot;
};

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Fires when another tab changes the history
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

export function saveBatch(batch: PastBatch) {
  try {
    const list = [batch, ...getSnapshot()].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    return;
  }
  for (const listener of listeners) listener();
}

// The server has no localStorage, so it renders an empty history
export const useBatchHistory = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
