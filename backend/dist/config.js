import "dotenv/config";
function optionalEnv(key) {
    const value = process.env[key]?.trim();
    return value ? value : undefined;
}
export const config = {
    openaiApiKey: optionalEnv("OPENAI_API_KEY"),
    anthropicApiKey: optionalEnv("ANTHROPIC_API_KEY"),
    mcpServerUrl: process.env["MCP_SERVER_URL"] || "http://localhost:8001/mcp",
    port: parseInt(process.env["PORT"] || "3001", 10),
};
//# sourceMappingURL=config.js.map