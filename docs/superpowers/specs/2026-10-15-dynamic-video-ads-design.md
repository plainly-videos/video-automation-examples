# Dynamic video ads example — design

Date: 2026-10-15
Status: approved in brainstorming, pending spec review

## Goal

Add a new example, `plainly-dynamic-video-ads/`, to this repo:

> Dynamic video ads — demonstrates dynamic creative for video advertising, where one template produces many ad variants with different headlines, offers, pricing, and visuals. Every variant renders in multiple aspect ratios, like 16:9, 9:16, and 1:1, ready for each ad platform.

Audience: developers evaluating the Plainly Videos API. The example must clearly differ from the batch render example. Its teaching points are:

1. **Fan-out**: one ad (one data object) becomes three single render calls, one per aspect ratio.
2. **Template discovery**: template IDs are read from the project, not configured.
3. **Attribute filtering**: renders are tagged with custom attributes and found again with `POST /api/v2/renders/attributes`, so no database, webhooks or local storage are needed.
4. **Per-render error handling**: renders are created independently, so each format can fail and be retried on its own.

Success: a developer opens the app, picks a product, edits the copy, clicks once and sees the same ad rendered in three shapes side by side.

## Non-goals

- Batch API (covered by `plainly-batch-render`). One ad per submit; many ads at once is a batch use case.
- Webhooks and database (covered by `plainly-render-and-webhook`).
- Free image URLs, file uploads, CSV/feed import.
- Brand color, logo, font, music parameters. Add later if the designer's template exposes them.

## Constraints and assumptions

- The After Effects project is not ready. The designer will deliver one project with three compositions: 1920×1080 (16:9), 1080×1920 (9:16) and 1080×1080 (1:1). Until then, parameter names are placeholders.
- Stack is copied from `plainly-batch-render`: TanStack Start, TypeScript, Tailwind CSS, shadcn/ui, Biome, Vitest, pnpm, Node from `.nvmrc`.
- Environment: only `PLAINLY_API_KEY` and `PLAINLY_PROJECT_ID`.

## API usage

All calls go through server functions with the existing `plainlyFetch` pattern (Basic auth, API key never reaches the browser), base URL `https://api.plainlyvideos.com/api/v2`.

| Purpose | Call |
|---|---|
| Find templates per format | `GET /projects/{projectId}` |
| Create one render | `POST /renders` |
| Renders of one ad | `POST /renders/attributes` with filter `adId = <id>` |
| Recent ads | `POST /renders/attributes?size=60` with filter `example = dynamic-video-ads` |

The `full` response model is used for attribute filters, because the `simple` model omits `parameters`, which the app needs for prefill, retry and recent ad titles.

### Template discovery

`GET /projects/{projectId}` returns the project's templates. Each template's `resolution` (`width`, `height`) maps to a format by its ratio: 16:9, 9:16 or 1:1. The first template per ratio wins; other templates are ignored. A missing format fails the request with a clear message, e.g. `Project has no 9:16 template`. Fetched on every create and retry, no cache.

### Render attributes

Every render gets:

```json
{ "example": "dynamic-video-ads", "adId": "<uuid>", "format": "9:16" }
```

- `example`: string, not boolean, because the filter value is untyped and only supports `EQ`. Also lets other examples use the same key with their own value.
- `adId`: generated on the server per submit (`crypto.randomUUID()`), used in the URL `/ad/<adId>`.
- `format`: maps a render back to its frame.

### Parameters

One function, `toParameters(ad)`, is the only place that knows parameter names. Placeholder names follow the `plainlyEdit` prefix used by the other examples:

| Field | Parameter | Max length |
|---|---|---|
| Headline | `plainlyEditHeadline` | 40 |
| Offer | `plainlyEditOffer` | 15 |
| Price | `plainlyEditPrice` | 10 |
| Old price (optional) | `plainlyEditOldPrice` | 10 |
| Call to action | `plainlyEditCta` | 15 |
| Product image | `plainlyEditImage` | preset only |

Prices are plain text (`$79`), since After Effects only prints them. Lengths are placeholders until the template is known.

## Data flow

### Create

1. The browser sends `{ productId, headline, offer, price, oldPrice?, cta }`.
2. `pickAd` validates on the server: known product id, required fields present, lengths within limits. It maps `productId` to the image URL.
3. The server reads templates per format, generates `adId`, and sends three `POST /renders` calls with `Promise.allSettled`. Calls differ only in `templateId` and the `format` attribute.
4. All three failed: the error is returned and the form shows it. Nothing is created, nothing to navigate to.
5. Otherwise the server returns `adId`, and the browser navigates to `/ad/<adId>`. Formats whose call failed have no render and show as "Not created".

### Ad page

