import { notFound } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import {
  EXAMPLE,
  isBatchId,
  pickBatchInput,
  type Render,
  toBatchRequest,
  toCampaigns,
} from "@/lib/batch";
import { MAX_RECIPIENTS } from "@/lib/recipients";

const PLAINLY_API = "https://api.plainlyvideos.com/api/v2";

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

// Plainly error bodies are JSON with a `message`, fall back to the raw text
async function apiError(res: Response) {
  const text = await res.text();
  let message = text;
  try {
    message = JSON.parse(text).message ?? text;
  } catch {}
  return new Error(`Plainly API error ${res.status}: ${message}`);
}

const getProjectId = createServerOnlyFn(() => {
  const projectId = process.env.PLAINLY_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "PLAINLY_PROJECT_ID is not set. Copy .env.example to .env and add your project ID.",
    );
  }
  return projectId;
});

// Finds this example's renders by custom attributes, so no database is needed.
// Newest first, so a full page leaves out the oldest renders
const filterRenders = createServerOnlyFn(
  async (filters: { key: string; value: string }[], size: number) => {
    const query = `size=${size}&sort=createdDate,desc`;
    const res = await plainlyFetch(`/renders/attributes?${query}`, {
      method: "POST",
      body: JSON.stringify({
        filters: [{ key: "example", value: EXAMPLE }, ...filters],
      }),
    });
    if (!res.ok) throw await apiError(res);
    const renders: Render[] = await res.json();
    return renders;
  },
);

// https://help.plainlyvideos.com/docs/developer-guide/batch-renders-api
export const createBatch = createServerFn({ method: "POST" })
  .validator(pickBatchInput)
  .handler(async ({ data }) => {
    // Batch creation is synchronous and all-or-nothing:
    // either every render is created, or none of them are
    const res = await plainlyFetch("/batch", {
      method: "POST",
      body: JSON.stringify(toBatchRequest(data, getProjectId())),
    });
    if (!res.ok) throw await apiError(res);

    const batch: { id: string } = await res.json();
    return { id: batch.id };
  });

// One campaign with its renders. Plainly tags every batch render with
// `batchRenderId`, so the batch is found with the same attribute filter
export const getBatch = createServerFn({ method: "GET" })
  .validator((batchId: string) => {
    // Rejects ids like ".." before they reach the API
    if (!isBatchId(batchId)) throw notFound();
    return batchId;
  })
  .handler(async ({ data: batchId }) => {
    const renders = await filterRenders(
      [{ key: "batchRenderId", value: batchId }],
      MAX_RECIPIENTS,
    );
    // Unknown ids and batches made outside this app both come back empty
    const [campaign] = toCampaigns(renders);
    if (!campaign) throw notFound();
    return { campaign, renders };
  });

export const listCampaigns = createServerFn({ method: "GET" }).handler(
  async () => {
    // ponytail: reads the newest 1000 renders (at least 10 full campaigns),
    // page through the results if older campaigns must show
    return toCampaigns(await filterRenders([], 1000));
  },
);
