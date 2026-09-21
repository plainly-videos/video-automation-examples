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
- 🛠️ **[Developer guide](https://help.plainlyvideos.com/docs/developer-guide)** - Special section for developers integrating Plainly's API.
- 🌐 **[API reference](https://app.plainlyvideos.com/api-reference.html)** - Complete REST API reference.

## Examples

Simply choose an example that matches your use case and follow the `README.md` file provided for setup instructions. Currently, the following examples are available:

1. **[Render and webhook](plainly-render-and-webhook/)**
   * **Purpose**: Demonstrates a complete video rendering workflow, from creating render jobs via the Plainly API to receiving webhook notifications and tracking render status in a database. Renders are triggered from a web form, so this also works as a form-to-video example.
   * **What it shows**:
      - Creating video render jobs via the Plainly API.
      - Setting up webhook endpoints to receive render completion notifications.
      - Database integration to track render status and results.
      - User interface for managing video generation requests.
   * **Tech Stack**: Next.js, PostgreSQL, Prisma, TypeScript, Tailwind CSS

2. **[MCP AI Crypto Video Agent](mcp-ai-crypto-video-agent/)**
   * **Purpose**: Showcases an AI-powered video generation agent that creates cryptocurrency-related videos.
   * **What it shows**:
      - Integrating with AI services to generate video content dynamically.
      - Using Plainly's API to render videos based on AI-generated scripts and assets.
      - Automating the entire video creation process from content generation to rendering.
   * **Tech Stack**: Node.js, TypeScript

## Contributing

Found an issue or want to contribute a new example? We welcome contributions! Please feel free to:
- Report bugs or issues
- Suggest new example scenarios
- Submit pull requests with improvements
- Share your own integration patterns

## Support

Need help? Here's how to get support:
- 📖 Check the [Help center](https://help.plainlyvideos.com/) first.
- 📧 Open a [new issue](https://github.com/plainly-videos/examples/issues/new).

---

<div align="center">

**If you find this project helpful, please consider giving it a ⭐!**

[![Star on GitHub](https://img.shields.io/github/stars/plainly-videos/examples?style=for-the-badge&logo=github&label=Star%20this%20repo&color=FFD700)](https://github.com/plainly-videos/examples/stargazers)

</div>
