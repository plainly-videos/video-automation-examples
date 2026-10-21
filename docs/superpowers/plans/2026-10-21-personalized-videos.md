# Personalized Videos Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `plainly-personalized-videos/`, an example app where a sales rep uploads a client CSV, renders one holiday greeting video per client with one Batch API request, and copies each client's link (or a clickable thumbnail) into Gmail.

**Architecture:** TanStack Start app copied from the `plainly-dynamic-video-ads` skeleton. One page (`/`) with a `?batch=<id>` search param: without it the page shows upload + campaign settings + client table; with it, the same table lists the batch's renders and polls until done. Every render is tagged with `example: "personalized-videos"` and its campaign, so the app reads renders back with `POST /renders/attributes` and never shows batches made elsewhere (Plainly app, other tools). Pure logic (CSV rows, validation, batch request, file names, email snippet, campaign grouping) lives in `src/lib/recipients.ts` and `src/lib/batch.ts` and is unit tested; `src/lib/plainly.ts` is the only file that calls the API. No database, no webhooks, no localStorage.

**Tech Stack:** TanStack Start 1.168, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui (base-nova), papaparse 5.7, Biome 2.5, Vitest 5, pnpm 12, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-21-personalized-videos-design.md`

## Global Constraints

- Folder: `plainly-personalized-videos/` at repo root. Package name `plainly-personalized-videos`.
- Dependencies: exactly the versions in `plainly-dynamic-video-ads/package.json`, minus `@fontsource/anton`, `@tanstack/react-form`, `zod` (unused here), plus `papaparse@5.7.0` and dev `@types/papaparse@5.5.2`. No other new dependencies. shadcn `switch` and `table` are generated source files.
- Environment: only `PLAINLY_API_KEY` and `PLAINLY_PROJECT_ID`.
- API base `https://api.plainlyvideos.com/api/v2`, Basic auth (API key as username, empty password), server code only.
- CSV headers exactly `name,title,company,headshot`, any order, case-insensitive, trimmed; extra columns ignored. All four required per row; `headshot` must be an `http(s)` URL.
- Parameters: `Name`, `Title`, `Company`, `Image`. Only `toBatchRequest` in `src/lib/batch.ts` mentions them.
- Render attributes: `example: "personalized-videos"`, `campaign`, `name`, `title`, `company`, `headshot`. Plainly adds `batchRenderId` (and other `batchRender*` keys) itself.
- Reading renders: always `POST /renders/attributes?size=<n>&sort=createdDate,desc` with an `example = personalized-videos` filter (filters in one request must all match). Never list batches with `GET /batch`.
- At most 100 valid rows per batch (`MAX_RECIPIENTS = 100`).
- Campaign name default `Holiday greetings 2026`, required, sent as batch `reference` and as the `campaign` attribute.
- Draft switch on by default; on → `outputFormat.settingsTemplate: "DRAFT"`, off → no `outputFormat`.
- Thumbnails: `options.thumbnails.atSeconds: [5]`.
- File name: per-entry `attachmentFileName` = `<campaign>-<name>` reduced to ASCII letters, digits, dashes. Never set `outputFormat.attachment`.
- Polling every 5 seconds, next poll scheduled after the previous one settles (as in `plainly-batch-render`).
- Names in tests and the sample CSV are English.
- Live testing uses draft renders only. Dev server for testing runs on port 3001+ with `--strictPort`; port 3000 belongs to the user and is never killed. Kill only processes you started. Browser automation uses Chrome.
- Code style: match `plainly-dynamic-video-ads` (short comments explaining *why*, Biome formatting, `@/` imports).
- Commit messages: Conventional Commits, ending with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Commands run from `plainly-personalized-videos/` unless stated otherwise.

## Review Focus

