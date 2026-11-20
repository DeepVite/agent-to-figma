# 客户端支持

仓库自带 `scripts/setup-clients.mjs`，可把 `TalkToFigma` 这个 MCP server 写入以下 harness 的本地配置。

**默认 dry-run，只有加 `--write` 才会落盘；每次写入前自动备份。**

```bash
npm run setup:clients -- --list            # 查看检测结果
npm run setup:clients -- --all             # 预览会改哪些文件
npm run setup:clients -- --all --write     # 实际写入
npm run setup:clients -- --client codex --write
```

## 默认支持的 7 个 harness

| Harness | 配置文件 | 备注 |
|---|---|---|
| **Claude Code** | `~/.claude.json` → `mcpServers` | 写入全局配置；也可在项目根放 `.mcp.json` |
| **Codex** | `~/.codex/config.toml` → `[mcp_servers.TalkToFigma]` | TOML；会保留其它 section |
| **Cursor** | `~/.cursor/mcp.json` → `mcpServers` | 全局 MCP 配置 |
| **Trae / Trae CN** | `%APPDATA%\Trae CN\User\Claude\claude_desktop_config.json`（Windows）<br>`~/Library/Application Support/Trae CN/User/Claude/claude_desktop_config.json`（macOS） | Trae 使用 Claude 兼容的 MCP 配置；同时存在 Trae 与 Trae CN 时两个都写 |
| **dsh（DeepSeek Harness）** | `$DSH_HOME/profiles/<profile>/cordis.patch.yml` | 通过 `@deepseek-ai/dsh-mcp-client` 接入；写入所有已存在的 profile |
| **ZCode** | `~/.zcode/cli/config.json` → `mcp.servers` | 需要 `type: "stdio"` |
| **WorkBuddy** | `~/.workbuddy/mcp.json` → `mcpServers` | 写入后到「专家·技能·连接器 → 我的 MCP」里批准/启用；频道不跨任务轮次保留，见下方说明 |

### WorkBuddy 补充说明

- 配置文件是 `~/.workbuddy/mcp.json`（不是 `connectors/default/mcp.json`）；WorkBuddy 的「我的 MCP」面板保存时也写这个文件。
- 保存后重启 WorkBuddy，并在「专家·技能·连接器 → 我的 MCP」里确认 `TalkToFigma` 已启用，工具数为 44/44。
- **频道不跨任务轮次保留**：每个新任务会重建 MCP server 进程，上一轮的 `join_channel` 状态不继承。新任务的第一条 Figma 命令前必须重新 `join_channel`。
- 实测（2026-11-20，WorkBuddy 5.6.2 / Windows）：MCP 面板显示 44/44 个工具；`join_channel` → `get_document_info` → `create_frame`（15:949）→ `delete_node` → 复核节点数回到原状，全链路通过。

## 写入后的通用步骤

1. **重启对应 harness**（Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy）。
2. 确认 `agent-to-figma` 的 `dist/server.js` 存在：`npm install && npm run build`。
3. 启动中继：`npm run relay`。
4. 在 Figma 桌面版运行插件 **Agent to Figma**。
5. 在 harness 里调用 `join_channel`，频道名从中继日志取。

## 各 harness 的格式示例

- Claude Code / Cursor / Trae / WorkBuddy：见 [`examples/`](../examples/)
- Codex：`examples/codex-config.toml`
- dsh：`examples/dsh-cordis.patch.yml`
- ZCode：`examples/zcode-mcp.json`

## 两个能力边界

- **纯 MCP 客户端**：能用 44 个标准工具；`create_page` / `scan_all_text` 不在 MCP 工具列表里。
- **有 shell 的 harness**：可额外用 `node node-relay/send-command.mjs` / `batch-replace.mjs`，获得建页与跨页扫描能力。

## 常见问题

| 现象 | 处理 |
|---|---|
| 写入后 harness 里看不到 server | 重启 harness；确认配置路径与当前安装的版本一致 |
| Trae 看不到 | 确认写的是 `Trae CN` 还是 `Trae`；两者配置目录不同 |
| dsh 启动报插件错误 | 确认 `$DSH_HOME/profiles/<profile>/node_modules/@deepseek-ai/dsh-mcp-client` 存在 |
| WorkBuddy 不生效 | 到 WorkBuddy 的 MCP/连接器面板确认已启用并批准 |
| 工具列表不是 44 个 | 配置指向了旧 `dist` 或 `npx` 发布包；改用本仓库 `dist/server.js` |
