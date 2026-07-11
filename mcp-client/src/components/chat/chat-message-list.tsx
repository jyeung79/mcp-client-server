import { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";

import { ChatBubble } from "./chat-bubble";
import type { ChatMessage } from "@/hooks/use-chat";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatMessageList({ messages, isStreaming }: Props) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return <View className="flex-1" />;
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <ChatBubble
          message={item}
          isStreaming={
            isStreaming &&
            item.role === "assistant" &&
            index === messages.length - 1
          }
        />
      )}
      contentContainerStyle={{ paddingVertical: 8 }}
      onContentSizeChange={() =>
        listRef.current?.scrollToEnd({ animated: false })
      }
    />
  );
}
