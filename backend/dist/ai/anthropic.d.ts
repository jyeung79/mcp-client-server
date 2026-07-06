import type { ChatAdapter, ChatMessage, StreamResult, ToolDefinition } from "./adapter.js";
export declare class AnthropicAdapter implements ChatAdapter {
    private client;
    constructor(apiKey: string);
    streamChat(messages: ChatMessage[], tools: ToolDefinition[], onChunk: (text: string) => void): Promise<StreamResult>;
}
//# sourceMappingURL=anthropic.d.ts.map