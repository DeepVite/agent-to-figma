# 坑位清单

按「症状 → 根因 → 修法」记录实际踩过的坑。新踩到的坑请追加，标日期。

## A1 · 官方 remote MCP 对非白名单客户端返回 403

- **症状**：配置 `https://mcp.figma.com/mcp` 后提示授权失败；日志里是
  `Dynamic Client Registration rejected (HTTP 403)`。
- **根因**：Figma 的 OAuth 动态注册只放行白名单客户端；官方 remote 也不支持 PAT。
- **修法**：不要修配置、不要换代理。用本仓库的本地桥（MCP server + 中继 + 开发插件）。

## A2 · manifest 的 `id` 撞社区插件 → 改代码不生效

- **症状**：改了本地 `code.js`，重跑插件后行为不变，报 `Unknown command: ...`。
- **根因**：manifest 带社区插件 `id` 时，Figma 会加载线上版本，忽略本地代码。
- **修法**：删掉 manifest 的 `id`，给插件一个独立名字（本仓库已改为
  `Agent to Figma`），重新 `Import plugin from manifest…`。

## A3 · `dynamic-page` 权限下不能同步切页

- **症状**：`Cannot call with documentAccess: dynamic-page. Use figma.setCurrentPageAsync instead.`
- **修法**：`create_page` 用 `await figma.setCurrentPageAsync(page)`；先切页再改名，
  非当前页直接改属性会受限。

## A4 · 插件每次连接都换随机频道名

- **症状**：`join_channel("abc123")` 成功但 `get_document_info` 超时。
- **根因**：插件用随机频道（不是固定 `abc123`），频道名只在中继日志里。
- **修法**：始终从日志取：

  ```bash
  grep -o 'joined channel "[^"]*"' relay.log | tail -1
  ```

  不要硬编码，也不要让用户手抄。

## A5 · 中继是先决条件，且会随宿主进程退出

- **症状**：原来能用的链路突然全部超时；`netstat` 看不到 3055。
- **根因**：中继是独立进程，宿主终端/ZCode 会话/MCP 重启会被一起清掉。
- **修法**：① 重启链路时先起中继；② 长期使用让中继独立常驻
  （Windows 双击 `node-relay/start-figma-bridge.cmd`，或 `nohup`）。
  本仓库插件已带断线重连，重连前请先恢复中继。

## A6 · 不要在用户现有页面上直接写（最高优先级）

- **症状**：用户原有页面内容被新内容覆盖。
- **根因**：为省事把测试 frame 写在用户激活页上。
- **修法**：**任何写入前先 `create_page` 建独立页面**；只在指定目标页写；
  改已有节点前先 `get_node_info`；删改用户内容前显式确认。

## A7 · 自建直连脚本必须「先 join 再发消息」

- **症状**：`send-command.mjs` 超时，插件毫无反应，中继日志只有连接没有广播。
- **根因**：中继协议要求先 `{type:"join", channel}`，收到 `system.result` 后才允许
  `{type:"message"}`，否则回 `You must join the channel first`。
- **修法**：连接后先 join，等确认再发命令（本仓库脚本已处理）。

## A8 · 改完插件代码必须重跑插件

- **症状**：`code.js` / `ui.html` 改完，行为不变。
- **修法**：关闭插件窗口 → `Plugins → Development → Agent to Figma` 重新运行。
  开发插件每次运行都会重读磁盘代码，但运行中的实例不会热更新。

## A9 · 没有 Bun

- **症状**：`bun: command not found`，上游 README 的 `bun setup` / `bun socket` 全不可用。
- **修法**：本仓库的 Node 中继与 `npm` 脚本就是为此准备的；MCP server 也直接用
  `node dist/server.js`。不要为了跑中继去装 Bun。

## A10 · 中继协议要点

- `join` → 回两条 `system`（其中一条 `message.result = "Connected to channel: X"`），
  并通知同频道其他客户端。
- `message` → 以 `{type:"broadcast", sender:"peer", message, channel}` 转发给**同频道其他**
  客户端（不回显给自己，请求-响应靠 id 配对）。
- `progress_update` → 原样转发给其他客户端。
- 信封：外层 `{id, type, channel, message}`，内层 `message: {id, command, params}`；
  插件回包是 `message: {id, result}` 或 `{id, error, result:{}}`。

## A11 · 单次工具调用 30 秒超时

- **症状**：长时间无返回。
- **根因**：几乎都是「频道内无对端」。
- **修法**：先看中继日志有没有 `broadcast to ...`，再判是频道问题、插件没运行还是命令本身慢。

## A12 · 字体

- `create_text` 的字体要在 Figma 端可用（中文建议 PingFang SC / 思源黑体 / 系统已装字体）。
- 本机安装的字体不保证 Figma 插件可用；自定义字体需要先上传到 Figma 账户。

## A13 · TEXT 节点的 `name` 跟着 `characters` 走

- **现象**：`set_text_content` 改完文字，`get_nodes_info` 里节点的 `name` 也变了。
- **原因**：图层名与文本内容一致时（默认命名），Figma 会同步更新 name，属正常行为。
- **修法**：需要固定图层名时，改完显式调 `rename_node`。
- 批量改地址：先 `scan_text_nodes` 或 `scan_all_text` 拉全量，正则匹配旧串 →
  `set_text_content` 逐条替换 → 复扫确认残留 0。