1. Real CRM/Excel exports: UTF-8 BOM, CRLF, quoted fields with commas, rows of only commas, trailing blank lines. Must give the right clients. Pinned in Task 2 (`readClients` tests).
2. Names with accents or punctuation (`Zoë Turner`, `Liam O'Brien`) or nothing usable must give readable file names, never empty or dash-led. Pinned in Task 3 (`fileName` tests).
3. A client name containing `<`, `>`, `"` or `&` must not break or inject into the Copy for email HTML. Pinned in Task 3 (`emailSnippet` test).
4. A hand-crafted `createBatch` call (101 recipients, `javascript:` headshot, missing field, non-string values, blank campaign) must be rejected with a readable message before reaching Plainly. Pinned in Task 3 (`pickBatchInput` tests).
5. Renders and batches made outside this example (Plainly app, other tools, the earlier test batch) must not appear in past campaigns, and opening their batch id must show "Campaign not found". Pinned in Task 3 (`toCampaigns` test) and Task 4 (filter), checked live in Task 7.

---

## File Structure

```
README.md                                     modify: add example 5
after-effects-projects/Christmas Greetings.zip create: AE project
plainly-personalized-videos/
  .env.example .gitignore .nvmrc biome.json components.json package.json
  pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json vite.config.ts vitest.config.ts
  public/                                     copied, manifest renamed, + sample-clients.csv
  README.md  .assets/app.png .assets/video.png
  src/styles.css src/router.tsx src/lib/utils.ts   copied unchanged
  src/routeTree.gen.ts                        generated by vite, committed
  src/lib/recipients.ts (+ .test.ts)          Recipient, ClientRow, checkRecipient, readClients (papaparse)
  src/lib/batch.ts (+ .test.ts)               render types and helpers, request shaping, file name, email snippet, campaigns
  src/lib/plainly.ts                          server functions, only file calling the API
  src/components/ui/*                         copied + shadcn switch, table
  src/components/clients-table.tsx            ClientsTable: one row per client, video cell is a slot
  src/components/client-upload.tsx            ClientUpload: drop zone, file picker, sample links
  src/components/campaign-form.tsx            CampaignForm: upload + settings + table + Render button
  src/components/render-cell.tsx              RenderCell: state, preview, copy buttons
  src/components/batch-results.tsx            BatchResults: header + polling + table
  src/components/past-campaigns.tsx           PastCampaigns card
  src/routes/__root.tsx                       shell, logo, footer
  src/routes/index.tsx                        search param, loader, picks form or results
```

---

### Task 1: Scaffold the app

**Files:**
- Create: `plainly-personalized-videos/` (copied config, `public/`, `src/styles.css`, `src/router.tsx`, `src/lib/utils.ts`, `src/components/ui/*`)
- Create: `.env.example`, `public/sample-clients.csv`, `src/routes/__root.tsx`, `src/routes/index.tsx`
- Create: `src/components/ui/switch.tsx`, `src/components/ui/table.tsx` (generated by shadcn)

**Interfaces:**
- Produces: a building app; `@/components/ui/{alert,badge,button,card,empty,field,input,item,label,select,separator,switch,table}`; `@/lib/utils` (`cn`); root route rendering `<Outlet />` in the shared shell; `/sample-clients.csv` served from `public/`; `papaparse` installed.

- [ ] **Step 0: Branch and commit the docs**

From repo root: `git switch -c feat/personalized-videos`, then commit the spec and this plan (`docs: add personalized videos design spec and plan`).

- [ ] **Step 1: Copy the skeleton**

From repo root:

```bash
mkdir -p plainly-personalized-videos/src/lib plainly-personalized-videos/src/components plainly-personalized-videos/src/routes
cd plainly-dynamic-video-ads
cp -R .nvmrc .gitignore biome.json components.json package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json vite.config.ts vitest.config.ts public ../plainly-personalized-videos/
cp -R src/components/ui ../plainly-personalized-videos/src/components/
cp src/styles.css src/router.tsx ../plainly-personalized-videos/src/
cp src/lib/utils.ts ../plainly-personalized-videos/src/lib/
cd ../plainly-personalized-videos
```

- [ ] **Step 2: Rename, trim, add papaparse**

`package.json`: name `plainly-personalized-videos`; remove `@fontsource/anton`, `@tanstack/react-form`, `zod` (and any `@fontsource/anton` import in `src/styles.css`). Run `pnpm add papaparse@5.7.0 && pnpm add -D @types/papaparse@5.5.2` (exact versions in `package.json`, no `^`). `public/manifest.json`: `short_name` `Personalized videos`, `name` `Plainly Videos personalized videos example`.

