import { notFound } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import {
  type Ad,
  EXAMPLE,
  FORMATS,
  type Format,
  groupAds,
  isAdId,
  isFormat,
  pickAd,
  type Render,
  renderBody,
  type Template,
  templatesByFormat,
  toParameters,
} from "@/lib/ad";

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
const getTemplates = createServerOnlyFn(async (projectId: string) => {
  const res = await plainlyFetch(`/projects/${encodeURIComponent(projectId)}`);
  if (!res.ok) throw await apiError(res);
  const project: { templates?: Template[] } = await res.json();
  return templatesByFormat(project.templates ?? []);
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

// Finds renders by one custom attribute, so no database is needed
const filterRenders = createServerOnlyFn(
  async (key: string, value: string, size: number) => {
    const res = await plainlyFetch(`/renders/attributes?size=${size}`, {
      method: "POST",
      body: JSON.stringify({ filters: [{ key, value }] }),
    });
    if (!res.ok) throw await apiError(res);
    const renders: Render[] = await res.json();
    return renders;
  },
);

// One ad, three single render calls: same parameters, one template per format
export const createAd = createServerFn({ method: "POST" })
  .validator((ad: Ad) => pickAd(ad))
  .handler(async ({ data: ad }) => {
    const projectId = getProjectId();
    const templates = await getTemplates(projectId);
    const adId = crypto.randomUUID();
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

// Renders one format of an existing ad again
export const retryFormat = createServerFn({ method: "POST" })
  .validator((input: { adId: string; format: Format }) => {
    if (!isAdId(input?.adId) || !isFormat(input?.format)) {
      throw new Error("Invalid retry request");
    }
    return { adId: input.adId, format: input.format };
  })
  .handler(async ({ data: { adId, format } }) => {
    const projectId = getProjectId();
    // Every render of an ad has the same parameters, copy them from any of them
    const renders = await filterRenders("adId", adId, 50);
    const parameters = renders.find((render) => render.parameters)?.parameters;
    if (!parameters) throw new Error("Ad not found");

    const templates = await getTemplates(projectId);
    // Same attributes as the first try, so the new render replaces the old one
    await createRender(
      renderBody({
        projectId,
        templateId: templates[format],
        adId,
        format,
        parameters,
      }),
    );
  });

// Every render of one ad, including retries
export const getAdRenders = createServerFn({ method: "GET" })
  .validator((adId: string) => {
    // Rejects ids like ".." before they reach the API
    if (!isAdId(adId)) throw notFound();
    return adId;
  })
  .handler(async ({ data: adId }) => {
    // Three formats plus retries, 50 leaves plenty of room
    const renders = await filterRenders("adId", adId, 50);
    if (renders.length === 0) throw notFound();
    return renders;
  });

// Latest ads made with this example, found by the `example` attribute
export const listAds = createServerFn({ method: "GET" }).handler(async () => {
  // About 20 ads with 3 renders each
  const renders = await filterRenders("example", EXAMPLE, 60);
  return groupAds(renders).slice(0, 20);
});
