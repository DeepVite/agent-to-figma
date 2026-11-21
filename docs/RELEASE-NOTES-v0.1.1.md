# v0.1.1 — v0.1.0 的快速修订版

发布日期：2026-11-21

## 变更

### Added

- **架构图补全**：README 架构节现在画出完整链路——MCP（44 工具）与 CLI（send-command.mjs）双入口 → Node 中继 → Figma 插件（唯一执行层）→ Plugin API → Figma 文档，并附上下文成本说明（44 工具定义 ≈ 7k tokens 常驻每轮）
- **运行要求**：新增三组件对照表——Figma 桌面版全程打开、插件保持运行不关闭（可折叠成窄条）、中继常驻；一键安装 prompt 与 GETTING-STARTED 同步提醒
- 点破常见误区：导入 manifest 只是注册，重开 Figma 需重新运行插件

### Changed

- **MCP server 名统一为 `agent-to-figma`**：配置生成器（7 harness）、`.mcp.json`、示例配置、插件 UI 配置片段与 MCP 握手名全部改名；工具前缀相应为 `mcp__agent-to-figma__*`；`dist/` 已重建并复测 44 工具握手
- `.gitignore` 忽略本地工作记忆 `session-memory.md`

## 继承自 v0.1.0

完整能力清单与实测矩阵见 [`RELEASE-NOTES-v0.1.0.md`](RELEASE-NOTES-v0.1.0.md) 与 [`CHANGELOG.md`](../CHANGELOG.md)。

## 升级说明

- 从旧名配置迁移：把客户端配置里的 server 名 `TalkToFigma` 改为 `agent-to-figma`（或直接重跑 `npm run setup:clients -- --all --write`），重启客户端后工具前缀变为 `mcp__agent-to-figma__*`
- 插件无破坏性变更，manifest 与 code.js 兼容 v0.1.0
