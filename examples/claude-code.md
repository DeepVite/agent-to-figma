# Claude Code

```bash
claude mcp add TalkToFigma -- node /absolute/path/to/agent-to-figma/dist/server.js
```

或者写进项目根目录的 `.mcp.json`（`bash scripts/setup.sh` 会自动生成）：

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

把 `/absolute/path/to/agent-to-figma` 换成你 clone 的仓库路径。不要用上游 npx 包：它没有本仓库的插件补丁和 4 个重建工具。

启动后：

1. 确认中继已运行（`npm run relay`）
2. 在 Claude Code 里调用 `join_channel`，填中继日志里的频道名
3. 调用 `get_document_info` 验证
