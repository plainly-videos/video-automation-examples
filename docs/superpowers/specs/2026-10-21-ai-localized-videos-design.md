# AI localized videos example — design

Date: 2026-10-21
Status: approved

## Goal

Add example 6, `plainly-ai-localized-videos/`, to this repo:

> AI localized videos — demonstrates generating the same video in multiple languages, with ChatGPT translating the on-screen text automatically.

A user writes a product ad once in English, picks the languages they want, lets ChatGPT translate the copy, reviews and edits every translation next to a rough preview, and gets one rendered video per language back.

Audience: developers evaluating the Plainly Videos API. Teaching points:

1. **AI translation before rendering**: one OpenAI call turns the English copy into every chosen language, as structured JSON.
2. **Human review**: translations are shown and editable before any render is created. Nothing renders without the user clicking Render.
3. **Single renders, one per language**: one `POST /renders` per language (English included). Not the batch endpoint.
4. **Per-render fonts**: languages the template fonts can't show (Japanese, Chinese, Korean) get a different font through the render `properties` object (`fontUrl`, `font`), with no change to the After Effects project.
5. **Attribute filtering**: renders are tagged and found again with `POST /renders/attributes`, so no database or webhooks.

Success: a developer opens the app, keeps the default English ad, ticks German and Japanese, clicks Translate, sees three cards with previews, clicks Render, and lands on a page that fills in with three videos: English, German and Japanese, each in readable type.

## Non-goals

- Batch Renders API (covered by `plainly-batch-render` and `plainly-personalized-videos`).
- Webhooks, database, localStorage (covered by `plainly-render-and-webhook`).
- Draft render switch. The preview is the free check.
- Free-text language input. The language list is fixed.
- Right-to-left languages (Arabic, Hebrew). After Effects needs extra setup for them.
- Automatic text fitting in After Effects. Length is handled by limits, the translation prompt and the preview.
- File uploads for image and logo. They are URL fields.
- Retrying a single failed language.
- Saving translations between reloads. Losing the review step on reload is fine.

## Anti-goals

- `OPENAI_API_KEY` or `PLAINLY_API_KEY` reaching the browser or any committed file.
- Renders created straight from ChatGPT's output without the review step.
- A language in the list that renders with missing glyphs or a fallback font when used with its defaults.

## Constraints

- Plainly project: "Localized Product Ads", id `f9cf94e6-d6f9-4002-8dba-d769ab3deab3`, one template `3c0cd894-200c-492b-b345-93b9f824c595`, 1080×1080, 8 s, 25 fps. The id goes in `.env`, never in code.
- Template parameters (from `GET /projects/{id}`, all optional, blank keeps the After Effects default):

  | Parameter | Layer type | Translated | Input |
  |---|---|---|---|
  | `Headline` | text | yes | text |
  | `Subheadline` | text | yes | text, may wrap to 2 lines |
  | `CTA` | text | yes | text |
  | `ProductImage` | media | no | URL |
  | `Logo` | media | no | URL |
  | `ColorBackground` | data | no | color |
  | `ColorButton` | data | no | color |

- The After Effects project is `~/Downloads/Localized Product Ads.zip` (44 MB, mostly a 39 MB WAV). It goes into `after-effects-projects/Localized Product Ads.zip` as it is. It includes Anton, DIN Condensed and Jost. The user confirmed DIN Condensed can ship.
- Stack copied from `plainly-dynamic-video-ads`: TanStack Start, TanStack Form, Zod, TypeScript, Tailwind CSS, shadcn/ui, Biome, Vitest, pnpm, Node from `.nvmrc`. Plus the official `openai` SDK.
- Environment: `PLAINLY_API_KEY`, `PLAINLY_PROJECT_ID`, `OPENAI_API_KEY`. The user adds the OpenAI key themselves.
- The dev server runs on port 3000 like the other examples (`vite dev --port 3000`). During development and testing, use 3001+ with `--strictPort`, because port 3000 is the user's own server.

## Verified so far

- A reference render of the template with defaults: `https://storage.plainlyvideos.com/f9cf94e6-d6f9-4002-8dba-d769ab3deab3/8bd771b1-09ca-44c3-ada0-cc1938269f46/8bd771b1-09ca-44c3-ada0-cc1938269f46.mp4`. Green gradient background, leaves in the corners, a leaf logo at the top, an Anton all-caps white headline, a Jost subheadline that fades in below it, a product bottle rising from the bottom, and an orange "BUY NOW" button (DIN Condensed) that pops in at about 1 s. Everything holds from about 2 s to 8 s.
- Spike draft render `5281941b-4207-4594-b376-0106d3694af0`: Japanese text with `properties.{Headline,Subheadline,CTA}.fontUrl` set to `https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf` rendered correct Japanese glyphs. Findings:
  - The variable font rendered in its default (light) weight. The headline needs a bold instance through the `font` field (PostScript name, e.g. `NotoSansJP-Bold`). Verify the exact instance name with a draft render.
  - The 11-character Japanese headline wrapped to 2 lines and pushed into the subheadline. Headline length limits are needed per script, not just per Latin character count.
