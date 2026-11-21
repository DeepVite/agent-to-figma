# Changelog

## 0.1.1 — 2026-11-21

v0.1.0 的快速修订版。

### Added

- README 架构图补全：CLI 并行入口、「插件是唯一能改文档的执行层」、Plugin API 层，附上下文成本说明（44 工具 ≈ 7k tokens 常驻）
- README 新增「运行要求」：Figma 桌面版全程打开、插件保持运行不关闭（可折叠）、中继常驻；一键安装 prompt 与 GETTING-STARTED 同步提醒
- 明确「导入 manifest 只是注册，重开 Figma 需重新运行插件」这一常见误区

### Changed

- MCP server 名统一为 `agent-to-figma`：配置生成器、`.mcp.json`、示例配置、插件配置片段与握手名同步更新；工具前缀相应为 `mcp__agent-to-figma__*`；dist 已重建并复测 44 工具握手
- `.gitignore` 忽略本地工作记忆 `session-memory.md`

## 0.1.0 — 2026-11-21

首个公开里程碑：本地 Figma MCP 桥可安装、可配置、可读写。

### Added

- Node.js WebSocket 中继 `node-relay/socket.mjs`，不再依赖 Bun；支持 `FIGMA_RELAY_PORT` / `FIGMA_RELAY_HOST`
- 已打补丁的 Figma 开发插件：
  - `get_document_info` 跨页返回全部页面
  - `create_page` 新建页面
  - `scan_all_text` 跨页文本扫描
  - 插件面板可折叠为 56px 窄条
  - 中文 / English 切换（默认中文）
  - 断线自动重连、手动断开
- `node-relay/batch-replace.mjs`：跨页批量替换（扫描 → 修改 → 复扫确认）
- `scripts/setup-clients.mjs`：Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy 的配置生成器，默认 dry-run，写入前备份
- MCP server 名统一为 `agent-to-figma`：配置生成器、`.mcp.json`、示例配置、插件配置片段与握手名同步更新；工具前缀相应为 `mcp__agent-to-figma__*`
- `send-command.mjs` 支持 `@params.json`，解决 PowerShell / Git Bash 传中文 JSON 的编码问题
- 一键安装 prompt（README）与分 harness 示例（`examples/one-click-install.md`）
- README 中英双语摘要，以及繁體中文 / 日本語 / 한국어 / Español / Français / Deutsch / Русский / Português 摘要切换

### Fixed

- 插件断线后生成新频道、旧 socket 事件覆盖新连接状态的问题
- 插件重连时端口变成 `undefined` 的问题
- WorkBuddy 实际读取 `~/.workbuddy/mcp.json`，不是 `connectors/default/mcp.json`
- Trae / Trae CN 实际读取 `User/mcp.json`，不是 Claude 兼容路径

### Repository

- 删除冗余的 `CLAUDE.md`；`AGENTS.md` 作为唯一的 Agent 指南。npm 包本来就不包含 `CLAUDE.md`，发布内容不受影响。

### Verified

- **WorkBuddy 5.6.2**：MCP 44/44 工具，`join_channel` → `get_document_info` → `create_frame` → `create_text` → `export_node_as_image` 全链路通过
- **Trae CN 3.4.22**：MCP 整页写入（Frame + 20 个子节点），导出 PNG 正常
- **dsh 0.2.1-rc.5**：`dsh-mcp-client` 条目未注册出 MCP 工具；用 `send-command.mjs` CLI 完成整页写入（Frame + 20 个子节点）
- 中继协议自测、44 个 MCP 工具握手、插件语法检查通过

### Known limitations

- Claude Code、Codex、Cursor 尚未做端到端写入实测（配置生成器已覆盖）
- dsh 0.2.1-rc.5 的 MCP client 未激活，需要走 CLI；不同 dsh 版本可能不同
- Linux 没有官方 Figma 桌面版，不支持
- 中继无鉴权，只适合本机使用

### Security

- 移除上游插件内置的 GA4 统计；当前版本不向任何第三方上报
- 仓库不包含 token、密钥、真实租户数据；`.gitignore` 覆盖 `.env`、密钥、备份和本地 harness 配置
