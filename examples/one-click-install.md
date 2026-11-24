# 一键安装 prompt（分 harness 版）

主 prompt 在 [README](../README.md#one-click-install)。下面是可以直接复制给 Agent 的短版。

前提：Agent 有终端权限；Node.js ≥ 18；Figma 桌面版已安装。所有 prompt 都假设仓库已经 clone 到当前目录；没有的话先执行：

> 说明：`--install-skill` 安装的 `skills/agent-to-figma/` 仅包含连通流程、安全红线与排障参考（主仓只负责写入能力本身）；如需可选的视觉/排版模板预设，见独立仓库 [`agent-to-figma-skills`](https://github.com/DeepVite/agent-to-figma-skills)。

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
```

## Claude Code

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client claude-code --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
4. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info，把页面树结果贴给我
写入配置前先备份；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；不要改其他 MCP。
```

## Codex

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client codex --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
4. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info，把页面树结果贴给我
写入 ~/.codex/config.toml 前先备份；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；不要动其他 section。
```

## Cursor

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client cursor --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
4. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info，把页面树结果贴给我
写入 ~/.cursor/mcp.json 前先备份；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；不要改其他 MCP。
```

## Trae / Trae CN

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client trae --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 Trae / Trae CN，在 MCP 设置面板确认 agent-to-figma 已启用（首次调用按提示允许信任）
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info
配置文件是 User/mcp.json，不是 User/Claude/claude_desktop_config.json；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma。
```

## dsh（DeepSeek Harness）

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client dsh --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 DeepSeek Harness，开新会话，先看工具清单里有没有 mcp__agent-to-figma__*
4. 如果没有（0.2.1-rc.5 实测没有），直接用 shell：
   node node-relay/send-command.mjs <channel> get_document_info '{}'
   写入时用 @params.json 传中文 JSON
5. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
写入 cordis.patch.yml 前先备份；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；不要改其他 profile 配置。
```

## ZCode

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client zcode --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 ZCode，确认 agent-to-figma 的 44 个工具已加载
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info
写入 ~/.zcode/cli/config.json 前先备份；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；不要改其他 mcp.servers。
```

## WorkBuddy

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client workbuddy --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 WorkBuddy，在「我的 MCP」里确认 agent-to-figma 已启用（应为 44/44 个工具）
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 每个新任务的第一条 Figma 命令前先 join_channel，再 get_document_info
配置文件是 ~/.workbuddy/mcp.json；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；频道不跨任务轮次保留。
```

## Antigravity App

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client antigravity-app --install-skill --write
2. 运行 npm run relay（保持后台常驻）
3. 在 Antigravity App 的「... → MCP Servers」（或左侧 Skills & Customizations → MCP Servers）刷新/重启确认 agent-to-figma 已加载 44 个工具
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info，把页面树结果贴给我
配置文件是 ~/.gemini/config/mcp_config.json；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；写入前先备份，不要改其他 mcpServers。
```

## Antigravity CLI (`agy`)

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client antigravity-cli --install-skill --write（或原生命令 agy mcp add agent-to-figma -- node <仓库路径>/dist/server.js 后再运行 npm run setup:skill -- --write）
2. 运行 agy mcp list 确认 agent-to-figma 状态为 enabled
3. 运行 npm run relay（保持后台常驻）
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 拿到频道名后，用 agent-to-figma 调用 join_channel 和 get_document_info，把页面树结果贴给我
与 Antigravity App 共用 ~/.gemini/config/mcp_config.json；配套 Skill 会安装到 ~/.agents/skills/agent-to-figma；写入前先备份，不要改其他 mcpServers。
```

## 通用兜底

如果客户端不在上面，或 MCP 工具没注册：

```text
用仓库里的直连 CLI 控制 Figma：
node node-relay/send-command.mjs <channel> <command> @params.json
先用 get_document_info 确认页面树，再写入；不要动其他页面。
```
