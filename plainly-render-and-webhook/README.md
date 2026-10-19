# Render and webhook handling example

This example demonstrates how to build a complete end-to-end video generation workflow with webhook handling using the [Plainly Videos REST API](https://www.plainlyvideos.com/).

## What this app does

**Non-technical view:**
Create professional sports matchup videos automatically! Simply select two teams from a dropdown menu, and the app generates a custom video preview showing the upcoming game with team logos and names.

**Technical view:**
This is a full-stack web application that demonstrates programmatic video generation through API integration. Users create matchup requests via a form interface, which triggers video rendering jobs through the Plainly Videos API. The app uses webhooks to receive real-time notifications when videos are complete, automatically updating the database.

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
    - Generate and push the Prisma schema
    - Create a unique `tunnel` URL to expose your local server for webhook handling
    - Start the Next.js development server

    The output will show your unique `tunnel` URL and the app started message:

    ```text
    🌐 Tunnel URL: https://abc123.loca.lt
    📨 Webhook URL: https://abc123.loca.lt/api/webhook

      ▲ Next.js 16.4.0
      - Local:        http://localhost:3000
      - Network:      http://192.168.0.109:3000
      - Environments: .env.local

    ✓ Starting...
    ✓ Ready in 1376ms
    ```

## Usage

Open your browser and navigate to http://localhost:3000 to access the app. You should see a simple form where you can select two teams and generate a matchup video.

A table below the form will show all the matchups created so far, along with their current status and a preview of the rendered video once it's complete.

At the bottom, the Webhook Status should show `Configured` along with the `tunnel` URL.

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

After the new entity is persisted successfully, we send a new video render request to the Plainly Videos API.

Besides the render parameters that provide dynamic data for the video, we also include a `webhook` object in the request body to specify where to send the status updates. The `matchupId` is set as `passthrough` data, so we can identify which matchup the webhook notification belongs to.

We'll also enable `onFailure` and `onInvalid` webhook options to receive notifications in case the render fails or the provided data is invalid.

```ts
  // ./src/actions/render.ts
  // Construct the request body for the Plainly Videos API
  const body = {
    projectId, // Project ID for the Plainly Videos project
    parameters: { // render parameters
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

If the render was successful, we will receive `success: true` along with the `output` URL and `expirationDate` of the rendered video. If the render failed, we will receive the `error` details instead. Based on the status, we'll update the database entry accordingly.

In order to know which entry in the database needs to be updated, we'll use the `passthrough` value from the webhook body. It should point to the `matchupId` that we sent previously in the render request.

```ts
// ./src/app/api/webhook/route.ts
export async function POST(request: NextRequest) {
  try {
    // Here you can see the example webhook payloads
    // https://help.plainlyvideos.com/docs/user-guide/rendering/video-delivery#webhook-delivery
    const body = await request.json();
    const { passthrough, output, success, expirationDate } = body;

    // Update matchup in DB based on the passthrough data
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
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }
}
```

## Useful commands

 - `pnpm dev:full` - Starts the app in development mode with the webhook tunnel setup.
 - `pnpm start:full` - Builds and starts the app in production mode with the webhook tunnel setup.
 - `pnpm db:stop` - Stops the PostgreSQL instance by running `docker compose down`.
 - `pnpm db:remove` - Stops the PostgreSQL instance and removes any data in the database.
