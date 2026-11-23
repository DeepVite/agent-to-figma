# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project Overview

MCP (Model Context Protocol) server that bridges AI agents (Claude Code, Codex, Cursor, Trae, dsh, ZCode, WorkBuddy, Antigravity App, Antigravity CLI) with Figma. Three components communicate in a pipeline:

```
Claude Code / Cursor ←(stdio)→ MCP Server ←(WebSocket)→ WebSocket Relay ←(WebSocket)→ Figma Plugin
```

## Build & Development Commands

```bash
npm install               # Install dependencies (Node >= 18, no Bun needed)
npm run build             # Build MCP server (tsup → dist/)
npm run start             # Run built MCP server
npm run relay             # Start the Node WebSocket relay (port 3055)
npm run test:relay        # Relay protocol self-test
bash scripts/setup.sh     # Install + write MCP configs
```

There is no unit test suite; `npm run test:relay` covers the relay protocol.

## Architecture

### MCP Server (`src/talk_to_figma_mcp/server.ts`)
The main server implementing the MCP protocol via `@modelcontextprotocol/sdk`. Exposes 45 tools (including `list_channels`, `join_channel`, create shapes, modify text, manage layouts, export images, etc.) and several AI prompts (design strategies). Communicates with the AI agent over stdio and with the WebSocket relay via `ws`. Auto-discovers and joins the active Figma plugin channel when exactly one canvas is open, refuses to guess when multiple canvases are open, and silently switches + retries when a restarted plugin reports `NO_PEER`.

### WebSocket Relay (`node-relay/socket.mjs`)
Node.js HTTP + WebSocket server on port 3055 (configurable via `FIGMA_RELAY_PORT` /
`FIGMA_RELAY_HOST`). Routes messages between MCP server, CLI, and Figma plugin using
channel-based isolation. Exposes `GET /channels` and `GET /health` (loopback only),
supports WS `list_channels` / `update_meta`, tracks client roles (`plugin`/`mcp`/`cli`)
and document metadata, and fast-fails commands with `NO_PEER` when no plugin is online.
The original Bun implementation is kept in `src/socket.ts` for reference.

### Figma Plugin (`src/cursor_mcp_plugin/`)
Runs inside Figma. `code.js` is the plugin main thread handling 45 commands via a dispatcher. `ui.html` is the plugin UI for WebSocket connection management. `manifest.json` declares permissions (dynamic-page access, localhost network). The plugin is **not built/bundled** — `code.js` is written directly as the runtime artifact.

## Key Patterns

- **Colors**: Figma uses RGBA 0-1 range. The MCP tools accept 0-1 floats and the filter converts to hex for display.
- **Logging**: All logs go to stderr. Stdout is reserved for MCP protocol messages.
- **Timeouts**: 30s default per command. Progress updates from the plugin reset the inactivity timer.
- **Chunking**: Large operations (scanning 100+ nodes) are chunked with progress updates to prevent Figma UI freezing.
- **Reconnection**: WebSocket auto-reconnects after 2 seconds on disconnect.
- **Zod validation**: All tool parameters are validated with Zod schemas.

## Setup

1. `npm install` — installs dependencies
2. `npm run relay` in one terminal (WebSocket relay on port 3055)
3. In Figma: Plugins → Development → Import plugin from manifest → select `src/cursor_mcp_plugin/manifest.json`
4. Run plugin in Figma, join a channel, then use tools from your MCP client

Point clients at **this repo's build** (the upstream npx package does not include the plugin patches or the 4 rebuilt tools):

```json
{
  "mcpServers": {
    "agent-to-figma": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
```

You can also add it manually for Claude Code via the CLI (run from the repo root):

```bash
claude mcp add agent-to-figma -- node dist/server.js
```

Or write the configs of all detected harnesses:

```bash
npm run setup:clients -- --list
npm run setup:clients -- --client codex --write
```

## Agent Notes

- Using the bridge (not developing it): read `docs/AGENT-GUIDE.md` first.
- Single open Figma canvas auto-connects on the first tool call; when multiple canvases are open, call `list_channels` and confirm before `join_channel`
- Call `get_document_info` first to understand the design structure
- Use `read_my_design` or `get_selection` before making modifications
- Batch operations (`set_multiple_text_contents`, `delete_multiple_nodes`, `set_multiple_annotations`) are preferred over repeated single-node calls for performance
- All MCP tool parameters are Zod-validated; invalid inputs return structured errors
- The plugin and relay must both be running before any tool calls succeed
