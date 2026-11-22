# v0.2.1 — 配套 Agent Skill 同仓发布与一键安装

发布日期：2026-11-22

## 变更

### Added

- **仓库内置自包含配套 Skill（`skills/agent-to-figma/`）**：
  - `SKILL.md`：涵盖三组件启动顺序、安全红线（写前 `create_page`）、44 个 MCP 工具 + CLI 速查，以及**写原型说明/文档前主动询问用户选择样式 A（暖橙通用精简风）还是样式 B（靛蓝原型说明系统）**并按需加载的规则
  - `references/style-a.md`、`references/style-b.md`、`references/pitfalls.md`：自包含参考文件，装到全局目录后在任意其他项目里都能跨工作区自动生效
- **统一 `~/.agents/skills` 安装能力**：
  - `scripts/setup-clients.mjs` 新增 `--install-skill`（快捷命令 `npm run setup:skill -- --write`），统一安装到 `~/.agents/skills/agent-to-figma`，支持 dry-run 预览、备份与幂等检测
  - `package.json` 的 `files` 已纳入 `skills/`
- **下一步计划文档**：新增 [`docs/ROADMAP-FIGMA-TO-AGENT.md`](ROADMAP-FIGMA-TO-AGENT.md)，沉淀「Figma to Agent」只读研发读稿场景的 Figma 业务规则、5 条候选路线与待研问题

### Changed

- `README.md`（中英双语一键安装提示词）与 `examples/one-click-install.md` 同步加入 `npm run setup:skill -- --write`
- 同步更新 `package.json`、`src/talk_to_figma_mcp/package.json`、`server.ts`（已重建 `dist/`）与插件「关于」页版本号为 `0.2.1`

## 升级说明

- 拉取代码后运行 `npm run setup:skill -- --write` 即可将配套 Skill 安装或更新到 `~/.agents/skills/agent-to-figma`。
- 完整变更见 [`CHANGELOG.md`](../CHANGELOG.md)。
