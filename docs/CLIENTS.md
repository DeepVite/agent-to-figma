# 客户端支持

仓库自带 `scripts/setup-clients.mjs`，可把 `agent-to-figma` 这个 MCP server 写入以下 harness 的本地配置。

**默认 dry-run，只有加 `--write` 才会落盘；每次写入前自动备份。**

```bash
npm run setup:clients -- --list            # 查看检测结果
npm run setup:clients -- --all             # 预览会改哪些文件
npm run setup:clients -- --all --write     # 实际写入
npm run setup:clients -- --client codex --write
```

## 默认支持的 9 个 harness

| Harness | 配置文件 | 备注 |
|---|---|---|
| **Claude Code** | `~/.claude.json` → `mcpServers` | 写入全局配置；也可在项目根放 `.mcp.json` |
| **Codex** | `~/.codex/config.toml` → `[mcp_servers.agent-to-figma]` | TOML；会保留其它 section |
| **Cursor** | `~/.cursor/mcp.json` → `mcpServers` | 全局 MCP 配置 |
| **Trae / Trae CN** | `%APPDATA%\Trae CN\User\mcp.json`（Windows）<br>`~/Library/Application Support/Trae CN/User/mcp.json`（macOS） | Trae 自己的 MCP 配置，不是 Claude 兼容路径；同时存在 Trae 与 Trae CN 时两个都写 |
| **dsh（DeepSeek Harness）** | `$DSH_HOME/profiles/<profile>/cordis.patch.yml` | 通过 `@deepseek-ai/dsh-mcp-client` 接入；写入所有已存在的 profile。0.2.1-rc.5 实测该条目未注册出工具，可用 shell CLI 兜底 |
| **ZCode** | `~/.zcode/cli/config.json` → `mcp.servers` | 需要 `type: "stdio"` |
| **WorkBuddy** | `~/.workbuddy/mcp.json` → `mcpServers` | 写入后到「专家·技能·连接器 → 我的 MCP」里批准/启用；频道不跨任务轮次保留，见下方说明 |
| **Antigravity App** | `~/.gemini/config/mcp_config.json` → `mcpServers` | 全局 MCP 配置（首次安装时可能为 0 字节空文件，`setup-clients` 已自动兼容）；也可在项目根 `.agents/mcp_config.json` 配置工作区级 MCP |
| **Antigravity CLI（`agy`）** | `~/.gemini/config/mcp_config.json` → `mcpServers` | 与 Antigravity App 共用全局 MCP 配置；支持原生 `agy mcp add` 与 `agy mcp list` 检查 |

### dsh（DeepSeek Harness）补充说明

- 配置文件是 `$DSH_HOME/profiles/<profile>/cordis.patch.yml`（未设置 `DSH_HOME` 时默认 `~/.dsh`），条目格式为 `@deepseek-ai/dsh-mcp-client`。
- **实测（2026-11-20，DeepSeek Harness 0.2.1-rc.5）**：desktop profile 的该条目没有注册出 `mcp__agent-to-figma__*` 工具（当时旧名 `mcp__talk-to-figma__*`）；dsh agent 明确报告工具清单里没有它。
- **兜底路径**：dsh 有 shell，可直接用 `node node-relay/send-command.mjs <channel> <command> @params.json` 控制 Figma。实测用这条路径写入 `dsh Write Proof`（Frame `25:1001`，1440×900，20 个子节点）并导出 PNG，页面节点数 21。
- 若你的 dsh 版本能正常加载 MCP client，优先用 `join_channel`；看不到 `mcp__agent-to-figma__*` 就按上面的 CLI 路径走。

### Trae / Trae CN 补充说明

- 配置文件是 `%APPDATA%\Trae CN\User\mcp.json`（macOS `~/Library/Application Support/Trae CN/User/mcp.json`），**不是** `User\Claude\claude_desktop_config.json`。
- 改完重启 Trae；首次调用时 Trae 可能提示信任该 MCP Server，需要允许。
- 实测（2026-11-20，Trae CN 3.4.22）：Agent 任务内 `join_channel` → `get_document_info` → `create_frame`（nodeId 28:994）→ `delete_node` 全链路通过，读取结果与 CLI 一致，测试后页面节点数回到 0。

