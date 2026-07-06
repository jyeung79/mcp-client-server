import { Platform } from "react-native";
import { useCallback, useRef, useState } from "react";

const DEFAULT_BACKEND_BASE_URL = Platform.select({
  android: "http://10.0.2.2:3001",
  default: "http://localhost:3001",
});

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_BASE_URL
);
const BACKEND_URL = `${BACKEND_BASE_URL}/chat`;

export type MessageRole = "user" | "assistant" | "tool";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Tool call indicators shown inline */
  toolCalls?: { id: string; name: string; status: "pending" | "done" }[];
}

export type AIProvider = "openai" | "anthropic";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, provider: AIProvider) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages,
              { role: "user", content: text },
            ].map((m) => ({ role: m.role, content: m.content })),
            provider,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const event = JSON.parse(line);

              switch (event.type) {
                case "text":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: m.content + event.content }
                        : m
                    )
                  );
                  break;

                case "tool_call":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? {
                            ...m,
                            toolCalls: [
                              ...(m.toolCalls || []),
                              {
                                id: event.id,
                                name: event.name,
                                status: "pending",
                              },
                            ],
                          }
                        : m
                    )
                  );
                  break;

                case "tool_result":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id && m.toolCalls
                        ? {
                            ...m,
                            toolCalls: m.toolCalls.map((tc) =>
                              tc.id === event.id ? { ...tc, status: "done" } : tc
                            ),
                          }
                        : m
                    )
                  );
                  break;

                case "error":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: `Error: ${event.message}` }
                        : m
                    )
                  );
                  break;

                case "done":
                  // Stream complete
                  break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    content: `Error: ${(error as Error).message}`,
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, cancelStream, clearMessages };
}