- Docs: `properties` is keyed like `parameters`. Plain `#Headline` layers receive properties, only operator expressions (`#a + ' ' + #b`) don't. Unknown keys are ignored, invalid values make the render `INVALID`. A font URL that can't be downloaded fails with `WORKER_FONT_INSTALL_FAILED`. Google Fonts only work as raw `.ttf` links from the google/fonts GitHub repo.

## Languages

English is the source and always renders. Target languages are a fixed list, each with a code, a display name, and optional default font settings:

- **Latin script, template fonts:** German, Spanish, French, Italian, Portuguese, Dutch, Polish.
- **Non-Latin script, default font:** Japanese (Noto Sans JP), Chinese Simplified (Noto Sans SC), Korean (Noto Sans KR). Each has a raw google/fonts GitHub URL and a bold PostScript instance name.

Before shipping, the builder checks glyph coverage of Anton, Jost and DIN Condensed for each Latin language. Use the font files in the zip, e.g. `fc-query` or `fontTools`, against that language's special characters (Polish ą ć ę ł ń ś ź ż, etc.). A language that fails gets a default font too, or is dropped. Adding more languages, like Cyrillic or Greek ones, is the builder's call under the same rule.

## Fonts per language

- Each language card has an optional **Font URL** field and an optional **Font name** (PostScript) field, prefilled for languages with a default font.
- When Font URL is set, the render sends `{ fontUrl, font? }` as `properties` for all three text layers: `Headline`, `Subheadline`, `CTA`. Empty means template fonts and no `properties`.
- One URL and one name per language, applied to all three layers. Per-layer fonts are a non-goal.
- The server only accepts `https://` font URLs.
- The README has a "Fonts for other languages" section: why it's needed, how to get a raw `.ttf` link from google/fonts, what the PostScript name is for (variable fonts and collections), and the two font error codes.

## OpenAI translation

- One server function, `translate({ source, languages })`, makes one OpenAI call for all chosen languages. It uses structured output (Zod schema → JSON) keyed by language code, each with `headline`, `subheadline`, `cta`.
- The prompt says: this is ad copy for a short square video, keep the tone, translate meaning rather than word for word, stay within the per-field limits for that language, keep the CTA short and imperative, don't add quotes or emojis.
- Model: a current OpenAI model chosen by the builder, kept in one constant.
- Translated values are clamped to limits on the server only for validation. Over-limit output is shown to the user as an error on that field, not silently cut.
- A missing `OPENAI_API_KEY` gives the same "copy `.env.example`" message style as the Plainly key.

## Text limits

- Limits per field, with stricter ones for CJK languages (wide glyphs), measured from draft renders of the template during development. Example: the longest headline that stays on one line in Anton and in Noto Sans JP.
- The same limits are used in the form validation, the OpenAI prompt and the server's render validation.

## API usage

All Plainly calls go through server functions with the `plainlyFetch` pattern from dynamic ads (Basic auth, env read per request, nothing reaches the browser). Base URL `https://api.plainlyvideos.com/api/v2`.

| Purpose | Call |
|---|---|
| Template id | `GET /projects/{projectId}` (first or default template; the builder decides) |
| Create one render | `POST /renders` |
| Renders of one localization | `POST /renders/attributes` with filter `localizationId = <id>` |
| Recent localizations | `POST /renders/attributes` with filter `example = ai-localized-videos` |

### Render body (one per language)

```json
{
  "projectId": "…",
  "templateId": "…",
  "parameters": {
    "Headline": "…", "Subheadline": "…", "CTA": "…",
    "ProductImage": "…", "Logo": "…",
    "ColorBackground": "…", "ColorButton": "…"
  },
  "properties": {
    "Headline": { "fontUrl": "…", "font": "…" },
    "Subheadline": { "fontUrl": "…", "font": "…" },
    "CTA": { "fontUrl": "…", "font": "…" }
  },
  "attributes": {
    "example": "ai-localized-videos",
    "localizationId": "<uuid>",
    "language": "ja",
    "languages": "en,de,ja"
  }
}
```

- `properties` is left out when the language has no font.
- `localizationId` is generated on the server per Render click.
- `languages` lists every language of the localization, so the results page knows which languages to expect and can show "Not created" for a failed create call.
- Renders are sent with `Promise.allSettled`, same as dynamic ads. All failed: error shown on the review step. Otherwise go to `/video/<localizationId>`. Languages whose call failed show "Not created".
- Color format: verify with a draft render what `ColorBackground` and `ColorButton` expect (hex string or something else).
- Media defaults: `ProductImage` and `Logo` default to the project's own files (`(Footage)/01_ASSETS/Image/product.png`, `(Footage)/01_ASSETS/Image/logo.png`). The API accepts paths inside the uploaded project. The browser can't load those paths, so the preview uses copies of the same images in `public/`.

## UI

Shadcn, neutral, same header and footer as dynamic ads.

### Home `/`

Three steps on one page:

