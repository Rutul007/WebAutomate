import OpenAI from "openai";
import type { Tool } from "openai/resources/responses/responses.js";
import { config } from "./config";

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LlmResponse {
  message: string | null;
  toolCalls: ToolCall[];
  isDone: boolean;
  usage: TokenUsage;
}

type ConversationItem = OpenAI.Responses.ResponseInputItem;

export class LlmClient {
  private openai: OpenAI;
  private history: ConversationItem[] = [];

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey, baseURL: config.openaiBaseUrl });
  }

  setObjective(objective: string): void {
    this.history = [
      {
        role: "user",
        content: objective,
      },
    ];
  }

  async getNextAction(tools: Tool[]): Promise<LlmResponse> {
    const response = await this.openai.responses.create({
      model: config.openaiModel,
      input: this.history,
      tools,
      instructions: SYSTEM_PROMPT,
    });

    // Add assistant response to history
    this.history.push(...response.output);

    const toolCalls: ToolCall[] = [];
    let message: string | null = null;

    for (const item of response.output) {
      if (item.type === "function_call") {
        toolCalls.push({
          id: item.call_id,
          name: item.name,
          args: JSON.parse(item.arguments) as Record<string, unknown>,
        });
      } else if (item.type === "message") {
        const textContent = item.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          message = textContent.text;
        }
      }
    }

    const isDone =
      toolCalls.length === 0 &&
      message !== null &&
      response.output_text?.toLowerCase().includes("objective") === false;

    const usage: TokenUsage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };

    return { message, toolCalls, isDone, usage };
  }

  addToolResult(toolCallId: string, result: string): void {
    this.history.push({
      type: "function_call_output",
      call_id: toolCallId,
      output: result,
    });
  }
}

const SYSTEM_PROMPT = `You are a browser automation agent. You have access to Playwright browser tools.

Your job:
1. Analyze the user's objective
2. Use the available browser tools step-by-step to accomplish it
3. After each tool result, decide the next action
4. When the objective is fully completed, respond with a plain message summarizing what was done — do NOT call any more tools

Rules:
- Always take one action at a time
- If a page needs to load, use a screenshot or wait tool to verify state before proceeding
- Be precise with selectors and inputs
- If you encounter an error, try an alternative approach`;
