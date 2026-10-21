# AI Localized Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add example 6, `plainly-ai-localized-videos/`. Users write a product ad in English, ChatGPT translates it into the languages they pick, they review each translation next to a preview, and they get one Plainly render per language.

**Architecture:** A copy of `plainly-dynamic-video-ads` (TanStack Start server functions, no database). Swap "3 formats" for "N languages". One OpenAI call translates all languages. One `POST /renders` per language. Renders are tagged with attributes and found again with `POST /renders/attributes`. Non-Latin languages send a `properties.{Headline,Subheadline,CTA}.fontUrl` font per render.

**Tech Stack:** TanStack Start, TanStack Form, Zod 4, TypeScript, Tailwind CSS 4, shadcn/ui, Biome, Vitest, pnpm, `openai` SDK.

**Spec:** `docs/superpowers/specs/2026-10-21-ai-localized-videos-design.md`

## Global Constraints

- Folder `plainly-ai-localized-videos/`, branch `feat/ai-localized-videos` (already checked out, spec committed).
- Env vars, read per request on the server only: `PLAINLY_API_KEY`, `PLAINLY_PROJECT_ID`, `OPENAI_API_KEY`. No key in any committed file, and none reaches the browser.
- Plainly base URL `https://api.plainlyvideos.com/api/v2`, Basic auth (API key as the username, empty password), same `plainlyFetch` as dynamic ads.
- Template parameter names exactly: `Headline`, `Subheadline`, `CTA`, `ProductImage`, `Logo`, `ColorBackground`, `ColorButton`.
- Attributes on every render: `example: "ai-localized-videos"`, `localizationId: <uuid v4>`, `language: <code>`, `languages: <comma-separated codes of the whole localization, English first>`.
- Media defaults: `(Footage)/01_ASSETS/Image/product.png`, `(Footage)/01_ASSETS/Image/logo.png`.
- No draft switch in the app. Draft renders (`outputFormat: { settingsTemplate: "DRAFT" }`) are only for development measurements.
- Dev server for testing: `pnpm vite dev --port 3001 --strictPort`. Never touch port 3000, the user's server runs there. Kill your own dev server when done.
- Style: match `plainly-dynamic-video-ads` (comment density, naming, Biome formatting, one short "why" comment where code isn't obvious).
- No new dependency beyond `openai`.

## Review Focus

1. ChatGPT omits a requested language, adds extra keys, or returns over-limit text. Expected: the review step shows field errors (or a clear Translate error), never a crash and never silent truncation. Covered by the Task 4 test `parseTranslation rejects missing languages`, and the over-limit case by the Task 3 schema test.
2. An apostrophe or quote in a translation (French `l'été`, German `„…“`) must keep the copied curl runnable. Covered by the Task 3 test `toCurl escapes apostrophes`.
3. A garbage or `http://` font URL must be rejected before any render is created. Covered by the Task 3 test `fontSchema accepts only https URLs`.
4. Renders from other tools on the same project carrying partial or odd attributes (no `languages`, unknown language code) must not break the results page or the recent list. Covered by the Task 3 test `groupLocalizations ignores renders with bad attributes`.
5. Deselecting a language after translating, or a hand-crafted request with duplicate languages or no English. Expected: the server rejects it. Covered by the Task 3 test `localizationSchema requires English first and unique languages`.

---

### Task 1: Scaffold the example

**Files:**
- Create: `plainly-ai-localized-videos/` (copied from `plainly-dynamic-video-ads/`, see Step 1)
- Create: `plainly-ai-localized-videos/.env.example`, `plainly-ai-localized-videos/.env` (not committed)
- Create: `plainly-ai-localized-videos/public/product.png`, `public/logo.png`
- Create: `after-effects-projects/Localized Product Ads.zip`

**Interfaces:**
- Produces: a building app with `src/lib/utils.ts` (`cn`, `formatDate`), `src/components/ui/*` and `src/routes/__root.tsx` from dynamic ads, plus empty-shell `src/routes/index.tsx`.

- [ ] **Step 1: Copy the sibling.** Run `rsync -a --exclude node_modules --exclude dist --exclude coverage --exclude .tanstack --exclude .env --exclude .DS_Store plainly-dynamic-video-ads/ plainly-ai-localized-videos/`. Then delete the ad-specific files: `src/products.ts`, `src/lib/ad.ts`, `src/lib/ad.test.ts`, `src/lib/plainly.ts`, `src/components/{ad-editor,ad-frames,ad-preview,ad-preview-data,api-request,recent-ads,render-frame}.tsx` (`.ts` for `ad-preview-data`), `src/routes/ad.$adId.tsx`, `.assets/*`, and the product images in `public/` (keep favicon, logos, manifest, robots, GitHub svg). Keep `render-frame.tsx` out for now; Task 7 brings back an adapted copy.
- [ ] **Step 2: Rename and add the SDK.** `package.json` `name` → `plainly-ai-localized-videos`. Run `pnpm add openai` in the folder (pin the exact version like the other deps). In `__root.tsx`, change the title/description text to "AI localized videos".
- [ ] **Step 3: Env.** `.env.example`:

```
# Plainly API key, from https://app.plainlyvideos.com/dashboard/user/settings/general
PLAINLY_API_KEY=your_plainly_api_key

# ID of the Localized Product Ads project you uploaded to Plainly
PLAINLY_PROJECT_ID=your_plainly_project_id

# OpenAI API key, from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key
```

Create `.env` with `PLAINLY_API_KEY` copied from `plainly-dynamic-video-ads/.env` (don't print it), `PLAINLY_PROJECT_ID=f9cf94e6-d6f9-4002-8dba-d769ab3deab3`, and an empty `OPENAI_API_KEY=`.
- [ ] **Step 4: Assets.** Copy `~/Downloads/Localized Product Ads.zip` to `after-effects-projects/Localized Product Ads.zip` unchanged. Extract `(Footage)/01_ASSETS/Image/product.png` and `logo.png` into `public/product.png` and `public/logo.png`. Extract `leaves 1.png`, `leaves 2.png` and the monstera image into `public/preview/` for Task 5.
- [ ] **Step 5: Shell route.** `src/routes/index.tsx` renders a placeholder card so the app builds. Run `pnpm install && pnpm lint && pnpm typecheck && pnpm build`. Expected: all pass (no tests yet, so skip `pnpm test`).
- [ ] **Step 6: Commit.** `git add plainly-ai-localized-videos "after-effects-projects/Localized Product Ads.zip"` (check `git status` shows no `.env`), commit `feat(ai-localized-videos): scaffold example from dynamic video ads`.
- [ ] **Step 7: Ask for the OpenAI key.** Tell the user: "Scaffold is ready. Please add your key to `plainly-ai-localized-videos/.env` as `OPENAI_API_KEY=…`. I'll keep building, and the first live Translate happens in Task 6." Don't wait here.

### Task 2: Measure the template and define languages

**Files:**
- Create: `plainly-ai-localized-videos/src/lib/languages.ts`
- Test: `plainly-ai-localized-videos/src/lib/languages.test.ts`

**Interfaces:**
- Produces:
  - `type Script = "latin" | "cjk"`
  - `type Font = { url: string; name?: string }`
  - `type Language = { code: string; name: string; script: Script; font?: Font }`
  - `const SOURCE: Language` (English, code `"en"`)
  - `const LANGUAGES: Language[]` (targets, in picker order)
  - `languageOf(code: string): Language | undefined` (covers `en` too)
  - `const LIMITS: Record<Script, { headline: number; subheadline: number; cta: number }>`
  - `const COLORS: { background: string; button: string }` (template defaults, `#rrggbb`)
  - `colorParameter(hex: string): string` (hex → whatever the template's color layers expect; identity if they take hex)

All research runs in `/private/tmp/claude-501/-Users-vox-Desktop-examples/2dc70bac-26c2-4810-9f28-dea7fcade1c4/scratchpad/measure/`, never in the repo. Draft renders use the `.env` key with `curl -u "$KEY:"`, `outputFormat: { settingsTemplate: "DRAFT" }`, `attributes: { example: "dev-measure" }` (so they never show in the app), template `3c0cd894-200c-492b-b345-93b9f824c595`. The reference render is at the URL in the spec.

- [ ] **Step 1: Colors.** Pick the default background and button colors from a frame of the reference render (ffmpeg → pixel). Draft-render once with `ColorBackground: "#1E3A8A"`, `ColorButton: "#F97316"`. If the frame shows those colors, `colorParameter` is identity. If not, read the expression format from the error or result (e.g. `[r,g,b]` 0–1), implement that, and re-render once to confirm.
- [ ] **Step 2: Glyph coverage.** Install fonttools in a scratchpad venv. For Anton, Jost and DIN Condensed from the zip, check every special character of de (äöüßÄÖÜ„“), es (áéíóúñü¿¡), fr (àâçéèêëîïôûùüÿœæ«»’), it (àèéìòù), pt (ãõáâàçéêíóôú), nl (ëïé), pl (ąćęłńóśźżĄĆĘŁŃÓŚŹŻ). A language whose characters are missing in any of the three fonts gets a default `font` (a Noto Sans static or variable `.ttf` from google/fonts raw GitHub) or is dropped. Note the decision in a one-line comment above `LANGUAGES`.
- [ ] **Step 3: CJK fonts.** Draft-render Japanese with `font` set to candidate bold instance names of `NotoSansJP[wght].ttf` (e.g. `NotoSansJP-Bold`, `NotoSansJP-Black`; list instance names with fonttools `fvar`/`name`). If one renders bold, use the same pattern for SC/KR. If none does, use static Bold OTFs from `notofonts/noto-cjk` raw GitHub links (check HTTP 200), confirmed with one draft. Last resort: no name, note the light weight for the README. Base URLs: `https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf`, the `notosanssc/NotoSansSC` and `notosanskr/NotoSansKR` equivalents (all return 200).
- [ ] **Step 4: Limits.** From the reference render and one draft with long text, measure each text box's max width in px (headline: one line, subheadline: two lines, CTA: inside the button). Compute with fonttools advance widths at the rendered size: Latin limit = box width ÷ the average width of uppercase letters (headline is all caps) or lowercase (subheadline). CJK limit = box width ÷ the full-width advance. Round down. Confirm each limit with one draft at exactly the limit, using the widest realistic text (German for Latin, Japanese for CJK). It must not wrap past its allowed lines.
- [ ] **Step 5: Write the failing test** `src/lib/languages.test.ts`:

```ts
test("language codes are unique and include the source", () => {
  const codes = [SOURCE, ...LANGUAGES].map((l) => l.code);
  expect(new Set(codes).size).toBe(codes.length);
  expect(languageOf("en")).toBe(SOURCE);
  expect(languageOf("xx")).toBeUndefined();
});
test("default fonts are https and non-Latin languages have one", () => {
  for (const l of LANGUAGES) {
    if (l.font) expect(l.font.url).toMatch(/^https:\/\//);
    if (l.script === "cjk") expect(l.font).toBeDefined();
  }
  expect(LANGUAGES.map((l) => l.code)).toEqual(expect.arrayContaining(["de", "ja", "zh", "ko"]));
});
test("CJK limits are stricter than Latin ones", () => {
  for (const key of ["headline", "subheadline", "cta"] as const) {
    expect(LIMITS.cjk[key]).toBeLessThan(LIMITS.latin[key]);
  }
});
test("colorParameter maps template defaults", () => {
  expect(colorParameter(COLORS.background)).toBe(/* format found in Step 1 */);
});
```

- [ ] **Step 6: Run** `pnpm test src/lib/languages.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 7: Implement `languages.ts`** with the measured values. Names in English (`"German"`, `"Chinese (Simplified)"`). Codes: `de es fr it pt nl pl ja zh ko`, minus any dropped in Step 2.
- [ ] **Step 8: Run** `pnpm test`. Expected: PASS.
- [ ] **Step 9: Commit** `feat(ai-localized-videos): add languages, fonts and text limits`.

### Task 3: Localization model, render bodies, grouping

**Files:**
- Create: `plainly-ai-localized-videos/src/lib/localization.ts`
- Test: `plainly-ai-localized-videos/src/lib/localization.test.ts`

**Interfaces:**
- Consumes: Task 2 exports.
- Produces:
  - `const EXAMPLE = "ai-localized-videos"`
  - `type Copy = { headline: string; subheadline: string; cta: string }`
  - `type Design = { productImage: string; logo: string; colorBackground: string; colorButton: string }`
  - `type Version = { language: string; copy: Copy; font?: Font }`
  - `type Localization = { design: Design; versions: Version[] }` (versions[0] is English)
  - `const DEFAULT_COPY: Copy` (`"Rejuvenating face cream"`, a one-line subheadline, `"Buy now"`, adjusted to fit LIMITS.latin), `const DEFAULT_DESIGN: Design`
  - `copySchema(script: Script)`, `fontSchema`, `designSchema`, `localizationSchema` (Zod)
  - `toParameters(design: Design, copy: Copy): Record<string, string>`
  - `toProperties(font?: Font): Record<string, { fontUrl: string; font?: string }> | undefined`
  - `renderBody(args: { projectId: string; templateId: string; localizationId: string; languages: string[]; design: Design; version: Version })`
  - `RENDERS_URL`, `toCurl(body: string): string` (same as dynamic ads)
  - `type Render` (dynamic ads' type, attributes `{ localizationId?: string; language?: string; languages?: string } | null`), `toRender`, `isFinished`, `stateLabel` (copied)
  - `isLocalizationId(id: unknown): id is string`, `newLocalizationId(): string` (copied from `isAdId`/`newAdId`)
  - `expectedLanguages(renders: Render[]): string[]`: the newest render's `languages` attribute, split, known codes only. Falls back to the languages present
  - `latestPerLanguage(renders: Render[]): Record<string, Render>`
  - `isLocalizationFinished(renders: Render[]): boolean`
  - `type LocalizationSummary = { localizationId: string; createdDate: string; headline: string; languages: string[]; done: number; failed: number; rendering: number }`
  - `groupLocalizations(renders: Render[]): LocalizationSummary[]` (newest first)
  - `localizationStatus(summary)`: same as `adStatus`, `"x/N done"`
  - `fromRenders(renders: Render[]): { copy: Copy; design: Design; languages: string[]; fonts: Record<string, Font> }` for `?from` (English render's parameters; fonts are not stored in parameters, so `fonts` comes back empty and the language defaults apply; document that in a comment)

- [ ] **Step 1: Write the failing tests** (include all of these; values must match exactly):

```ts
const design = DEFAULT_DESIGN;
const ja: Version = { language: "ja", copy: { headline: "若返りクリーム", subheadline: "毎日のケアに", cta: "今すぐ購入" }, font: { url: "https://example.com/NotoSansJP.ttf", name: "NotoSansJP-Bold" } };
const en: Version = { language: "en", copy: DEFAULT_COPY };

test("toParameters maps every template parameter", () => {
  expect(Object.keys(toParameters(design, en.copy)).sort()).toEqual(
    ["CTA", "ColorBackground", "ColorButton", "Headline", "Logo", "ProductImage", "Subheadline"]);
});
test("toProperties sets the font on all three text layers, or nothing", () => {
  const font = { fontUrl: "https://example.com/NotoSansJP.ttf", font: "NotoSansJP-Bold" };
  expect(toProperties(ja.font)).toEqual({ Headline: font, Subheadline: font, CTA: font });
  expect(toProperties(undefined)).toBeUndefined();
  expect(toProperties({ url: "https://example.com/a.ttf" })?.Headline).toEqual({ fontUrl: "https://example.com/a.ttf" });
});
test("renderBody tags the render and leaves out properties without a font", () => {
  const args = { projectId: "p", templateId: "t", localizationId: "id", languages: ["en", "ja"], design };
  expect(renderBody({ ...args, version: ja }).attributes).toEqual({ example: "ai-localized-videos", localizationId: "id", language: "ja", languages: "en,ja" });
  expect(renderBody({ ...args, version: en })).not.toHaveProperty("properties");
});
test("fontSchema accepts only https URLs", () => {
  expect(fontSchema.safeParse({ url: "http://example.com/a.ttf" }).success).toBe(false);
  expect(fontSchema.safeParse({ url: "not a url" }).success).toBe(false);
  expect(fontSchema.safeParse({ url: "https://example.com/a.ttf" }).success).toBe(true);
});
test("localizationSchema requires English first and unique languages", () => {
  const ok = { design, versions: [en, ja] };
  expect(localizationSchema.safeParse(ok).success).toBe(true);
  expect(localizationSchema.safeParse({ design, versions: [ja, en] }).success).toBe(false);
  expect(localizationSchema.safeParse({ design, versions: [en, ja, ja] }).success).toBe(false);
  expect(localizationSchema.safeParse({ design, versions: [en, { ...ja, language: "xx" }] }).success).toBe(false);
  expect(localizationSchema.safeParse({ design, versions: [en] }).success).toBe(false); // at least one target
});
test("limits depend on the script", () => {
  const long = "あ".repeat(LIMITS.cjk.headline + 1);
  expect(localizationSchema.safeParse({ design, versions: [en, { ...ja, copy: { ...ja.copy, headline: long } }] }).success).toBe(false);
  expect(copySchema("latin").safeParse({ ...en.copy, headline: "A".repeat(LIMITS.latin.headline) }).success).toBe(true);
});
test("designSchema rejects non-hex colors", () => {
  expect(designSchema.safeParse({ ...design, colorButton: "orange" }).success).toBe(false);
});
test("toCurl escapes apostrophes", () => {
  expect(toCurl(JSON.stringify({ a: "l'été" }))).toContain(`l'\\''été`);
});
test("groupLocalizations ignores renders with bad attributes", () => {
  // renders: two valid ones of one localization (en DONE, ja IN_PROGRESS, languages "en,ja,de"),
  // one with no attributes, one with a non-UUID localizationId, one with language "xx"
  // expect one summary: languages ["en","ja","de"], done 1, rendering 1, failed 1 (de never created)
});
test("expectedLanguages falls back to present renders without a languages attribute", () => { /* … */ });
test("latestPerLanguage keeps the newest render per language", () => { /* … */ });
```

Finish the last three bodies with literal `Render` fixtures in the style of `ad.test.ts`.
- [ ] **Step 2: Run** `pnpm test src/lib/localization.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `localization.ts`.** `copySchema` reuses the dynamic ads `text(label, max)` helper. `localizationSchema.superRefine` checks the English-first and uniqueness rules, applies `copySchema(languageOf(code).script)` per version, and puts issues on `["versions", i, "copy", field]` so the form can show them per card. `design.productImage`/`logo` accept an `https://` URL or a path starting with `(Footage)/`.
- [ ] **Step 4: Run** `pnpm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(ai-localized-videos): add localization model and render bodies`.

### Task 4: ChatGPT translation

**Files:**
- Create: `plainly-ai-localized-videos/src/lib/translate.ts` (pure: schema, prompt, parsing)
- Create: `plainly-ai-localized-videos/src/lib/openai.ts` (server function)
- Test: `plainly-ai-localized-videos/src/lib/translate.test.ts`

**Interfaces:**
- Consumes: `Copy`, `languageOf`, `LIMITS`.
- Produces:
  - `const MODEL` (in `translate.ts`, a current OpenAI model chosen by the builder, one constant)
  - `translationSchema(codes: string[])`: Zod object `{ [code]: { headline, subheadline, cta } }` with all codes required (no length limits here; limits are checked by the form so over-limit text shows as a field error)
  - `translationInstructions(codes: string[]): string`: the system prompt. Names each language and its limits
  - `parseTranslation(codes: string[], data: unknown): Record<string, Copy>`: throws `Error("ChatGPT did not return <Language name>")` for a missing code, ignores extra keys
  - `translate` server function (`openai.ts`), input `{ copy: Copy; languages: string[] }` (validated: known codes, not `en`, 1+ unique), returns `Record<string, Copy>`

- [ ] **Step 1: Write the failing tests:**

```ts
test("translationInstructions names each language with its limits", () => {
  const text = translationInstructions(["de", "ja"]);
  expect(text).toContain("German");
  expect(text).toContain("Japanese");
  expect(text).toContain(String(LIMITS.cjk.headline));
});
test("parseTranslation rejects missing languages", () => {
  expect(() => parseTranslation(["de", "ja"], { de: copy })).toThrow("ChatGPT did not return Japanese");
});
test("parseTranslation drops extra keys", () => {
  expect(parseTranslation(["de"], { de: copy, fr: copy })).toEqual({ de: copy });
});
```

- [ ] **Step 2: Run** `pnpm test src/lib/translate.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `translate.ts`.** The instructions cover what the spec says: ad copy for a short square video, keep the tone, translate meaning rather than word for word, stay within each field's character limit for that language, CTA short and imperative, no quotes or emojis. The English copy goes in the user input as JSON.
- [ ] **Step 4: Implement `openai.ts`** with `createServerFn({ method: "POST" })`, the key read per request through `createServerOnlyFn` (missing key → `"OPENAI_API_KEY is not set. Copy .env.example to .env and add your API key."`), `new OpenAI({ apiKey })`, Responses API with structured output from `translationSchema` via the SDK's Zod helper (`zodTextFormat` from `openai/helpers/zod`, check it supports Zod 4; if not, pass `z.toJSONSchema(...)` as a strict `json_schema` format), then `parseTranslation`.
- [ ] **Step 5: Run** `pnpm test && pnpm typecheck`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(ai-localized-videos): translate ad copy with ChatGPT`.

### Task 5: Preview

**Files:**
- Create: `plainly-ai-localized-videos/src/components/preview-data.ts`
- Create: `plainly-ai-localized-videos/src/components/localized-preview.tsx`

**Interfaces:**
- Consumes: `Copy`, `Design`, `Font`.
- Produces: `<LocalizedPreview copy={Copy} design={Design} font?={Font} />`: a square, `@container`-sized, looping 8 s HTML version of the template.

- [ ] **Step 1: Measure.** Extract frames of the reference render at 25 fps for 0–2.5 s (`ffmpeg -vf fps=25`), plus one still at 4 s. Record in `preview-data.ts`, in `cqw` like dynamic ads' `ad-preview-data.ts` (copy its header comment, adapted): positions and sizes of the logo, headline, subheadline, bottle, button and leaves; font sizes; start times and durations of each entrance; `LENGTH = 8`; `STILL` (a time where everything is visible).
- [ ] **Step 2: Build `LocalizedPreview`.** Reuse dynamic ads' `useClock`, `tween`, `clamp`, `cq` helpers (copy them, they're small). Background: a gradient using `design.colorBackground`. Button: `design.colorButton`. Images: `design.productImage`/`logo` when they're `https://` URLs, else `/product.png` and `/logo.png`. Leaves from `public/preview/`. Fonts: Anton, Jost and DIN Condensed loaded from the zip's font files copied to `public/fonts/` with `@font-face` in `styles.css` (check the licenses allow this; the user approved shipping DIN Condensed). When `font` is set, load it with `new FontFace(name, \`url(${font.url})\`)` (catch failures and fall back silently) and use it for all three texts. Show the note "Rough preview, the final look comes from After Effects".
- [ ] **Step 3: Check it visually.** Temporarily render `<LocalizedPreview copy={DEFAULT_COPY} design={DEFAULT_DESIGN} />` on the index route. Start `pnpm vite dev --port 3001 --strictPort`, open it in Playwright (Chrome), screenshot at t≈STILL, and compare side by side with the reference frame at the same time. Positions should be within a few percent. Then screenshot a Japanese copy with the Noto font: the glyphs must show and the wrap should match draft render `5281941b-4207-4594-b376-0106d3694af0`. Kill your dev server.
- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(ai-localized-videos): add the template preview`.

### Task 6: Plainly server functions and the home page

**Files:**
- Create: `plainly-ai-localized-videos/src/lib/plainly.ts`
- Create: `src/components/localizer.tsx` (the compose → review form), `src/components/version-card.tsx`, `src/components/api-request.tsx`, `src/components/recent-localizations.tsx`, `src/components/render-frame.tsx` (adapted copy, also used by Task 7)
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces (server functions in `plainly.ts`, shaped like dynamic ads' `plainly.ts`):
  - `createLocalization` (POST, validator `localizationSchema`) → `{ localizationId: string }`: reads the template id (`defaultTemplateId`, else the first template, else the error `"Project has no template"`), sends one `POST /renders` per version with `Promise.allSettled`, throws the first error if all failed
  - `getLocalization` (GET, validator `isLocalizationId` else `notFound()`) → `Render[]` via `filterRenders("localizationId", id, 50)`, `notFound()` when empty
  - `listLocalizations` (GET) → `LocalizationSummary[]`, 20 newest, via `filterRenders("example", EXAMPLE, 200)` (11 languages max per localization)
  - `getRenderTarget` (GET) → `{ projectId: string; templateId?: string }` for the API request card
  - `<RenderFrame render?={Render} />`, `<RenderBadge render?={Render} />` (copied from dynamic ads)

- [ ] **Step 1: Write `plainly.ts`** from dynamic ads' version (`plainlyFetch`, `apiError`, `getProjectId`, `filterRenders`, `createRender` copied as they are).
- [ ] **Step 2: Build the home page.** Index loader: `validateSearch` for `?from=<uuid>`, then `fromRenders(getLocalization(from))` with a fallback to defaults, `getRenderTarget().catch(() => undefined)`, and `listLocalizations().catch(() => undefined)` (an error shows inside the recent card, like dynamic ads). `Localizer` state:
  - **Compose card:** Headline, Subheadline, CTA (English, `copySchema("latin")`), Product image URL, Logo URL (placeholders show the `(Footage)/…` defaults), two `<input type="color">`, and language toggle chips from `LANGUAGES`. Button "Translate with ChatGPT" (spinner while waiting, disabled without a language). An error goes in a destructive Alert in the card.
  - **Review section** (after a translation): an English card plus one `VersionCard` per language, each with `LocalizedPreview`, the three text inputs with per-field errors from `localizationSchema`, and a collapsible "Font" group (Font URL, Font name) that starts open when the language has a default font, prefilled with it. "Translate again" calls `translate` again and replaces all versions. Toggling a language after translating removes its card (deselect), or shows "Translate again to add <Language>" (select). Button "Render N videos" → `createLocalization` → navigate to `/video/$localizationId`.
  - **API request card:** the curl for the first non-English version (or English before translating), with real ids from `getRenderTarget`, showing the `properties` block when a font is set. Adapted from dynamic ads' `api-request.tsx`.
  - **Recent localizations card:** from `listLocalizations`, each row shows the English headline, language codes, date and a status badge, linking to `/video/$localizationId`. Adapted from `recent-ads.tsx`.
- [ ] **Step 3: Wait for the OpenAI key if needed.** Check `.env` has a non-empty `OPENAI_API_KEY` (`grep -c '^OPENAI_API_KEY=.\+' .env`, never print the value). If not, ask the user and stop until they confirm.
- [ ] **Step 4: Live check.** Start `pnpm vite dev --port 3001 --strictPort`. In Playwright: keep the defaults, pick German and Japanese, Translate, check three cards with previews show (Japanese in Noto). Edit the German headline. Render. Expected: navigation to `/video/<id>` (Task 7 may not exist yet, so a 404 page is fine here). `curl` the attribute filter for that id and confirm three renders with the right attributes, and that the `ja` render carries `properties`. Kill your dev server.
- [ ] **Step 5: Run** `pnpm lint && pnpm typecheck && pnpm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(ai-localized-videos): compose, translate, review and render`.

### Task 7: Results page

**Files:**
- Create: `plainly-ai-localized-videos/src/routes/video.$localizationId.tsx`

**Interfaces:**
- Consumes: `getLocalization`, `expectedLanguages`, `latestPerLanguage`, `isLocalizationFinished`, `groupLocalizations`, `localizationStatus`, `languageOf`, `RenderFrame`, `RenderBadge`.

- [ ] **Step 1: Build the route** from `ad.$adId.tsx`: the same polling component (`POLL_INTERVAL_MS = 5000`, next poll scheduled after the previous one settles, "Could not refresh" alert, `router.invalidate()` when finished), error and not-found components ("Video not found", link to `/`). Header: "Localization `<id8>`", status badge, created date, and a link "Start from this video" → `/?from=<id>`. Body: a grid (`sm:grid-cols-2 lg:grid-cols-3`) of square frames, one per `expectedLanguages`, captioned with the language name and `RenderBadge`. A missing render shows "Not created".
- [ ] **Step 2: Live check.** Open the localization from Task 6 on port 3001 (Playwright, Chrome). Expected: the frames poll from spinner to video. English, German and Japanese play, and Japanese shows bold Noto glyphs. Open `/video/not-a-uuid` → "Video not found". Kill your dev server.
- [ ] **Step 3: Run** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: PASS.
- [ ] **Step 4: Commit** `feat(ai-localized-videos): add results page`.

### Task 8: READMEs and final check

**Files:**
- Create: `plainly-ai-localized-videos/README.md`, `plainly-ai-localized-videos/.assets/app.png`, `.assets/video.png`, `.assets/auto-generate-template.png` (or reuse PR #24's screenshot if it's the same Plainly screen)
- Modify: `README.md` (root)

- [ ] **Step 1: Example README**, following `plainly-dynamic-video-ads/README.md` section by section (What this app does, What you'll learn, Prerequisites (adds an OpenAI account), Getting started (upload the zip, auto-generate the template with the `edit` prefix stripped, copy `.env.example`, all three keys), Usage, code walkthrough sections, Good to know, Useful commands). Walkthrough sections: "Translate with ChatGPT" (structured output, limits in the prompt), "Render one video per language" (body with `properties`), "Fonts for other languages" (why, raw google/fonts link, PostScript name for variable fonts/collections, `WORKER_FONT_INSTALL_FAILED` and the missing-glyph error, how to add a language), "Find renders by attribute". Include the same credits WARNING as dynamic ads. Screenshots taken from the live app with Playwright.
- [ ] **Step 2: Root README entry 6** after Personalized videos:
  - **Purpose:** Demonstrates generating the same video in multiple languages, with ChatGPT translating the on-screen text automatically, through an app where you write a product ad in English, review each translation next to a preview, and get one video per language.
  - **What it shows:** translating ad copy into many languages with one structured OpenAI call; reviewing and editing translations before anything renders; one single render request per language; switching fonts per render with render properties so Japanese, Chinese and Korean text renders correctly.
  - **Tech stack:** TanStack Start, TanStack Form, OpenAI API, Zod, TypeScript, Tailwind CSS, shadcn/ui
- [ ] **Step 3: Final check.** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` in the example. `git status` shows no `.env`. `git grep -nF "$(grep '^PLAINLY_API_KEY=' plainly-ai-localized-videos/.env | cut -d= -f2-)"` and `git grep -nE 'sk-[A-Za-z0-9_-]{20,}'` both return nothing.
- [ ] **Step 4: Commit** `docs(ai-localized-videos): add README and root entry`.
