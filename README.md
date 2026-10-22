# Video Automation Examples

A collection of code examples for automating video creation with [Plainly Videos](https://plainlyvideos.com), a video automation platform that renders Adobe After Effects projects natively in the cloud. Each example shows a practical way to use the [Plainly Videos REST API](https://app.plainlyvideos.com/api-reference.html) or the Plainly Videos MCP server.

## What is Plainly Videos?

Plainly Videos is a cloud-based video automation platform that enables developers to render Adobe After Effects templates natively in the cloud using Plainly's powerful REST API, web app or native integrations.

## Who is this repository for?

- **Developers** looking to integrate video generation into their applications and workflows.
- **Product teams** wanting to add automated video creation features.
- **Anyone** interested in learning how to work with the Plainly Videos API.

## Documentation & resources

Before diving into the examples, we recommend checking out these resources:

- 📚 **[Help center](https://help.plainlyvideos.com/)** - General guides, tips and FAQ.
- 🛠️ **[Developer guide](https://help.plainlyvideos.com/docs/developer-guide)** - Special section for developers integrating the Plainly Videos API.
- 🌐 **[API reference](https://app.plainlyvideos.com/api-reference.html)** - Complete REST API reference.

## Examples

Simply choose an example that matches your use case and follow the `README.md` file provided for setup instructions. Currently, the following examples are available:

1. **[Render and webhook](plainly-render-and-webhook/)**
   * **Purpose**: Demonstrates a complete video rendering workflow, from creating render jobs via the Plainly Videos API to receiving webhook notifications and tracking render status in a database. Renders are triggered from a web form, so this also works as a form-to-video example.
   * **What it shows**:
      - Creating video render jobs via the Plainly Videos API.
      - Setting up a webhook endpoint to receive render completion and failure notifications.
      - Database integration to track render status and results.
      - A web form for submitting renders and a table showing each render's status and video link.
   * **Tech stack**: Next.js, PostgreSQL (Docker), Prisma, localtunnel, TypeScript, Tailwind CSS, shadcn/ui

2. **[MCP AI crypto video agent](mcp-ai-crypto-video-agent/)**
   * **Purpose**: Showcases an OpenAI agent that pulls live coin data from one MCP server and renders a crypto performance video through the Plainly Videos MCP server.
   * **What it shows**:
      - Connecting one agent to a local and a remote MCP server.
      - Picking a Plainly Videos project and submitting a render through MCP tool calls, with no Plainly API code in the app.
      - Shaping the agent's behavior with plain-language instructions and keeping context between turns by replaying the earlier messages as text in each new prompt.
   * **Tech stack**: Node.js, TypeScript, OpenAI Agents SDK, MCP

3. **[Batch render](plainly-batch-render/)**
   * **Purpose**: Demonstrates rendering multiple After Effects videos in a single request using the Plainly Videos Batch Renders API, through an app where you pair NBA teams into a night of games and get one matchup video per game.
   * **What it shows**:
      - Creating many renders with one Batch Renders API request.
      - Polling a batch's renders until they are finished, without webhooks or a database.
      - Showing finished videos in a grid.
   * **Tech stack**: TanStack Start, TypeScript, Tailwind CSS, shadcn/ui

4. **[Dynamic video ads](plainly-dynamic-video-ads/)**
   * **Purpose**: Demonstrates dynamic creative for video advertising, through a collection ad builder app where you set the hook, products, prices and call to action, and get the same ad rendered in 16:9, 9:16 and 1:1, one for each type of ad placement.
   * **What it shows**:
      - Rendering one ad in three aspect ratios with three separate render requests.
      - Matching each format to a project template by its resolution.
      - Tagging renders with custom attributes and finding them again with the attribute filter.
   * **Tech stack**: TanStack Start, TanStack Form, Zod, TypeScript, Tailwind CSS, shadcn/ui

5. **[Personalized videos](plainly-personalized-videos/)**
   * **Purpose**: Demonstrates rendering a unique video per recipient, with the name, company, and other personal details filled into the same template, through an app where a sales rep uploads a client list as a CSV and gets a holiday greeting video for every client.
   * **What it shows**:
      - Turning CSV rows into one Batch Renders API request, with each row checked before rendering.
      - Giving every recipient their own file name and thumbnail, and copying a clickable thumbnail into an email.
      - Rendering free drafts first, then the final videos.
      - Naming campaigns with the batch reference and finding their renders with the attribute filter.
   * **Tech stack**: TanStack Start, papaparse, TypeScript, Tailwind CSS, shadcn/ui

6. **[AI localized videos](ai-localized-videos/)**
   * **Purpose**: Demonstrates generating the same video in multiple languages, with ChatGPT translating the on-screen text automatically, through an app where you write a product ad in English, review each translation next to a preview, and get one video per language.
   * **What it shows**:
      - Translating ad copy into many languages with one structured OpenAI call.
      - Reviewing and editing translations, with length checks, before anything renders.
      - Rendering one video per language with single render requests.
      - Switching fonts per render with render properties, so Japanese, Chinese and Korean text renders correctly.
   * **Tech stack**: TanStack Start, TanStack Form, OpenAI API, Zod, TypeScript, Tailwind CSS, shadcn/ui

## Contributing

Found an issue or want to contribute a new example? We welcome contributions! Please feel free to:
- Report bugs or issues.
- Suggest new example scenarios.
- Submit pull requests with improvements.
- Share your own integration patterns.

## Support

Need help? Here's how to get support:
- 📖 Check the [Help center](https://help.plainlyvideos.com/) first.
- 🐛 Open a [new issue](https://github.com/plainly-videos/video-automation-examples/issues/new).

---

<div align="center">

**If you find this project helpful, please consider giving it a ⭐!**

[![Star on GitHub](https://img.shields.io/github/stars/plainly-videos/video-automation-examples?style=for-the-badge&logo=github&label=Star%20this%20repo&color=FFD700)](https://github.com/plainly-videos/video-automation-examples/stargazers)

</div>
