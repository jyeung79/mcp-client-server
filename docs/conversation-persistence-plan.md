# Conversation Persistence Plan (React Native + Expo SQLite)

## Goal

Persist chat history locally on-device in the Expo app so messages survive app restarts.

## Reviewed, Common Expo Approach

The most common and recommended Expo implementation is:

1. Install `expo-sqlite` using `npx expo install expo-sqlite`
2. Wrap app with `SQLiteProvider`
3. Use `onInit` to run schema migration(s)
4. Access database from hooks/components with `useSQLiteContext()`
5. Use async methods (`runAsync`, `getAllAsync`, `withTransactionAsync`) for CRUD

This follows Expo docs for SDK 57 and keeps dependency versions aligned with Expo.

## Expo-specific Tools/Skills Used

- **Expo library installation workflow**: `expo install` (via MCP Expo add-library tool)
- **`SQLiteProvider` + `useSQLiteContext`** for app-wide DB access
- **Migration pattern** using `PRAGMA user_version`
- **WAL mode** (`PRAGMA journal_mode = WAL`) for better write/read behavior
- **expo-sqlite DevTools inspector** (available during development)

## Step-by-Step Implementation Plan

### Phase 1: Data model + migration

- Create `chat_messages` table:
  - `id TEXT PRIMARY KEY`
  - `role TEXT`
  - `content TEXT`
  - `tool_calls_json TEXT NULL`
  - `created_at INTEGER`
- Add index on `created_at`
- Add migration versioning with `PRAGMA user_version`

### Phase 2: Persistence repository

Create DB helper functions:

- `loadPersistedMessages(db)`
- `persistMessages(db, messages)`
- `clearPersistedMessages(db)`

### Phase 3: App wiring

- Wrap root layout in `SQLiteProvider` and run migration in `onInit`
- Update `useChat` to:
  - hydrate messages on mount
  - persist user+assistant turn after stream completes
  - clear DB when clearing messages

### Phase 4: Validation and DX

- Type-check and diagnostics for changed files
- Update docs/roadmap to mark feature status
- Provide run instructions and verification notes

## Review Notes / Tradeoffs

- Persisting each full turn (not each chunk) reduces DB write frequency.
- Mid-stream app kills may lose partial assistant content; acceptable for v1 persistence.
- Current schema is single-thread chat history. Multi-session support can be added later with `conversation_id`.

## Future Enhancements

- Add `conversation_id` and `conversations` table for multiple sessions
- Save streaming chunks incrementally for crash resilience
- Add retention controls and message pruning
- Optional encryption (SQLCipher) for sensitive local data
