import { Platform } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  clearPersistedMessages,
  createConversation,
  deleteConversation,
  ensureConversationExists,
  loadConversations,
  loadPersistedMessages,
  persistMessages,
  renameConversation,
} from "@/db/chat-history";

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

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export type AIProvider = "openai" | "anthropic";

function generateMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const refreshConversations = useCallback(async () => {
    const items = await loadConversations(db);
    setConversations(items);
    return items;
  }, [db]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      setIsLoadingHistory(true);

      try {
        let items = await refreshConversations();

        if (items.length === 0) {
          const initialConversation = await createConversation(db, "New chat");
          items = [initialConversation];
          setConversations(items);
        }

        const active = items[0];
        const persistedMessages = await loadPersistedMessages(db, active.id);

        if (!isMounted) return;

        setCurrentConversationId(active.id);
        setMessages(persistedMessages);
      } catch (error) {
        console.warn("[Chat] Failed to load persisted history", error);
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [db, refreshConversations]);

  const switchConversation = useCallback(
    async (conversationId: string) => {
      if (isStreaming || conversationId === currentConversationId) return;

      setIsLoadingHistory(true);
      try {
        const exists = await ensureConversationExists(db, conversationId);
        if (!exists) return;

        const persistedMessages = await loadPersistedMessages(db, conversationId);
        setCurrentConversationId(conversationId);
        setMessages(persistedMessages);
      } catch (error) {
        console.warn("[Chat] Failed to switch conversation", error);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [currentConversationId, db, isStreaming]
  );

  const startNewConversation = useCallback(async () => {
    if (isStreaming) return;

    try {
      const created = await createConversation(db, "New chat");
      setConversations((prev) => [created, ...prev]);
      setCurrentConversationId(created.id);
      setMessages([]);
    } catch (error) {
      console.warn("[Chat] Failed to create conversation", error);
    }
  }, [db, isStreaming]);

  const renameSession = useCallback(
    async (conversationId: string, title: string) => {
      if (isStreaming) return;

      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      try {
        await renameConversation(db, conversationId, trimmedTitle);
        await refreshConversations();
      } catch (error) {
        console.warn("[Chat] Failed to rename conversation", error);
      }
    },
    [db, isStreaming, refreshConversations]
  );

  const deleteSession = useCallback(
    async (conversationId: string) => {
      if (isStreaming) return;

      setIsLoadingHistory(true);
      try {
        await deleteConversation(db, conversationId);

        let items = await refreshConversations();
        if (items.length === 0) {
          const created = await createConversation(db, "New chat");
          items = [created];
          setConversations(items);
        }

        const currentStillExists =
          currentConversationId &&
          items.some((item) => item.id === currentConversationId);

        if (!currentStillExists) {
          const fallback = items[0];
          setCurrentConversationId(fallback.id);
          const persistedMessages = await loadPersistedMessages(db, fallback.id);
          setMessages(persistedMessages);
        }
      } catch (error) {
        console.warn("[Chat] Failed to delete conversation", error);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [currentConversationId, db, isStreaming, refreshConversations]
  );

  const sendMessage = useCallback(
    async (text: string, provider: AIProvider) => {
      if (
        !text.trim() ||
        isStreaming ||
        isLoadingHistory ||
        !currentConversationId
      ) {
        return;
      }

      const userMsg: ChatMessage = {
        id: generateMessageId("user"),
        role: "user",
        content: text,
      };

      const assistantMsg: ChatMessage = {
        id: generateMessageId("assistant"),
        role: "assistant",
        content: "",
      };

      const assistantMsgFinal: ChatMessage = {
        ...assistantMsg,
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

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const event = JSON.parse(line);

              switch (event.type) {
                case "text":
                  assistantMsgFinal.content += event.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: m.content + event.content }
                        : m
                    )
                  );
                  break;

                case "tool_call":
                  assistantMsgFinal.toolCalls = [
                    ...(assistantMsgFinal.toolCalls || []),
                    {
                      id: event.id,
                      name: event.name,
                      status: "pending",
                    },
                  ];
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
                  assistantMsgFinal.toolCalls = (
                    assistantMsgFinal.toolCalls || []
                  ).map((tc) =>
                    tc.id === event.id ? { ...tc, status: "done" } : tc
                  );
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
                  assistantMsgFinal.content = `Error: ${event.message}`;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: `Error: ${event.message}` }
                        : m
                    )
                  );
                  break;

                case "done":
                  break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          assistantMsgFinal.content = `Error: ${(error as Error).message}`;
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
        try {
          await persistMessages(db, currentConversationId, [
            userMsg,
            assistantMsgFinal,
          ]);
          await refreshConversations();
        } catch (error) {
          console.warn("[Chat] Failed to persist chat turn", error);
        }

        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      currentConversationId,
      db,
      isLoadingHistory,
      isStreaming,
      messages,
      refreshConversations,
    ]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    if (!currentConversationId) return;

    const clear = async () => {
      setMessages([]);
      try {
        await clearPersistedMessages(db, currentConversationId);
        await refreshConversations();
      } catch (error) {
        console.warn("[Chat] Failed to clear persisted history", error);
      }
    };

    void clear();
  }, [currentConversationId, db, refreshConversations]);

  return {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    isLoadingHistory,
    sendMessage,
    cancelStream,
    clearMessages,
    switchConversation,
    startNewConversation,
    renameSession,
    deleteSession,
  };
}
