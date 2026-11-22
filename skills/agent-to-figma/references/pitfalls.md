# Agent to Figma — High-Frequency Pitfalls

Quick troubleshooting reference for agents operating the `agent-to-figma` bridge.

---

## 1. Connection & Relay

- **All commands time out (20–30s)**
  - Almost always means **no plugin peer in that channel**.
  - Check in order: (1) relay listening on `127.0.0.1:3055` (`FIGMA_RELAY_PORT`), (2) Figma Desktop open and `Agent to Figma` plugin running (not closed), (3) channel name matches the latest `joined channel "..."` entry in relay logs.
- **`Not connected to server` / `Socket error` on MCP startup**
  - Relay was not started before the MCP server. Start `npm run relay`; the MCP server auto-retries every 2s.
- **Channel does not persist across tasks (e.g. WorkBuddy) or plugin reconnects**
  - Some harnesses spawn a fresh MCP server per task; always call `join_channel` at the start of a new task.
- **Custom port requires 4 places to match**
  - (1) Relay: `FIGMA_RELAY_PORT=4000 npm run relay`
  - (2) Plugin UI port input
  - (3) `src/cursor_mcp_plugin/manifest.json` (`networkAccess.allowedDomains` & `devAllowedDomains`)
  - (4) MCP client config: `env.FIGMA_RELAY_PORT=4000` or `args` `--port=4000` (CLI scripts also read `FIGMA_RELAY_PORT`).

## 2. Figma Plugin Runtime

- **`get_document_info` returns only 1 page / `Unknown command: create_page`**
  - Figma loaded an older/community plugin instead of this repo's `src/cursor_mcp_plugin/manifest.json`.
- **Plugin UI or version did not update after `git pull` (Pitfall A23)**
  - Figma Desktop saves local plugin paths in its `settings.json` (`localFileExtensions`) and may still point to an older clone.
  - Fix: in Figma Desktop `Plugins → Development`, remove the old `Agent to Figma` entry, re-import `src/cursor_mcp_plugin/manifest.json` from the current repo, close the old plugin window, and re-run (`Ctrl+Alt+P` / `Cmd+Option+P`). Confirm the version in the plugin's **About** tab.
- **Running plugin does not hot-reload code changes**
  - After editing `code.js` or `ui.html`, close the plugin and run it again.
- **`Cannot call with documentAccess: dynamic-page`**
  - Any plugin command traversing pages must `await figma.loadAllPagesAsync()` and switch pages via `await figma.setCurrentPageAsync(page)` (already patched in `code.js`).

## 3. Canvas Writing & API Quirks

- **`create_frame` with `fillColor.a = 0` renders opaque**
  - Upstream `opacity: parseFloat(fillColor.a) || 1` converts `0` to `1`. Omit `fillColor` or match the parent background color.
- **`set_corner_radius` with mixed `corners` throws `in postMessage: Cannot unwrap symbol`**
  - Setting only selected corners turns `node.cornerRadius` into `figma.mixed` (a Symbol), which crashes `postMessage` serialization. Use uniform `radius` and rely on parent frame clipping.
- **`export_node_as_image` ignores `SVG` / `PDF` / `JPG`**
  - `code.js` hardcodes `format = "PNG"` and returns `{ imageData: <base64>, mimeType }` without writing to disk. Decode base64 to save `.png`; `scale` is supported.
- **TEXT node `name` changes after `set_text_content`**
  - Normal Figma behavior when layer name mirrors text content. Call `rename_node` afterwards if a fixed layer name is required.
- **Fonts**
  - `create_text` requires fonts available to Figma (e.g. `Inter`, `PingFang SC`, system-installed CJK fonts).

## 4. CLI & Windows Shell Quoting

- **Non-ASCII / Chinese JSON garbled in PowerShell or Git Bash**
  - Write JSON params to a file and pass `@params.json` to `node node-relay/send-command.mjs <channel> <command> @params.json` (handles both UTF-8 BOM and PowerShell 5.1 UTF-16LE BOM).
- **`batch-replace.mjs` is literal string match, not regex**
  - Optional 4th argument is an exclusion substring; always verify replacement URLs return HTTP 200 before bulk updating.
