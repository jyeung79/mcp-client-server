import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
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
    <ThemedView style={styles.container}>
      {/* Provider toggle */}
      <View style={styles.providerRow}>
        <TouchableOpacity
          style={[
            styles.providerBtn,
            provider === "openai" && styles.providerBtnActive,
          ]}
          onPress={() => onProviderChange("openai")}
          disabled={isStreaming}>
          <ThemedText
            type="small"
            style={provider === "openai" && styles.providerTextActive}>
            OpenAI
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.providerBtn,
            provider === "anthropic" && styles.providerBtnActive,
          ]}
          onPress={() => onProviderChange("anthropic")}
          disabled={isStreaming}>
          <ThemedText
            type="small"
            style={provider === "anthropic" && styles.providerTextActive}>
            Anthropic
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
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
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isStreaming}>
          <ThemedText style={styles.sendBtnText}>↑</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.3)",
  },
  providerRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  providerBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
  },
  providerBtnActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  providerTextActive: {
    color: "#ffffff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    fontSize: 16,
    lineHeight: 22,
    backgroundColor: "rgba(128,128,128,0.1)",
    color: "#000",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(0,122,255,0.3)",
  },
  sendBtnText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
