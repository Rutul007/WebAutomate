# WebAutomate

AI-driven browser automation using **Playwright MCP** + **OpenAI**.

## How it works

1. Launches a Playwright MCP server as a subprocess
2. Connects to it via MCP client and fetches all available browser tools
3. Sends the objective + tools to OpenAI (GPT-4o)
4. LLM decides the next browser action (tool call)
5. Executes the action via MCP, feeds the result back to LLM
6. Loops until objective is complete or max iterations reached

## Project Structure

```
src/
├── config.ts      # Env config
├── mcpClient.ts   # MCP client (connects to Playwright MCP server)
├── llm.ts         # OpenAI client + conversation history
├── agent.ts       # Main orchestration loop
└── index.ts       # Entry point (CLI)
```

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

## Usage

```bash
# Development
npm run dev -- "Go to google.com and search for latest AI news"

# Production
npm run build
npm start -- "Go to amazon.com and find the best rated headphones under $100"
```

## Environment Variables

| Variable        | Default  | Description                        |
|-----------------|----------|------------------------------------|
| OPENAI_API_KEY  | required | Your OpenAI API key                |
| OPENAI_MODEL    | gpt-4o   | OpenAI model to use                |
| MAX_ITERATIONS  | 20       | Max agent loop iterations          |
