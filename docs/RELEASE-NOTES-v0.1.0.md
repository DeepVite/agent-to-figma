# v0.1.0 — 首个公开里程碑

发布日期：2026-11-21

## 这个版本是什么

Agent to Figma 是一个本地 MCP 桥：AI Agent 通过 stdio 连接 MCP server，MCP server 通过 WebSocket 连接 Node 中继，中继再连接 Figma 桌面版里的开发插件。它让 Agent 能读页面树、改文本、建 Frame、导出图片，也能跨页批量改文案。

这个版本的目标不是「功能最多」，而是「clone 下来能稳定跑通，并且知道边界在哪」。

## 亮点

- **不需要 Bun**：Node.js ≥ 18 直接跑中继
- **插件可折叠**：顶部「−」收成 56px，不再遮挡画布
- **中英切换**：默认中文，顶部可切 English
- **跨页能力**：`get_document_info` 返回全部页面，`scan_all_text` 跨页扫描，`create_page` 新建页面
- **7 个 harness 配置生成器**：Claude Code、Codex、Cursor、Trae、dsh、ZCode、WorkBuddy
- **一键安装 prompt**：README 顶部可直接复制给 Agent
- **多语言摘要**：中英双语主摘要，另提供繁體中文、日本語、한국어、Español、Français、Deutsch、Русский、Português 摘要切换
- **CLI 兜底**：MCP 没暴露的命令用 `send-command.mjs`，中文参数用 `@params.json`

## 实测矩阵

| Harness | 版本 | 路径 | 结果 |
|---|---|---|---|
| WorkBuddy | 5.6.2 | MCP | ✅ 只读 + 整页写入 + 导出 |
| Trae CN | 3.4.22 | MCP | ✅ 整页写入 + 导出 |
| dsh | 0.2.1-rc.5 | CLI 兜底 | ⚠️ MCP client 未注册；CLI 整页写入通过 |
| ZCode | 当前环境 | MCP | ✅ 工具加载、join_channel 通过；整页写入待补 |
| Claude Code | — | MCP | 🧪 配置已生成，端到端待测 |
| Codex | — | MCP | 🧪 配置已生成，端到端待测 |
| Cursor | — | MCP | 🧪 配置已生成，端到端待测 |

测试使用本地 Figma 测试文件；页面、节点和频道不会随仓库发布。

## 安装

最短路径：

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
npm run relay
```

然后在 Figma 桌面版导入 `src/cursor_mcp_plugin/manifest.json`，运行 **Agent to Figma**，再按 [`CLIENTS.md`](CLIENTS.md) 配置你的客户端。

或者把 README 顶部的「一键安装」prompt 复制给 Agent。

## 与上游 npx 包的区别

不要用 `npx cursor-talk-to-figma-mcp@latest`：那是上游包，没有本仓库的插件补丁，也没有重建后的 4 个工具（`set_image_fill`、`rename_node`、`create_section`、`set_parent`）。MCP 配置应指向本仓库的 `dist/server.js`。

## 已知限制

- Claude Code / Codex / Cursor 尚未端到端实测
- dsh 0.2.1-rc.5 的 `dsh-mcp-client` 条目未激活，需要 CLI；不同版本可能不同
- Linux 没有官方 Figma 桌面版
- 中继只绑 `127.0.0.1`、无鉴权；不要暴露到局域网/公网
- 不能生成 `.fig` 文件；`.fig` 是 Figma 的私有二进制格式，写入只能走插件 API 或 REST API

## 仓库说明

- `CLAUDE.md` 已删除；`AGENTS.md` 作为唯一的 Agent 指南
- 插件不包含第三方统计
- 仓库不含 token、密钥、真实租户数据
- 中继只监听本机回环，但本机任意进程/浏览器页面都能连接；不要在不可信环境里长期开着