- [ ] **Step 3: Add shadcn components**

Run: `pnpm dlx shadcn@4.21.4 add switch table`
Expected: `src/components/ui/switch.tsx` and `table.tsx` created, no dependency added.

- [ ] **Step 4: `.env.example`**

```properties
# Plainly API key, from https://app.plainlyvideos.com/dashboard/user/settings/general
PLAINLY_API_KEY=your_plainly_api_key

# ID of the Christmas Greetings project you uploaded to Plainly.
# Its default template needs the parameters Name, Title, Company and Image
PLAINLY_PROJECT_ID=your_plainly_project_id
```

Create local `.env` with the user's key and project `de90ca8a-500c-49c4-9bed-2d19df948fe6` (gitignored; `git status` must not list it).

- [ ] **Step 5: `public/sample-clients.csv`**

Header `name,title,company,headshot`, then 7 rows with English names and `https://randomuser.me/api/portraits/{women|men}/<n>.jpg` headshots. 6 valid, including `Zoë Turner` (accent), one company `"Acme, Inc."` (quoted comma) and one title `"Senior Vice President, Global Partnerships"` (long text). 1 row with an empty headshot, so the sample shows validation.

- [ ] **Step 6: Root layout and placeholder index**

`src/routes/__root.tsx`: copy `plainly-dynamic-video-ads/src/routes/__root.tsx`, drop the loader, `RecentAds` and `RootLayout` (no `component`), title `Plainly Videos personalized videos example`, GitHub footer link `.../tree/master/plainly-personalized-videos`. `src/routes/index.tsx`: route rendering `<p>Personalized videos</p>`.

- [ ] **Step 7: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: all pass, `src/routeTree.gen.ts` generated.

- [ ] **Step 8: Commit** (`feat(personalized-videos): scaffold app`), including `routeTree.gen.ts`, excluding `.env`.

---

### Task 2: Client rows from CSV

**Files:**
- Create: `src/lib/recipients.ts`, `src/lib/recipients.test.ts`

**Interfaces:**
- Produces:
  - `RECIPIENT_COLUMNS = ["name", "title", "company", "headshot"] as const`
  - `MAX_RECIPIENTS = 100`
  - `type Recipient = Record<(typeof RECIPIENT_COLUMNS)[number], string>`
  - `type ClientRow = Recipient & { error?: string }`
  - `checkRecipient(r: Recipient): string | undefined` — first failing check's message, in column order
  - `readClients(csvText: string): { rows: ClientRow[]; error?: string }`

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, test } from "vitest";
import { checkRecipient, readClients } from "@/lib/recipients";

const emma = {
  name: "Emma Johnson",
  title: "Head of Marketing",
  company: "Northwind",
  headshot: "https://randomuser.me/api/portraits/women/44.jpg",
};
const header = "name,title,company,headshot";
const line = `Emma Johnson,Head of Marketing,Northwind,${emma.headshot}`;

test("checkRecipient accepts a complete client", () => {
  expect(checkRecipient(emma)).toBeUndefined();
});

test("checkRecipient names the first problem", () => {
  expect(checkRecipient({ ...emma, name: "  " })).toBe("Missing name");
  expect(checkRecipient({ ...emma, title: "" })).toBe("Missing title");
  expect(checkRecipient({ ...emma, company: "" })).toBe("Missing company");
  expect(checkRecipient({ ...emma, headshot: "" })).toBe("Missing headshot");
  for (const headshot of ["photo.jpg", "javascript:alert(1)", "ftp://x/y.jpg"]) {
    expect(checkRecipient({ ...emma, headshot }), headshot).toBe(
      "Headshot must be an http(s) URL",
    );
  }
});

test("readClients maps headers in any order, case and spacing, and ignores extra columns", () => {
  const csv = ` Headshot ,NAME,Company,title,email\n${emma.headshot},Emma Johnson,Northwind,Head of Marketing,e@x.com`;
  expect(readClients(csv)).toEqual({ rows: [emma] });
});

