# 一键安装 prompt（分 harness 版）

主 prompt 在 [README](../README.md#一键安装复制给-agent)。下面是可以直接复制给 Agent 的短版。

前提：Agent 有终端权限；Node.js ≥ 18；Figma 桌面版已安装。所有 prompt 都假设仓库已经 clone 到当前目录；没有的话先执行：

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
```

## Claude Code

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client claude-code --write
2. 运行 npm run relay（保持后台常驻）
3. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
4. 拿到频道名后，用 TalkToFigma 调用 join_channel 和 get_document_info，把页面树结果贴给我
写入配置前先备份；不要改其他 MCP。
```

## Codex

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client codex --write
2. 运行 npm run relay（保持后台常驻）
3. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
4. 拿到频道名后，用 TalkToFigma 调用 join_channel 和 get_document_info，把页面树结果贴给我
写入 ~/.codex/config.toml 前先备份；不要动其他 section。
```

## Cursor

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client cursor --write
2. 运行 npm run relay（保持后台常驻）
3. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
4. 拿到频道名后，用 TalkToFigma 调用 join_channel 和 get_document_info，把页面树结果贴给我
写入 ~/.cursor/mcp.json 前先备份；不要改其他 MCP。
```

## Trae / Trae CN

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client trae --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 Trae CN，在「专家·技能·连接器 → 我的 MCP」里确认 TalkToFigma 已启用
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 拿到频道名后，用 TalkToFigma 调用 join_channel 和 get_document_info
配置文件是 User/mcp.json，不是 User/Claude/claude_desktop_config.json。
```

## dsh（DeepSeek Harness）

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client dsh --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 DeepSeek Harness，开新会话，先看工具清单里有没有 mcp__talk-to-figma__*
4. 如果没有（0.2.1-rc.5 实测没有），直接用 shell：
   node node-relay/send-command.mjs <channel> get_document_info '{}'
   写入时用 @params.json 传中文 JSON
5. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
写入 cordis.patch.yml 前先备份；不要改其他 profile 配置。
```

## ZCode

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client zcode --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 ZCode，确认 TalkToFigma 的 44 个工具已加载
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 拿到频道名后，用 TalkToFigma 调用 join_channel 和 get_document_info
写入 ~/.zcode/cli/config.json 前先备份；不要改其他 mcp.servers。
```

## WorkBuddy

```text
在 agent-to-figma 仓库根目录：
1. 运行 npm run setup:clients -- --client workbuddy --write
2. 运行 npm run relay（保持后台常驻）
3. 重启 WorkBuddy，在「我的 MCP」里确认 TalkToFigma 已启用（应为 44/44 个工具）
4. 告诉我 Figma 桌面版里导入 src/cursor_mcp_plugin/manifest.json 并运行 Agent to Figma
5. 每个新任务的第一条 Figma 命令前先 join_channel，再 get_document_info
配置文件是 ~/.workbuddy/mcp.json；频道不跨任务轮次保留。
```

## 通用兜底

如果客户端不在上面，或 MCP 工具没注册：

```text
用仓库里的直连 CLI 控制 Figma：
node node-relay/send-command.mjs <channel> <command> @params.json
先用 get_document_info 确认页面树，再写入；不要动其他页面。
```
