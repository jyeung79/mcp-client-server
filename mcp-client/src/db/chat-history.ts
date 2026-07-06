import type { SQLiteDatabase } from "expo-sqlite";

import type { ChatMessage, ConversationSummary } from "@/hooks/use-chat";

const DATABASE_VERSION = 2;

interface ChatMessageRow {
  id: string;
  role: ChatMessage["role"];
  content: string;
  tool_calls_json: string | null;
}

interface ConversationRow {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count: number;
}

const MIGRATION_CONVERSATION_ID = "conv-migrated-default";

function parseToolCalls(
  toolCallsJson: string | null
): ChatMessage["toolCalls"] | undefined {
  if (!toolCallsJson) return undefined;

  try {
    return JSON.parse(toolCallsJson) as ChatMessage["toolCalls"];
  } catch {
    return undefined;
  }
}

function mapConversationRow(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: row.message_count,
  };
}

export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const originalVersion = result?.user_version ?? 0;
  let currentVersion = originalVersion;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls_json TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
      ON conversations(updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created_at
      ON chat_messages(conversation_id, created_at);
    `);

    currentVersion = 2;
  }

  if (currentVersion === 1) {
    const now = Date.now();

    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      ALTER TABLE chat_messages ADD COLUMN conversation_id TEXT;
    `);

    await db.runAsync(
      `INSERT OR IGNORE INTO conversations (id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      MIGRATION_CONVERSATION_ID,
      "Migrated chat",
      now,
      now
    );

    await db.runAsync(
      `UPDATE chat_messages
       SET conversation_id = ?
       WHERE conversation_id IS NULL`,
      MIGRATION_CONVERSATION_ID
    );

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
      ON conversations(updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created_at
      ON chat_messages(conversation_id, created_at);
    `);

    currentVersion = 2;
  }

  if (originalVersion !== DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}

export async function loadConversations(
  db: SQLiteDatabase
): Promise<ConversationSummary[]> {
  const rows = await db.getAllAsync<ConversationRow>(`
    SELECT
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      COUNT(m.id) as message_count
    FROM conversations c
    LEFT JOIN chat_messages m ON m.conversation_id = c.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC, c.created_at DESC
  `);

  return rows.map(mapConversationRow);
}

export async function createConversation(
  db: SQLiteDatabase,
  title?: string
): Promise<ConversationSummary> {
  const now = Date.now();
  const id = generateConversationId();

  await db.runAsync(
    `INSERT INTO conversations (id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    id,
    title || "New chat",
    now,
    now
  );

  return {
    id,
    title: title || "New chat",
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };
}

export async function touchConversation(
  db: SQLiteDatabase,
  conversationId: string
): Promise<void> {
  await db.runAsync(
    `UPDATE conversations
     SET updated_at = ?
     WHERE id = ?`,
    Date.now(),
    conversationId
  );
}

export async function renameConversation(
  db: SQLiteDatabase,
  conversationId: string,
  title: string
): Promise<void> {
  await db.runAsync(
    `UPDATE conversations
     SET title = ?, updated_at = ?
     WHERE id = ?`,
    title,
    Date.now(),
    conversationId
  );
}

export async function deleteConversation(
  db: SQLiteDatabase,
  conversationId: string
): Promise<void> {
  await db.runAsync(`DELETE FROM conversations WHERE id = ?`, conversationId);
}

export async function ensureConversationExists(
  db: SQLiteDatabase,
  conversationId: string
): Promise<boolean> {
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM conversations WHERE id = ? LIMIT 1`,
    conversationId
  );

  return !!row?.id;
}

export async function loadPersistedMessages(
  db: SQLiteDatabase,
  conversationId: string
): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<ChatMessageRow>(
    `SELECT id, role, content, tool_calls_json
     FROM chat_messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC, id ASC`,
    conversationId
  );

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    toolCalls: parseToolCalls(row.tool_calls_json),
  }));
}

export async function persistMessages(
  db: SQLiteDatabase,
  conversationId: string,
  messages: ChatMessage[]
): Promise<void> {
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    for (const [index, message] of messages.entries()) {
      await db.runAsync(
        `INSERT OR REPLACE INTO chat_messages (id, conversation_id, role, content, tool_calls_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        message.id,
        conversationId,
        message.role,
        message.content,
        message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        now + index
      );
    }

    await db.runAsync(
      `UPDATE conversations
       SET updated_at = ?
       WHERE id = ?`,
      now,
      conversationId
    );
  });
}

export async function clearPersistedMessages(
  db: SQLiteDatabase,
  conversationId: string
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM chat_messages WHERE conversation_id = ?`,
      conversationId
    );

    await db.runAsync(
      `UPDATE conversations
       SET updated_at = ?
       WHERE id = ?`,
      Date.now(),
      conversationId
    );
  });
}
