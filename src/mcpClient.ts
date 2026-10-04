import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "openai/resources/responses/responses.js";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class McpClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor() {
    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["@playwright/mcp@latest"],
    });

    this.client = new Client({ name: "web-automate", version: "1.0.0" });
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
    console.log("[MCP] Connected to Playwright MCP server");
  }

  async listTools(): Promise<McpTool[]> {
    const response = await this.client.listTools();
    return response.tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: t.inputSchema as Record<string, unknown>,
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const result = await this.client.callTool({ name, arguments: args });

    const contents = result.content as Array<{ type: string; text?: string }>;
    return contents
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n");
  }

  toOpenAITools(tools: McpTool[]): Tool[] {
    return tools.map((t) => ({
      type: "function" as const,
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
      strict: false,
    }));
  }

  async disconnect(): Promise<void> {
    await this.transport.close();
    console.log("[MCP] Disconnected");
  }
}
