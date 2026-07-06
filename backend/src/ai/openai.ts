import OpenAI from "openai";
import type {
  ChatAdapter,
  ChatMessage,
  StreamResult,
  ToolDefinition,
} from "./adapter.js";

export class OpenAIAdapter implements ChatAdapter {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async streamChat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    onChunk: (text: string) => void
  ): Promise<StreamResult> {
    const openaiTools = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));

    const stream = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: messages.map((m) => {
        if (m.role === "tool") {
          return {
            role: "tool" as const,
            tool_call_id: m.toolCallId!,
            content: m.content,
          };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
        };
      }),
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      stream: true,
    });

    let fullContent = "";
    const toolCallsMap: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();
    const toolCalls: StreamResult["toolCalls"] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle text content
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }

      // Accumulate tool call deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index;
          if (!toolCallsMap.has(index)) {
            toolCallsMap.set(index, { id: "", name: "", arguments: "" });
          }
          const acc = toolCallsMap.get(index)!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name += tc.function.name;
          if (tc.function?.arguments) acc.arguments += tc.function.arguments;
        }
      }
    }

    // Parse accumulated tool calls
    for (const [, tc] of toolCallsMap) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.arguments);
      } catch {
        parsedArgs = {};
      }
      toolCalls.push({
        id: tc.id,
        name: tc.name,
        arguments: parsedArgs,
      });
    }

    return { content: fullContent, toolCalls };
  }
}
