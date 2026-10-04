import { Agent } from "./agent";

const objective = process.argv.slice(2).join(" ");

if (!objective) {
  console.error("Usage: npm run dev -- \"<your objective here>\"");
  console.error('Example: npm run dev -- "Go to google.com and search for OpenAI"');
  process.exit(1);
}

const agent = new Agent();

agent.run(objective).catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
