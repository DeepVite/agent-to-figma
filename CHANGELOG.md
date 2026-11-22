# Changelog

## 0.2.1 — 2026-11-22

配套 Agent Skill 同仓发布、统一 `~/.agents/skills` 安装脚本，以及只读研发方向路线图沉淀。

### Added

- **同仓配套 Agent Skill（`skills/agent-to-figma/`）**：
  - `SKILL.md`：沉淀三组件启动顺序、安全红线（`create_page` 隔离写入）、44 个 MCP 工具 + CLI 速查，以及写入原型/文档画布前**主动询问用户选择「样式 A / 样式 B」并按需加载对应参考规范**的规则
  - `references/style-a.md` / `references/style-b.md` / `references/pitfalls.md`：自包含参考文档，安装到全局目录后跨项目直接生效
- **一键安装 Skill**：`scripts/setup-clients.mjs` 新增 `--install-skill`（`npm run setup:skill -- --write`），统一安装到跨客户端标准目录 `~/.agents/skills/agent-to-figma`（默认 dry-run，更新前自动备份，幂等检测）；`package.json` 的 `files` 纳入 `skills`
- **下一步路线图文档**：新增 `docs/ROADMAP-FIGMA-TO-AGENT.md`，整理 Figma 只读研发场景（`Can view` / 席位限流 / 防拷贝开关）业务规则、5 条候选技术路线与待确认问题清单

### Changed

- `README.md` 与 `examples/one-click-install.md` 的一键安装提示词同步纳入 `npm run setup:skill -- --write`
- 统一各处版本号为 `0.2.1` 并重建 `dist/`

## 0.2.0 — 2026-11-22

插件交互升级、新增 Antigravity App / CLI 支持、文本样式双预设、文档国际化与发版审计修复。

### Added

- **Figma 插件「方案 D」三种存在形态**（`src/cursor_mcp_plugin/manifest.json` / `code.js` / `ui.html`）：
  - 精简为三页签面板（`连接` / `一键启动` / `关于`），「一键启动」动态带入当前端口与频道名生成可复制提示词
  - 顶栏 `−` 折叠为 `212×44` 迷你状态条；顶栏 `隐藏` 进入 0 浮窗后台静默态（保持 WebSocket 不断连），画布底部常驻原生状态条，点击 **`展开面板` / `Open Panel`** 一键呼出
  - 插件菜单拆为双入口：`打开控制面板 / Open Panel` 与 `静默连接（无窗口） / Silent Connect`
- **新增 Antigravity App 与 Antigravity CLI（`agy`）支持**（覆盖 harness 增至 9 个）：
  - `scripts/setup-clients.mjs` 新增 `antigravity-app` 与 `antigravity-cli`，读写共享的 `~/.gemini/config/mcp_config.json`，兼容首次安装的 0 字节空配置文件
  - 新增配置示例 `examples/antigravity-app-mcp.json` 与 `examples/antigravity-cli.md`，补全分 harness 一键安装提示词与接入文档
- **文本样式规范双预设（样式 A / 样式 B）**：新增 `docs/TYPOGRAPHY-PRESETS.md`，正式沉淀 **样式 A（暖橙通用精简风，v1.1）** 与 **样式 B（靛蓝原型说明系统，v2.0）** 供用户按需选择，并接入 `docs/AGENT-GUIDE.md`
- **MCP Server 自定义端口支持**：`src/talk_to_figma_mcp/server.ts` 与重建后的 `dist/` 支持 `FIGMA_RELAY_PORT` 环境变量与 `--port=` 启动参数
- **文档与排障补全**：
  - `docs/AGENT-GUIDE.md` 补齐全部 44 个 MCP 工具清单
  - `docs/PITFALLS.md` 新增 **A23**（首次导入与旧目录 `manifest.json` 缓存导致升级后插件界面不更新的排查与清理）并重排编号

### Changed

- `README.md` 改为默认英文，顶部语言切换栏将 **简体中文** 置顶，摘要与一键安装提示词保持中英双语
- `README.md` 与 `AGENTS.md` 插件命令数修正为 `45`（与 `code.js` 实际启用分支一致）
- `package.json` 的 `files` 纳入 `CHANGELOG.md`；统一 `package.json`、`src/talk_to_figma_mcp/package.json`、`server.ts`（`dist/`）与插件「关于」页版本号为 `0.2.0`

### Fixed

- **P0**：修复 `src/cursor_mcp_plugin/ui.html` 中未加引号的 `"agent-to-figma"` 对象键名导致的脚本解析语法错误
- **P1 / P2**：
  - `scripts/setup-clients.mjs` 修复 macOS 路径检测、严格校验 `--client` 参数、修复 TOML section 替换正则并统一 ZCode 参数斜杠
  - `node-relay/send-command.mjs` 支持 `@params.json` 的 UTF-16LE / UTF-8 BOM 编码、优化缺失文件报错，并在收到 `progress_update` 时重置超时
  - 清理 `docs/CLIENTS.md` 中的本机路径以及示例/文档中遗留的旧命名（`TalkToFigma` 等），修复 `examples/one-click-install.md` 中 Trae 章节菜单名

### Verified

- **Antigravity App（Windows）**：44/44 个 MCP 工具热加载成功，全链路 `join_channel` → `get_document_info` → 建 Frame/矩形/文本/配色/圆角/聚焦 → `export_node_as_image` PNG 导出通过
- **Antigravity CLI（`agy`，Windows）**：`agy mcp list` 正常识别 `agent-to-figma`（`stdio` / `enabled`），端到端 MCP 调用验证通过
- 全部 JS/MJS/CJS、`ui.html` 内联脚本、JSON、隐私扫描（0 泄露）与 `npm pack --dry-run` 通过

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
