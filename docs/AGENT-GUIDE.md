# 给 Agent 的操作手册

这份文档可以直接喂给其他 Agent（Claude Code / Codex / Cursor / ZCode 等）。
目标：让它在不重新安装、不靠试错的情况下，安全地读写 Figma。

---

## 0. 可直接复制的提示词

```text
你要操作 Figma。本机已经装好 agent-to-figma 桥，不要重装，也不要尝试官方
remote MCP（mcp.figma.com 对非白名单客户端 403）。

【必读】
先读 <repo>/docs/AGENT-GUIDE.md，再动手。

【启动检查】
1. 中继是否在跑：netstat -ano | grep ":3055.*LISTEN"
   没跑就执行：npm run relay（或 node node-relay/socket.mjs），并保持运行
2. Figma 桌面版里是否运行了开发插件 "Agent to Figma"
3. 取频道（插件每次连接都会随机生成）：
   grep -o 'joined channel "[^"]*"' relay.log | tail -1
   有多个插件实例时，和用户确认要操作的是哪一个
4. MCP 工具 join_channel(<频道>)
5. get_document_info 能返回页面树 = 链路通；超时 = 频道里没有对端

【硬规则】
- 写之前先 create_page 建独立页面，绝不在用户已有内容的页面上直接写
- 写入原型说明/文档类画布前，参考 docs/TYPOGRAPHY-PRESETS.md：若用户未指定风格，先询问采用「样式 A（暖橙通用精简风）」还是「样式 B（靛蓝原型说明系统）」
- 删除/覆盖用户内容前必须显式确认
- 改链接前先验证新地址可访问，避免把活链接改成死链
- create_page / scan_all_text 不在 MCP 工具列表里，只能走 node-relay/send-command.mjs
- 没有 shell 权限时：不要假装能建页/跨页扫描，明确告诉用户这两个能力不可用
- 改完必须复核：get_node_info / scan_all_text 复扫，报告改前改后

【交付报告】
每步报告：做了什么、改了哪些节点、验证结果（节点 id / 剩余条数 / 页面名）
```

---

## 1. 环境事实

| 事实 | 值 |
|---|---|
| 中继地址 | `ws://127.0.0.1:3055`（可用 `FIGMA_RELAY_PORT` 改） |
| 频道 | 插件随机生成，只在中继日志里 |
| 操作范围 | Figma 里**当前打开的文件** |
| MCP server | 44 个工具，stdio |
| 插件私有命令 | `create_page`、`scan_all_text`（MCP 工具列表里没有） |
| 其他命令 | `set_parent`、`create_section`、`rename_node`、`set_image_fill` 等已在 MCP 工具里 |

> 关键限制：MCP server 沿用上游，没有为这两个新命令加工具。
> 所以 `create_page` / `scan_all_text` 只能由能执行 shell 的 Agent 调 CLI。

---

## 2. 标准工作流（按顺序）

### 2.1 建立连接

```text
join_channel(<channel>)
```

### 2.2 先读，不要先写

```text
get_document_info()          // 页面列表 + 当前页顶层节点
read_my_design()             // 当前选中内容的完整结构
get_selection()              // 选中项
get_node_info(nodeId)        // 单个节点详情
scan_text_nodes(nodeId)      // 某个子树里的所有文本
```

确认三件事再动手：

1. 目标页面是哪一个（页面 id / 名称）
2. 要改的节点 id 是什么
3. 页面上是否已有用户内容（有就建新页）

### 2.3 写之前先建独立页面

```bash
node node-relay/send-command.mjs <channel> create_page '{"name":"Agent Draft"}'
```

返回 `{ id, name, currentPage }`。**不要跳过这一步直接在用户页面上写。**

### 2.4 搭建内容

> 写入原型说明或文档画布前，先查 [`TYPOGRAPHY-PRESETS.md`](TYPOGRAPHY-PRESETS.md) 确认使用 **样式 A（暖橙通用精简风）** 还是 **样式 B（靛蓝原型说明系统）**；用户未明确时先问再写。

```text
create_frame({ x, y, width, height, name })
set_layout_mode({ nodeId, layoutMode: "VERTICAL" })
set_padding({ nodeId, paddingTop, paddingRight, paddingBottom, paddingLeft })
create_text({ x, y, text, fontSize })
set_fill_color({ nodeId, r, g, b, a })   // 0-1 浮点
set_corner_radius({ nodeId, radius })
```

