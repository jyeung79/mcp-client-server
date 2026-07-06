import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { MCPClient } from "./mcp/client.js";
import { createChatRouter } from "./routes/chat.js";
async function main() {
    // Connect to MCP server
    const mcpClient = new MCPClient(config.mcpServerUrl);
    try {
        await mcpClient.connect();
        console.log("[Server] MCP client connected successfully");
    }
    catch (error) {
        console.error("[Server] Failed to connect to MCP server. The server will start but tool calls will fail.", error);
    }
    // Create Express app
    const app = express();
    // Middleware
    app.use(cors());
    app.use(express.json());
    // Health check
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            mcpConnected: mcpClient.getTools().length > 0,
            toolsAvailable: mcpClient.getTools().length,
        });
    });
    // Chat routes
    app.use("/chat", createChatRouter(mcpClient));
    // Start server
    app.listen(config.port, () => {
        console.log(`[Server] Backend running on http://localhost:${config.port}`);
        console.log(`[Server] Chat endpoint: POST http://localhost:${config.port}/chat`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        console.log("\n[Server] Shutting down...");
        await mcpClient.disconnect();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch((error) => {
    console.error("[Server] Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map