### WorkBuddy 补充说明

- 配置文件是 `~/.workbuddy/mcp.json`（不是 `connectors/default/mcp.json`）；WorkBuddy 的「我的 MCP」面板保存时也写这个文件。
- 保存后重启 WorkBuddy，并在「专家·技能·连接器 → 我的 MCP」里确认 `agent-to-figma` 已启用，工具数为 44/44。
- **频道不跨任务轮次保留**：每个新任务会重建 MCP server 进程，上一轮的 `join_channel` 状态不继承。新任务的第一条 Figma 命令前必须重新 `join_channel`。
- 实测（2026-11-20，WorkBuddy 5.6.2 / Windows）：MCP 面板显示 44/44 个工具；`join_channel` → `get_document_info` → `create_frame`（15:949）→ `delete_node` → 复核节点数回到原状，全链路通过。

### Antigravity App 补充说明

- 全局配置文件是 `~/.gemini/config/mcp_config.json`（Windows 为 `%USERPROFILE%\.gemini\config\mcp_config.json`），结构为标准 `mcpServers`（stdio 传输，无需 `type` 字段）。
- Antigravity 首次安装后 `~/.gemini/config/mcp_config.json` 可能是 0 字节空文件；`scripts/setup-clients.mjs` 会自动将其视为空对象 `{}` 并安全写入（写入前自动备份）。
- 写入后在 Antigravity App 的 **Additional Options (`...`) → MCP Servers**（或左侧 **Skills & Customizations → MCP Servers**）刷新或重开会话，确认 `agent-to-figma` 已连接并加载 44 个工具（Antigravity 2.0 支持热加载，通常无需重启整个应用）。
- 如需仅在单个仓库生效，也可放到工作区根目录 `.agents/mcp_config.json`。
- **实测（2026-11-22，Antigravity App / Windows）**：44/44 个 MCP 工具热加载成功；CLI `create_page` 建独立测试页 `Antigravity App Proof`（`31:2`）后，MCP 全链路执行 `join_channel` → `get_document_info` → `create_frame`（`31:3` / `31:7`）→ `create_rectangle` → `create_text` → `set_fill_color` → `set_corner_radius` → `set_focus` → `get_node_info` → `export_node_as_image`（PNG 导出正常），其它页面零改动。

### Antigravity CLI（`agy`）补充说明

- 与 Antigravity App **共用** 全局 MCP 配置文件 `~/.gemini/config/mcp_config.json`（同样支持工作区级 `.agents/mcp_config.json`）；如果已经为 Antigravity App 写入过，CLI 会自动识别，无需重复配置。
- 也可以用原生 CLI 命令添加和查看状态：
  - `agy mcp add agent-to-figma -- node /absolute/path/to/agent-to-figma/dist/server.js`
  - `agy mcp list`（确认 `agent-to-figma  stdio  enabled`）
- **实测（2026-11-22，Antigravity CLI / Windows）**：`agy mcp list` 正常识别 `agent-to-figma`（`stdio` / `enabled`），端到端 MCP 调用验证通过。

## 写入后的通用步骤

1. **重启对应 harness**（Claude Code / Codex / Cursor / Trae / dsh / ZCode / WorkBuddy / Antigravity App / Antigravity CLI）。
2. 确认 `agent-to-figma` 的 `dist/server.js` 存在：`npm install && npm run build`。
3. 启动中继：`npm run relay`。
4. 在 Figma 桌面版运行插件 **Agent to Figma**。
5. 在 harness 里调用 `join_channel`，频道名从中继日志取。

## 各 harness 的格式示例

- Claude Code / Cursor / Trae / WorkBuddy / Antigravity App / Antigravity CLI：见 [`examples/`](../examples/)（Antigravity App 为 `examples/antigravity-app-mcp.json`，Antigravity CLI 为 `examples/antigravity-cli.md`）
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
| 工具列表不是 44 个 | 配置指向了旧 `dist` 或上游 `npx` 包（`cursor-talk-to-figma-mcp`）；改用本仓库 `dist/server.js` 或 `npx -y agent-to-figma` |
