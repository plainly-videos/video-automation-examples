import { notFound } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import {
  EXAMPLE,
  groupLocalizations,
  isLocalizationId,
  localizationSchema,
  newLocalizationId,
  type Render,
  renderBody,
  toRender,
} from "@/lib/localization";

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

// The template id is not configured: the project's default template is used,
// or its first one
const fetchTemplateId = createServerOnlyFn(async (projectId: string) => {
  const res = await plainlyFetch(`/projects/${encodeURIComponent(projectId)}`);
  if (!res.ok) throw await apiError(res);
  const project: { defaultTemplateId?: string; templates?: { id: string }[] } =
    await res.json();
  const templateId = project.defaultTemplateId ?? project.templates?.[0]?.id;
  if (!templateId) throw new Error("Project has no template");
  return templateId;
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

// One localization, one single render call per language
export const createLocalization = createServerFn({ method: "POST" })
  .validator(localizationSchema)
  .handler(async ({ data: { design, versions } }) => {
    const projectId = getProjectId();
    const templateId = await fetchTemplateId(projectId);
    const localizationId = newLocalizationId();
    const languages = versions.map((version) => version.language);

    // Renders are independent: one language can fail while the others are created
    const results = await Promise.allSettled(
      versions.map((version) =>
        createRender(
          renderBody({
            projectId,
            templateId,
            localizationId,
            languages,
            design,
            version,
          }),
        ),
      ),
    );

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    // Nothing was created, so there is no page to show
    if (failed.length === versions.length) throw failed[0].reason;

    return { localizationId };
  });

// Real ids for the API request card, so the copied curl runs as it is
export const getRenderTarget = createServerFn({ method: "GET" }).handler(
  async () => {
    const projectId = getProjectId();
    const templateId = await fetchTemplateId(projectId).catch(() => undefined);
    return { projectId, templateId };
  },
);

export const getLocalization = createServerFn({ method: "GET" })
  .validator((id: string) => {
    // Rejects ids like ".." before they reach the API
    if (!isLocalizationId(id)) throw notFound();
    return id;
  })
  .handler(async ({ data: id }) => {
    // 11 languages at most, 50 leaves room for copied curls run again
    const renders = await filterRenders("localizationId", id, 50);
    if (renders.length === 0) throw notFound();
    return renders;
  });

// Latest localizations made with this example, found by the `example` attribute
export const listLocalizations = createServerFn({ method: "GET" }).handler(
  async () => {
    // ponytail: one page of renders, the oldest listed localization can miss
    // some languages. Load it whole with getLocalization if that matters
    const renders = await filterRenders("example", EXAMPLE, 200);
    return groupLocalizations(renders).slice(0, 20);
  },
);
