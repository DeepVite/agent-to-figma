# agent-to-figma

> **English TL;DR** — A local bridge that lets an AI agent read and edit Figma through MCP. It bundles a patched Figma development plugin (multi-page scanning, page creation, batch text replacement), a Node.js WebSocket relay that replaces the Bun-only relay, and CLI helpers for plugin commands that the MCP tool list does not expose. Forked from [`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp) (MIT). Docs below are in Chinese.

让 AI Agent 直接读写 Figma 的本地桥。由三部分组成：

```
MCP 客户端（Claude Code / Codex / ZCode / Cursor ...）
        │  stdio（MCP 协议）
        ▼
MCP server  ──ws──▶  Node 中继（127.0.0.1:3055）  ◀──ws──  Figma 开发插件
                                                              │
                                                              ▼
                                                          Figma 画布
```

- **MCP server**：沿用上游 `cursor-talk-to-figma-mcp`，未改业务逻辑，`dist/` 已用当前源码重建（44 个工具）。
- **Node 中继**：`node-relay/`，零 Bun 依赖，协议与上游 `src/socket.ts` 一致。
- **Figma 插件**：`src/cursor_mcp_plugin/`，在 `documentAccess: "dynamic-page"` 下可跨页扫描、可新建页面、支持批量改文案。

## 为什么要这个 fork

上游项目用 Bun 跑中继，且插件在 `dynamic-page` 权限下有四个实际使用中的坑：

| 问题 | 本 fork 的处理 |
|---|---|
| 中继只能 `bun socket` | `node-relay/socket.mjs`，Node ≥ 18 直接跑 |
| `get_document_info` 只返回当前页 | 先 `loadAllPagesAsync()`，返回全部页面 |
| 没有「新建页面」命令，写入只能落在用户当前页 | 新增 `create_page`，写入前先建独立页面 |
| 跨页批量改文案要逐页找节点 | 新增 `scan_all_text` + `node-relay/batch-replace.mjs` |
| 插件断线后不会自动重连（且重连代码有 `undefined` 端口 bug） | 修复并补齐重连/手动断开逻辑 |
| 插件内置上游作者的 GA4 统计 | 已移除，不向任何第三方上报 |
| 插件面板固定 350×600，遮挡画布 | 顶部「−」可折叠成 56px 窄条；支持中文 / English 切换（默认中文） |

`dist/server.js` 也重新构建过：上游提交的旧 `dist` 比源码少 4 个工具（`set_image_fill`、`rename_node`、`create_section`、`set_parent`）。

## 文档导航

| 你是 | 先读 |
|---|---|
| 第一次用，想 15 分钟跑通 | [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md) |
| Agent，或要把任务交给 Agent | [`docs/AGENT-GUIDE.md`](docs/AGENT-GUIDE.md) |
| 日常操作、启动顺序、批量改文案 | [`docs/RUNBOOK.md`](docs/RUNBOOK.md) |
| 接 Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy | [`docs/CLIENTS.md`](docs/CLIENTS.md) |
| 报错排查 | [`docs/PITFALLS.md`](docs/PITFALLS.md) |
| 安全边界 | [`docs/SECURITY.md`](docs/SECURITY.md) |

## 默认支持的客户端

仓库自带 `scripts/setup-clients.mjs`，可把 MCP server 写入以下 7 个 harness 的本地配置：

| Harness | 写入位置 |
|---|---|
| Claude Code | `~/.claude.json` → `mcpServers` |
| Codex | `~/.codex/config.toml` → `[mcp_servers.TalkToFigma]` |
| Cursor | `~/.cursor/mcp.json` → `mcpServers` |
| Trae / Trae CN | `%APPDATA%\Trae CN\User\mcp.json`（macOS 为 `~/Library/Application Support/Trae CN/User/mcp.json`） |
| dsh | `$DSH_HOME/profiles/<profile>/cordis.patch.yml` |
| ZCode | `~/.zcode/cli/config.json` → `mcp.servers` |
| WorkBuddy | `~/.workbuddy/mcp.json` → `mcpServers` |

默认是 **dry-run**，只有加 `--write` 才会写入，并自动备份原文件：

```bash
npm run setup:clients -- --list            # 检测装了哪些
npm run setup:clients -- --all             # 预览会改哪些文件
npm run setup:clients -- --all --write     # 实际写入
npm run setup:clients -- --client codex --write
```

每个 harness 的路径、格式和注意事项见 [`docs/CLIENTS.md`](docs/CLIENTS.md)。

## 快速开始

### 0. 前置条件

| 条件 | 要求 |
|---|---|
| Figma 客户端 | **桌面版**（Windows / macOS）。网页版没有 `Plugins → Development` 菜单，加载不了本地插件 |
| Figma 账号 | 免费版即可，不需要 Dev Mode / 付费席位 |
| Node.js | ≥ 18（不需要 Bun） |
| 操作系统 | Windows / macOS；Linux 没有官方 Figma 桌面版，这套方案不适用 |

> 只需要「Agent 读设计」、不需要改画布的话，可以不走这套：用 Figma REST API 或官方 remote MCP（只读）。

完整的人类向教学见 [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md)。

### 1. 安装

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
```

### 2. 启动中继

```bash
npm run relay
# 等价于 node node-relay/socket.mjs
# 默认监听 ws://127.0.0.1:3055
```

中继要一直开着。插件连上后，日志里会出现频道名：

```text
[relay] joined channel "a1b2c3d4" (1 client(s))
```

### 3. 在 Figma 里加载插件

1. Figma 桌面版 → `Plugins → Development → Import plugin from manifest…`
2. 选择仓库里的 `src/cursor_mcp_plugin/manifest.json`
3. 运行 `Plugins → Development → Agent to Figma`
4. 插件面板点 **Connect**（插件启动时也会自动尝试连接）

插件会随机生成频道并加入，频道名以中继日志为准。

### 4. 配置 MCP 客户端

可以用 `npm run setup:clients -- --all --write` 自动写入 Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy 的配置；也可以手动任选一种：

**A. 直接用上游已发布的 MCP server（推荐，无需本地路径）**

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "npx",
      "args": ["-y", "cursor-talk-to-figma-mcp@latest"]
    }
  }
}
```

**B. 用本仓库构建的 `dist/server.js`**

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "node",
      "args": ["/absolute/path/to/agent-to-figma/dist/server.js"]
    }
  }
}
```

