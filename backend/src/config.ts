import "dotenv/config";

export interface Config {
  openaiApiKey: string;
  anthropicApiKey: string;
  mcpServerUrl: string;
  port: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
  mcpServerUrl: process.env["MCP_SERVER_URL"] || "http://localhost:8001/mcp",
  port: parseInt(process.env["PORT"] || "3001", 10),
};
