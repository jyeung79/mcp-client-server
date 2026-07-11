import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { AIProvider } from "@/hooks/use-chat";

interface Props {
  onSend: (text: string) => void;
  onProviderChange: (provider: AIProvider) => void;
  provider: AIProvider;
  isStreaming: boolean;
}

export function ChatInput({
  onSend,
  onProviderChange,
  provider,
  isStreaming,
}: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  const handleSubmitEditing = (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => {
    handleSend();
  };

  return (
    <ThemedView className="border-t border-gray-400/40 px-4 pb-4 pt-2">
      {/* Provider toggle */}
      <View className="mb-2 flex-row gap-2">
        <TouchableOpacity
          className={`rounded-lg border px-2 py-1 ${
            provider === "openai" ? "border-primary bg-primary" : "border-gray-400/40"
          }`}
          onPress={() => onProviderChange("openai")}
          disabled={isStreaming}>
          <ThemedText type="small" className={provider === "openai" ? "text-white" : ""}>
            OpenAI
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          className={`rounded-lg border px-2 py-1 ${
            provider === "anthropic" ? "border-primary bg-primary" : "border-gray-400/40"
          }`}
          onPress={() => onProviderChange("anthropic")}
          disabled={isStreaming}>
          <ThemedText
            type="small"
            className={provider === "anthropic" ? "text-white" : ""}>
            Anthropic
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Input row */}
      <View className="flex-row items-end gap-2">
        <TextInput
          className="max-h-[120px] min-h-10 flex-1 rounded-3xl bg-gray-400/10 px-4 py-2 text-base leading-6 text-black"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmitEditing}
          placeholder="Ask about weather..."
          placeholderTextColor="#999"
          multiline
          editable={!isStreaming}
          returnKeyType="send"
        />
        <TouchableOpacity
          className={`h-10 w-10 items-center justify-center rounded-full ${
            input.trim() ? "bg-primary" : "bg-primary/40"
          }`}
          onPress={handleSend}
          disabled={!input.trim() || isStreaming}>
          <ThemedText className="text-[20px] font-bold text-white">↑</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
