# Architecture

```mermaid
graph LR
    subgraph "Expo App (React Native)"
        A[Chat UI]
        B[NDJSON Stream Parser]
        C[Provider Toggle<br/>OpenAI / Anthropic]
    end

    subgraph "Proxy Backend (Node.js/Express :3001)"
        D[POST /chat]
        E[AI Adapter<br/>OpenAI \| Anthropic]
        F[Tool-Calling Loop]
        G[MCP Streamable HTTP Client]
    end

    subgraph "MCP Server (Python/FastMCP :8001)"
        H[get_alerts]
        I[get_forecast]
    end

    subgraph "External APIs"
        J[NWS Weather API]
        K[OpenAI API]
        L[Anthropic API]
    end

    A -->|"POST /chat (NDJSON)"| D
    D --> E
    E --> K
    E --> L
    E --> F
    F --> G
    G -->|"Streamable HTTP (JSON-RPC)"| H
    G -->|"Streamable HTTP (JSON-RPC)"| I
    H --> J
    I --> J
    D -->|"NDJSON stream"| B
    B --> A
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant App as Expo App
    participant Backend as Proxy Backend
    participant AI as AI Provider
    participant MCP as MCP Server
    participant NWS as NWS API

    User->>App: "What's the weather in SF?"
    App->>Backend: POST /chat { messages, provider }
    Backend->>AI: Stream chat completion
    AI-->>Backend: tool_call: get_forecast(lat, lon)
    Backend-->>App: {"type":"tool_call","name":"get_forecast",...}
    App-->>User: 🔧 Calling get_forecast...
    Backend->>MCP: callTool("get_forecast", {lat, lon})
    MCP->>NWS: GET /points/37.77,-122.41
    NWS-->>MCP: Grid endpoint
    MCP->>NWS: GET /gridpoints/.../forecast
    NWS-->>MCP: Forecast data
    MCP-->>Backend: "Today: 68°F, partly cloudy..."
    Backend-->>App: {"type":"tool_result",...}
    App-->>User: ✅ get_forecast complete
    Backend->>AI: Continue with tool result
    AI-->>Backend: "The weather in San Francisco is..."
    Backend-->>App: {"type":"text","content":"The weather..."}
    App-->>User: Streamed response text
    Backend-->>App: {"type":"done"}
```
