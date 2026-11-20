# NOTICE

This repository is a fork of
[`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp)
at commit `ddd90f3` ("feat: add set_image_fill, rename_node, create_section and set_parent tools (#185)").

Upstream license: MIT, Copyright (c) 2025 Github User sonnylazuardi.
The upstream `LICENSE` file is kept unchanged in this repository.

## Modifications

Copyright (c) 2026 DeepVite, released under the same MIT license.

### Figma plugin (`src/cursor_mcp_plugin/`)

- Added `create_page` (creates a page and switches to it via `figma.setCurrentPageAsync`).
- Added `scan_all_text` (loads all pages, returns every TEXT node, optional substring filter).
- `get_document_info` now calls `figma.loadAllPagesAsync()` and returns all pages, not just the current one.
- Removed the hardcoded GA4 Measurement Protocol credentials and all analytics calls.
- Removed the community plugin `id` from `manifest.json` and renamed the plugin to
  "Agent to Figma", so Figma loads the local code instead of the published community plugin.
- Reworked the WebSocket reconnect logic: the reconnect call keeps the last port, ignores
  close events from superseded sockets, and manual disconnect no longer triggers a reconnect.
- Updated UI copy that referenced Cursor/Bun to client-neutral wording.

### Node relay (`node-relay/`, new)

- `socket.mjs` reimplements the upstream `src/socket.ts` relay on Node.js (`ws`), so Bun is not required.
- Added `FIGMA_RELAY_PORT` / `FIGMA_RELAY_HOST` environment variables.
- Fixed repeated `join` leaving a socket in its previous channel.
- Added `send-command.mjs`, `batch-replace.mjs`, `test-relay.mjs`, `start-figma-bridge.cmd`.

### Tooling

- Rebuilt `dist/` from the current `src/talk_to_figma_mcp/server.ts` with `tsup`.
  The upstream `dist/` was stale and missing four tools.
- `package.json` scripts now use Node (`npm run relay`, `npm run send`, `npm run test:relay`),
  added `license` and `engines` metadata.
- `.mcp.json`, `scripts/setup.sh` and `Dockerfile` updated for the Node-based workflow.

### Documentation

- New Chinese-first `README.md`, `docs/GETTING-STARTED.md`, `docs/AGENT-GUIDE.md`,
  `docs/RUNBOOK.md`, `docs/PITFALLS.md`, `docs/SECURITY.md` and `examples/`.
- The original upstream README is preserved as `README.upstream.md`.
- Removed `DRAGME.md` (Bun/macOS-oriented upstream setup guide superseded by the
  Node workflow), `bun.lock` and `smithery.yaml`.
- `.gitignore` no longer ignores `dist/` and `docs/`; both are committed on purpose.
