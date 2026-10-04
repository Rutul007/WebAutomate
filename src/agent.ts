import { McpClient, type McpTool } from "./mcpClient";
import { LlmClient } from "./llm";
import { config } from "./config";
import type { Tool } from "openai/resources/responses/responses.js";

export class Agent {
  private mcp: McpClient;
  private llm: LlmClient;

  constructor() {
    this.mcp = new McpClient();
    this.llm = new LlmClient();
  }

  async run(objective: string): Promise<void> {
    console.log(`\n[Agent] Objective: ${objective}\n`);

    await this.mcp.connect();

    const mcpTools: McpTool[] = await this.mcp.listTools();
    const openAITools: Tool[] = this.mcp.toOpenAITools(mcpTools);
    console.log(`[Agent] Loaded ${mcpTools.length} tools from MCP\n`);

    this.llm.setObjective(objective);

    let iteration = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (iteration < config.maxIterations) {
      iteration++;
      console.log(`[Agent] --- Iteration ${iteration}/${config.maxIterations} ---`);

      const response = await this.llm.getNextAction(openAITools);

      totalInputTokens += response.usage.inputTokens;
      totalOutputTokens += response.usage.outputTokens;
      console.log(`[Tokens] Input: ${response.usage.inputTokens} | Output: ${response.usage.outputTokens}`);

      if (response.message) {
        console.log(`[LLM] ${response.message}`);
      }

      if (response.isDone || response.toolCalls.length === 0) {
        console.log("\n[Agent] Objective completed.");
        break;
      }

      for (const toolCall of response.toolCalls) {
        console.log(`[Tool] Calling: ${toolCall.name}`, toolCall.args);

        const result = await this.mcp.callTool(toolCall.name, toolCall.args);
        console.log(`[Tool] Result: ${result.slice(0, 300)}${result.length > 300 ? "..." : ""}\n`);

        this.llm.addToolResult(toolCall.id, result);
      }
    }

    if (iteration >= config.maxIterations) {
      console.log(`\n[Agent] Max iterations (${config.maxIterations}) reached. Stopping.`);
    }

    console.log(`\n[Tokens] Total Input: ${totalInputTokens} | Total Output: ${totalOutputTokens} | Total: ${totalInputTokens + totalOutputTokens}`);

    await this.mcp.disconnect();
  }
}
