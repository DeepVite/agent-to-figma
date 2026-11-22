# v0.2.0 — 插件三态交互、Antigravity App / CLI 支持与文本样式双预设

发布日期：2026-11-22

## 亮点变更

### 1. Figma 插件「方案 D」三种存在形态
- **三页签精简面板**：重构 `ui.html` 为 `连接` / `一键启动` / `关于`，「一键启动」自动带入当前端口与频道名生成一键提示词；修复此前 `ui.html` 中未加引号的 `"agent-to-figma"` 键名导致的脚本解析报错（P0）。
- **三种存在形态自由切换**：
  - 完整面板 ↔ 点击顶栏 `−` 折叠为 `212×44` 迷你状态条；
  - 点击顶栏 `隐藏` 进入 0 浮窗后台静默态（保持 WebSocket 不断连），画布底部常驻官方原生状态条，点击 **`展开面板` / `Open Panel`** 按钮秒回主面板；
  - 插件菜单拆为双入口：**打开控制面板 / Open Panel** 与 **静默连接（无窗口） / Silent Connect**。

### 2. 新增 Antigravity App 与 Antigravity CLI（`agy`）支持
- `scripts/setup-clients.mjs` 新增 `antigravity-app` 与 `antigravity-cli`，支持 harness 增至 **9 个**；读写共享的 `~/.gemini/config/mcp_config.json`，兼容首次安装的 0 字节空配置文件。
- 新增 `examples/antigravity-app-mcp.json` 与 `examples/antigravity-cli.md`，同步补齐一键安装提示词与 `docs/CLIENTS.md`。
- **双端均已实测通过**：Antigravity App 44/44 工具热加载 + 读写/PNG 导出全链路通过；Antigravity CLI（`agy`）端到端测试通过。

### 3. 文本样式规范双预设（样式 A / 样式 B 可选）
- 新增 [`docs/TYPOGRAPHY-PRESETS.md`](TYPOGRAPHY-PRESETS.md)，将旧版暖橙精简规范定义为 **样式 A（v1.1）**、新版靛蓝原型说明系统定义为 **样式 B（v2.0）**，并在 [`docs/AGENT-GUIDE.md`](AGENT-GUIDE.md) 中接入，按场景或用户偏好自由选择。

### 4. 文档国际化与发版审计修复
- `README.md` 改为默认英文，顶部语言栏将 **简体中文** 置顶，摘要与一键安装提示词保持中英双语。
- `docs/PITFALLS.md` 新增 **A23**（旧目录 `manifest.json` 缓存导致升级后界面未更新的排查与重导步骤）；`docs/AGENT-GUIDE.md` 补全全部 44 个 MCP 工具清单。
- MCP Server（`dist/server.js`）新增 `FIGMA_RELAY_PORT` 环境变量与 `--port=` 启动参数支持；修复 `setup-clients.mjs` macOS 检测、严格 `--client` 校验与 TOML 段落替换逻辑；`send-command.mjs` 支持 UTF-16LE / UTF-8 BOM 参数文件并在收到进度回报时重置超时。

## 升级说明

- 拉取代码后如已安装过旧版开发插件，请确认 Figma Desktop `Plugins → Development` 中指向的是当前仓库的 `src/cursor_mcp_plugin/manifest.json`（如曾在其他目录导入过同名插件，请先 Remove 旧条目再重新导入，见 `docs/PITFALLS.md` A23），然后关闭旧插件窗口并重新运行，在「关于」页确认显示 `v0.2.0`。
- 完整变更列表见 [`CHANGELOG.md`](../CHANGELOG.md)。
