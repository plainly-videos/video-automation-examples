# Dynamic video ads example

This example demonstrates dynamic creative for video advertising with [Plainly Videos](https://www.plainlyvideos.com/): one After Effects template produces many ad variants with a different hook, products, prices and call to action, and every variant renders in 16:9, 9:16 and 1:1, ready for each ad platform.

## What this App does?

**Non-technical view:**
Write a hook, pick three products with their names and prices, set the button text and a call to action, and watch a live preview in all three formats. Click one button and get the same ad as a wide, a tall and a square video.

**Technical view:**
A TanStack Start app that reads the project's templates from `GET /api/v2/projects/{projectId}`, picks one template per aspect ratio by its resolution, and sends three `POST /api/v2/renders` requests to `https://api.plainlyvideos.com`, one per format. Every render is tagged with custom attributes, and the app finds them again with `POST /api/v2/renders/attributes`. No database, no webhooks and no local storage are needed.

## What you'll learn

- **🎯 One ad, many formats**: Fan out one set of parameters to one render per aspect ratio.
- **🧩 Template discovery**: Find the right template for each format from the project, instead of configuring template ids.
- **🏷️ Attribute filtering**: Tag renders with your own data and query them later, for both a single ad and a list of recent ads.
- **🔁 Per-render retry**: Renders are independent, so one format can fail and be retried on its own.
- **🔐 Server functions**: Keep your Plainly Videos API key on the server with TanStack Start server functions.

## Prerequisites

- [Node.js](https://nodejs.org/) (v24 or later, run `nvm use` to pick it up from `.nvmrc`)
- [pnpm](https://pnpm.io/) package manager (v12 or later)

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/plainly-videos/video-automation-examples.git
    cd video-automation-examples/plainly-dynamic-video-ads
    ```
2. Install dependencies:

    ```bash
    pnpm install --frozen-lockfile
    ```
3. Upload the After Effects project used in this example to Plainly Videos:
   - Download the example project from [here](../after-effects-projects/Dynamic%20Video%20Ads.zip). It has one composition per format: `editRender16x9` (1920×1080), `editRender9x16` (1080×1920) and `editRender1x1` (1080×1080).
   - Go to [Upload form](https://app.plainlyvideos.com/dashboard/projects/create) and upload the project.
   - Once the upload is done, auto-generate the templates with the prefix option:
      - Leave the target composition empty.
      - Set the prefixes to `edit`, which includes all compositions and layers whose name starts with `edit`.
      - Check **Strip prefix**, so the layer `editHook` becomes the parameter `Hook`. The app sends the parameter names without the prefix.
      - Click on "Generate".
   - This generates three templates, `Render16x9`, `Render9x16` and `Render1x1`, each with the parameters `Hook`, `ButtonCTA`, `CTA`, `Product1`-`Product3`, `Price1`-`Price3` (text) and `Image1`-`Image3` (image). The video opens with the hook, shows one slide per product with a button and ends with the call to action. `Logo` and `ButtonSwitch` are generated too, the app leaves them at their defaults.

4. Set up environment variables:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your API key from [Plainly Videos settings](https://app.plainlyvideos.com/dashboard/user/settings/general) and the project `ID` from the project you just uploaded. Template ids are not needed, the app finds them.

    ```properties
    # Plainly API key, from https://app.plainlyvideos.com/dashboard/user/settings/general
    PLAINLY_API_KEY=your_plainly_api_key

    # ID of the Dynamic video ads project you uploaded to Plainly
    PLAINLY_PROJECT_ID=your_plainly_project_id
    ```
5. Start the development server:

    ```bash
    pnpm dev
    ```

    The app is available at http://localhost:3000.

## Usage

Open http://localhost:3000. Pick a product for each of the three slots, which fills in its name and price, edit any field, and check the preview of all three formats on the right. The preview plays the ad in HTML, close to the video; the final look comes from the After Effects template.

Click **Render 3 formats**. The app opens `/ad/<id>`, where each format turns into a video once its render is finished. If a format fails, click **Retry** to render only that format again. The page also shows the ad's values and the exact API request each render was made with. Click **Edit as new ad** to open the form prefilled with this ad.

Every ad made with this app is listed under **Recent ads**, so you can reopen an earlier ad with one click. The list comes from Plainly, so it shows ads created by everyone using the same API key.

### Find the template for each format

Template ids are not configured. The app reads the project and matches each template to a format by the size of its rendered composition:

```ts
// ./src/lib/ad.ts
export function templatesByFormat(
  templates: Template[],
): Record<Format, string> {
  const found: Partial<Record<Format, string>> = {};
  for (const template of templates) {
    const format = formatOf(template.resolution);
    if (format && !found[format]) found[format] = template.id;
  }
  for (const format of FORMATS) {
    if (!found[format]) throw new Error(`Project has no ${format} template`);
  }
  return found as Record<Format, string>;
}
```

### Render one ad in three formats

The `createAd` server function sends three single render requests with the same parameters and a different template. `Promise.allSettled` lets one format fail without losing the others:

```ts
// ./src/lib/plainly.ts
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
```

Every request carries custom attributes. Plainly stores them on the render, which is how the app finds it again:

```json
{
  "projectId": "your-project-id",
  "templateId": "template-id-of-the-9:16-composition",
  "parameters": {
    "Hook": "New season picks",
    "ButtonCTA": "Shop now",
    "CTA": "Shop the collection",
    "Product1": "Running sneakers",
    "Price1": "$79",
    "Image1": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&q=80",
    "Product2": "Wireless headphones",
    "Price2": "$129",
    "Image2": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1080&q=80",
    "Product3": "Coffee beans",
    "Price3": "$12",
    "Image3": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1080&q=80"
  },
  "attributes": {
    "example": "dynamic-video-ads",
    "adId": "7f3c9a1e-2b4d-4e8f-9a6b-1c2d3e4f5a6b",
    "format": "9:16"
  }
}
```

### Find renders by attribute

`POST /api/v2/renders/attributes` returns the renders whose attributes match. The ad page filters by `adId`, the recent ads list filters by `example`:

```ts
// ./src/lib/plainly.ts
const res = await plainlyFetch(`/renders/attributes?size=${size}`, {
  method: "POST",
  body: JSON.stringify({ filters: [{ key, value }] }),
});
```

While any format is still rendering, the ad page calls this again every 5 seconds.

### Retry one format

A retry creates a new render with the same parameters and attributes. An ad can now have two renders for one format, so the app always shows the newest one:

```ts
// ./src/lib/ad.ts
export function latestPerFormat(
  renders: Render[],
): Partial<Record<Format, Render>> {
  const latest: Partial<Record<Format, Render>> = {};
  for (const render of renders) {
    const format = render.attributes?.format;
    if (!isFormat(format)) continue;
    const current = latest[format];
    if (
      !current ||
      Date.parse(render.createdDate) > Date.parse(current.createdDate)
    ) {
      latest[format] = render;
    }
  }
  return latest;
}
```

### Good to know

- The preview is made by hand for this template: its timings and layouts were measured on rendered videos, see `src/components/ad-preview-data.ts`. Plainly does not provide it, so other templates need their own preview, or none.
- Product images must be public URLs, because Plainly downloads them while rendering. The example uses placeholder photos from [Unsplash](https://unsplash.com/).
- To render many ads at once, use the Batch Renders API, see the [Batch render example](../plainly-batch-render/).
- Prefer webhooks over polling in production. See [webhook delivery](https://help.plainlyvideos.com/docs/user-guide/rendering/video-delivery#webhook-delivery) and the [Render and webhook example](../plainly-render-and-webhook/).

## Useful commands

- `pnpm dev` - Starts the app in development mode.
- `pnpm build` and `pnpm preview` - Builds the app and serves the production build.
- `pnpm test` - Runs the unit tests.
- `pnpm coverage` - Runs the unit tests with a coverage report.
- `pnpm lint` - Checks the code with Biome.
