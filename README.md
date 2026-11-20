# Agent to Figma

**语言 / Languages：** [简体中文](#chinese-summary) · [English](#english-summary) · [繁體中文](#summary-zh-tw) · [日本語](#summary-ja) · [한국어](#summary-ko) · [Español](#summary-es) · [Français](#summary-fr) · [Deutsch](#summary-de) · [Русский](#summary-ru) · [Português](#summary-pt)

## 摘要 / Summary

<a id="chinese-summary"></a>
**中文** — Agent to Figma 是一个本地 MCP 桥：让 AI Agent 直接读写 Figma 桌面版。仓库包含已打补丁的 Figma 开发插件、Node.js WebSocket 中继（不需要 Bun），以及 MCP 工具列表没有暴露的 CLI 命令。默认支持 Claude Code、Codex、Cursor、Trae / Trae CN、dsh、ZCode、WorkBuddy 七个 harness；clone 后执行 `npm install --omit=dev` 和 `npm run relay`，在 Figma 导入 `src/cursor_mcp_plugin/manifest.json` 即可。

<a id="english-summary"></a>
**English** — Agent to Figma is a local MCP bridge that lets an AI agent read and edit Figma Desktop. It ships a patched Figma development plugin (multi-page scanning, page creation, batch text replacement), a Node.js WebSocket relay that replaces the Bun-only relay, and CLI helpers for commands the MCP tool list does not expose. It works with Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, and WorkBuddy. Clone the repo, run `npm install --omit=dev` and `npm run relay`, then import `src/cursor_mcp_plugin/manifest.json` in Figma. Forked from [`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp) (MIT).

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![MCP tools](https://img.shields.io/badge/MCP_tools-44-7c3aed)
![Plugin commands](https://img.shields.io/badge/plugin_commands-47-0ea5e9)

## 一键安装（复制给 Agent）

把下面整段复制给有终端权限的 Agent。它会检查环境、克隆、安装、启动中继，并且只给你正在用的客户端写配置。

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
4. 检测我装了哪些 Agent 客户端：
   npm run setup:clients -- --list
   只给我正在使用的客户端写配置（Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy）；命令形式：npm run setup:clients -- --client <id> --write；写入前先备份；不要动其他 MCP。没检测到就问我用哪一个。
5. 告诉我 Figma 里的下一步：
   Plugins → Development → Import plugin from manifest…
   选择 src/cursor_mcp_plugin/manifest.json
   运行 Agent to Figma，把插件显示的频道名告诉我。
6. 用我选择的客户端调用 join_channel(频道名)，再调用 get_document_info；确认返回页面树后，把结果贴给我。

安全边界：不要提交或回显任何 token/密钥；不要把中继暴露到 0.0.0.0；不要改我其他项目的配置；不要 force push。
```

> 不想让 Agent 改配置？只执行 1–3 步，再按下面的[手动安装](#手动安装)操作。

## 这是什么

Agent to Figma 把 Figma 桌面版接进 AI Agent：

- **读**：页面树、节点、文本、样式、组件、选区
- **写**：Frame、矩形、文本、图片填充、圆角、批量替换、新建页面
- **44 个 MCP 工具**，加上 **47 个插件命令**；MCP 没暴露的 `create_page`、`scan_all_text` 用 CLI 补齐
- **不需要 Bun**，Node.js ≥ 18 即可
- 中继只监听 `127.0.0.1`，数据不出本机

### 不是什么

- 不是 Figma 官方 MCP，也不是云服务
- 不能生成 `.fig` 文件，不能替代 Figma 桌面版
- Linux 没有官方 Figma 桌面版，这套方案不适用
- 中继没有鉴权，不要暴露到局域网或公网

## 架构

```
MCP 客户端（Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy）
        │  stdio（MCP 协议）
        ▼
MCP server  ──ws──▶  Node 中继（127.0.0.1:3055）  ◀──ws──  Figma 开发插件
                                                              │
                                                              ▼
                                                          Figma 画布
```

- **MCP server**：`src/talk_to_figma_mcp/server.ts`，44 个工具，`dist/` 已按当前源码重建
- **Node 中继**：`node-relay/socket.mjs`，协议与上游 `src/socket.ts` 一致
- **Figma 插件**：`src/cursor_mcp_plugin/`，支持跨页扫描、新建页面、批量改文案、折叠面板、中英切换

## 手动安装

### 0. 前置条件

| 条件 | 要求 |
|---|---|
| Figma | **桌面版**（Windows / macOS）。网页版没有 `Plugins → Development` 菜单 |
| Figma 账号 | 免费版即可，不需要 Dev Mode / 付费席位 |
| Node.js | ≥ 18（不需要 Bun） |
| 操作系统 | Windows / macOS；Linux 没有官方 Figma 桌面版 |

> 只需要「Agent 读设计」、不需要改画布？可以不走这套，直接用 Figma REST API 或官方 remote MCP（只读）。

### 1. 安装

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
```

`dist/` 已提交，克隆后不需要构建。只有改源码时才需要 `npm run build`。

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
4. 插件面板点 **Connect**（启动时也会自动尝试连接）

插件会生成频道并加入；频道名以插件界面或中继日志为准。

### 4. 配置 MCP 客户端

自动检测并写入（默认 dry-run，`--write` 才落盘，写入前自动备份）：

```bash
npm run setup:clients -- --list            # 检测装了哪些 harness
npm run setup:clients -- --all             # 预览会改哪些文件
npm run setup:clients -- --all --write     # 实际写入
npm run setup:clients -- --client codex --write
```

支持的客户端 id：`claude-code`、`codex`、`cursor`、`trae`、`dsh`、`zcode`、`workbuddy`。

手动配置时，**指向本仓库的 `dist/server.js`**，不要用上游的 npx 包（上游没有本仓库的插件补丁和 4 个重建工具）：

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

项目级 `.mcp.json` 已经配好相对路径 `dist/server.js`，在仓库根目录使用 Claude Code / Cursor 时可直接读取。

### npm 包（可选）

仓库同时发布 npm 包 `agent-to-figma`，只用于分发 MCP server：

```bash
npx -y agent-to-figma
```

MCP 客户端配置：

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "npx",
      "args": ["-y", "agent-to-figma"]
    }
  }
}
```

注意：npm 包只负责启动 MCP server，**不会**启动中继，也不会把 Figma 插件安装到固定位置。中继和插件仍按上面的 clone 步骤准备；插件从 `src/cursor_mcp_plugin/manifest.json` 导入。

### 5. 验证

在 MCP 客户端里：

1. `join_channel` → 填第 2 步拿到的频道名
2. `get_document_info` → 能返回页面树就说明全链路通了

## 支持哪些客户端

| Harness | 配置位置 | 状态（2026-11-21） |
|---|---|---|
| **Claude Code** | `~/.claude.json` → `mcpServers` | 配置已生成；端到端待测 |
| **Codex** | `~/.codex/config.toml` → `[mcp_servers.TalkToFigma]` | 配置已生成；端到端待测 |
| **Cursor** | `~/.cursor/mcp.json` → `mcpServers` | 配置已生成；端到端待测 |
| **Trae / Trae CN** | `%APPDATA%\Trae CN\User\mcp.json`（macOS 为 `~/Library/Application Support/Trae CN/User/mcp.json`） | ✅ Trae CN 3.4.22：MCP 整页写入 |
| **dsh（DeepSeek Harness）** | `$DSH_HOME/profiles/<profile>/cordis.patch.yml` | ⚠️ 0.2.1-rc.5：MCP client 条目未激活；CLI 整页写入已验证 |
| **ZCode** | `~/.zcode/cli/config.json` → `mcp.servers` | ✅ MCP 工具加载、`join_channel` 通过；整页写入待补 |
| **WorkBuddy** | `~/.workbuddy/mcp.json` → `mcpServers` | ✅ WorkBuddy 5.6.2：MCP 整页写入 |

实测用的是本地 Figma 测试文件；页面和节点不会随仓库发布。每个 harness 的路径、格式和注意事项见 [`docs/CLIENTS.md`](docs/CLIENTS.md)。

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

## 常用操作

### MCP 工具

| 工具 | 作用 |
|---|---|
| `join_channel` | 加入插件所在频道，所有命令前必须先调用 |
| `get_document_info` | 读取页面树（含全部页面） |
| `create_frame` / `create_rectangle` / `create_text` | 创建画布节点 |
| `set_fill_color` / `set_corner_radius` | 设置填充与圆角 |
| `export_node_as_image` | 导出 PNG（base64） |
| `set_focus` | 在 Figma 中定位到节点 |

完整工具列表见 [`docs/AGENT-GUIDE.md`](docs/AGENT-GUIDE.md)。

### CLI（MCP 未暴露的命令）

```bash
# 新建页面并切过去
node node-relay/send-command.mjs <channel> create_page '{"name":"Draft"}'

# 跨页扫描所有文本（可按子串过滤）
node node-relay/send-command.mjs <channel> scan_all_text '{"contains":"example.com"}'

# 跨页批量替换（扫 → 改 → 复扫确认）
node node-relay/batch-replace.mjs <channel> "old text" "new text" [exclude]

# 参数含中文/特殊字符时，用 UTF-8 JSON 文件传，避免 Windows 终端编码问题
node node-relay/send-command.mjs <channel> rename_node @params.json
```

### 改端口

1. 启动中继时设环境变量：`FIGMA_RELAY_PORT=4000 npm run relay`
2. 插件面板的端口输入框填同一个端口
3. 修改 `src/cursor_mcp_plugin/manifest.json` 的 `networkAccess.allowedDomains` / `devAllowedDomains`，把 `3055` 换成新端口

CLI 脚本同样读取 `FIGMA_RELAY_PORT`。

## 安全边界

- 中继只监听 `127.0.0.1:3055`，没有鉴权；本机任意进程、浏览器页面都可能连上
- 不要把 `FIGMA_RELAY_HOST` 改成 `0.0.0.0` 暴露到局域网/公网
- 不要在开着桥的机器上运行不可信网页或脚本
- `setup-clients` 写入前会备份原配置；执行 `--write` 前先看 dry-run 输出
- 插件不再包含任何第三方统计；所有数据只在本机回环
- 仓库的 `.gitignore` 已覆盖 `.env`、密钥、备份、临时文件和本地 harness 配置

完整说明见 [`docs/SECURITY.md`](docs/SECURITY.md)。

## 排错

先看 [`docs/PITFALLS.md`](docs/PITFALLS.md)（20+ 条实际踩过的坑），再按 [`docs/RUNBOOK.md`](docs/RUNBOOK.md) 的顺序启动。最常见的三件事：

- 命令超时 → 频道里没有插件对端（中继没开 / 插件没运行 / 频道名不对）
- `get_document_info` 只看到一个页面 → 用的是旧版插件，不是本仓库的 `manifest.json`
- MCP server 启动时刷 `Socket error` → 中继还没起；server 会自动重试，先起中继即可

## 版本与里程碑

当前：**v0.1.0**（2026-11-21，首个公开里程碑）

- 44 个 MCP 工具、47 个插件命令
- Node 中继，无需 Bun
- 7 个 harness 的配置生成器
- 实测：WorkBuddy（MCP）、Trae CN（MCP）、dsh（CLI 兜底）

已知限制：

- Claude Code、Codex、Cursor 尚未做端到端写入实测
- dsh 0.2.1-rc.5 的 `dsh-mcp-client` 条目没有注册出 MCP 工具，需要走 CLI
- Linux 没有官方 Figma 桌面版
- 中继无鉴权，只适合本机使用

详见 [`CHANGELOG.md`](CHANGELOG.md) 与 [`docs/RELEASE-NOTES-v0.1.0.md`](docs/RELEASE-NOTES-v0.1.0.md)。

## 文档导航

| 你是 | 先读 |
|---|---|
| 第一次用，想 15 分钟跑通 | [`docs/GETTING-STARTED.md`](docs/GETTING-STARTED.md) |
| Agent，或要把任务交给 Agent | [`docs/AGENT-GUIDE.md`](docs/AGENT-GUIDE.md) |
| 日常操作、启动顺序、批量改文案 | [`docs/RUNBOOK.md`](docs/RUNBOOK.md) |
| 接 Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy | [`docs/CLIENTS.md`](docs/CLIENTS.md) |
| 一键 prompt 的分 harness 版本 | [`examples/one-click-install.md`](examples/one-click-install.md) |
| 报错排查 | [`docs/PITFALLS.md`](docs/PITFALLS.md) |
| 安全边界 | [`docs/SECURITY.md`](docs/SECURITY.md) |
| 版本变更 | [`CHANGELOG.md`](CHANGELOG.md) |

## 目录结构

```text
node-relay/              Node 中继与 CLI
  socket.mjs             中继（替代上游 Bun 版）
  send-command.mjs       直连单条命令
  batch-replace.mjs      跨页批量替换
  test-relay.mjs         中继协议自测
  start-figma-bridge.cmd Windows 双击启动
scripts/
  setup-clients.mjs      7 个 harness 的 MCP 配置生成器
  setup.sh               项目级 .mcp.json + 依赖安装
src/cursor_mcp_plugin/   已打补丁的 Figma 开发插件
src/talk_to_figma_mcp/   MCP server 源码（未改业务逻辑）
dist/                    MCP server 构建产物（44 个工具）
docs/                    教学、客户端接入、运行手册、坑位清单、安全边界
examples/                各客户端配置示例、一键安装 prompt 变体
```

## 多语言摘要 / Multilingual summaries

> 完整文档目前提供简体中文与英文；以下为其他常见语言的摘要。

<a id="summary-zh-tw"></a>
### 繁體中文

Agent to Figma 是一個本地 MCP 橋樑，讓 AI Agent 直接讀寫 Figma 桌面版。內含已修補的 Figma 開發外掛、Node.js WebSocket 中繼（不需 Bun），以及 MCP 工具列表未提供的 CLI 指令。支援 Claude Code、Codex、Cursor、Trae / Trae CN、dsh、ZCode、WorkBuddy；Clone 後執行 `npm install --omit=dev` 與 `npm run relay`，並在 Figma 匯入 `src/cursor_mcp_plugin/manifest.json`。完整文件以簡體中文與英文為主。

<a id="summary-ja"></a>
### 日本語

Agent to Figma は、AI エージェントが Figma デスクトップ版を読み書きできるようにするローカル MCP ブリッジです。Figma 開発プラグイン、Node.js 製 WebSocket リレー（Bun 不要）、MCP ツールにないコマンド用の CLI を同梱しています。Claude Code、Codex、Cursor、Trae / Trae CN、dsh、ZCode、WorkBuddy に対応。リポジトリを clone して `npm install --omit=dev` と `npm run relay` を実行し、Figma で `src/cursor_mcp_plugin/manifest.json` を読み込んでください。詳細なドキュメントは中国語と英語です。

<a id="summary-ko"></a>
### 한국어

Agent to Figma는 AI 에이전트가 Figma 데스크톱을 읽고 편집할 수 있게 해주는 로컬 MCP 브리지입니다. 패치된 Figma 개발 플러그인, Node.js WebSocket 릴레이(Bun 불필요), MCP 도구 목록에 없는 명령을 위한 CLI를 포함합니다. Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode, WorkBuddy를 지원합니다. 저장소를 clone한 뒤 `npm install --omit=dev`와 `npm run relay`를 실행하고, Figma에서 `src/cursor_mcp_plugin/manifest.json`을 불러오세요. 자세한 문서는 중국어와 영어로 제공됩니다.

<a id="summary-es"></a>
### Español

Agent to Figma es un puente MCP local que permite a un agente de IA leer y editar Figma Desktop. Incluye un plugin de desarrollo de Figma, un relay WebSocket en Node.js (sin Bun) y utilidades CLI para comandos que no están en la lista de herramientas MCP. Compatible con Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode y WorkBuddy. Clona el repositorio, ejecuta `npm install --omit=dev` y `npm run relay`, e importa `src/cursor_mcp_plugin/manifest.json` en Figma. La documentación completa está en chino e inglés.

<a id="summary-fr"></a>
### Français

Agent to Figma est un pont MCP local qui permet à un agent IA de lire et modifier Figma Desktop. Il fournit un plugin de développement Figma, un relais WebSocket Node.js (sans Bun) et des utilitaires CLI pour les commandes absentes de la liste d'outils MCP. Compatible avec Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode et WorkBuddy. Clonez le dépôt, lancez `npm install --omit=dev` et `npm run relay`, puis importez `src/cursor_mcp_plugin/manifest.json` dans Figma. La documentation complète est en chinois et en anglais.

<a id="summary-de"></a>
### Deutsch

Agent to Figma ist eine lokale MCP-Brücke, mit der ein KI-Agent Figma Desktop lesen und bearbeiten kann. Enthalten sind ein Figma-Entwicklungs-Plugin, ein Node.js-WebSocket-Relay (ohne Bun) und CLI-Helfer für Befehle, die nicht in der MCP-Tool-Liste stehen. Unterstützt Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode und WorkBuddy. Repository klonen, `npm install --omit=dev` und `npm run relay` ausführen, dann `src/cursor_mcp_plugin/manifest.json` in Figma importieren. Die vollständige Dokumentation ist auf Chinesisch und Englisch.

<a id="summary-ru"></a>
### Русский

Agent to Figma — это локальный MCP-мост, который позволяет ИИ-агенту читать и редактировать Figma Desktop. В комплекте — плагин разработки Figma, WebSocket-ретранслятор на Node.js (без Bun) и CLI-утилиты для команд, которых нет в списке инструментов MCP. Поддерживаются Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode и WorkBuddy. Склонируйте репозиторий, выполните `npm install --omit=dev` и `npm run relay`, затем импортируйте `src/cursor_mcp_plugin/manifest.json` в Figma. Полная документация — на китайском и английском.

<a id="summary-pt"></a>
### Português

Agent to Figma é uma ponte MCP local que permite a um agente de IA ler e editar o Figma Desktop. Inclui um plugin de desenvolvimento para Figma, um relay WebSocket em Node.js (sem Bun) e utilitários CLI para comandos que não estão na lista de ferramentas MCP. Compatível com Claude Code, Codex, Cursor, Trae / Trae CN, dsh, ZCode e WorkBuddy. Clone o repositório, execute `npm install --omit=dev` e `npm run relay`, e importe `src/cursor_mcp_plugin/manifest.json` no Figma. A documentação completa está em chinês e inglês.

[↑ 回到顶部 / Back to top](#agent-to-figma)

## 与上游的关系

- 上游：[`grab/cursor-talk-to-figma-mcp`](https://github.com/grab/cursor-talk-to-figma-mcp)，MIT，Copyright (c) 2025 Github User sonnylazuardi
- 本仓库 fork 自上游 `ddd90f3`，改动清单见 [`NOTICE.md`](NOTICE.md)
- 上游原始英文 README 保留在 [`README.upstream.md`](README.upstream.md)

## License

MIT。见 [`LICENSE`](LICENSE) 与 [`NOTICE.md`](NOTICE.md)。
