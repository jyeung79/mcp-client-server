import { useMemo, useState } from "react";
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ClassNames } from "@/constants/theme";
import type { ConversationSummary } from "@/hooks/use-chat";

interface Props {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  isDisabled?: boolean;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

function shortLabel(conversation: ConversationSummary, index: number): string {
  const base = conversation.title?.trim();
  if (base && base !== "New chat") return base;
  return `Chat ${index + 1}`;
}

export function ChatSessionStrip({
  conversations,
  currentConversationId,
  isDisabled,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === currentConversationId) ||
      null,
    [conversations, currentConversationId]
  );

  const handleStartRename = () => {
    if (!activeConversation || isDisabled) return;
    setRenameDraft(activeConversation.title);
    setIsRenaming(true);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setRenameDraft("");
  };

  const handleSaveRename = () => {
    if (!activeConversation || !renameDraft.trim()) return;
    onRenameConversation(activeConversation.id, renameDraft);
    setIsRenaming(false);
    setRenameDraft("");
  };

  const handleDelete = () => {
    if (!activeConversation || isDisabled) return;

    Alert.alert(
      "Delete conversation?",
      "This will permanently remove all messages in this session.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteConversation(activeConversation.id),
        },
      ]
    );
  };

  return (
    <View className="border-b border-gray-400/40">
      <View className="flex-row items-center gap-2 px-4 pb-1 pt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}>
          {conversations.map((conversation, index) => {
            const isActive = conversation.id === currentConversationId;
            return (
              <TouchableOpacity
                key={conversation.id}
                className={`flex-row items-center gap-1 ${
                  isActive ? ClassNames.chipActive : ClassNames.chip
                }`}
                onPress={() => onSelectConversation(conversation.id)}
                disabled={isDisabled || isRenaming}>
                <ThemedText type="small" className={isActive ? "text-white" : "text-gray-600"}>
                  {shortLabel(conversation, index)}
                </ThemedText>
                <ThemedText
                  type="small"
                  className={isActive ? "text-white/90" : "text-gray-500"}>
                  {conversation.messageCount}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          className={`rounded-full border border-gray-400/40 px-2 py-1 ${
            isDisabled ? "opacity-50" : ""
          }`}
          onPress={onNewConversation}
          disabled={isDisabled || isRenaming}>
          <ThemedText type="small" className="text-primary">
            + New
          </ThemedText>
        </TouchableOpacity>
      </View>

      {activeConversation && !isRenaming && (
        <View className="flex-row gap-2 px-4 pb-2">
          <TouchableOpacity
            className="rounded-lg border border-gray-400/40 px-2 py-1"
            onPress={handleStartRename}
            disabled={isDisabled}>
            <ThemedText type="small" className="text-primary">
              Rename
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-lg border border-gray-400/40 px-2 py-1"
            onPress={handleDelete}
            disabled={isDisabled}>
            <ThemedText type="small" className="text-destructive">
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {activeConversation && isRenaming && (
        <View className="flex-row items-center gap-2 px-4 pb-2">
          <TextInput
            className="h-9 flex-1 rounded-lg border border-gray-400/40 bg-gray-400/10 px-2 text-black"
            value={renameDraft}
            onChangeText={setRenameDraft}
            placeholder="Session name"
            placeholderTextColor="#999"
            autoFocus
            editable={!isDisabled}
          />
          <TouchableOpacity
            className="rounded-lg border border-gray-400/40 px-2 py-1"
            onPress={handleSaveRename}
            disabled={!renameDraft.trim() || isDisabled}>
            <ThemedText type="small" className="text-primary">
              Save
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-lg border border-gray-400/40 px-2 py-1"
            onPress={handleCancelRename}
            disabled={isDisabled}>
            <ThemedText type="small" className="text-gray-600">
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
