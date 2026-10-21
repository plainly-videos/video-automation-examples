# Personalized videos example — design

Date: 2026-10-21
Status: builder check done, pending user review

## Goal

Add a new example, `plainly-personalized-videos/`, to this repo:

> Personalized videos — demonstrates rendering a unique video per recipient, with the name, company, and other personal details filled into the same template.

Story: a sales rep in December wants to send each of ~30 clients their own holiday greeting video. They upload the client list they already have as a CSV, render one video per client in one go, and copy each client's video link into a Gmail message, one by one.

Audience: developers evaluating the Plainly Videos API. Teaching points:

1. **CSV to batch**: each CSV row becomes one `batchData` entry, so one Batch API request creates one render per recipient.
2. **Row validation before rendering**: bad rows are shown and skipped, only good rows are sent.
3. **Mapping results back to recipients**: every render can be matched to its client, and each finished render gives a link the rep can copy.
4. **Per-recipient output file name**: each `batchData` entry sets its own `attachmentFileName`, so every client's video saves under their name.
5. **Per-recipient thumbnail**: `options.thumbnails` gives each client a still of their own video, used as a clickable image in the email.
6. **Free draft renders**: `outputFormat.settingsTemplate: DRAFT` lets the rep check every video without using video minutes.
7. **Campaign reference**: the batch `reference` names the campaign, and past campaigns are listed from Plainly, still without a database.

Success: a developer clicks "use sample CSV", clicks Render, and watches the client table fill with one personalized video and a Copy link button per client.

## Non-goals

- Sending emails, mail merge, outreach tools, CRM integrations. The rep pastes links into Gmail by hand.
- Column matching. CSV headers are fixed.
- Editing rows in the app. Fix the CSV and upload again.
- "Hide layer when empty" (per-entry `properties`), watermark, captions, integrations.
- Webhooks and database (covered by `plainly-render-and-webhook`).
- Polling design beyond what `plainly-batch-render` already shows; reuse its approach.

## Anti-goals

- Typing clients in one by one.
- A flow where the rep cannot tell which video belongs to which client.

## Plainly project

