import type { ChatAdapter, ChatMessage, StreamResult, ToolDefinition } from "./adapter.js";
export declare class OpenAIAdapter implements ChatAdapter {
    private client;
    constructor(apiKey: string);
    streamChat(messages: ChatMessage[], tools: ToolDefinition[], onChunk: (text: string) => void): Promise<StreamResult>;
}
//# sourceMappingURL=openai.d.ts.map