1. The loader calls `getAdRenders(adId)` (attribute filter `adId`). An `adId` that is not a UUID or has no renders shows "Ad not found".
2. `latestPerFormat` keeps the newest render per format by `createdDate`. The API's sort order is not documented, so the app never relies on it.
3. While any format's latest render is in progress (`PENDING`, `THROTTLED`, `QUEUED`, `IN_PROGRESS`), the page polls every 5 seconds, scheduling the next poll after the previous one settles (same as batch render). A failed poll keeps the last state and shows a "Could not refresh" alert.
4. Missing formats count as finished for polling purposes.

### Retry

`retryFormat({ adId, format })`:

1. Validates `adId` (UUID) and `format` (one of the three).
2. Loads the ad's renders and copies `parameters` from any of them.
3. Reads templates and creates one new render with the same three attributes.
4. The new render is the newest for its format, so it replaces the old one in the UI.

Retry is offered for `FAILED`, `INVALID`, `CANCELLED` and missing formats.

## UI

Layout A from the brainstorming mockups: shadcn, neutral, same header and footer as batch render.

### Home `/`

- **Left: ad form card.** Product picker (4 presets with thumbnails), headline, offer, price + old price, call to action. "Reset" and "Render 3 formats" buttons. Picking a product fills all fields with that product's defaults; fields stay editable.
- **Right: preview card.** Three frames in their real aspect ratios, equal height, side by side, labeled 16:9 (YouTube, in-stream), 9:16 (Stories, Reels, TikTok), 1:1 (Feed). Each frame shows a CSS mock of the ad that updates as you type. A note says "Layout preview only — final look comes from the After Effects template". Placement labels are generic text, no platform logos.
- **Bottom: recent ads.** From the `example` filter, grouped by `adId`, newest first: product thumbnail, headline, date, status badge (`3/3 done`, `Rendering`, `1 failed`). Each links to `/ad/<adId>`.

### Ad page `/ad/<adId>`

Same layout:

- **Left:** the form, prefilled from the ad's render `parameters` (product resolved from the image URL). Submitting creates a new ad.
- **Right:** the three frames show render state per format: video player with thumbnail poster when done, spinner while rendering, "Output expired" when expired, error message plus "Retry" when failed or not created. Each frame has a state badge.
- **Bottom:** recent ads, current ad highlighted.

### Products

`src/products.ts` holds 4 presets: sneakers, headphones, coffee, watch. Each has an id, name, public image URL (Unsplash for now, swapped when the designer provides assets) and default copy. Image URLs must be public because Plainly fetches them.

## Files

```
plainly-dynamic-video-ads/
  .env.example, .nvmrc, README.md, package.json, biome.json, ...   copied from batch render
  src/products.ts
  src/lib/plainly.ts         plainlyFetch, apiError, getTemplates, createAd, retryFormat, getAdRenders, listAds
  src/lib/ad.ts              FORMATS, formatOf(resolution), pickAd, toParameters, latestPerFormat,
                             groupAds, isFinished, isAdId
  src/lib/ad.test.ts
  src/components/ad-form.tsx
  src/components/ad-frames.tsx    3 shaped frames: CSS preview or render state
  src/components/recent-ads.tsx
  src/routes/__root.tsx, index.tsx, ad.$adId.tsx
```

Repo-level changes: root `README.md` gets a 4th example entry; `.github/workflows/ci.yml` gets the new folder like batch render; `.gitignore` gets `.superpowers/`.

## Error handling

| Case | Behavior |
|---|---|
| Missing env var | Server function throws a message telling the user to copy `.env.example` |
| Project missing a format | Create/retry fails with `Project has no <format> template` |
| Invalid form input | `pickAd` throws, form shows the message |
| All 3 creates fail | Form shows the first API error |
| Some creates fail | Navigate; missing formats show "Not created" + Retry |
| Render `FAILED` / `INVALID` / `CANCELLED` | Frame shows error + Retry |
| Poll fails | Keep last state, show "Could not refresh", retry in 5 s |
| Unknown or malformed `adId` | "Ad not found" with a link home |

## Testing

- `src/lib/ad.test.ts` (Vitest): `pickAd` (unknown product, missing field, too long), `toParameters`, `formatOf` (16:9, 9:16, 1:1, unknown ratio), `latestPerFormat` (newest wins, missing formats), `groupAds` (grouping, ordering, status).
- Manual run against the live API with a placeholder project.
- First implementation step verifies two undocumented behaviors against the live API: whether a new render is visible to the attribute filter right after creation, and the result sort order. If the filter lags, a missing format briefly shows as pending instead of "Not created"; adjust then.

## Open items

- Real AE project from the designer: final parameter names, length limits, template setup steps for the README, product assets.
- README screenshot once the real template renders.
