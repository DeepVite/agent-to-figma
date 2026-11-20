# 运行手册

## 1. 组件

| 组件 | 位置 | 说明 |
|---|---|---|
| MCP server | `dist/server.js` | stdio MCP server，44 个工具 |
| Node 中继 | `node-relay/socket.mjs` | 默认 `ws://127.0.0.1:3055` |
| Figma 插件 | `src/cursor_mcp_plugin/manifest.json` | 开发插件，Figma 直接加载本地代码 |
| 直连命令器 | `node-relay/send-command.mjs` | 调用 MCP 未暴露的命令 |
| 批量替换 | `node-relay/batch-replace.mjs` | 跨页扫描 + 替换 + 复扫 |

## 2. 启动顺序

顺序不能乱：**中继 → 插件 → MCP 客户端 join**。

1. 启动中继（保持运行）

   ```bash
   npm run relay
   # 或：node node-relay/socket.mjs
   # 建议落日志：node node-relay/socket.mjs > relay.log 2>&1 &
   ```

2. Figma 桌面版运行插件

   `Plugins → Development → Agent to Figma Bridge`

   （如果是第一次，先 `Plugins → Development → Import plugin from manifest…` 选择
   `src/cursor_mcp_plugin/manifest.json`）

3. 从日志取频道

   ```bash
   grep -o 'joined channel "[^"]*"' relay.log | tail -1
   ```

   插件每次连接都会随机生成频道名，不要硬编码。

4. MCP 客户端 `join_channel(<频道>)`

5. 健康检查：`get_document_info` 能返回页面树 = 全链路通。超时 30s 说明频道里没有对端。

## 3. 安全写入流程

1. **先 `create_page`**，在独立页面上写，绝不直接在用户已有内容的页面上写。
2. 用 `create_frame` + `set_layout_mode(VERTICAL)` + `set_padding` 搭骨架。
3. `create_text` 写字，`set_fill_color` 上色。
4. 改已有节点前先 `get_node_info` 确认。
5. 删除/覆盖用户内容前必须显式确认。

推荐的直连命令：

```bash
node node-relay/send-command.mjs <channel> create_page '{"name":"Draft"}'
node node-relay/send-command.mjs <channel> create_frame '{"x":0,"y":0,"width":414,"height":300,"name":"Card"}'
```

## 4. 跨页批量改文案

```bash
# 1. 先确认旧串分布
node node-relay/send-command.mjs <channel> scan_all_text '{"contains":"old.example.com"}'

# 2. 批量替换（可传排除子串）
node node-relay/batch-replace.mjs <channel> "old.example.com" "new.example.com"

# 3. 脚本会自动复扫，确认剩余 0 条
```

改链接前先验证新地址可访问，避免把活链接改成死链。

## 5. 多客户端接入

- Claude Code：

  ```bash
  claude mcp add TalkToFigma -- npx -y cursor-talk-to-figma-mcp@latest
  ```

- Codex：见 [`../examples/codex-config.toml`](../examples/codex-config.toml)
- ZCode：见 [`../examples/zcode-mcp.json`](../examples/zcode-mcp.json)
- Cursor：见 [`../examples/cursor-mcp.json`](../examples/cursor-mcp.json)

同一时间只让一个 MCP 客户端 join 同一频道，避免命令和回包串台。

## 6. 健康检查（30 秒）

```bash
# 1) 中继在监听
netstat -ano | grep ":3055.*LISTEN"

# 2) 频道名
grep -o 'joined channel "[^"]*"' relay.log | tail -1

# 3) 带内探活（要有插件在线才会返回）
node node-relay/send-command.mjs <channel> get_document_info '{}'
```

MCP 侧：`join_channel` → `get_document_info` 返回页面树即通。

## 7. 端口

默认 3055。修改时三处要一致：

1. `FIGMA_RELAY_PORT=4000 npm run relay`
2. 插件面板的端口输入框
3. `src/cursor_mcp_plugin/manifest.json` 的 `networkAccess` 白名单

## 8. 常见现象速查

| 现象 | 先查 |
|---|---|
| 命令 20/30 秒超时 | 中继是否在跑、插件是否在线、频道是否一致 |
| `get_document_info` 只有 1 个页面 | 是否加载了本仓库的插件（旧插件不会加载全部页面） |
| MCP server 启动刷 `Socket error` | 中继没起；先起中继，server 会自动重连 |
| 插件显示已连接但命令全超时 | 看中继日志是否有 `broadcast to 1 peer(s)`；没有对端就是频道不一致 |
| 改名后文本节点 `name` 也变了 | Figma 默认行为（图层名跟随文本），需要固定名字就再调 `rename_node` |

更多见 [`PITFALLS.md`](PITFALLS.md)。
