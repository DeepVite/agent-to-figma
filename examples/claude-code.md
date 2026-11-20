# Claude Code

```bash
claude mcp add TalkToFigma -- npx -y cursor-talk-to-figma-mcp@latest
```

或者写进项目根目录的 `.mcp.json`（`bash scripts/setup.sh` 会自动生成）：

```json
{
  "mcpServers": {
    "TalkToFigma": {
      "command": "npx",
      "args": ["-y", "cursor-talk-to-figma-mcp@latest"]
    }
  }
}
```

如果要用本仓库构建的 server，把 `command` 改成 `node`，`args` 改成
`["/absolute/path/to/agent-to-figma/dist/server.js"]`。

启动后：

1. 确认中继已运行（`npm run relay`）
2. 在 Claude Code 里调用 `join_channel`，填中继日志里的频道名
3. 调用 `get_document_info` 验证
