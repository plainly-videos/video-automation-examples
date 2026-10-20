#!/usr/bin/env node

/**
 * MCP AI Crypto Video Agent
 * Autonomous agent-based system using OpenAI Agents with MCP servers
 *
 * The agents autonomously:
 * - Discover and use MCP tools
 * - Coordinate with each other
 * - Generate videos from cryptocurrency data
 */

import { stdin, stdout } from "node:process";
import * as readline from "node:readline/promises";
import {
	Agent,
	getAllMcpTools,
	MCPServerStdio,
	MCPServerStreamableHttp,
	run,
	withTrace,
} from "@openai/agents";
import chalk from "chalk";
import { config } from "dotenv";

const MAX_TURNS = 100;

// Load environment variables
config({ path: ".env.local" });

async function main() {
	console.log(chalk.cyan.bold("\n🎬 MCP AI Crypto Video Agent"));
	console.log(chalk.gray("Autonomous agents with MCP tool integration\n"));

	// Verify API keys
	if (!process.env.OPENAI_API_KEY) {
		console.error(chalk.red("❌ OPENAI_API_KEY not found in environment"));
		console.error(chalk.gray("   Add it to .env.local file"));
		process.exitCode = 1;
		return;
	}

	if (!process.env.PLAINLY_API_KEY) {
		console.error(chalk.red("❌ PLAINLY_API_KEY not found in environment"));
		console.error(chalk.gray("   Add it to .env.local file"));
		process.exitCode = 1;
		return;
	}

	const servers: Array<MCPServerStdio | MCPServerStreamableHttp> = [];
	const rl = readline.createInterface({ input: stdin, output: stdout });
	rl.on("SIGINT", () => rl.close());

	// CoinGecko's public MCP server, free and keyless (shared rate limits)
	const cryptoServer = new MCPServerStreamableHttp({
		name: "CoinGecko MCP Server",
		url: "https://mcp.api.coingecko.com/mcp",
	});

	const plainlyServer = new MCPServerStdio({
		name: "Plainly MCP Server",
		fullCommand: "npx -y @plainly-videos/mcp-server@latest",
		env: { PLAINLY_API_KEY: process.env.PLAINLY_API_KEY },
	});

	try {
		console.log("🔌 Connecting to MCP servers...");
		servers.push(cryptoServer, plainlyServer);
		for (const server of servers) {
			await server.connect();
			console.log(`  ✅ Connected to ${server.name}`);
		}

		await withTrace("agent-run", async () => {
			const allToolsWithOptions = await getAllMcpTools({
				mcpServers: servers,
			});

			const agent = new Agent({
				name: "MCP Assistant with Crypto and Plainly Tools",
				instructions: `
- You must always use the MCP tools to answer questions. The mcp server knows which repo to investigate, so you do not need to ask the user about it.
- Use the available tools to help the user create a video about cryptocurrency data.
- Look for a Crypto projects in Plainly that would be suitable for the user's video, and based on its parameters and data, give the user suggestions on what video to create, if he asks.
- Always use USD, and never suggest other currencies, because there is no currency parameter.
- Always include current price, price change in 24h and 7d, and the date.
- Don't use symbols "$", "%" in the video text, but you can use "+" and "-" for changes.
- Use images from coingecko where possible, but first ask the user if they have specific coin image they want to use.
- Once you submit a video, keep the info about the render job, ask the user if they want to check the video status.
- If there is a failure at any point, don't proceed further, but inform the user about the failure and ask them if they want to try again.
				`,
				tools: allToolsWithOptions,
			});

			const initialInput =
				"Greet yourself to a user and explain who you are. Tell the user that he can quit the session anytime by typing 'exit' or 'quit'.";
			console.log(chalk.blue.bold("🤖 Agent Starting...\n"));
			const result = await run(agent, initialInput, { maxTurns: MAX_TURNS });
			const safeInitialOutput = result.finalOutput ?? "(No response)";
			console.log(safeInitialOutput);

			const history: Array<{
				role: "user" | "assistant";
				content: string;
			}> = [{ role: "assistant", content: safeInitialOutput }];

			while (true) {
				let userInput = "";
				try {
					userInput = await rl.question(chalk.green("🧑 You: "));
				} catch {
					break;
				}

				const trimmed = userInput.trim();
				if (!trimmed) {
					continue;
				}

				if (
					trimmed.toLowerCase() === "exit" ||
					trimmed.toLowerCase() === "quit"
				) {
					break;
				}

				history.push({ role: "user", content: trimmed });
				const prompt = buildConversationPrompt(history);
				const turnResult = await run(agent, prompt, { maxTurns: MAX_TURNS });
				const safeTurnOutput = turnResult.finalOutput ?? "(No response)";
				history.push({ role: "assistant", content: safeTurnOutput });
				console.log(chalk.blueBright("🤖 Agent:"), safeTurnOutput);
			}

			console.log(chalk.blue.bold("\n🤖 Agent session ended."));
		});
	} finally {
		try {
			await Promise.all(servers.map((server) => server.close()));
			console.log(chalk.gray("\n🔌 Closed MCP server connections."));
			rl.close();
		} catch (error) {
			console.error(chalk.red("❌ Error closing MCP servers:"), error);
		}
	}
}

function buildConversationPrompt(
	history: Array<{ role: "user" | "assistant"; content: string }>,
) {
	const lines = history.map((entry) => {
		const label = entry.role === "user" ? "User" : "Assistant";
		return `${label}: ${entry.content}`;
	});
	return [
		"You are in a live conversation with the user. Continue the dialogue and respond to the latest user message.",
		"",
		"Conversation so far:",
		...lines,
		"",
		"Assistant:",
	].join("\n");
}

main().catch((err) => {
	console.error(chalk.red("❌ Unhandled Error:"), err);
	process.exit(1);
});