### 2.5 验证

```text
get_nodes_info(nodeIds)      // 复核结构/文本
scan_all_text({...})         // CLI，复核文案残留
export_node_as_image(...)    // 需要截图时（只出 PNG）
```

### 2.6 把视口带到结果处

```text
set_focus(nodeId)
set_selections(nodeIds)
```

---

## 3. 跨页批量改文案

```bash
# 1. 先看分布
node node-relay/send-command.mjs <channel> scan_all_text '{"contains":"old.example.com"}'

# 2. 批量替换（自动复扫）
node node-relay/batch-replace.mjs <channel> "old.example.com" "new.example.com"

# 3. 脚本输出里确认 "Remaining matches: 0"
```

注意：

- `batch-replace` 是字面量替换，不是正则
- 第四个参数是排除子串
- 改 URL 前先自行验证新地址可访问（HTTP 200）

---

## 4. 安全红线（违反会出事）

1. **不在用户已有内容的页面上直接写**——先 `create_page`
2. **删除/覆盖前确认**——`delete_node`、`delete_multiple_nodes`、`set_text_content` 都可能破坏用户内容
3. **改已有节点前先 `get_node_info`**——确认 id 和类型
4. **不猜频道名**——只从中继日志取
5. **多个插件实例时先问用户**——每个实例一个频道，join 错就操作错文件
6. **不伪造能力**——没有 shell 就说 `create_page`/`scan_all_text` 不可用

---

## 5. 错误对照表

| 报错 / 现象 | 根因 | 处理 |
|---|---|---|
| 命令 20–30s 超时 | 频道里没有插件对端 | 查中继是否在跑、插件是否 Connect、频道是否一致 |
| `Not connected to server` | MCP server 与中继断开 | 先起中继；server 会自动重连 |
| `Unknown command: create_page` | 跑的是旧插件 | 重新导入本仓库的 `manifest.json` 并重跑插件 |
| `get_document_info` 只有 1 个页面 | 旧插件，没有 `loadAllPagesAsync` | 换成本仓库插件 |
| `Cannot call with documentAccess: dynamic-page` | 同步切页 API | 用 `setCurrentPageAsync`（插件已修） |
| `You must join the channel first` | 自定义脚本没先 join | 先 `join`，收到确认再发 `message` |
| 插件显示 Connected 但全超时 | 多实例，UI 显示的频道不是处理命令的那条 | 看日志里连续两条 join，换另一条试 |
| `export_node_as_image` 忽略 format | 插件端硬编码 PNG | 只当 PNG 用；要 SVG/PDF 走 Figma 导出 |

---

## 6. 完整 MCP 工具列表（44 个）

| 分类 | 工具名 |
|---|---|
| 频道连接（1） | `join_channel` |
| 读取与扫描（10） | `get_document_info`、`get_selection`、`read_my_design`、`get_node_info`、`get_nodes_info`、`get_styles`、`get_local_components`、`scan_text_nodes`、`scan_nodes_by_types`、`export_node_as_image` |
| 创建与层级（9） | `create_frame`、`create_rectangle`、`create_text`、`create_section`、`create_component_instance`、`clone_node`、`move_node`、`resize_node`、`set_parent` |
| 删除与命名（3） | `delete_node`、`delete_multiple_nodes`、`rename_node` |
| 样式、文本与图片（6） | `set_fill_color`、`set_stroke_color`、`set_corner_radius`、`set_image_fill`、`set_text_content`、`set_multiple_text_contents` |
| 自动布局（5） | `set_layout_mode`、`set_padding`、`set_axis_align`、`set_layout_sizing`、`set_item_spacing` |
| 实例覆写与标注（5） | `get_instance_overrides`、`set_instance_overrides`、`get_annotations`、`set_annotation`、`set_multiple_annotations` |
| 原型连线与视口（5） | `get_reactions`、`set_default_connector`、`create_connections`、`set_focus`、`set_selections` |

> 另有 2 个插件独有命令不在 MCP 工具列表内：`create_page`、`scan_all_text`（通过 `node-relay/send-command.mjs` 调用）。

---

## 7. 交付报告模板

```text
目标：<要做什么>
操作页面：<page name / id>
改动：
  - <node id> <before> -> <after>
验证：
  - get_node_info: <结果>
  - scan_all_text 残留：<n> 条
未做/受限：<例如：没有 shell，create_page 不可用>
```
