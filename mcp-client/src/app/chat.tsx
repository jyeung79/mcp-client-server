import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatSessionStrip } from "@/components/chat/chat-session-strip";
import { ThemedView } from "@/components/themed-view";
import { ClassNames } from "@/constants/theme";
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
    <ThemedView className={ClassNames.screen}>
      <SafeAreaView className={ClassNames.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          className="flex-1"
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
