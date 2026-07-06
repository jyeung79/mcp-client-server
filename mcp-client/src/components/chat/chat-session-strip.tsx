import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
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
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}>
          {conversations.map((conversation, index) => {
            const isActive = conversation.id === currentConversationId;
            return (
              <TouchableOpacity
                key={conversation.id}
                style={[styles.sessionChip, isActive && styles.sessionChipActive]}
                onPress={() => onSelectConversation(conversation.id)}
                disabled={isDisabled || isRenaming}>
                <ThemedText
                  type="small"
                  style={isActive ? styles.sessionTextActive : styles.sessionText}>
                  {shortLabel(conversation, index)}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={isActive ? styles.countTextActive : styles.countText}>
                  {conversation.messageCount}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.newBtn, isDisabled && styles.newBtnDisabled]}
          onPress={onNewConversation}
          disabled={isDisabled || isRenaming}>
          <ThemedText type="small" style={styles.newBtnText}>
            + New
          </ThemedText>
        </TouchableOpacity>
      </View>

      {activeConversation && !isRenaming && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleStartRename}
            disabled={isDisabled}>
            <ThemedText type="small" style={styles.actionBtnText}>
              Rename
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDelete}
            disabled={isDisabled}>
            <ThemedText type="small" style={styles.deleteBtnText}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {activeConversation && isRenaming && (
        <View style={styles.renameRow}>
          <TextInput
            style={styles.renameInput}
            value={renameDraft}
            onChangeText={setRenameDraft}
            placeholder="Session name"
            placeholderTextColor="#999"
            autoFocus
            editable={!isDisabled}
          />
          <TouchableOpacity
            style={styles.renameActionBtn}
            onPress={handleSaveRename}
            disabled={!renameDraft.trim() || isDisabled}>
            <ThemedText type="small" style={styles.renameSaveText}>
              Save
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.renameActionBtn}
            onPress={handleCancelRename}
            disabled={isDisabled}>
            <ThemedText type="small" style={styles.renameCancelText}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.3)",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  sessionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  sessionChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  sessionText: {
    color: "#666",
  },
  sessionTextActive: {
    color: "#fff",
  },
  countText: {
    color: "#999",
  },
  countTextActive: {
    color: "rgba(255,255,255,0.9)",
  },
  newBtn: {
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  newBtnDisabled: {
    opacity: 0.5,
  },
  newBtnText: {
    color: "#007AFF",
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  actionBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
  },
  actionBtnText: {
    color: "#007AFF",
  },
  deleteBtnText: {
    color: "#D92D20",
  },
  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  renameInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    backgroundColor: "rgba(128,128,128,0.08)",
    color: "#000",
  },
  renameActionBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.3)",
  },
  renameSaveText: {
    color: "#007AFF",
  },
  renameCancelText: {
    color: "#666",
  },
});