## A14 · `dynamic-page` 模式下只看到 1 个页面

- **症状**：Figma 左侧有十几个页面，但 `get_document_info` 的 `pages` 只返回当前页。
- **根因**：`documentAccess: "dynamic-page"` 下非当前页默认不加载；上游实现又把
  `pages` 写死成 `[当前页]`。
- **修法（本仓库已修）**：`get_document_info` 先 `await figma.loadAllPagesAsync()`，
  `pages` 改为 `figma.root.children.map(...)`；新增 `scan_all_text` 支持跨页扫描。
  任何遍历全部页面的新命令，第一行都要 `await figma.loadAllPagesAsync()`。

## A15 · 批量改文案用 `batch-replace.mjs`

- **行为**：一次连接 → `scan_all_text(contains 旧串)` → 逐条 `set_text_content` →
  再扫一遍确认残留 → 输出前后对照。比逐条调 MCP 工具快，且不会漏页。
- **改地址前必做**：对每种域名/路径形态先做一次可访问性验证（HTTP 200），再批量写。

## A16 · 本机代理会劫持 DNS，测线上地址要绕开

- **症状**：某些域名 `curl` 全超时，`nslookup` 解析到 `198.18.x.x` 之类的假 IP。
- **根因**：本地 TUN 代理的 fake-IP 模式接管 DNS；同 IP 指定 `Host` 头仍超时，
  通常是该 vhost 后端实例没在跑，不是网络问题。
- **判据**：`curl --noproxy '*' -H "Host: <域名>" http://<IP>/` 绕过本地 DNS；
  纯 IP 能 200、换 Host 头挂住 → 服务端站点问题，别改 DNS。
- 结论：**改 Figma 里的链接前，用两种方式都验一遍**。

## A17 · 插件开两条 WS，UI 显示的是「空壳」那条

- **症状**：插件面板显示已连接，中继日志也有对端、广播也送达，但所有命令超时。
- **根因（上游版本）**：`ui.html` 在启动路径上连接了两次，UI 显示的是后连上的那条，
  而真正处理命令、回包的是先连上的那条；回包发到了另一个频道。
- **判据**：中继日志里插件启动时出现连续两条 `joined channel "A"` / `joined channel "B"`。
- **本仓库处理**：`connectToServer` 增加 OPEN/CONNECTING 守卫、旧 socket 的
  `onclose` 不再清空新连接状态，并把端口保存在 `state.serverPort`，重连不会变成
  `ws://localhost:undefined`。若仍复现，先看日志是否有两条连续 join。

## A19 · WorkBuddy 每个新任务重开 MCP 进程，频道不跨轮次（2026-11-20）

- **症状**：上一个任务里 `join_channel` 成功、`get_document_info` 正常；在同一会话里发第二个任务，
  第一条 `create_frame` 直接报 `Must join a channel before sending commands`。
- **根因**：WorkBuddy 的任务轮次会重建 MCP server 进程，上一轮的 WebSocket join 状态不会继承。
- **修法**：**每个新任务的第一条 Figma 命令前都先 `join_channel`**；不要把「上一轮已 join」当前提。
  其它 harness 如果每次会话都重开 server（而不是长驻），行为相同。
- 已实测：join → `get_document_info`（只读）→ `create_frame`（15:949）→ `delete_node` → 复核节点数回到原状。

## A20 · Trae / Trae CN 的 MCP 配置不是 Claude 兼容路径（2026-11-20）

- **症状**：把 `TalkToFigma` 写进 `%APPDATA%\Trae CN\User\Claude\claude_desktop_config.json` 后，
  Trae 的 MCP 面板看不到、Agent 也不会拉起 node 进程。
- **根因**：Trae 用户级 MCP 实际读取 `%APPDATA%\Trae CN\User\mcp.json`；
  `User\Claude\claude_desktop_config.json` 是 Claude Code 扩展的配置，不是 Trae 的 MCP 入口。
- **修法**：写 `User\mcp.json`，结构为
  `{"mcpServers":{"TalkToFigma":{"command":"node","args":["..."],"env":{},"type":"stdio"}}}`；
  改完重启 Trae。工作区级另有 `.trae/mcp.json`。
- **实测（Trae CN 3.4.22）**：Agent 任务里 `join_channel` → `get_document_info` →
  `create_frame`（nodeId 28:994）→ `delete_node` 全链路通过，复核页面节点数回到原状。

## A18 · `export_node_as_image` 只出 PNG

- **现象**：工具参数写了 `format:"SVG"/"PDF"`，实际仍返回 PNG。
- **根因**：插件端 `exportNodeAsImage()` 把 `format` 硬编码为 `"PNG"`，只认 `nodeId` 和 `scale`。
- **行为**：返回 `{imageData: <base64>, mimeType}`，不写本地文件；需要落盘就自行解码
  base64 成 `.png`。
- **修法/边界**：要 SVG/PDF/JPG，走 Figma 界面 Export 面板或 REST API `/v1/images`。
  桥导出只当 PNG 用；`scale` 参数有效。
