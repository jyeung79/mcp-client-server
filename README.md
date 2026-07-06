# mcp-client-server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/python-%3E%3D3.11-blue)](mcp-server/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-green)](backend/)
[![Expo SDK](https://img.shields.io/badge/expo--sdk-57-blue)](mcp-client/)

A full-stack AI chat application demonstrating **Model Context Protocol (MCP)** integration. An Expo mobile app with an AI chat interface connects through a thin proxy backend that orchestrates multi-provider AI (OpenAI, Anthropic) with tool-calling — all backed by a Python MCP server exposing real-world weather tools via Streamable HTTP.

## Architecture

```
 POST /chat (NDJSON stream)              Streamable HTTP (JSON-RPC)
┌──────────────────────┐    ┌──────────────────────────┐    ┌─────────────────────┐
│    Expo App (RN)     │    │    Proxy Backend          │    │    MCP Server       │
│                      │    │    (Node.js / Express)    │    │    (Python /        │
│  • Chat UI           │◄──►│                            │◄──►│     FastMCP)        │
│  • Streaming text    │    │  • AI Adapter (OpenAI /   │    │                     │
│  • Provider toggle   │    │    Anthropic)             │    │  • get_alerts()     │
│  • NDJSON parsing    │    │  • Tool-calling loop      │    │  • get_forecast()   │
│                      │    │  • MCP Streamable HTTP    │    │                     │
│  Port: expo          │    │    client                 │    │  Port: 8001         │
│                      │    │                            │    │                     │
│                      │    │  Port: 3001               │    │                     │
└──────────────────────┘    └──────────────────────────┘    └─────────────────────┘
```

### How it works

1. **User** sends a message in the chat UI — e.g., *"What's the weather in San Francisco?"*
2. **Expo app** sends the conversation to the proxy backend via `POST /chat`
3. **Backend** streams the request to the chosen AI provider (OpenAI or Anthropic)
4. **AI** decides to call a tool (e.g., `get_forecast`) and returns a tool-use block
5. **Backend** invokes the tool through the MCP client → Python MCP server → NWS API
6. **Backend** feeds the tool result back to the AI, which generates the final answer
7. **App** renders the response as it streams in, line by line, with tool-call status indicators

## Project Structure

```
mcp-client-server/
├── mcp-server/                 # Python MCP server (FastMCP + Streamable HTTP)
│   ├── weather.py              #   MCP tools: get_alerts, get_forecast
│   ├── pyproject.toml          #   Python project config + dependencies
│   └── .venv/                  #   Virtual environment (gitignored)
│
├── backend/                    # Node.js proxy backend (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts            #   Express entry point, health check, lifecycle
│   │   ├── config.ts           #   Environment config (API keys, URLs)
│   │   ├── ai/
│   │   │   ├── adapter.ts      #   ChatAdapter interface + factory
│   │   │   ├── openai.ts       #   OpenAI streaming adapter (GPT-4o)
│   │   │   └── anthropic.ts    #   Anthropic streaming adapter (Claude)
│   │   ├── mcp/
│   │   │   └── client.ts       #   MCP StreamableHTTP client
│   │   └── routes/
│   │       └── chat.ts         #   POST /chat — NDJSON streaming + tool loop
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── mcp-client/                 # Expo mobile app (React Native + TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── _layout.tsx     #   Root layout (native tabs)
│   │   │   ├── index.tsx       #   Home screen
│   │   │   ├── explore.tsx     #   Explore screen
│   │   │   └── chat.tsx        #   Chat screen (NEW)
│   │   ├── components/
│   │   │   ├── chat/           #   Chat UI components (NEW)
│   │   │   │   ├── chat-bubble.tsx
│   │   │   │   ├── chat-input.tsx
│   │   │   │   ├── chat-message-list.tsx
│   │   │   │   └── chat-streaming-text.tsx
│   │   │   ├── app-tabs.tsx    #   Tab bar (Home, Explore, Chat)
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── use-chat.ts     #   Chat state + NDJSON stream hook (NEW)
│   │   ├── constants/
│   │   │   └── theme.ts        #   Colors, spacing, fonts
│   │   └── global.css
│   ├── assets/
│   │   └── images/tabIcons/    #   Tab bar icons (home, explore, chat)
│   └── package.json
│
├── .gitignore
├── LICENSE                     # MIT
└── README.md
```

## Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **MCP Server** | [FastMCP](https://github.com/jlowin/fastmcp) (Python 3.11+) | MCP tool server with `streamable-http` transport |
| | [httpx](https://www.python-httpx.org/) | Async HTTP client for NWS API calls |
| | [uvicorn](https://www.uvicorn.org/) | ASGI server for Streamable HTTP |
| **Backend** | [Express](https://expressjs.com/) (Node.js/TypeScript) | HTTP server + chat API |
| | [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | MCP Streamable HTTP client |
| | [OpenAI SDK](https://www.npmjs.com/package/openai) | OpenAI streaming chat completions |
| | [Anthropic SDK](https://www.npmjs.com/package/@anthropic-ai/sdk) | Anthropic streaming messages |
| **Frontend** | [Expo SDK 57](https://expo.dev/) | Cross-platform React Native app |
| | [Expo Router](https://docs.expo.dev/router/introduction/) | File-based routing + native tabs |
| | [@expo/ui](https://docs.expo.dev/versions/latest/sdk/ui/) | Native UI components (SwiftUI/Jetpack Compose) |
| | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animations |
| **Protocol** | [Model Context Protocol](https://modelcontextprotocol.io/) | AI ↔ tool communication |
| | Streamable HTTP + NDJSON | Transport: HTTP chunked, newline-delimited JSON |

## Getting Started

### Prerequisites

- **Python** ≥ 3.11
- **Node.js** ≥ 22
- **Expo CLI** (`npx expo`)
- API keys for at least one AI provider (OpenAI or Anthropic)

### 1. MCP Server

```bash
cd mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python weather.py
# → Streamable HTTP listening on http://0.0.0.0:8001
```

### 2. Proxy Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (at least one):
#   OPENAI_API_KEY=sk-...
#   ANTHROPIC_API_KEY=sk-ant-...

npm install
npm run dev
# → Express running on http://localhost:3001
```

### 3. Expo App

```bash
cd mcp-client
# Optional: override backend URL for real devices/emulators
# EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
npm install
npx expo start
# Press 'i' for iOS simulator, 'a' for Android, or 'w' for web
```

### 4. Try it out

1. Tap the **Chat** tab
2. Toggle between OpenAI and Anthropic
3. Ask: *"What's the weather in San Francisco?"*
4. Watch the AI call the MCP weather tool and stream the response

## API Reference

### Backend Endpoints

#### `GET /health`

Health check with MCP connection status.

```
→ 200 OK
{
  "status": "ok",
  "mcpConnected": true,
  "toolsAvailable": 2
}
```

#### `POST /chat`

Streaming chat endpoint (NDJSON).

**Request**
```json
{
  "messages": [
    { "role": "user", "content": "What's the weather in NYC?" }
  ],
  "provider": "openai"
}
```

**Response** (NDJSON stream, `Content-Type: application/x-ndjson`)
```json
{"type":"text","content":"Let me check the forecast for New York City."}
{"type":"tool_call","id":"call_abc123","name":"get_forecast","arguments":{"latitude":40.71,"longitude":-74.00}}
{"type":"tool_result","id":"call_abc123","name":"get_forecast","content":"Today: 72°F..."}
{"type":"text","content":"The current weather in New York City is..."}
{"type":"done"}
```

### MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_alerts` | Get active weather alerts for a US state | `state` (e.g., `"CA"`, `"NY"`) |
| `get_forecast` | Get weather forecast for coordinates | `latitude`, `longitude` (float) |

## Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | *if using OpenAI* | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | *if using Anthropic* | — | Anthropic API key |
| `MCP_SERVER_URL` | No | `http://localhost:8001/mcp` | MCP server Streamable HTTP URL |
| `PORT` | No | `3001` | Backend server port |

At least one provider key is required for chat. If a request targets a provider whose key is missing, `/chat` returns a provider-specific error.

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | No | Platform default (`http://localhost:3001`, Android emulator: `http://10.0.2.2:3001`) | Base URL for proxy backend |

## Roadmap

- [x] **Conversation persistence** — store chat history in local SQLite (Expo app)
- [ ] **Cloud conversation sync** — persist and sync chat history across devices/accounts
- [x] **Multiple chat sessions** — create, switch, rename, and delete conversation threads
- [ ] **Additional MCP tools** — web search, file system access, database queries, calendar
- [ ] **Vision support** — image upload + analysis via multimodal models (GPT-4o, Claude)
- [ ] **EAS Build & Submit** — ship to TestFlight and Google Play with EAS
- [ ] **EAS Hosting** — deploy the proxy backend as Expo API Routes
- [ ] **Prompt templates** — system prompts, saved prompt presets
- [ ] **Offline resilience** — graceful degradation when MCP server is unreachable
- [ ] **Streaming cancellation** — cancel mid-response with UI feedback
- [ ] **Dark mode polish** — refined dark theme for chat components
- [ ] **E2E tests** — UI flow tests for chat interactions with Maestro or Detox
- [ ] **Markdown rendering** — full Markdown support in chat bubbles (code blocks, tables, links)

## License

MIT © [Jeffery Yeung](https://github.com/jyeung)

---

Built with [Expo](https://expo.dev), [FastMCP](https://github.com/jlowin/fastmcp), and the [Model Context Protocol](https://modelcontextprotocol.io).