test("readClients handles a BOM, CRLF, quoted commas, blank and comma-only lines", () => {
  const csv = `﻿${header}\r\n Emma Johnson ,Head of Marketing,"Northwind, Inc.",${emma.headshot}\r\n,,,\r\n\r\n`;
  expect(readClients(csv)).toEqual({ rows: [{ ...emma, company: "Northwind, Inc." }] });
});

test("readClients keeps invalid rows with their error", () => {
  expect(readClients(`${header}\nLiam O'Brien,CTO,Acme,`).rows).toEqual([
    { name: "Liam O'Brien", title: "CTO", company: "Acme", headshot: "", error: "Missing headshot" },
  ]);
});

test("readClients fails the file when columns are missing", () => {
  expect(readClients("name,company\nEmma,Northwind")).toEqual({
    rows: [],
    error: "Missing columns: title, headshot. Expected headers: name, title, company, headshot.",
  });
});

test("readClients fails an empty file", () => {
  expect(readClients("")).toEqual({ rows: [], error: "The CSV file is empty." });
  expect(readClients("﻿\n")).toEqual({ rows: [], error: "The CSV file is empty." });
});

test("readClients fails when there are more valid clients than one batch takes", () => {
  const csv = [header, ...Array(101).fill(line)].join("\n");
  expect(readClients(csv).error).toBe("Too many clients: 101 valid rows, at most 100 per batch.");
});
```

- [ ] **Step 2: Run** `pnpm test src/lib/recipients.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement in `src/lib/recipients.ts`**

`checkRecipient` checks `name`, `title`, `company`, `headshot` non-empty after trim in that order (`Missing <column>`), then `new URL(headshot)` protocol is `http:` or `https:` (a throw counts as invalid). `readClients`: `Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim().toLowerCase() })`; missing columns from `meta.fields`; trim every value (`?? ""`); if papaparse leaves the BOM on the first header, strip it in `transformHeader`. When valid rows exceed the limit, return `rows` alongside the error so the table still shows them.

- [ ] **Step 4: Run** `pnpm test src/lib/recipients.test.ts` → PASS.

- [ ] **Step 5: Commit** (`feat(personalized-videos): read and validate clients from CSV`).

---

### Task 3: Batch helpers

**Files:**
- Create: `src/lib/batch.ts`, `src/lib/batch.test.ts`

**Interfaces:**
- Consumes: `Recipient`, `checkRecipient`, `MAX_RECIPIENTS` (Task 2).
- Produces:
  - `EXAMPLE = "personalized-videos"`, `DEFAULT_CAMPAIGN = "Holiday greetings 2026"`, `THUMBNAIL_AT_SECONDS = 5`
  - `type RenderAttributes = Partial<Recipient> & { example?: string; campaign?: string; batchRenderId?: string; batchRenderDataEntryNo?: number }`
  - `type Render = { id: string; state: string; createdDate: string; attributes: RenderAttributes | null; output?: string; thumbnailUris?: string[]; expired?: boolean; outputFormat?: { settingsTemplate?: string | null } | null }`
  - `type Campaign = { id: string; name: string; createdDate: string; videos: number; draft: boolean }`
  - `type BatchInput = { campaign: string; draft: boolean; recipients: Recipient[] }`
  - `isFinished`, `isBatchFinished`, `stateLabel`, `isBatchId` — copied with their tests from `plainly-batch-render/src/lib/batch.ts`
  - `isDraft(render: Pick<Render, "outputFormat">): boolean`
  - `toCampaigns(renders: Render[]): Campaign[]` — grouped by `attributes.batchRenderId` (renders without it skipped), `name` = `attributes.campaign ?? "Untitled"`, `createdDate` = newest render's, `videos` = render count, `draft` from any render; newest campaign first
  - `fileName(campaign: string, name: string): string`
  - `pickBatchInput(input: unknown): BatchInput` — throws `Error` with a readable message; returns trimmed values
  - `toBatchRequest(input: BatchInput, projectId: string): object` — the `POST /batch` body
  - `emailSnippet(r: { output: string; thumbnail: string; name: string }): { html: string; text: string }`

