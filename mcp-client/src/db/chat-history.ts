import type { SQLiteDatabase } from "expo-sqlite";

import type { ChatMessage } from "@/hooks/use-chat";

const DATABASE_VERSION = 1;

interface ChatMessageRow {
  id: string;
  role: ChatMessage["role"];
  content: string;
  tool_calls_json: string | null;
  created_at: number;
}

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

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls_json TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
      ON chat_messages(created_at);
    `);

    currentVersion = 1;
  }

  if (currentVersion < DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}

export async function loadPersistedMessages(
  db: SQLiteDatabase
): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<ChatMessageRow>(
    "SELECT id, role, content, tool_calls_json, created_at FROM chat_messages ORDER BY created_at ASC, id ASC"
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
  messages: ChatMessage[]
): Promise<void> {
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    for (const [index, message] of messages.entries()) {
      await db.runAsync(
        `INSERT OR REPLACE INTO chat_messages (id, role, content, tool_calls_json, created_at)
         VALUES (?, ?, ?, ?, ?)` ,
        message.id,
        message.role,
        message.content,
        message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        now + index
      );
    }
  });
}

export async function clearPersistedMessages(db: SQLiteDatabase): Promise<void> {
  await db.runAsync("DELETE FROM chat_messages");
}
