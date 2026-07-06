import type { ToolDefinition } from "../ai/adapter.js";
export declare class MCPClient {
    private client;
    private transport;
    private toolsCache;
    constructor(serverUrl: string);
    connect(): Promise<void>;
    getTools(): ToolDefinition[];
    callTool(name: string, args: Record<string, unknown>): Promise<string>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map