- [ ] **Step 1: Write the failing tests**

Copy the `isFinished`, `isBatchId`, `isBatchFinished`, `stateLabel` tests from `plainly-batch-render/src/lib/batch.test.ts`, then add:

```ts
const emma = { name: "Emma Johnson", title: "Head of Marketing", company: "Northwind", headshot: "https://randomuser.me/api/portraits/women/44.jpg" };

test("fileName joins campaign and name into a plain ASCII file name", () => {
  expect(fileName("Holiday greetings 2026", "Emma Johnson")).toBe("Holiday-greetings-2026-Emma-Johnson");
  expect(fileName("Holiday greetings 2026", "Zoë Turner")).toBe("Holiday-greetings-2026-Zoe-Turner");
  expect(fileName("Holiday greetings 2026", "Liam O'Brien")).toBe("Holiday-greetings-2026-Liam-O-Brien");
  expect(fileName("Holiday greetings 2026", "???")).toBe("Holiday-greetings-2026");
  expect(fileName("!!", "???")).toBe("video");
});

test("toBatchRequest builds one tagged entry per client", () => {
  expect(toBatchRequest({ campaign: "Holiday greetings 2026", draft: true, recipients: [emma] }, "project-1")).toEqual({
    projectId: "project-1",
    reference: "Holiday greetings 2026",
    outputFormat: { settingsTemplate: "DRAFT" },
    options: { thumbnails: { atSeconds: [5] } },
    batchData: [{
      attachmentFileName: "Holiday-greetings-2026-Emma-Johnson",
      attributes: { example: "personalized-videos", campaign: "Holiday greetings 2026", ...emma },
      parameters: { Name: "Emma Johnson", Title: "Head of Marketing", Company: "Northwind", Image: emma.headshot },
    }],
  });
});

test("toBatchRequest leaves out draft settings for final renders", () => {
  const body = toBatchRequest({ campaign: "X", draft: false, recipients: [emma] }, "p") as Record<string, unknown>;
  expect(body.outputFormat).toBeUndefined();
});

test("pickBatchInput accepts and trims a valid input", () => {
  expect(pickBatchInput({ campaign: " Holiday ", draft: false, recipients: [{ ...emma, name: " Emma Johnson " }] }))
    .toEqual({ campaign: "Holiday", draft: false, recipients: [emma] });
});

test("pickBatchInput rejects hand-crafted input", () => {
  const ok = { campaign: "Holiday", draft: true, recipients: [emma] };
  const cases: [unknown, string][] = [
    [null, "Invalid request"],
    [{ ...ok, campaign: "  " }, "Campaign name is required"],
    [{ ...ok, draft: "yes" }, "Invalid request"],
    [{ ...ok, recipients: [] }, "Add at least one client"],
    [{ ...ok, recipients: Array(101).fill(emma) }, "At most 100 clients per batch"],
    [{ ...ok, recipients: [{ ...emma, headshot: "javascript:alert(1)" }] }, "Client 1: Headshot must be an http(s) URL"],
    [{ ...ok, recipients: [{ ...emma, name: 42 }] }, "Client 1: Missing name"],
  ];
  for (const [input, message] of cases) {
    expect(() => pickBatchInput(input), message).toThrow(message);
  }
});

test("isDraft reads the render settings template", () => {
  expect(isDraft({ outputFormat: { settingsTemplate: "DRAFT" } })).toBe(true);
  expect(isDraft({ outputFormat: { settingsTemplate: null } })).toBe(false);
  expect(isDraft({ outputFormat: null })).toBe(false);
});

test("toCampaigns groups renders by batch, newest first, and skips renders without a batch", () => {
  const render = (id: string, batch: string | undefined, createdDate: string, campaign?: string): Render => ({
    id, state: "DONE", createdDate,
    attributes: batch ? { batchRenderId: batch, campaign } : null,
    outputFormat: { settingsTemplate: "DRAFT" },
  });
  expect(toCampaigns([
    render("1", "a", "2026-10-20T10:00:00Z", "Old"),
    render("2", "b", "2026-10-21T10:00:01Z"),
    render("3", "a", "2026-10-20T10:00:05Z", "Old"),
    render("4", undefined, "2026-10-22T10:00:00Z"),
  ])).toEqual([
    { id: "b", name: "Untitled", createdDate: "2026-10-21T10:00:01Z", videos: 1, draft: true },
    { id: "a", name: "Old", createdDate: "2026-10-20T10:00:05Z", videos: 2, draft: true },
  ]);
});

test("emailSnippet links the thumbnail to the video and escapes the name", () => {
  const { html, text } = emailSnippet({ output: "https://v/x.mp4?a=1&b=2", thumbnail: "https://v/x.png", name: `Emma "<b>" & co` });
  expect(text).toBe("https://v/x.mp4?a=1&b=2");
  expect(html).toBe(
    '<a href="https://v/x.mp4?a=1&amp;b=2"><img src="https://v/x.png" alt="Holiday video for Emma &quot;&lt;b&gt;&quot; &amp; co" width="480"></a>',
  );
});
```