- Project: "Christmas Greetings Template", id `de90ca8a-500c-49c4-9bed-2d19df948fe6`, AE2026.
- One template, "Render" (`e90cc1ac-77ed-4507-b1f4-d615db7a2a30`, the project default), 1920×1080, 7 s.
- Parameters (keys from the template's `parametrization.value`, without `#`):

| CSV column | Parameter | Layer | Type |
|---|---|---|---|
| `name` | `Name` | `editName` | text |
| `title` | `Title` | `editTitle` | text (job title) |
| `company` | `Company` | `editCompany` | text |
| `headshot` | `Image` | `editImage` | image URL |

None of the parameters are mandatory in Plainly, but the app requires all four (a greeting without a name or face makes no sense).

## Constraints

- Stack copied from `plainly-batch-render` / `plainly-dynamic-video-ads`: TanStack Start, TypeScript, Tailwind CSS, shadcn/ui, Biome, Vitest, pnpm, Node from `.nvmrc`.
- Environment: only `PLAINLY_API_KEY` and `PLAINLY_PROJECT_ID`, in `.env`, never committed. `.env.example` documents both.
- All Plainly calls go through server functions using the existing `plainlyFetch` pattern (Basic auth, key never reaches the browser).
- Headshots must be public URLs, because Plainly fetches media itself and cannot reach `localhost` or local files.
- Plainly output links expire (`expirationDate`, `expired` on the render). The draft test render expired 7 days after creation; whether full renders keep longer depends on the plan and is not known. README tells the rep to send links before they expire; the app shows "Expired" for expired renders.

## CSV format

Fixed headers, in any order: `name,title,company,headshot`. Header match is case-insensitive and trims spaces. Extra columns are ignored.

Row checks, each failing row shows its reason and is skipped:

- `name`, `title`, `company` non-empty after trimming.
- `headshot` is an `http(s)` URL.

A missing required header fails the whole file with a clear message listing the expected headers.

A sample CSV (about 6 clients, public headshots e.g. `https://randomuser.me/api/portraits/...`) ships in `public/` so the "use sample CSV" link loads it and devs can also download it as a format reference.

## Screen (single page, option A from brainstorming)

Top to bottom:

1. **Upload area**: drop or pick a `.csv`, plus a "use sample CSV" link.
2. **Campaign settings**: campaign name text input (default `Holiday greetings 2026`, required) and a **Draft preview (free)** switch, on by default.
3. **Clients table**: headshot thumbnail, name, title, company, video column. Invalid rows in red with the reason in the video column. Button **Render N videos** (or **Render N drafts**), N = valid rows; disabled when N is 0.
4. **After Render**: one `POST /batch` with one entry per valid row. The batch id goes in the page URL (`?batch=<id>`). The same table now lists the batch's renders; the video column goes from "Rendering…" to a ▶ preview (thumbnail as poster) plus **Copy link** and **Copy for email**, or "Failed" / "Expired". A draft batch is clearly labelled as draft. The page polls the batch's renders (attribute filter below) until every render is finished, as in `plainly-batch-render`.
5. **Past campaigns**: a list of earlier batches for the project (campaign name, date, number of videos, draft or final), newest first; clicking one opens `?batch=<id>`.
6. **Refresh / revisit** with `?batch=<id>`: the table is rebuilt from Plainly alone (the CSV is not kept anywhere). The batch renders response does not include `parameters`, so each render carries its client's name, title, company and headshot in custom `attributes`.

Copy link copies the render's Plainly `output` URL.

**Copy for email** copies an HTML snippet (thumbnail `<img>` wrapped in a link to the video) as `text/html`, with the plain link as `text/plain` fallback, so pasting into Gmail gives a clickable personalized thumbnail. It must reference the thumbnail by URL: `storage.plainlyvideos.com` sends no CORS headers, so the browser cannot fetch the PNG to copy it as image data.

## Batch options

Verified with one free draft render (batch `32aad62a-0aec-40da-bff3-6c473634a1ae`):

- **File name**: per-entry `attachmentFileName` works without `outputFormat.attachment`. The output URL answers `content-disposition: inline; filename="Holiday-greeting-Ana-Petrovic.mp4"`: plays in the browser, saves under the client's name. Value is `<campaign>-<name>`, reduced to ASCII letters, digits and dashes (diacritics stripped), no extension.
- **Thumbnail**: `options.thumbnails.atSeconds: [5]` returns one 960×540 PNG in `thumbnailUris`. Second 5 shows headshot, title/company badge and "Merry Christmas <Name>!".
- **Draft**: `outputFormat.settingsTemplate: "DRAFT"` when the switch is on (half resolution, free). Omitted otherwise.
- **Reference**: `reference` = campaign name.
- Draft or final is read back from each render's `outputFormat.settingsTemplate`, so nothing is stored locally.

## API usage

| Purpose | Call |
|---|---|
| Create one render per client | `POST /api/v2/batch` with `projectId` and `batchData[]` (`parameters` + `attributes` per entry) |
| Past campaigns | `POST /api/v2/renders/attributes?sort=createdDate,desc` filter `example = personalized-videos`, grouped by `batchRenderId` |
| Renders of the open batch | `POST /api/v2/renders/attributes` filters `example = personalized-videos` and `batchRenderId = <id>` (all filters must match, verified) |

Every render carries `example: "personalized-videos"` and `campaign` attributes, so batches made in the Plainly app or other tools on the same project never show up, and opening their id shows "Campaign not found". `GET /batch` is not used.

## Repo changes

- New folder `plainly-personalized-videos/` with README following the structure of the other examples (What this app does, What you'll learn, Prerequisites, Getting started, Usage, Good to know, Useful commands) and `.assets/` screenshots.
- Root `README.md`: add entry 5 under Examples.
- `after-effects-projects/Christmas Greetings.zip`: the AE project, so devs can upload it to their own Plainly account.
- CI needs no change (it picks up any top-level folder with `package.json`).

## Calls made by Claude (not discussed)

- Folder name `plainly-personalized-videos`.
- Stack as above, copied from previous examples.
- All four CSV columns required.
- Sample headshots from randomuser.me; English names in the sample and tests (user's call).
- CSV parsed with papaparse (user's call).
- AE project zip fetched with `GET /api/v2/projects/{projectId}/download`.
- At most 100 valid rows per batch; a bigger file fails with a clear message. Guards against burning render credits on a huge export.
- No localStorage batch history (unlike `plainly-batch-render`); past campaigns come from Plainly.
- Draft switch on by default, so trying the example costs nothing.
- Thumbnail at second 5.
- File name pattern `<campaign>-<name>`.
- Live verification during the build uses draft renders only (free). Long-text behaviour of the template (e.g. "Senior Vice President, Global Partnerships") is checked with one draft render; if text overflows, add per-column length limits to row validation and a long row to the tests.

## Left to the builder

- Exact components, empty/error states, copy-feedback UI.
- Tests: CSV parsing/validation and CSV-row → `batchData` mapping get Vitest tests.
