# Agent to Figma

**Languages / 语言:** [简体中文](#chinese-summary) · [English](#english-summary) · [繁體中文](#summary-zh-tw) · [日本語](#summary-ja) · [한국어](#summary-ko) · [Español](#summary-es) · [Français](#summary-fr) · [Deutsch](#summary-de) · [Русский](#summary-ru) · [Português](#summary-pt)

## Summary / 摘要

<a id="english-summary"></a>
**English** — Agent to Figma is a local MCP bridge that lets an AI agent read and edit Figma Desktop directly. It ships a patched Figma development plugin (multi-page scanning, page creation, batch text replacement, collapsible / silent-mode UI, zh/EN switch), a Node.js WebSocket relay (no Bun required), and CLI helpers for plugin commands not exposed in the MCP tool list. It supports Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App, and Antigravity CLI out of the box. Clone the repo, run `npm install --omit=dev` and `npm run relay`, then import `src/cursor_mcp_plugin/manifest.json` in Figma Desktop. Forked from [`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp) (MIT).

<a id="chinese-summary"></a>
**简体中文** — Agent to Figma 是一个本地 MCP 桥：让 AI Agent 直接读写 Figma 桌面版。仓库包含已打补丁的 Figma 开发插件（跨页扫描、新建页面、批量改文案、可折叠与静默后台模式、中英切换）、Node.js WebSocket 中继（不需要 Bun），以及 MCP 工具列表没有暴露的 CLI 命令。默认支持 Claude Code、Codex、Cursor、Trae / Trae CN、dsh、ZCode、WorkBuddy、Antigravity App、Antigravity CLI 九个 harness；clone 后执行 `npm install --omit=dev` 和 `npm run relay`，在 Figma 桌面版导入 `src/cursor_mcp_plugin/manifest.json` 即可。

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![MCP tools](https://img.shields.io/badge/MCP_tools-44-7c3aed)
![Plugin commands](https://img.shields.io/badge/plugin_commands-45-0ea5e9)

<a id="one-click-install"></a>
## One-Click Install (Copy to Your Agent) / 一键安装（复制给 Agent）

Copy either prompt below to an AI agent with terminal access. It will check your environment, clone and install the repo, start the relay, and configure only the client you use.

把下面对应语言的整段复制给有终端权限的 Agent。它会检查环境、克隆、安装、启动中继，并且只给你正在用的客户端写配置。

### English

```text
You are my installation assistant. Please install and configure Agent to Figma (a local Figma MCP bridge) on this machine by following these steps:

1. Check prerequisites: Node.js >= 18, git, and Figma Desktop (Windows / macOS). Tell me first if anything is missing — do not install system-level software on your own.
2. Clone and install. If the current directory is not empty, ask me where to install first:
   git clone https://github.com/DeepVite/agent-to-figma.git
   cd agent-to-figma
   npm install --omit=dev
3. Start the relay and keep it running in the background:
   npm run relay
   Confirm 127.0.0.1:3055 is listening.
4. Detect which agent clients are installed and install the bundled Agent Skill:
   npm run setup:clients -- --list
   Write config ONLY for the client I actively use (Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy / Antigravity App / Antigravity CLI) via:
   npm run setup:clients -- --client <id> --write
   Also install the bundled Agent Skill (safe workflow, pitfalls, and Style A / Style B presets) to ~/.agents/skills/agent-to-figma via:
   npm run setup:skill -- --write
   Back up existing configs before writing; do not touch other MCP servers. If none is detected, ask me which client I use.
5. Guide me through the Figma steps:
   Plugins → Development → Import plugin from manifest…
   Select src/cursor_mcp_plugin/manifest.json
   Run "Agent to Figma" and tell me the channel name shown in the plugin.
   Remind me: keep Figma Desktop open the whole time; the plugin window can be collapsed but must NOT be closed, and must be re-run after every Figma restart.
6. In my chosen client, call join_channel(<channel>) and then get_document_info; once the page tree is returned, paste the result to me.

Safety boundaries: never commit or echo any token/secret; never bind the relay to 0.0.0.0; never modify configs of my other projects; never force push.
```

### 简体中文

```text
你是我的安装助手。请在这台电脑上安装并配置 Agent to Figma（本地 Figma MCP 桥），按步骤执行：

1. 检查环境：Node.js >= 18、git、Figma 桌面版（Windows / macOS）。缺什么先告诉我，不要擅自安装系统级软件。
2. 克隆并安装。如果当前目录不是空目录，先问我装到哪里：
   git clone https://github.com/DeepVite/agent-to-figma.git
   cd agent-to-figma
   npm install --omit=dev
3. 启动中继并保持后台常驻：
   npm run relay
   确认 127.0.0.1:3055 正在监听。
4. 检测我装了哪些 Agent 客户端，并安装配套 Agent Skill：
   npm run setup:clients -- --list
   只给我正在使用的客户端写配置（Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy / Antigravity App / Antigravity CLI）；命令形式：npm run setup:clients -- --client <id> --write；同时运行 npm run setup:skill -- --write 将配套 Skill（安全红线、避坑手册与样式 A/B 预设）安装到 ~/.agents/skills/agent-to-figma；写入前先备份；不要动其他 MCP。没检测到就问我用哪一个。
5. 告诉我 Figma 里的下一步：
   Plugins → Development → Import plugin from manifest…
   选择 src/cursor_mcp_plugin/manifest.json
   运行 Agent to Figma，把插件显示的频道名告诉我。
   同时提醒我：Figma 桌面版要全程开着；插件窗口可以折叠但不要关闭，每次重开 Figma 后要重新运行插件。
6. 用我选择的客户端调用 join_channel(频道名)，再调用 get_document_info；确认返回页面树后，把结果贴给我。

安全边界：不要提交或回显任何 token/密钥；不要把中继暴露到 0.0.0.0；不要改我其他项目的配置；不要 force push。
```

> Prefer not to let an agent edit your config? Run steps 1–3 yourself, then follow [Manual Installation](#manual-installation) below.

## What It Is

Agent to Figma connects Figma Desktop to your AI agent:

- **Read**: page tree (all pages), nodes, text, styles, components, selections
- **Write**: frames, rectangles, text, image fills, corner radius, batch text replacement, creating new pages
- **44 MCP tools** + **45 plugin commands**; plugin commands not exposed in MCP (`create_page`, `scan_all_text`) are covered by the CLI
- **No Bun required** — Node.js >= 18 is all you need
- Relay binds strictly to `127.0.0.1`; data never leaves your machine

### What It Is Not

- Not Figma's official MCP server, and not a cloud service
- Cannot generate `.fig` files or replace Figma Desktop
- Does not work on Linux (there is no official Figma Desktop for Linux)
- Relay has no authentication — never expose it to your LAN or the public internet

## Architecture

Everything ultimately flows through one execution path: the Figma Plugin API. MCP and the CLI are two entry points speaking the exact same command protocol.

```text
AI Agent (Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy / Antigravity App & CLI)   Human / Script
        │ MCP stdio (44 tools)                                                 │ Direct JSON
        ▼                                                                      ▼
  MCP server (dist/server.js)                                        CLI (send-command.mjs)
        │                                                                      │
        └──────────────────────────┬───────────────────────────────────────────┘
                                   ▼
        Node relay (node-relay/socket.mjs, 127.0.0.1:3055, WebSocket forwarding)
                                   ▼
        Figma dev plugin (src/cursor_mcp_plugin/code.js) ★ Sole execution layer that edits docs
                                   │
                                   ▼
        Figma Plugin API (figma.createFrame(), page.findAll(), exportAsync…)
                                   ▼
                             Figma Document
```

- **MCP server**: `src/talk_to_figma_mcp/server.ts`, 44 tools; `dist/` is prebuilt from current source
- **CLI**: `node-relay/send-command.mjs` sends commands directly, covering plugin commands not exposed by MCP (`create_page`, `scan_all_text`) and serving as the shortest path to debug the bridge
- **Node relay**: `node-relay/socket.mjs`, wire-compatible with upstream `src/socket.ts`
- **Figma plugin**: `src/cursor_mcp_plugin/`, the **only layer capable of modifying documents**, with multi-page scanning, page creation, batch text replacement, collapsible UI, and zh/EN toggle
- **Context cost note**: while connected, the 44 MCP tool definitions (~7k tokens) remain in context on every turn. Disable the MCP server when you are not working on Figma tasks. The CLI has zero standing token cost.

## Manual Installation

### 0. Prerequisites

| Requirement | Details |
|---|---|
| Figma | **Desktop app** (Windows / macOS). The web app does not have `Plugins → Development` |
| Figma plan | Free plan is sufficient — no Dev Mode or paid seat required |
| Node.js | >= 18 (no Bun required) |
| OS | Windows / macOS; Linux has no official Figma Desktop |

> Only need your agent to **read** designs without editing the canvas? You can use the Figma REST API or Figma's official remote MCP (read-only) instead.

### 1. Install

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
```

`dist/` is committed to the repo, so no build step is needed after cloning. Only run `npm run build` if you modify source files.

### 2. Start the Relay

```bash
npm run relay
# Equivalent to: node node-relay/socket.mjs
# Listens on ws://127.0.0.1:3055 by default
```

Keep the relay running. Once the plugin connects, the relay logs the channel name:

```text
[relay] joined channel "a1b2c3d4" (1 client(s))
```

### 3. Load the Plugin in Figma

1. *(First-time / upgrading from an older clone)* If an older `Agent to Figma` entry already exists under `Plugins → Development`, remove it first so Figma does not keep loading the previous path.
2. In Figma Desktop: `Plugins → Development → Import plugin from manifest…`
3. Select `src/cursor_mcp_plugin/manifest.json` from **this** repository
4. Run `Plugins → Development → Agent to Figma`
5. Click **Connect** in the plugin panel (it also attempts to auto-connect on launch)

The plugin generates and joins a channel; read the channel name from the plugin UI or relay logs. After pulling plugin updates (`git pull`), close the plugin window and re-run it (`Ctrl+Alt+P` / `Cmd+Option+P`), then check the version in the About tab.

### 3.5 Runtime Requirements (All 3 Components Must Stay Running)

If **any one** of the three components stops, the bridge disconnects. Confirm all three are running before writing to Figma:

| Component | Requirement | Symptom When Stopped |
|---|---|---|
| Figma Desktop | **Keep open the entire time** (minimized to tray is fine; do not quit) | Tool calls fail with relay/plugin unreachable |
| Plugin | **Keep running**: collapse it to a `212×44` mini bar (`−`) or hide it to the background (`Hide` — leaves a bottom bar with an `Open Panel` button), but **do not close it**; if closed, re-run via `Plugins → Development → Agent to Figma` (`Open Panel` or `Silent Connect`) | No peer in relay logs; tool calls time out |
| Relay | Keep `npm run relay` running (dedicated terminal or background process) | Plugin shows connection failure; reconnect loops |

Common pitfall: importing `manifest.json` only **registers** the plugin — **you must manually run the plugin again after every Figma restart**, and closing the plugin window stops it (it does not run in the background). See [`docs/PITFALLS.md`](docs/PITFALLS.md) for troubleshooting.

### 4. Configure Your MCP Client

Auto-detect and write configs (dry-run by default; pass `--write` to apply, with automatic backup before writing):

```bash
npm run setup:clients -- --list            # Detect installed harnesses & skill status
npm run setup:clients -- --all             # Preview changes
npm run setup:clients -- --all --write     # Apply MCP config changes
npm run setup:clients -- --client codex --write
npm run setup:skill -- --write             # Install bundled Agent Skill to ~/.agents/skills/agent-to-figma
```

Supported client IDs: `claude-code`, `codex`, `cursor`, `trae`, `dsh`, `zcode`, `workbuddy`, `antigravity-app`, `antigravity-cli`.

> **Bundled Agent Skill (`skills/agent-to-figma/`)**: Installing it to `~/.agents/skills/agent-to-figma` (via `npm run setup:skill -- --write` or `npx skills add DeepVite/agent-to-figma`) gives any Agent Skills–compatible harness the bridge workflow, safety rules, troubleshooting guide, and progressive-disclosure **Style A / Style B** typography presets even when working outside this repository.

When configuring manually, **point to this repo's `dist/server.js`** rather than the upstream npx package (upstream lacks the plugin patches and 4 rebuilt tools):

```json
{
  "mcpServers": {
    "agent-to-figma": {
      "command": "node",
      "args": ["/absolute/path/to/agent-to-figma/dist/server.js"]
    }
  }
}
```

A project-level `.mcp.json` using the relative path `dist/server.js` is already included for Claude Code / Cursor when opened at the repo root.

### Optional: npm Package

This repo also publishes `agent-to-figma` to npm for distributing the MCP server binary:

```bash
npx -y agent-to-figma
```

MCP client configuration:

```json
{
  "mcpServers": {
    "agent-to-figma": {
      "command": "npx",
      "args": ["-y", "agent-to-figma"]
    }
  }
}
```

Note: the npm package **only** runs the MCP server — it does **not** start the WebSocket relay or install the Figma plugin. Set up the relay and import `src/cursor_mcp_plugin/manifest.json` from the cloned repository as described above.

### 5. Verify

In your MCP client:

1. Call `join_channel` with the channel name from step 2/3
2. Call `get_document_info` — returning the page tree confirms the end-to-end pipeline works

## Supported Clients

| Harness | Config Path | Status (2026-11-22) |
|---|---|---|
| **Claude Code** | `~/.claude.json` → `mcpServers` | Config generator covered; E2E pending |
| **Codex** | `~/.codex/config.toml` → `[mcp_servers.agent-to-figma]` | Config generator covered; E2E pending |
| **Cursor** | `~/.cursor/mcp.json` → `mcpServers` | Config generator covered; E2E pending |
| **Trae / Trae CN** | `%APPDATA%\Trae CN\User\mcp.json` (macOS: `~/Library/Application Support/Trae CN/User/mcp.json`) | ✅ Trae CN 3.4.22: MCP full-page write verified |
| **dsh (DeepSeek Harness)** | `$DSH_HOME/profiles/<profile>/cordis.patch.yml` | ⚠️ 0.2.1-rc.5: MCP client entry not activated; CLI full-page write verified |
| **ZCode** | `~/.zcode/cli/config.json` → `mcp.servers` | ✅ MCP tools loaded & `join_channel` passed; full-page write pending |
| **WorkBuddy** | `~/.workbuddy/mcp.json` → `mcpServers` | ✅ WorkBuddy 5.6.2: MCP full-page write verified |
| **Antigravity App** | `~/.gemini/config/mcp_config.json` → `mcpServers` | ✅ Antigravity App: MCP read/write + PNG export verified (44/44 tools) |
| **Antigravity CLI (`agy`)** | `~/.gemini/config/mcp_config.json` → `mcpServers` | ✅ Antigravity CLI: MCP connection & end-to-end test verified (shared config; native `agy mcp add`) |

Tests were performed on local Figma test files; no test pages or nodes are published with the repo. See [`docs/CLIENTS.md`](docs/CLIENTS.md) for per-harness paths, schemas, and notes.

## Why This Fork

Upstream requires Bun for the relay and hits several practical issues under Figma's `dynamic-page` access mode:

| Upstream Limitation | What This Fork Changes |
|---|---|
| Relay requires `bun socket` | `node-relay/socket.mjs` runs on Node >= 18 |
| `get_document_info` only returns the current page | Calls `loadAllPagesAsync()` and returns all pages |
| No page-creation command; writes land on the user's active page | Adds `create_page` so agents write to an isolated page first |
| Cross-page copy replacement requires manual per-page traversal | Adds `scan_all_text` + `node-relay/batch-replace.mjs` |
| Plugin does not reliably auto-reconnect (`undefined` port bug) | Fixes reconnect state, keeps channel across reconnects, respects manual disconnect |
| Plugin includes upstream GA4 analytics | Removed; zero third-party telemetry |
| Fixed 350×600 panel blocks the canvas | Top `−` collapses to a `212×44` mini bar, `Hide` runs silently with a bottom `Open Panel` bar (plus dual menu entries), and built-in zh/EN toggle (default Chinese) |

`dist/server.js` is also rebuilt from current source: upstream's checked-in `dist` was missing 4 tools (`set_image_fill`, `rename_node`, `create_section`, `set_parent`).

## Common Operations

### MCP Tools

| Tool | Purpose |
|---|---|
| `join_channel` | Join the plugin's channel (must be called before any other tool) |
| `get_document_info` | Read the document page tree (all pages) |
| `create_frame` / `create_rectangle` / `create_text` | Create canvas nodes |
| `set_fill_color` / `set_corner_radius` | Style fills and corner radius |
| `export_node_as_image` | Export PNG (base64) |
| `set_focus` | Focus the Figma viewport on a node |

See [`docs/AGENT-GUIDE.md`](docs/AGENT-GUIDE.md) for the complete 44-tool list.

### CLI (Commands Not Exposed in MCP)

```bash
# Create a new page and switch to it
node node-relay/send-command.mjs <channel> create_page '{"name":"Draft"}'

# Scan text across all pages (optional substring filter)
node node-relay/send-command.mjs <channel> scan_all_text '{"contains":"example.com"}'

# Cross-page batch replace (scan → update → rescan to verify)
node node-relay/batch-replace.mjs <channel> "old text" "new text" [exclude]

# Pass non-ASCII / special-character JSON via file to avoid Windows shell escaping issues
node node-relay/send-command.mjs <channel> rename_node @params.json
```

### Changing the Port

1. Start the relay with `FIGMA_RELAY_PORT=4000 npm run relay`
2. Enter the same port in the plugin UI input field
3. Update `3055` in `src/cursor_mcp_plugin/manifest.json` (`networkAccess.allowedDomains` and `devAllowedDomains`)
4. In your MCP client config for `agent-to-figma`, set `env.FIGMA_RELAY_PORT=4000` (or pass `--port=4000` in `args`)

Both the MCP server and CLI scripts respect `FIGMA_RELAY_PORT`.

## Security Boundaries

- The relay listens only on `127.0.0.1:3055` with **no authentication**; any local process or browser tab could connect
- Never set `FIGMA_RELAY_HOST=0.0.0.0` to expose the relay to LAN/WAN
- Do not open untrusted pages or run untrusted scripts while the bridge is active
- `setup-clients` creates timestamped backups before writing; review dry-run output before passing `--write`
- All third-party analytics have been removed; traffic stays strictly on loopback
- `.gitignore` excludes `.env`, keys, backups, temp files, and local harness state

Full details: [`docs/SECURITY.md`](docs/SECURITY.md).

## Troubleshooting

Check [`docs/PITFALLS.md`](docs/PITFALLS.md) (23 real-world pitfalls) and follow the startup order in [`docs/RUNBOOK.md`](docs/RUNBOOK.md). The most common issues:

- **Commands time out** → No plugin peer in that channel (relay stopped / plugin not running / channel mismatch)
- **`get_document_info` returns only 1 page** → You loaded an older/community plugin instead of this repo's `manifest.json`
- **Plugin UI or version didn't update after `git pull`** → Figma Desktop may still point to an older clone's `manifest.json` (remove the old entry under `Plugins → Development` and re-import from the current repo, then close and re-run; see `PITFALLS.md` A23)
- **MCP server logs `Socket error` on startup** → Relay isn't running yet; the server auto-retries every 2s once the relay starts

## Version & Milestone

Current: **v0.2.1** (2026-11-22)

- Full baseline: 44 MCP tools, 45 plugin commands, Node relay (no Bun), 9-harness config generator, unified MCP server name `agent-to-figma` (`mcp__agent-to-figma__*`)
- Added in v0.2.1: bundled self-contained Agent Skill (`skills/agent-to-figma/`, with progressive Style A / Style B & pitfalls references); `npm run setup:skill -- --write` installer targeting `~/.agents/skills/agent-to-figma` (included in one-click install prompts); read-only Figma-to-Agent roadmap (`docs/ROADMAP-FIGMA-TO-AGENT.md`)
- Added in v0.2.0: 3-mode Figma plugin UI (3-tab panel, `212×44` mini bar, silent background mode with bottom `Open Panel` bar + dual menu entries); Antigravity App & Antigravity CLI (`agy`) support; selectable Style A / Style B typography presets; English-default README with bilingual summary & prompts; `FIGMA_RELAY_PORT` / `--port=` support in MCP server; P0/P1/P2 audit fixes & A23 troubleshooting
- Verified: WorkBuddy (MCP), Trae CN (MCP), Antigravity App (MCP), Antigravity CLI (MCP), dsh (CLI fallback)

Known limitations:

- Claude Code, Codex, and Cursor have not yet undergone E2E write testing
- dsh 0.2.1-rc.5 does not register MCP tools from `dsh-mcp-client`; use the CLI fallback
- No official Figma Desktop for Linux
- Relay has no authentication; strictly for local loopback use

See [`CHANGELOG.md`](CHANGELOG.md), [`docs/RELEASE-NOTES-v0.2.1.md`](docs/RELEASE-NOTES-v0.2.1.md), [`docs/RELEASE-NOTES-v0.2.0.md`](docs/RELEASE-NOTES-v0.2.0.md), [`docs/RELEASE-NOTES-v0.1.1.md`](docs/RELEASE-NOTES-v0.1.1.md), and [`docs/RELEASE-NOTES-v0.1.0.md`](docs/RELEASE-NOTES-v0.1.0.md).

## Documentation

| If You Are… | Start Here | Language |
|---|---|---|
| Setting up for the first time (15-min guide) | [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md) | 简体中文 |
| An AI agent, or delegating Figma work to an agent | [`skills/agent-to-figma/SKILL.md`](skills/agent-to-figma/SKILL.md) / [`docs/AGENT-GUIDE.md`](docs/AGENT-GUIDE.md) | EN + 简体中文 |
| Choosing a typography & prototype-spec style (Style A / Style B) | [`docs/TYPOGRAPHY-PRESETS.md`](docs/TYPOGRAPHY-PRESETS.md) | 简体中文 |
| Developing / contributing to this repo (agent guide) | [`AGENTS.md`](AGENTS.md) | English |
| Day-to-day operations, startup order, batch text replace | [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | 简体中文 |
| Connecting Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy / Antigravity App & CLI | [`docs/CLIENTS.md`](docs/CLIENTS.md) | 简体中文 |
| Per-harness one-click install prompts | [`examples/one-click-install.md`](examples/one-click-install.md) | 简体中文 |
| Troubleshooting errors | [`docs/PITFALLS.md`](docs/PITFALLS.md) | 简体中文 |
| Security boundaries | [`docs/SECURITY.md`](docs/SECURITY.md) | 简体中文 |
| Exploring next-step read-only dev handoff (`Figma to Agent`) | [`docs/ROADMAP-FIGMA-TO-AGENT.md`](docs/ROADMAP-FIGMA-TO-AGENT.md) | 简体中文 |
| Release history | [`CHANGELOG.md`](CHANGELOG.md) | 简体中文 |

## Directory Structure

```text
node-relay/              Node.js WebSocket relay & CLI helpers
  socket.mjs             Relay (replaces upstream Bun relay)
  send-command.mjs       Direct single-command CLI
  batch-replace.mjs      Cross-page batch text replacement
  test-relay.mjs         Relay protocol self-test
  start-figma-bridge.cmd Windows double-click relay launcher
scripts/
  setup-clients.mjs      MCP config generator (9 harnesses) & ~/.agents skill installer
  setup.sh               Project-level .mcp.json + dependency install
skills/
  agent-to-figma/        Bundled Agent Skill (SKILL.md + Style A/B & pitfalls references)
src/cursor_mcp_plugin/   Patched Figma development plugin
src/talk_to_figma_mcp/   MCP server TypeScript source
dist/                    Prebuilt MCP server bundle (44 tools)
docs/                    Guides, client setup, runbook, pitfalls, security
examples/                Per-client config snippets & install prompts
```

## Multilingual Summaries

> This README and [`AGENTS.md`](AGENTS.md) are in English; detailed guides under `docs/` are currently in Simplified Chinese. Below are short summaries in other languages.

<a id="summary-zh-tw"></a>
### 繁體中文

Agent to Figma 是一個本地 MCP 橋樑，讓 AI Agent 直接讀寫 Figma 桌面版。內含已修補的 Figma 開發外掛、Node.js WebSocket 中繼（不需 Bun），以及 MCP 工具列表未提供的 CLI 指令。支援 Claude Code、Codex、Cursor、Trae / Trae CN、dsh、ZCode、WorkBuddy、Antigravity App、Antigravity CLI；Clone 後執行 `npm install --omit=dev` 與 `npm run relay`，並在 Figma 匯入 `src/cursor_mcp_plugin/manifest.json`。本 README 與 `AGENTS.md` 為英文，`docs/` 詳細文件目前為簡體中文。

<a id="summary-ja"></a>
### 日本語

Agent to Figma は、AI エージェントが Figma デスクトップ版を読み書きできるようにするローカル MCP ブリッジです。Figma 開発プラグイン、Node.js 製 WebSocket リレー（Bun 不要）、MCP ツールにないコマンド用の CLI を同梱しています。Claude Code、Codex、Cursor、Trae / Trae CN、dsh、ZCode、WorkBuddy、Antigravity App、Antigravity CLI に対応。リポジトリを clone して `npm install --omit=dev` と `npm run relay` を実行し、Figma で `src/cursor_mcp_plugin/manifest.json` を読み込んでください。本 README と `AGENTS.md` は英語、`docs/` の詳細ガイドは現在簡体字中国語です。

<a id="summary-ko"></a>
### 한국어

Agent to Figma는 AI 에이전트가 Figma 데스크톱을 읽고 편집할 수 있게 해주는 로컬 MCP 브리지입니다. 패치된 Figma 개발 플러그인, Node.js WebSocket 릴레이(Bun 불필요), MCP 도구 목록에 없는 명령을 위한 CLI를 포함합니다. Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App, Antigravity CLI를 지원합니다. 저장소를 clone한 뒤 `npm install --omit=dev`와 `npm run relay`를 실행하고, Figma에서 `src/cursor_mcp_plugin/manifest.json`을 불러오세요. 본 README와 `AGENTS.md`는 영어이며, `docs/`의 상세 문서는 현재 간체 중국어로 제공됩니다.

<a id="summary-es"></a>
### Español

Agent to Figma es un puente MCP local que permite a un agente de IA leer y editar Figma Desktop. Incluye un plugin de desarrollo de Figma, un relay WebSocket en Node.js (sin Bun) y utilidades CLI para comandos que no están en la lista de herramientas MCP. Compatible con Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App y Antigravity CLI. Clona el repositorio, ejecuta `npm install --omit=dev` y `npm run relay`, e importa `src/cursor_mcp_plugin/manifest.json` en Figma. Este README y `AGENTS.md` están en inglés; las guías detalladas en `docs/` están actualmente en chino simplificado.

<a id="summary-fr"></a>
### Français

Agent to Figma est un pont MCP local qui permet à un agent IA de lire et modifier Figma Desktop. Il fournit un plugin de développement Figma, un relais WebSocket Node.js (sans Bun) et des utilitaires CLI pour les commandes absentes de la liste d'outils MCP. Compatible avec Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App et Antigravity CLI. Clonez le dépôt, lancez `npm install --omit=dev` et `npm run relay`, puis importez `src/cursor_mcp_plugin/manifest.json` dans Figma. Ce README et `AGENTS.md` sont en anglais ; les guides détaillés dans `docs/` sont actuellement en chinois simplifié.

<a id="summary-de"></a>
### Deutsch

Agent to Figma ist eine lokale MCP-Brücke, mit der ein KI-Agent Figma Desktop lesen und bearbeiten kann. Enthalten sind ein Figma-Entwicklungs-Plugin, ein Node.js-WebSocket-Relay (ohne Bun) und CLI-Helfer für Befehle, die nicht in der MCP-Tool-Liste stehen. Unterstützt Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App und Antigravity CLI. Repository klonen, `npm install --omit=dev` und `npm run relay` ausführen, dann `src/cursor_mcp_plugin/manifest.json` in Figma importieren. Diese README und `AGENTS.md` sind auf Englisch; die ausführlichen Leitfäden unter `docs/` sind derzeit auf vereinfachtem Chinesisch.

<a id="summary-ru"></a>
### Русский

Agent to Figma — это локальный MCP-мост, который позволяет ИИ-агенту читать и редактировать Figma Desktop. В комплекте — плагин разработки Figma, WebSocket-ретранслятор на Node.js (без Bun) и CLI-утилиты для команд, которых нет в списке инструментов MCP. Поддерживаются Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App и Antigravity CLI. Склонируйте репозиторий, выполните `npm install --omit=dev` и `npm run relay`, затем импортируйте `src/cursor_mcp_plugin/manifest.json` в Figma. Этот README и `AGENTS.md` написаны на английском; подробные руководства в `docs/` сейчас на упрощённом китайском.

<a id="summary-pt"></a>
### Português

Agent to Figma é uma ponte MCP local que permite a um agente de IA ler e editar o Figma Desktop. Inclui um plugin de desenvolvimento para Figma, um relay WebSocket em Node.js (sem Bun) e utilitários CLI para comandos que não estão na lista de ferramentas MCP. Compatível com Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy, Antigravity App e Antigravity CLI. Clone o repositório, execute `npm install --omit=dev` e `npm run relay`, e importe `src/cursor_mcp_plugin/manifest.json` no Figma. Este README e `AGENTS.md` estão em inglês; os guias detalhados em `docs/` estão atualmente em chinês simplificado.

[↑ Back to top / 回到顶部](#agent-to-figma)

## Upstream Relationship

- Upstream: [`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp), MIT, Copyright (c) 2025 Github User sonnylazuardi
- Forked from upstream commit `ddd90f3`; see [`NOTICE.md`](NOTICE.md) for the full list of modifications
- Original upstream README is archived untouched at [`README.upstream.md`](README.upstream.md)

## License

MIT. See [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).