- [ ] **Step 2: Run** `pnpm test src/lib/batch.test.ts` → FAIL.

- [ ] **Step 3: Implement in `src/lib/batch.ts`**

`fileName`: per part `normalize("NFKD")`, drop `\p{M}`, replace runs of non `[A-Za-z0-9]` with `-`, trim dashes; join non-empty parts with `-`, fall back to `video`. `pickBatchInput` reuses `checkRecipient` per client (prefix `Client <n>: `), treats non-string fields as empty. `emailSnippet` escapes `& < > "` in every interpolated value.

- [ ] **Step 4: Run** `pnpm test` → all PASS.

- [ ] **Step 5: Commit** (`feat(personalized-videos): add batch request and campaign helpers`).

---

### Task 4: Server functions and page route

**Files:**
- Create: `src/lib/plainly.ts`, `src/components/past-campaigns.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: everything from Task 3.
- Produces:
  - `createBatch` — `createServerFn({ method: "POST" })`, validator `pickBatchInput`, posts `toBatchRequest(data, projectId)` to `/batch`, returns `{ id: string }`
  - `getBatch` — `createServerFn({ method: "GET" })`, validator rejects non-UUIDs with `notFound()`; filters `example = personalized-videos` and `batchRenderId = <id>`, size `MAX_RECIPIENTS`; returns `{ campaign: Campaign; renders: Render[] }` (`campaign` = `toCampaigns(renders)[0]`); no renders → `notFound()`
  - `listCampaigns` — `createServerFn({ method: "GET" })`, filter `example = personalized-videos`, size 1000 → `toCampaigns(...)`
  - `Route` in `src/routes/index.tsx` with search `{ batch?: string }` (kept only when `isBatchId`), loader returning `{ campaigns: Campaign[]; campaignsError?: string; result?: { campaign: Campaign; renders: Render[] } }`
  - `PastCampaigns({ campaigns: Campaign[]; error?: string })` — card listing name, date, `N videos`, `Draft` badge; each links to `/?batch=<id>`; empty state "No campaigns yet"

- [ ] **Step 1: `src/lib/plainly.ts`**

Copy `plainlyFetch`, `apiError` and env checks from `plainly-batch-render/src/lib/plainly.ts`, and `filterRenders` from `plainly-dynamic-video-ads/src/lib/plainly.ts`, changed to take a filter list: `filterRenders(filters: { key: string; value: string }[], size: number): Promise<Render[]>` (always prepends the `example` filter). Comment on `listCampaigns`: `ponytail:` reads the newest 1000 renders (at least 10 full campaigns); page through if older campaigns must show.

- [ ] **Step 2: Route and past campaigns**

`index.tsx`: `validateSearch`, `loaderDeps: ({ search }) => ({ batch: search.batch })`, loader runs `listCampaigns` (a failure becomes `campaignsError`, like recent ads in `plainly-dynamic-video-ads`) and `getBatch` when `batch` is set. Component renders `<p>` placeholders for form/results (Tasks 5–6) above `<PastCampaigns>`. `notFoundComponent` shows "Campaign not found" with a link to `/`.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`, then `pnpm dev --port 3001 --strictPort` and open `http://localhost:3001/`, `/?batch=32aad62a-0aec-40da-bff3-6c473634a1ae`, `/?batch=abc`.
Expected: "No campaigns yet" (the earlier test batch has no `example` attribute, so it is not listed); the test batch URL shows "Campaign not found"; `/?batch=abc` shows the page without a batch. Stop the dev server you started.

