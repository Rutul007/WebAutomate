import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
  maxIterations: parseInt(process.env.MAX_ITERATIONS ?? "20", 10),
  openaiBaseUrl: process.env.OPENAI_API_BASE_URL,
};
