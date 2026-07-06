import { StyleSheet, View } from "react-native";

import { ChatStreamingText } from "./chat-streaming-text";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { ChatMessage } from "@/hooks/use-chat";

interface Props {
  message: ChatMessage;
  isStreaming: boolean;
}

export function ChatBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.rowRight : styles.rowLeft,
      ]}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}>
        {isAssistant && message.toolCall && (
          <ThemedView style={styles.toolCall}>
            <ThemedText type="small" themeColor="textSecondary">
              {message.toolCall.status === "pending"
                ? `🔧 Calling ${message.toolCall.name}...`
                : `✅ ${message.toolCall.name} complete`}
            </ThemedText>
          </ThemedView>
        )}

        {isAssistant ? (
          <ChatStreamingText
            text={message.content}
            isStreaming={isStreaming}
          />
        ) : (
          <ThemedText style={styles.text}>{message.content}</ThemedText>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  bubbleUser: {
    borderBottomRightRadius: Spacing.one,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: Spacing.one,
  },
  toolCall: {
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.3)",
  },
  text: {
    lineHeight: 22,
  },
});