- [ ] **Step 4: Commit** (`feat(personalized-videos): add Plainly server functions and campaign list`).

---

### Task 5: Campaign form (before rendering)

**Files:**
- Create: `src/components/clients-table.tsx`, `src/components/client-upload.tsx`, `src/components/campaign-form.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `readClients`, `ClientRow`, `Recipient` (Task 2); `DEFAULT_CAMPAIGN` (Task 3); `createBatch` (Task 4).
- Produces:
  - `ClientsTable({ clients: { key: string; headshot?: string; name?: string; title?: string; company?: string; video: React.ReactNode; invalid?: boolean }[] })` — shadcn table: headshot (round 32 px image, blank when missing), Name, Title, Company, Video; `invalid` rows in destructive text
  - `ClientUpload({ onLoad: (csvText: string) => void })` — drop zone + hidden `<input type="file" accept=".csv,text/csv">`, "use sample CSV" (fetches `/sample-clients.csv`) and "download sample" (`<a href="/sample-clients.csv" download>`)
  - `CampaignForm()` — owns `rows`, file `error`, `campaign` (default `DEFAULT_CAMPAIGN`), `draft` (default `true`), submit state

- [ ] **Step 1: Build the components**

`CampaignForm` order: upload, file error alert, campaign `Input` (required) + `Switch` "Draft preview (free)" with helper text "Half resolution, no video minutes used", `ClientsTable` (invalid rows show their `error` in the Video cell, valid rows "Ready"), button `Render N videos` / `Render N drafts` (N = valid rows; disabled when 0, when the file has an error, when the campaign is blank, or while submitting). Submit calls `createBatch({ data: { campaign, draft, recipients } })` with the valid rows (without `error`) and navigates to `{ search: { batch: id } }`; a failure shows a destructive alert with the message and keeps the rows.

- [ ] **Step 2: Wire into `index.tsx`** — no `batch` in search → `<CampaignForm />`.

- [ ] **Step 3: Verify**

`pnpm lint && pnpm typecheck`, then on `pnpm dev --port 3001 --strictPort` click "use sample CSV". Expected: 7 rows, 1 red with "Missing headshot", button `Render 6 drafts`; switch off → `Render 6 videos`; a CSV without `title` shows the missing-columns message. Do not click Render yet. Stop the dev server.

- [ ] **Step 4: Commit** (`feat(personalized-videos): add CSV upload and campaign form`).

---

### Task 6: Batch results

**Files:**
- Create: `src/components/render-cell.tsx`, `src/components/batch-results.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `ClientsTable` (Task 5); `getBatch` (Task 4); `isFinished`, `isBatchFinished`, `stateLabel`, `emailSnippet`, `Render`, `Campaign` (Task 3).
- Produces:
  - `RenderCell({ render: Render })` — in progress: spinner + `stateLabel`; failed/invalid/cancelled: "Failed"; done + expired: "Expired"; done: `<video controls preload="metadata" poster={thumbnailUris[0]}>` (≈ 240 px wide) plus **Copy link** (copies `output`) and **Copy for email** (only with a thumbnail; `navigator.clipboard.write` with `text/html` and `text/plain` from `emailSnippet`, `name` from attributes), each showing "Copied" for 2 s
  - `BatchResults({ campaign: Campaign; renders: Render[] })` — header: campaign name, `Draft` badge when `campaign.draft`, `finished/total finished`, "New campaign" link to `/`; polling copied from `BatchRenders` in `plainly-batch-render/src/routes/batch.$batchId.tsx`, re-fetching `getBatch`; rows from `render.attributes`, sorted by `attributes.batchRenderDataEntryNo` ascending so they follow the CSV order (the API returns newest first); when the campaign is a draft and finished, a note: "Drafts are half resolution. Turn off Draft preview and render again for the final videos."

