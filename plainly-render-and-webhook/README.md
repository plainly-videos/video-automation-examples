# Render and webhook handling example

This example demonstrates how to build a complete end-to-end video generation workflow with webhook handling using the [Plainly Videos REST API](https://www.plainlyvideos.com/).

## What this app does

**Non-technical view:** Create sports matchup videos automatically! Simply pick two teams (from a short list of NBA teams) in the Team A and Team B dropdowns, and the app renders a custom matchup video with the two teams' names and logos.

**Technical view:** This is a full-stack web application that demonstrates programmatic video generation through API integration. Users create matchup requests via a form interface, which triggers video rendering jobs through the Plainly Videos API. The app uses webhooks to receive real-time notifications when videos are complete or fail, automatically updating the database; the table reflects the new status on refresh.

## What you'll learn

By working through this example, you'll understand how to:

- **🎬 Video generation**: Integrate with the Plainly Videos API to programmatically create videos.
- **🔄 Webhook handling**: Set up an endpoint to receive and process webhook notifications, in order to track video render jobs and their statuses.
- **🌐 Development workflow**: Use tunneling for local webhook development and testing.
- **🏗️ Full-stack architecture**: Build a complete app with form handling, API routes and data persistence.

## Prerequisites

- [Node.js](https://nodejs.org/) (v24 or later, run `nvm use` to pick it up from `.nvmrc`)
- [pnpm](https://pnpm.io/) package manager (v12 or later)
- [Docker](https://www.docker.com/), including [Docker Compose](https://docs.docker.com/compose/), for running a local PostgreSQL instance

## Getting started

1. Clone the repository:

    ```bash
    git clone https://github.com/plainly-videos/video-automation-examples.git
    cd video-automation-examples/plainly-render-and-webhook
    ```
2. Install dependencies:

    ```bash
    pnpm install --frozen-lockfile
    ```
3. Upload the After Effects project used in this example to Plainly Videos:
   - Download the [example project](../after-effects-projects/Sports%20Matchup.zip).
   - Go to the [upload form](https://app.plainlyvideos.com/dashboard/projects/create) and upload the project.
   - Once the upload is done, auto-generate a template with the prefix option:
      - Set the target composition to `editRender`.
      - Click **Generate**.
      - This will generate a template with a few parameters from layers.


   <p align="center">
     <img src=".assets/auto-generate-template.png" alt="Plainly Videos auto-generate template" width="500" />
   </p>

4. Set up environment variables:

    ```bash
    cp .env.example .env.local
    ```

    Update `.env.local` with your API key from [Plainly Videos settings](https://app.plainlyvideos.com/dashboard/user/settings/general) and the id of the project you just uploaded.

    ```properties
    # DB connection string, update if you change postgres settings in docker-compose
    DATABASE_URL=postgres://postgres:password@localhost:5432/plainly_render_webhook

    # Plainly API
    PLAINLY_API_KEY=your_plainly_api_key

    # Plainly Project ID
    PLAINLY_PROJECT_ID=your_plainly_project_id
    ```
5. Start the development environment:

    ```bash
    pnpm dev:full
    ```

    This command will:
    - Start a PostgreSQL database in a Docker container
    - Generate the Prisma client and push the schema to the database
    - Create a unique `tunnel` URL to expose your local server for webhook handling
    - Start the Next.js development server

    Among the output you'll see your unique `tunnel` URL and the Next.js startup message (abridged):

    ```text
    ✅ Tunnel created: https://floppy-emus-hug.loca.lt

    🌐 Tunnel URL: https://floppy-emus-hug.loca.lt
    📨 Webhook URL: https://floppy-emus-hug.loca.lt/api/webhook

      ▲ Next.js 16.4.0
      - Local:        http://localhost:3000
      - Network:      http://192.168.0.109:3000
      - Environments: .env.local

    ✓ Starting...
    ✓ Ready in 1376ms
    ```

## Usage

Open your browser and navigate to http://localhost:3000 to access the app. You should see a simple form where you can select two teams and generate a matchup video.

A table below the form lists all matchups with their status (`pending`, `completed`, `failed`) and, once complete, a `Preview` link to the rendered video (`Expired` after the link expires). While a render is pending, click `Refresh` in that row to see updates.

Below the table, the Webhook Status card should show `Configured` along with the webhook endpoint (your `tunnel` URL followed by `/api/webhook`).

<p align="center">
  <img src=".assets/app.png" alt="Plainly Videos render and webhook example UI" width="500" />
</p>

### Create a new matchup video

When a new matchup video is created, it will be saved in the PostgreSQL database first. The `id` of a new row will be referenced in a `matchupId` variable for later use in the webhook handling.

```ts
  // ./src/actions/render.ts
  // Save matchup details to the database with an initial status of 'pending'
  const { id: matchupId } = await prisma.matchup.create({
    data: {
      teamA: rawFormData.team1,
      teamB: rawFormData.team2,
      teamALogo: rawFormData.team1logo,
      teamBLogo: rawFormData.team2logo,
      status: "pending", // Initial status of the matchup
    },
  });
```

After the new entity is persisted successfully, we send a new video render request to the Plainly Videos API. If the API rejects the request, the matchup is marked `failed` and the form shows an error.

Besides the render parameters that provide dynamic data for the video, we also include a `webhook` object in the request body to specify where to send the status updates. The `matchupId` is set as `passthrough` data, so we can identify which matchup the webhook notification belongs to.

We'll also enable `onFailure` and `onInvalid` webhook options to receive notifications in case the render fails or the provided data is invalid. Both cases are recorded as `failed` in this example.

```ts
  // ./src/actions/render.ts
  // Construct the request body for the Plainly Videos API
  const body = {
    projectId, // Project ID for the Plainly Videos project
    // render parameters
    parameters: {
      plainlyEditTeam1: rawFormData.team1,
      plainlyEditLogo1: rawFormData.team1logo,
      plainlyEditTeam2: rawFormData.team2,
      plainlyEditLogo2: rawFormData.team2logo,
    },
    webhook: {
      url: `${publicUrl}/api/webhook`, // Webhook URL to handle render status updates
      passthrough: matchupId, // Send matchupId as passthrough to identify the render
      onFailure: true, // Trigger webhook on failure
      onInvalid: true, // Trigger webhook on invalid data
    },
  };

  // Send a POST request to the Plainly Videos API to initiate a render
  const res = await fetch("https://api.plainlyvideos.com/api/v2/renders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`, // Basic authentication header
    },
    body: JSON.stringify(body),
  });
```

### Webhook handling

When the video rendering is complete, Plainly Videos will send a webhook notification to the specified URL in the form of a `POST` request. The app has the API route `/api/webhook` set up to handle these webhook notifications and update the corresponding matchup status in the database.

If the render was successful, we will receive `success: true` along with the `output` URL and `expirationDate` of the rendered video. If the render failed, the payload contains `error` details instead (this example doesn't store them). We set the status to `completed` or `failed` and save the `output` URL and `expirationDate` when present.

In order to know which entry in the database needs to be updated, we'll use the `passthrough` value from the webhook body. It should point to the `matchupId` that we sent previously in the render request.

```ts
// ./src/app/api/webhook/route.ts
export async function POST(request: NextRequest) {
  try {
    // Here you can see the example webhook payloads that Plainly sends
    // https://help.plainlyvideos.com/docs/user-guide/rendering/video-delivery#webhook-delivery
    const body = await request.json();
    const { passthrough, output, success, expirationDate } = body;

    // Update matchup in DB based on the passthrough data, as in /actions/render.ts we set it to the matchup ID
    await prisma.matchup.updateMany({
      where: { id: Number(passthrough) },
      data: {
        status: success ? "completed" : "failed",
        videoUrl: output ?? null,
        expirationDate: expirationDate ?? null,
      },
    });

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Webhook error:", error);

    // Return a 500 status code to indicate a server-side error
    // This will force Plainly to retry the webhook delivery
    return NextResponse.json(
      { message: "Error processing webhook" },
      { status: 500 },
    );
  }
}
```

## Useful commands

 - `pnpm dev:full` - Starts the app in development mode with the webhook tunnel setup.
 - `pnpm start:full` - Starts the database, pushes the schema, opens a tunnel, then builds and starts the app in production mode.
 - `pnpm db:stop` - Stops and removes the PostgreSQL container by running `docker compose down` (data is kept in the `db-data` volume).
 - `pnpm db:remove` - Stops the PostgreSQL instance and removes any data in the database.
