# Video Automation Examples

A collection of code examples for automating video creation with [Plainly Videos](https://plainlyvideos.com), a video automation platform that renders Adobe After Effects projects natively in the cloud. Each example shows a practical way to use the [Plainly REST API](https://app.plainlyvideos.com/api-reference.html).

### What is Plainly Videos?

Plainly Videos is a cloud-based video automation platform that enables developers to render Adobe After Effects templates natively in the cloud using Plainly's powerful REST API, web app, or native integrations.

### Who is this repository for?

- **Developers** looking to integrate video generation into their applications and workflows.
- **Product teams** wanting to add automated video creation features.
- **Anyone** interested in learning how to work with the Plainly Videos API.

## Documentation & Resources

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
      - Setting up webhook endpoints to receive render completion notifications.
      - Database integration to track render status and results.
      - User interface for managing video generation requests.
   * **Tech Stack**: Next.js, PostgreSQL, Prisma, TypeScript, Tailwind CSS

2. **[MCP AI Crypto Video Agent](mcp-ai-crypto-video-agent/)**
   * **Purpose**: Showcases an AI-powered video generation agent that creates cryptocurrency-related videos.
   * **What it shows**:
      - Integrating with AI services to generate video content dynamically.
      - Using the Plainly Videos API to render videos based on AI-generated scripts and assets.
      - Automating the entire video creation process from content generation to rendering.
   * **Tech Stack**: Node.js, TypeScript

3. **[Batch render](plainly-batch-render/)**
   * **Purpose**: Demonstrates rendering multiple After Effects videos in a single request using the Plainly Videos Batch Renders API.
   * **What it shows**:
      - Creating many renders with one Batch Renders API request.
      - Polling a batch's renders until they are finished, without webhooks or a database.
      - Showing finished videos in a grid.
   * **Tech Stack**: TanStack Start, TypeScript, Tailwind CSS, shadcn/ui

4. **[Dynamic video ads](plainly-dynamic-video-ads/)**
   * **Purpose**: Demonstrates dynamic creative for video advertising, where one template produces many ad variants with different headlines, offers, pricing, and visuals. Every variant renders in multiple aspect ratios, like 16:9, 9:16, and 1:1, ready for each ad platform.
   * **What it shows**:
      - Rendering one ad in three aspect ratios with three single render requests.
      - Finding the template for each format from the project's templates.
      - Tagging renders with custom attributes and finding them again with the attribute filter.
   * **Tech Stack**: TanStack Start, TypeScript, Tailwind CSS, shadcn/ui

## Contributing

Found an issue or want to contribute a new example? We welcome contributions! Please feel free to:
- Report bugs or issues
- Suggest new example scenarios
- Submit pull requests with improvements
- Share your own integration patterns

## Support

Need help? Here's how to get support:
- 📖 Check the [Help center](https://help.plainlyvideos.com/) first.
- 📧 Open a [new issue](https://github.com/plainly-videos/video-automation-examples/issues/new).

---

<div align="center">

**If you find this project helpful, please consider giving it a ⭐!**

[![Star on GitHub](https://img.shields.io/github/stars/plainly-videos/video-automation-examples?style=for-the-badge&logo=github&label=Star%20this%20repo&color=FFD700)](https://github.com/plainly-videos/video-automation-examples/stargazers)

</div>
