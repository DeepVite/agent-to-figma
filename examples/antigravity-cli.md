# Antigravity CLI (`agy`)

原生 CLI 命令添加：

```bash
agy mcp add agent-to-figma -- node /absolute/path/to/agent-to-figma/dist/server.js
```

或使用本仓库配置生成器（与 Antigravity App 共用 `~/.gemini/config/mcp_config.json`，写入前自动备份）：

```bash
npm run setup:clients -- --client antigravity-cli --write
```

检查是否注册成功：

```bash
agy mcp list
# 应看到 agent-to-figma  stdio  enabled
```

如需仅在单个仓库生效，也可放到工作区根目录的 `.agents/mcp_config.json`（格式见 `examples/antigravity-app-mcp.json`）。

把 `/absolute/path/to/agent-to-figma` 换成你 clone 的仓库路径。不要用上游 npx 包：它没有本仓库的插件补丁和 4 个重建工具。

启动后：

1. 确认中继已运行（`npm run relay`）
2. 在 Figma 桌面版运行 **Agent to Figma** 插件（支持常规面板或静默连接）
3. 在 `agy` 会话里调用 `join_channel`，填中继日志或插件提示中的频道名
4. 调用 `get_document_info` 验证
