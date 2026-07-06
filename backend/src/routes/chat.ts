import { Router, type Request, type Response } from "express";
import { createAdapter, type ChatMessage } from "../ai/adapter.js";
import { config } from "../config.js";
import type { MCPClient } from "../mcp/client.js";

export function createChatRouter(mcpClient: MCPClient): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const { messages, provider } = req.body as {
      messages: ChatMessage[];
      provider: string;
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const aiProvider = provider === "anthropic" ? "anthropic" : "openai";
    const apiKey =
      aiProvider === "openai" ? config.openaiApiKey : config.anthropicApiKey;

    if (!apiKey) {
      res.status(400).json({
        error: `Missing API key for provider \"${aiProvider}\". Set ${
          aiProvider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"
        }.`,
      });
      return;
    }

    // Set up Streamable HTTP response with NDJSON
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const write = (event: Record<string, unknown>) => {
      res.write(JSON.stringify(event) + "\n");
    };

    try {
      const adapter = createAdapter(aiProvider, apiKey);
      const tools = mcpClient.getTools();

      // Build conversation history (will grow with tool calls)
      const conversation: ChatMessage[] = [...messages];

      // Tool-calling loop (max 5 iterations to prevent infinite loops)
      const MAX_ITERATIONS = 5;
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = await adapter.streamChat(
          conversation,
          tools,
          (text: string) => {
            write({ type: "text", content: text });
          }
        );

        // No tool calls — AI is done, just add the assistant message
        if (result.toolCalls.length === 0) {
          if (result.content) {
            conversation.push({ role: "assistant", content: result.content });
          }
          break;
        }

        // Build assistant message and preserve tool-call metadata for
        // provider replay semantics (especially OpenAI).
        conversation.push({
          role: "assistant",
          content: result.content || "",
          assistantToolCalls: result.toolCalls,
        });

        // Execute each tool call
        for (const toolCall of result.toolCalls) {
          write({
            type: "tool_call",
            id: toolCall.id,
            name: toolCall.name,
            arguments: toolCall.arguments,
          });

          const toolResult = await mcpClient.callTool(
            toolCall.name,
            toolCall.arguments
          );

          write({
            type: "tool_result",
            id: toolCall.id,
            name: toolCall.name,
            content: toolResult,
          });

          // Add tool result to conversation
          conversation.push({
            role: "tool",
            content: toolResult,
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
        }
      }

      write({ type: "done" });
    } catch (error) {
      console.error("[Chat] Error:", error);
      write({
        type: "error",
        message:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
      write({ type: "done" });
    } finally {
      res.end();
    }
  });

  return router;
}
