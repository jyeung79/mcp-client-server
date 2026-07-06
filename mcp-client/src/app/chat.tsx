import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatSessionStrip } from "@/components/chat/chat-session-strip";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { type AIProvider, useChat } from "@/hooks/use-chat";

export default function ChatScreen() {
  const {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    isLoadingHistory,
    sendMessage,
    switchConversation,
    startNewConversation,
    renameSession,
    deleteSession,
  } = useChat();
  const [provider, setProvider] = useState<AIProvider>("openai");

  const handleSend = (text: string) => {
    sendMessage(text, provider);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
          <ChatSessionStrip
            conversations={conversations}
            currentConversationId={currentConversationId}
            isDisabled={isStreaming || isLoadingHistory}
            onSelectConversation={switchConversation}
            onNewConversation={startNewConversation}
            onRenameConversation={renameSession}
            onDeleteConversation={deleteSession}
          />
          <ChatMessageList messages={messages} isStreaming={isStreaming} />
          <ChatInput
            onSend={handleSend}
            onProviderChange={setProvider}
            provider={provider}
            isStreaming={isStreaming || isLoadingHistory}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