1. **Compose.** English Headline, Subheadline, CTA. Product image URL, logo URL, background color and button color (native color inputs, defaults from the template). Language picker (toggle chips). Button: "Translate with ChatGPT".
2. **Review.** One card per language, English first. Each card has a rough animated preview, the three editable text fields, and the Font URL / Font name fields (font fields collapsed unless prefilled). Changing the English compose fields after translating does not re-translate. A "Translate again" button does, and replaces the edited translations. Button: "Render N videos".
3. Below: **API request** card showing the curl for one language, like dynamic ads' card, so the `properties` font block is visible.
4. Below: **Recent localizations** from the `example` filter, grouped by `localizationId`: English headline, language flags or codes, date, status.

### Results `/video/<localizationId>`

Grid of square videos, one per language, labeled with the language name. States: video with thumbnail poster when done, spinner while rendering, error message when failed or not created, "Output expired" when expired. Polls every 5 s while anything is in progress, same as dynamic ads. A link back to `/` that starts the form from this localization (`?from=<id>`, like dynamic ads).

### Preview

An HTML/CSS version of the template, like `AdPreview` in dynamic ads but much smaller: one square layout, 8 s loop. Measured frame by frame from the reference render above. It uses the card's own text, colors, image and logo. For languages with a font URL, the preview loads the font with `FontFace` so overflow looks like it will in the render. A note says the final look comes from After Effects. Respects `prefers-reduced-motion` by showing a still frame.

## Files (expected, the builder may adjust)

```
plainly-ai-localized-videos/
  .env.example, .nvmrc, .gitignore, README.md, package.json, biome.json, ...   copied from dynamic ads
  public/product.png, public/logo.png                                          preview copies of template images
  src/lib/plainly.ts          plainlyFetch, createLocalization, getLocalization, listLocalizations
  src/lib/openai.ts           translate server function
  src/lib/localization.ts     LANGUAGES, LIMITS, schemas, toParameters, toProperties, renderBody, grouping
  src/lib/localization.test.ts
  src/components/compose-form.tsx, language-card.tsx, localized-preview.tsx, preview-data.ts,
                 api-request.tsx, recent-localizations.tsx
  src/routes/__root.tsx, index.tsx, video.$localizationId.tsx
```

Repo-level changes: root `README.md` gets a 6th example entry (purpose, what it shows, tech stack). `after-effects-projects/Localized Product Ads.zip` is added. CI picks the folder up without changes.

## README

Same structure as the dynamic ads README, plus:

- Upload `Localized Product Ads.zip` to Plainly and auto-generate the template with the `edit` prefix (stripped), which gives the parameter names above.
- OpenAI key setup.
- "Fonts for other languages" section (see above).
- The usual warning that renders cost credits, since there's no draft switch.

## Error handling

| Case | Behavior |
|---|---|
| Missing env var | Server function throws a "copy `.env.example`" message |
| OpenAI call fails or returns invalid JSON | Error on the compose step, the user can retry Translate |
| Translation over limit | Shown as a field error on that card, render blocked until fixed |
| Some render calls fail | Results page shows "Not created" for those languages |
| All render calls fail | Error on the review step, no navigation |
| Font URL fails in Plainly | The render ends `FAILED` with Plainly's error message on that card |
| Unknown or non-UUID `localizationId` | "Not found" page |

## Testing

Vitest for the pure parts: render body building (parameters, properties only when a font is set, attributes), translation schema parsing and limit checks, grouping of renders into localizations, language list integrity (codes unique, default font URLs `https://`). Live check before PR: one localization with English, one Latin language and Japanese renders correctly. Verify that Polish glyphs and Japanese weight look right.

## Build decisions (Claude's calls, from spec review)

- **Draft renders** (`outputFormat.settingsTemplate: "DRAFT"`) are free, so use them freely during development. Measure limits cheaply: one or two renders to find each text box's width, then compute per-script limits offline from font metrics with fontTools, and confirm the edge cases with a few drafts.
- **Bold CJK weight**: first try the `font` field with the variable font's bold instance name. If no name works, use static Bold OTFs from the `notofonts/noto-cjk` GitHub repo (raw links), checked with a draft render. Accepting the light default weight is the last resort, and it gets noted in the README.
- **`?from=<localizationId>`** prefills only the compose step: English text, image, logo, colors, chosen languages and their font settings. The user translates again. It doesn't rebuild edited translations.
- **Branching**: branch `feat/ai-localized-videos` from the latest `master`, which already has `plainly-personalized-videos` (PR #24, merged) as example 5. This is example 6.
- **OpenAI key** (user's choice): there's no dev-only manual translation path. Once the example folder and `.env` exist, the build stops and waits for the user to add `OPENAI_API_KEY` to `plainly-ai-localized-videos/.env` before any Translate or live check.

## Left to the builder

- OpenAI model and exact prompt wording.
- Exact limits per field and script, from draft renders.
- Preview timings and positions, from the reference render.
- Default template colors and the color value format.
- Bold PostScript instance names for the Noto fonts.
- Whether to read the template id from `defaultTemplateId` or the first template.
- Component split and file names.
