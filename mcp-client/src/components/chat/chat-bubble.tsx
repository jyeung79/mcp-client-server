import { View } from "react-native";

import { ChatStreamingText } from "./chat-streaming-text";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ClassNames } from "@/constants/theme";
import type { ChatMessage } from "@/hooks/use-chat";

interface Props {
  message: ChatMessage;
  isStreaming: boolean;
}

export function ChatBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <View className={`px-4 py-1 ${isUser ? "items-end" : "items-start"}`}>
      <ThemedView
        type="backgroundElement"
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser ? "rounded-br bg-primary" : "rounded-bl"
        }`}>
        {isAssistant && message.toolCalls && message.toolCalls.length > 0 && (
          <ThemedView className="mb-2 border-b border-gray-400/40 pb-2">
            {message.toolCalls.map((toolCall) => (
              <ThemedText key={toolCall.id} type="small" themeColor="textSecondary">
                {toolCall.status === "pending"
                  ? `🔧 Calling ${toolCall.name}...`
                  : `✅ ${toolCall.name} complete`}
              </ThemedText>
            ))}
          </ThemedView>
        )}

        {isAssistant ? (
          <ChatStreamingText
            text={message.content}
            isStreaming={isStreaming}
          />
        ) : (
          <ThemedText
            className={`${ClassNames.bodyLineHeight} ${isUser ? "text-white" : ""}`.trim()}>
            {message.content}
          </ThemedText>
        )}
      </ThemedView>
    </View>
  );
}
