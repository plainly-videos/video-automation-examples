# MCP AI crypto video agent

Generate a short crypto performance video using a real OpenAI agent that
talks with you and orchestrates MCP tools for data fetching and rendering.

## What this app does

**Non-technical view**: Ask the agent for a video about a coin, like Bitcoin or Solana. It's told to use the current price, the 24-hour and 7-day change and the date, to suggest what the video could show if you ask, and to ask whether you have a coin image before using one from CoinGecko. It then submits the render, and you can ask it to check the status. These steps come from the agent's prompt, so the model may not follow them exactly every time.

**Technical view**: A Node.js command-line app built with the OpenAI Agents SDK. It connects to two MCP servers and gives one agent the tools from both. The Plainly Videos MCP server runs locally, started by the app with npx, and CoinGecko's free public MCP server is reached over HTTP with no API key. The agent is instructed to look for a suitable crypto project in your Plainly account and fill its parameters with live coin data before submitting the render. All of that happens through MCP tool calls, so the app has no Plainly or crypto API code of its own.

## What you'll learn

- **🔌 Multiple MCP servers**: Connect a local MCP server and a remote one, and give one agent the tools from both.
- **🎬 Rendering through MCP**: Let the agent find a Plainly Videos project through MCP tools and submit a render, with no Plainly API code in your app.
- **🧭 Agent instructions**: Shape the agent's behavior with plain-language rules the model is asked to follow, like sticking to USD and asking before it uses a coin image.
- **💬 Conversation memory**: Send a text transcript of the chat with each new message so the agent sees earlier answers. Tool results aren't kept, so it can only check on a render if the render ID appears in the chat, for example in an earlier reply.

## Prerequisites

- [Node.js](https://nodejs.org/) (v24 or later; run `nvm use` to pick it up from `.nvmrc`)
- [pnpm](https://pnpm.io/) package manager (v12 or later)
- OpenAI API key
- Plainly Videos API key

## Getting started

1. Clone the repository:

    ```bash
    git clone https://github.com/plainly-videos/video-automation-examples.git
    cd video-automation-examples/mcp-ai-crypto-video-agent
    ```

2. Install dependencies:

    ```bash
    pnpm install --frozen-lockfile
    ```

3. Upload the After Effects project used in this example to Plainly Videos:
    - Download the [example project](../after-effects-projects/Crypto%202025.zip).
    - Go to the [upload form](https://app.plainlyvideos.com/dashboard/projects/create) and upload the project.
    - Once the upload is done, auto-generate a template with the prefix option:
        - Set the prefix to `edit`, which will include compositions and layers whose names start with `edit`.
        - Click **Generate**.
        - This will generate a template with a few parameters from layers.

    <p align="center">
      <img src=".assets/auto-generate-template.png" alt="Plainly Videos auto-generate template" width="500" />
    </p>

4. Set up environment variables:

    ```bash
    cp .env.example .env.local
    ```

    Update `.env.local` with your OpenAI API key from [OpenAI platform](https://platform.openai.com/api-keys) and Plainly Videos API key from [Plainly Videos settings](https://app.plainlyvideos.com/dashboard/user/settings/general).

    ```properties
    # Plainly Videos API key
    PLAINLY_API_KEY=your_plainly_api_key

    # OpenAI API key
    OPENAI_API_KEY=your_openai_api_key
    ```

## Usage

Start the interactive agent:

```bash
pnpm start
```

The agent will greet you. Ask for a crypto video, specify the coin and
answer its questions, such as whether you have your own coin image. Type
`exit` or `quit` to end the session.

## How it works

- Connects to the MCP servers (CoinGecko crypto data + Plainly Videos).
- Runs an OpenAI agent that chats with you and uses MCP tools to gather data.
- Following its prompt, the agent looks up a suitable Plainly project and fills its parameters from your input and the coin data.
- Submits a render. You can ask for status updates if the render ID is in the conversation.

## Scripts

- `pnpm start` - run the interactive agent
- `pnpm build` - compile TypeScript to `dist/`
- `pnpm biome` - lint and format check
- `pnpm biome:fix` - auto-fix lint and format issues
