import { notFound } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import {
  adSchema,
  EXAMPLE,
  FORMATS,
  findTemplates,
  groupAds,
  isAdId,
  newAdId,
  type Render,
  type RenderTarget,
  renderBody,
  type Template,
  templatesByFormat,
  toParameters,
  toRender,
} from "@/lib/ad";

const PLAINLY_API = "https://api.plainlyvideos.com/api/v2";

// Env vars are read per request and never reach the browser
const plainlyFetch = createServerOnlyFn(
  async (path: string, init?: RequestInit) => {
    const apiKey = process.env.PLAINLY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PLAINLY_API_KEY is not set. Copy .env.example to .env and add your API key.",
      );
    }

    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    // Basic auth: API key as the username, empty password
    headers.set("Authorization", `Basic ${btoa(`${apiKey}:`)}`);

    return fetch(`${PLAINLY_API}${path}`, { ...init, headers });
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

// Template ids are not configured: the project lists its templates, and each
// template's resolution tells which aspect ratio it renders
const fetchTemplates = createServerOnlyFn(async (projectId: string) => {
  const res = await plainlyFetch(`/projects/${encodeURIComponent(projectId)}`);
  if (!res.ok) throw await apiError(res);
  const project: { templates?: Template[] } = await res.json();
  return project.templates ?? [];
});

// https://help.plainlyvideos.com/docs/developer-guide
const createRender = createServerOnlyFn(
  async (body: ReturnType<typeof renderBody>) => {
    const res = await plainlyFetch("/renders", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await apiError(res);
  },
);

// Finds renders by one custom attribute, so no database is needed. Newest
// first, so a full page leaves out the oldest renders
const filterRenders = createServerOnlyFn(
  async (key: string, value: string, size: number) => {
    const query = `size=${size}&sort=createdDate,desc`;
    const res = await plainlyFetch(`/renders/attributes?${query}`, {
      method: "POST",
      body: JSON.stringify({ filters: [{ key, value }] }),
    });
    if (!res.ok) throw await apiError(res);
    const renders: Render[] = await res.json();
    return renders.map(toRender);
  },
);

// One ad, three single render calls: same parameters, one template per format
export const createAd = createServerFn({ method: "POST" })
  .validator(adSchema)
  .handler(async ({ data: ad }) => {
    const projectId = getProjectId();
    const templates = templatesByFormat(await fetchTemplates(projectId));
    const adId = newAdId();
    const parameters = toParameters(ad);

    // Renders are independent: one format can fail while the others are created
    const results = await Promise.allSettled(
      FORMATS.map((format) =>
        createRender(
          renderBody({
            projectId,
            templateId: templates[format],
            adId,
            format,
            parameters,
          }),
        ),
      ),
    );

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    // Nothing was created, so there is no ad page to show
    if (failed.length === FORMATS.length) throw failed[0].reason;

    return { adId };
  });

// Real ids for the API request card, so the copied curl runs as it is
export const getRenderTarget = createServerFn({ method: "GET" }).handler(
  async (): Promise<RenderTarget> => {
    const projectId = getProjectId();
    // Shows what the project has, missing formats keep their placeholder
    const templates = await fetchTemplates(projectId).catch(() => []);
    return { projectId, templates: findTemplates(templates) };
  },
);

export const getAdRenders = createServerFn({ method: "GET" })
  .validator((adId: string) => {
    // Rejects ids like ".." before they reach the API
    if (!isAdId(adId)) throw notFound();
    return adId;
  })
  .handler(async ({ data: adId }) => {
    // Three formats, 50 leaves plenty of room
    const renders = await filterRenders("adId", adId, 50);
    if (renders.length === 0) throw notFound();
    return renders;
  });

// Latest ads made with this example, found by the `example` attribute
export const listAds = createServerFn({ method: "GET" }).handler(async () => {
  // About 20 ads with 3 renders each
  const size = 60;
  const renders = await filterRenders("example", EXAMPLE, size);
  const ads = groupAds(renders).slice(0, 20);
  if (renders.length < size) return ads;
  // A full page can cut off an ad's older renders, and a missing format counts
  // as failed. Ads with a failed format are loaded whole to be sure
  return Promise.all(
    ads.map(async (ad) =>
      ad.failed > 0
        ? groupAds(await filterRenders("adId", ad.adId, 50))[0]
        : ad,
    ),
  );
});
