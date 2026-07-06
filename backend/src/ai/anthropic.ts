import Anthropic from "@anthropic-ai/sdk";
import type {
  ChatAdapter,
  ChatMessage,
  StreamResult,
  ToolDefinition,
} from "./adapter.js";

export class AnthropicAdapter implements ChatAdapter {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async streamChat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    onChunk: (text: string) => void
  ): Promise<StreamResult> {
    // Convert our unified messages to Anthropic format
    const chatMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === "user") {
        chatMessages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        chatMessages.push({ role: "assistant", content: msg.content });
      } else if (msg.role === "tool") {
        chatMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId!,
              content: msg.content,
            },
          ],
        });
      }
    }

    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));

    const stream = this.client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: chatMessages,
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    });

    stream.on("text", (text) => {
      onChunk(text);
    });

    const finalMessage = await stream.finalMessage();

    // Extract text content
    const textBlocks = finalMessage.content.filter((c) => c.type === "text");
    const fullContent = textBlocks.map((b) => b.text).join("");

    // Extract tool calls
    const toolBlocks = finalMessage.content.filter(
      (c) => c.type === "tool_use"
    );

    const toolCalls: StreamResult["toolCalls"] = toolBlocks.map((block) => {
      const toolUse = block as Anthropic.ToolUseBlock;
      return {
        id: toolUse.id,
        name: toolUse.name,
        arguments: toolUse.input as Record<string, unknown>,
      };
    });

    return { content: fullContent, toolCalls };
  }
}
