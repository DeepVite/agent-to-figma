# 从零跑通（人类向）

这份文档只回答一件事：**一个没接触过这个项目的人，怎么在 15 分钟内让它跑起来。**

## 1. 先确认它适合你

**能做：**

- 让 Agent 读取当前打开的 Figma 文件：页面列表、节点结构、文本内容、选中项
- 让 Agent 修改画布：建页面、建 frame / 文字 / 矩形、改颜色 / 圆角 / 布局 / 文案
- 跨页搜索和批量替换文本
- 导出节点为 PNG

**不能做：**

- 操作没有在 Figma 里打开的文件
- 修改 Figma 账号权限、团队设置、文件分享
- 在 Figma 网页版里使用（见下一节）

## 2. 硬性条件

| 条件 | 要求 | 不满足会怎样 |
|---|---|---|
| Figma 客户端 | **桌面版**（Windows / macOS） | 网页版没有 `Plugins → Development` 菜单，无法加载本地插件 |
| Figma 账号 | 免费版即可 | 不需要 Dev Mode、不需要付费席位 |
| Node.js | ≥ 18 | 中继和 MCP server 都跑不起来 |
| 操作系统 | Windows / macOS | Linux 没有官方 Figma 桌面版，这套方案用不了 |
| Bun | **不需要** | 上游要 Bun，这个 fork 已经换成 Node |
| 网络 | 本机回环 | 插件和 MCP 都连 `127.0.0.1:3055`，不经过外网 |

> 一句话：**没有 Figma 桌面版，就没有「Agent 改画布」这条路。**
> 只要能读设计，可以改用 Figma REST API 或官方 remote MCP（只读）。

## 3. 安装

```bash
git clone https://github.com/DeepVite/agent-to-figma.git
cd agent-to-figma
npm install --omit=dev
```

## 4. 启动中继（第一个终端，保持运行）

```bash
npm run relay
```

看到这行就对了：

```text
[relay] Agent to Figma relay listening on ws://127.0.0.1:3055
```

建议把输出留在一个日志文件里，后面要找频道名：

```bash
npm run relay > relay.log 2>&1 &
```

## 5. 在 Figma 里加载插件

1. 打开 Figma 桌面版，进入你要操作的文件
2. **首次加载 / 更换目录时**：如果之前导入过旧版或其它目录的同名插件，先在 `Plugins → Development` 里右键 **Remove** 移除旧条目，避免出现两个同名插件或仍加载旧代码
3. `Plugins → Development → Import plugin from manifest…`
4. 选择**当前仓库**里的 `src/cursor_mcp_plugin/manifest.json`
5. 运行 `Plugins → Development → Agent to Figma`
6. 插件面板点 **Connect**（插件启动时也会自动尝试）

> 插件支持三种形态随时切换：**三栏完整面板**、点「−」收成的 **`212×44` 迷你条**（可拖到角落或工具栏旁），以及点「隐藏」进入的 **0 浮窗后台静默态**（底部常驻带「展开面板」按钮的提示条，点一下秒回且不断连）；菜单也提供「打开控制面板 / 静默连接（无窗口）」双入口。顶部支持 **中文 / English** 切换（默认中文）。

> **运行与更新要求**：插件必须保持运行状态——窗口可折叠，但不要关闭；每次重开 Figma 后需要重新运行插件（导入 manifest 只是注册，不会自动启动）。每次 `git pull` 更新插件代码后，关闭插件窗口再重新运行（快捷键 `Ctrl + Alt + P` / `Cmd + Option + P`）即可加载新版，并在「关于」页确认版本号。Figma 桌面版全程保持打开，关掉即整条链路断开。

连接成功后，中继日志会出现：

```text
[relay] joined channel "a1b2c3d4" (1 client(s))
```

这个频道名就是 Agent 要 join 的频道。

## 6. 接入你的 MCP 客户端

