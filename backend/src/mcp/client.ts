import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ToolDefinition } from "../ai/adapter.js";

export class MCPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;
  private toolsCache: ToolDefinition[] = [];

  constructor(serverUrl: string) {
    this.transport = new StreamableHTTPClientTransport(
      new URL(serverUrl)
    );
    this.client = new Client(
      { name: "mcp-chat-backend", version: "1.0.0" },
      { capabilities: {} }
    );
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.log("[MCP] Connected to MCP server");

      // Discover tools
      const toolsResult = await this.client.listTools();
      this.toolsCache = toolsResult.tools.map((t) => ({
        name: t.name,
        description: t.description || "",
        inputSchema: t.inputSchema as Record<string, unknown>,
      }));
      console.log(
        `[MCP] Discovered ${this.toolsCache.length} tools:`,
        this.toolsCache.map((t) => t.name).join(", ")
      );
    } catch (error) {
      console.error("[MCP] Failed to connect:", error);
      throw error;
    }
  }

  getTools(): ToolDefinition[] {
    return this.toolsCache;
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    try {
      const result = await this.client.callTool({ name, arguments: args });
      // Extract text content from the result
      if (result.content && Array.isArray(result.content)) {
        return result.content
          .map((c) => {
            if (c.type === "text") return c.text;
            return JSON.stringify(c);
          })
          .join("\n");
      }
      return JSON.stringify(result.content);
    } catch (error) {
      console.error(`[MCP] Tool call "${name}" failed:`, error);
      return `Error calling tool "${name}": ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }
}
