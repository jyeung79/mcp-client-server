export interface ChatMessage {
    role: "user" | "assistant" | "tool";
    content: string;
    toolCallId?: string;
    name?: string;
    /**
     * Provider-level assistant tool calls emitted in the previous turn.
     * Required for OpenAI conversation replay semantics.
     */
    assistantToolCalls?: ToolCall[];
}
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface StreamResult {
    /** Accumulated full text from the assistant (may be empty if only tool calls) */
    content: string;
    /** Tool calls requested by the AI, if any */
    toolCalls: ToolCall[];
}
export interface ChatAdapter {
    /**
     * Stream a chat completion. Calls onChunk for each text delta,
     * and returns the full result including any tool calls.
     */
    streamChat(messages: ChatMessage[], tools: ToolDefinition[], onChunk: (text: string) => void): Promise<StreamResult>;
}
export type AIProvider = "openai" | "anthropic";
/**
 * Factory to create the appropriate AI adapter.
 */
export declare function createAdapter(provider: AIProvider, apiKey: string): ChatAdapter;
//# sourceMappingURL=adapter.d.ts.map