import "dotenv/config";

export interface Config {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  mcpServerUrl: string;
  port: number;
}

function optionalEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export const config: Config = {
  openaiApiKey: optionalEnv("OPENAI_API_KEY"),
  anthropicApiKey: optionalEnv("ANTHROPIC_API_KEY"),
  mcpServerUrl: process.env["MCP_SERVER_URL"] || "http://localhost:8001/mcp",
  port: parseInt(process.env["PORT"] || "3001", 10),
};