各客户端的写法见 [`examples/`](examples/)。

### 5. 连上并验证

在 MCP 客户端里：

1. `join_channel` → 填第 2 步日志里的频道名
2. `get_document_info` → 能返回页面树就说明全链路通了

## CLI 用法（MCP 未暴露的命令）

插件支持的命令比 MCP 工具列表多。`create_page`、`scan_all_text` 这两个命令 MCP 没有对应工具，用直连脚本：

```bash
# 新建页面并切过去
node node-relay/send-command.mjs <channel> create_page '{"name":"Draft"}'

# 跨页扫描所有文本（可按子串过滤）
node node-relay/send-command.mjs <channel> scan_all_text '{"contains":"example.com"}'

# 跨页批量替换（扫 → 改 → 复扫确认）
node node-relay/batch-replace.mjs <channel> "old text" "new text" [exclude]
```

一次性列命令：

```bash
node node-relay/send-command.mjs <channel> get_document_info '{}'
```

## 改端口

1. 启动中继时设环境变量：`FIGMA_RELAY_PORT=4000 npm run relay`
2. 插件面板的端口输入框填同一个端口
3. 修改 `src/cursor_mcp_plugin/manifest.json` 的 `networkAccess.allowedDomains` / `devAllowedDomains`，把 `3055` 换成新端口（Figma 只允许清单内的 origin）

CLI 脚本同样读取 `FIGMA_RELAY_PORT`。

## 目录结构

```text
node-relay/              Node 中继与 CLI
  socket.mjs             中继（替代上游 Bun 版）
  send-command.mjs       直连单条命令
  batch-replace.mjs      跨页批量替换
  test-relay.mjs         中继协议自测
  start-figma-bridge.cmd Windows 双击启动
src/cursor_mcp_plugin/   已打补丁的 Figma 开发插件
src/talk_to_figma_mcp/   MCP server 源码（未改业务逻辑）
dist/                    MCP server 构建产物（44 个工具）
docs/                    人类教学、Agent 手册、客户端接入、运行手册、坑位清单、安全边界
examples/                各客户端 MCP 配置示例
```

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run relay` | 启动中继 |
| `npm run test:relay` | 中继协议自测（需先启动中继） |
| `npm run send -- <channel> <command> '<json>'` | 直连命令 |
| `npm run build` | 用 tsup 重建 `dist/` |

## 排错

先看 [`docs/PITFALLS.md`](docs/PITFALLS.md)（18 条实际踩过的坑），再按 [`docs/RUNBOOK.md`](docs/RUNBOOK.md) 的顺序启动。最常见的三件事：

- 命令超时 → 频道里没有插件对端（中继没开 / 插件没运行 / 频道名不对）
- `get_document_info` 只看到一个页面 → 用的是旧版插件，不是本仓库的 `manifest.json`
- MCP server 启动时刷 `Socket error` → 中继还没起；server 会自动重试，先起中继即可

安全边界见 [`docs/SECURITY.md`](docs/SECURITY.md)：中继只绑 `127.0.0.1`，无鉴权，本机任意进程都能连。

## 与上游的关系

- 上游：[`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp)，MIT，Copyright (c) 2025 Github User sonnylazuardi
- 本仓库 fork 自上游 `ddd90f3`，改动清单见 [`NOTICE.md`](NOTICE.md)
- 上游原始英文 README 保留在 [`README.upstream.md`](README.upstream.md)

## License

MIT。见 [`LICENSE`](LICENSE) 与 [`NOTICE.md`](NOTICE.md)。
