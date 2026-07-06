export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
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
  streamChat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    onChunk: (text: string) => void
  ): Promise<StreamResult>;
}

export type AIProvider = "openai" | "anthropic";

/**
 * Factory to create the appropriate AI adapter.
 */
export function createAdapter(
  provider: AIProvider,
  apiKey: string
): ChatAdapter {
  switch (provider) {
    case "openai":
      return createOpenAIAdapter(apiKey);
    case "anthropic":
      return createAnthropicAdapter(apiKey);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported provider: ${_exhaustive}`);
    }
  }
}

// Lazy imports to avoid loading unused SDKs
function createOpenAIAdapter(apiKey: string): ChatAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OpenAIAdapter } = require("./openai.js") as typeof import("./openai.js");
  return new OpenAIAdapter(apiKey);
}

function createAnthropicAdapter(apiKey: string): ChatAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AnthropicAdapter } = require("./anthropic.js") as typeof import("./anthropic.js");
  return new AnthropicAdapter(apiKey);
}