- [ ] **Step 1: Build both components**, keyed on the batch id in `index.tsx` (`<BatchResults key={campaign.id} ... />` when `result` is present).

- [ ] **Step 2: Verify** `pnpm lint && pnpm typecheck && pnpm test` → pass.

- [ ] **Step 3: Commit** (`feat(personalized-videos): show batch results with copy buttons`).

---

### Task 7: Live check with draft renders

**Files:**
- Modify (only if needed): `src/lib/recipients.ts`, `src/lib/recipients.test.ts`, `public/sample-clients.csv`
- Create: `.assets/app.png`, `.assets/video.png`

- [ ] **Step 1: Render the sample as drafts**

`pnpm dev --port 3001 --strictPort`. In Chrome (Playwright): "use sample CSV", keep Draft on, click `Render 6 drafts`. Expected: URL gets `?batch=<uuid>`, 6 rows go from spinner to video within a few minutes, Draft badge shown, the campaign is the only one in Past campaigns.

- [ ] **Step 2: Check each feature on one render**

`curl -sI <output>` → `content-disposition: inline; filename="Holiday-greetings-2026-<Name>.mp4"`. Copy for email, paste into a `contenteditable` test div → linked thumbnail image. Reload → table rebuilt from Plainly. `/?batch=32aad62a-0aec-40da-bff3-6c473634a1ae` → "Campaign not found".

- [ ] **Step 3: Long text**

Look at the thumbnail of the `Senior Vice President, Global Partnerships` row. If title or company text overflows the badge: add per-column length limits to `checkRecipient` (message `<Column> is too long (max N characters)`, N = longest value that fits, found with at most 2 more draft renders), add a test, note the limit in the README. If it fits, change nothing.

- [ ] **Step 4: Screenshots**

`.assets/app.png`: results page, all rows done. `.assets/video.png`: one thumbnail at full size. Stop the dev server and close the browser you opened.

- [ ] **Step 5: Commit** (`docs(personalized-videos): add screenshots`; any limit fix as its own `fix:` commit).

---

### Task 8: Docs and AE project

**Files:**
- Create: `plainly-personalized-videos/README.md`, `after-effects-projects/Christmas Greetings.zip`
- Modify: `README.md` (repo root)

- [ ] **Step 1: AE project**

`curl -u "$PLAINLY_API_KEY:" -o "after-effects-projects/Christmas Greetings.zip" https://api.plainlyvideos.com/api/v2/projects/de90ca8a-500c-49c4-9bed-2d19df948fe6/download`. Expected: `unzip -l` lists an `.aep`. On `403 FEATURE_GATING_NOT_ALLOWED_PROJECT_DOWNLOAD`, stop and ask the user for the zip.

- [ ] **Step 2: Example README**

Sections as in `plainly-dynamic-video-ads/README.md`: What this app does, What you'll learn (the spec's 7 teaching points), Prerequisites, Getting started (upload `Christmas Greetings.zip`, auto-generate template, `.env`), Usage (CSV format table, sample CSV, draft first then final, Copy link vs Copy for email), API sections with request snippets (batch request body, file name, thumbnails, draft, reference, finding the example's renders with the attribute filter and `batchRenderId`), Good to know (headshots must be public URLs; output links expire, the draft test expired after 7 days, send before `expirationDate`; at most 100 clients per batch; batches made outside the app are not listed because they lack the `example` attribute; thumbnails have no CORS so Copy for email references the image URL), Useful commands.

- [ ] **Step 3: Root README** — entry 5 under Examples, same shape as entry 4: Purpose (spec's one-line description + the sales rep story), What it shows (CSV to batch, per-client file name and thumbnail, free draft renders, campaign reference and attribute filtering), Tech stack `TanStack Start, papaparse, TypeScript, Tailwind CSS, shadcn/ui`.

- [ ] **Step 4: Verify** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → pass; `git status` shows no `.env`.

- [ ] **Step 5: Commit** (`docs(personalized-videos): add README and AE project`).

- [ ] **Step 6: Remove the spec and plan** before opening the PR, as done for the previous example (`chore(personalized-videos): remove the design spec and plan`).
