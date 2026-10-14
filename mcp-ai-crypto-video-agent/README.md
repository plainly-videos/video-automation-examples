# MCP AI Crypto Video Agent

Generate a short crypto performance video using a real OpenAI agent that
talks with you and orchestrates MCP tools for data fetching and rendering.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (or newer)
- [pnpm](https://pnpm.io/) package manager
- OpenAI API key
- Smithery API key (Free Crypto Coin Data)
- Plainly API key

## Getting started

1. Clone the repository:

    ```bash
    git clone https://github.com/plainly-videos/video-automation-examples.git
    cd video-automation-examples/mcp-ai-crypto-video-agent
    ```

2. Install dependencies:
   - `pnpm install --frozen-lockfile`
3. Upload the After Effects project used in this example to Plainly:
    - Download the example project from [here](../ae-projects/Crypto%202025.zip).
    - Go to [Upload form](https://app.plainlyvideos.com/dashboard/projects/create) and upload the project.
    - Once the upload is done, auto-generate a template with prefix option:
        - Set the prefixes to `edit`, which will include all compositions starting with `edit` and their parameters.
        - Click on "Generate".
        - This will generate a template with few parameters from layers.

    <p align="center">
      <img src=".assets/auto-generate-template.png" alt="Plainly auto-generate template" width="500" />
    </p>

4. Set up environment variables:
   
   ```bash
    cp .env.example .env.local
    ```

    Update `.env.local` with your OpenAI API key, Smithery API key from [Smithery account settings](https://smithery.ai/account/api-keys), and Plainly API key from [Plainly settings](https://app.plainlyvideos.com/dashboard/user/settings/general).

    ```properties
    # Smithery API Key
    SMITHERY_API_KEY=your_smithery_api_key

    # Plainly API Key
    PLAINLY_API_KEY=your_plainly_api_key

    # OpenAI API Key
    OPENAI_API_KEY=your_openai_api_key
    ```

## Usage

Start the interactive agent:

```bash
pnpm start
```

The agent will greet you and guide the conversation. Ask for a crypto video,
specify the coin, and confirm the data or image choices it proposes. Type
`exit` or `quit` to end the session.

## How it works

- Connects to the MCP servers (crypto data + Plainly).
- Runs an OpenAI agent that chats with you and uses MCP tools to gather data.
- Builds a video render plan based on your input and the template data.
- Submits a render and keeps the job details, so you can ask for status updates.

## Scripts

- `pnpm start` - run the interactive agent
- `pnpm build` - type check with TypeScript
- `pnpm biome` - lint and format check
- `pnpm biome:fix` - auto-fix lint issues
