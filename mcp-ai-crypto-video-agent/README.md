# MCP AI Crypto Video Agent

Generate a short crypto performance video using a real OpenAI agent that
talks with you and orchestrates MCP tools for data fetching and rendering.

## What this app does

**Non-technical view**: Ask the agent for a video about a coin, like Bitcoin or Solana. It looks up the current price along with the 24-hour and 7-day change, then suggests what the video should show. Once you confirm the data and either share a coin image or let it use one from CoinGecko, it renders the video and can check its status whenever you ask.

**Technical view**: A Node.js command-line app built with the OpenAI Agents SDK. It connects to two MCP servers and gives one agent the tools from both. The Plainly Videos MCP server runs locally, started by the app with npx, and a free coin price MCP server is hosted on Smithery. The agent finds a suitable crypto project in Plainly and fills its parameters with live coin data before submitting the render. All of that happens through MCP tool calls, so the app has no Plainly or crypto API code of its own.

## What you'll learn

- **🔌 Multiple MCP servers**: Connect a local MCP server and a remote one, and give one agent the tools from both.
- **🎬 Rendering through MCP**: Let the agent pick a Plainly Videos project and submit a render, with no Plainly API code in your app.
- **🧭 Agent instructions**: Shape the agent's behavior with plain-language rules, like sticking to USD and asking before it uses a coin image.
- **💬 Conversation memory**: Keep the chat history between turns so the agent remembers earlier answers, including which render to check on.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later, run `nvm use` to pick it up from `.nvmrc`)
- [pnpm](https://pnpm.io/) package manager
- OpenAI API key
- Smithery API key (Free Crypto Coin Data)
- Plainly Videos API key

## Getting started

1. Clone the repository:

    ```bash
    git clone https://github.com/plainly-videos/video-automation-examples.git
    cd video-automation-examples/mcp-ai-crypto-video-agent
    ```

2. Install dependencies:
   - `pnpm install --frozen-lockfile`
3. Upload the After Effects project used in this example to Plainly Videos:
    - Download the example project from [here](../after-effects-projects/Crypto%202025.zip).
    - Go to [Upload form](https://app.plainlyvideos.com/dashboard/projects/create) and upload the project.
    - Once the upload is done, auto-generate a template with prefix option:
        - Set the prefixes to `edit`, which will include all compositions starting with `edit` and their parameters.
        - Click on "Generate".
        - This will generate a template with few parameters from layers.

    <p align="center">
      <img src=".assets/auto-generate-template.png" alt="Plainly Videos auto-generate template" width="500" />
    </p>

4. Set up environment variables:
   
   ```bash
    cp .env.example .env.local
    ```

    Update `.env.local` with your OpenAI API key, Smithery API key from [Smithery account settings](https://smithery.ai/account/api-keys) and Plainly Videos API key from [Plainly Videos settings](https://app.plainlyvideos.com/dashboard/user/settings/general).

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

- Connects to the MCP servers (crypto data + Plainly Videos).
- Runs an OpenAI agent that chats with you and uses MCP tools to gather data.
- Builds a video render plan based on your input and the template data.
- Submits a render and keeps the job details, so you can ask for status updates.

## Scripts

- `pnpm start` - run the interactive agent
- `pnpm build` - type check with TypeScript
- `pnpm biome` - lint and format check
- `pnpm biome:fix` - auto-fix lint issues