| 客户端 | 怎么配 |
|---|---|
| Claude Code | `claude mcp add agent-to-figma -- node /absolute/path/to/agent-to-figma/dist/server.js` |
| Codex | 把 `examples/codex-config.toml` 追加到 `~/.codex/config.toml` |
| Cursor | 把 `examples/cursor-mcp.json` 放进 `.cursor/mcp.json` |
| ZCode | 把 `examples/zcode-mcp.json` 合并进 `~/.zcode/cli/config.json` |
| Antigravity App | 把 `examples/antigravity-app-mcp.json` 合并进 `~/.gemini/config/mcp_config.json`（或跑 `npm run setup:clients -- --client antigravity-app --write`） |
| Antigravity CLI（`agy`） | `agy mcp add agent-to-figma -- node /absolute/path/to/agent-to-figma/dist/server.js`（或跑 `npm run setup:clients -- --client antigravity-cli --write`，与 Antigravity App 共用 `~/.gemini/config/mcp_config.json`） |

配置内容本质相同，都是：

```json
{
  "mcpServers": {
    "agent-to-figma": {
      "command": "node",
      "args": ["/absolute/path/to/agent-to-figma/dist/server.js"]
    }
  }
}
```

把 `/absolute/path/to/agent-to-figma` 换成你 clone 的仓库路径。不要用上游 npx 包：它没有本仓库的插件补丁，也没有重建后的 4 个工具。

> **推荐同步安装配套 Agent Skill**：执行 `npm run setup:skill -- --write`，会把本仓库的 `skills/agent-to-figma/` 安装到标准全局目录 `~/.agents/skills/agent-to-figma`。装好后，你在任意其他项目里让 Agent 操作 Figma 时，它会自动加载连通流程、安全红线与避坑手册（本仓只负责写入能力本身，如需可选视觉/模板预设见独立仓库 [`agent-to-figma-skills`](https://github.com/DeepVite/agent-to-figma-skills)）。

## 7. 第一次握手

在 MCP 客户端里按顺序：

1. `join_channel` → 填第 5 步日志里的频道名
2. `get_document_info` → 返回页面列表 = 全链路通了
3. `get_selection` → 选中画布上一个节点再看，能返回节点信息 = 读写都通

## 8. 试一句真实需求

可以对 Agent 说：

- 「读一下当前文件有哪几个页面，各自有多少顶层节点」
- 「新建一个页面叫 Draft，在里面放一张 414×300 的卡片，标题写 Hello」
- 「把所有页面里 `old.example.com` 换成 `new.example.com`，改完告诉我还剩几条」

第三条需要 Agent 有 shell 权限（走 `node-relay/batch-replace.mjs`）；
只能调 MCP 工具的 Agent 做不到跨页批量替换。

## 9. 跑通验收清单

- [ ] `netstat` 能看到 `127.0.0.1:3055` 在监听
- [ ] 中继日志有 `joined channel "..."` 
- [ ] 插件面板显示 Connected
- [ ] `join_channel` 不报错
- [ ] `get_document_info` 返回多个页面（不是只有 1 个）
- [ ] `get_selection` 能读到当前选中节点
- [ ] 新建页面后，Figma 左侧页面列表真的多了一页

## 10. 常见失败

| 现象 | 原因 |
|---|---|
| `join_channel` 成功但所有命令超时 | 频道里没有插件；频道名抄错；插件没点 Connect |
| `get_document_info` 只有 1 个页面 | 加载的不是本仓库的插件（旧插件不会加载全部页面） |
| 插件面板显示 Connected 但命令全超时 | 可能有多个插件实例，join 到了另一个频道；看日志里最后一条 join |
| MCP server 启动刷 `Socket error` | 中继没起；先起中继，server 会自动重试 |
| 导入插件时报 manifest 错误 | 选错文件；要选 `src/cursor_mcp_plugin/manifest.json` |
| 更新代码后插件界面/版本没变化 | Figma 仍指向旧目录的 `manifest.json`，或未关闭旧插件窗口重跑；先在 `Plugins → Development` 移除旧条目再重新导入当前仓库的 `manifest.json`（见 [`PITFALLS.md`](PITFALLS.md) A23） |

更多见 [`PITFALLS.md`](PITFALLS.md)。

## 11. 清理

- 关掉中继进程
- Figma：`Plugins → Development → Manage plugins` 里移除 Agent to Figma
- 删除仓库目录即可，不写注册表、不装全局包
