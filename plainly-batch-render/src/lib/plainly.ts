import { notFound } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { pickFixtures, type Render, toBatchData } from "@/lib/batch";

const PLAINLY_API = "https://api.plainlyvideos.com/api/v2";

// Server-only helper: env vars are read per request and never reach the browser
const plainlyFetch = createServerOnlyFn(
  async (path: string, init?: RequestInit) => {
    const apiKey = process.env.PLAINLY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PLAINLY_API_KEY is not set. Copy .env.example to .env and add your API key.",
      );
    }

    return fetch(`${PLAINLY_API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        // Basic auth: API key as the username, empty password
        Authorization: `Basic ${btoa(`${apiKey}:`)}`,
      },
    });
  },
);

// Creates all renders in a single request
// https://help.plainlyvideos.com/docs/developer-guide/batch-renders-api
export const createBatch = createServerFn({ method: "POST" })
  .validator((fixtureIds: string[]) => pickFixtures(fixtureIds))
  .handler(async ({ data: selected }) => {
    const projectId = process.env.PLAINLY_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        "PLAINLY_PROJECT_ID is not set. Copy .env.example to .env and add your project ID.",
      );
    }

    // Batch creation is synchronous and all-or-nothing:
    // either every render is created, or none of them are
    const res = await plainlyFetch("/batch", {
      method: "POST",
      body: JSON.stringify({
        projectId,
        batchData: toBatchData(selected),
      }),
    });

    if (!res.ok) {
      throw new Error(`Plainly API error ${res.status}: ${await res.text()}`);
    }

    const batch: { id: string } = await res.json();
    return { id: batch.id };
  });

// Lists every render created by the batch, with its current state
export const getBatchRenders = createServerFn({ method: "GET" })
  .validator((batchId: string) => batchId)
  .handler(async ({ data: batchId }) => {
    const res = await plainlyFetch(
      `/batch/${encodeURIComponent(batchId)}/renders`,
    );

    // Plainly answers 400 for malformed ids and 404 for unknown ones
    if (res.status === 400 || res.status === 404) throw notFound();
    if (!res.ok) {
      throw new Error(`Plainly API error ${res.status}: ${await res.text()}`);
    }

    const renders: Render[] = await res.json();
    return renders;
  });
