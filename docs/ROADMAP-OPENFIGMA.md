# 扩展方向技术评估：支持自托管 OpenFigma（基于 OpenPencil）

> 状态：**技术评估已完成 / 未来扩展方向（Draft / Backlog）**  
> 创建日期：2026-11-22  
> 思考框架：**以终为始（场景驱动）· 第一性原理 · 奥卡姆剃刀原则**  
> 关联文档：[`ROADMAP-FIGMA-TO-AGENT.md`](ROADMAP-FIGMA-TO-AGENT.md)、[`TYPOGRAPHY-PRESETS.md`](TYPOGRAPHY-PRESETS.md)

---

## 1. 背景与评估问题

在完成面向官方 Figma 桌面版的 `Agent to Figma`（v0.2.1）之后，评估如何将这套 AI 读写设计稿的能力扩展到自托管的 **OpenFigma / OpenPencil Cloud** 实例，回答三个核心问题：

1. 底层文件格式、操作 API 与格式约束是否与 `Agent to Figma` 一致？
2. 是否需要复用 `Agent to Figma` 的 MCP / 中继 / 插件体系，还是走 **CLI + Skill** 更优？
3. 最小完备落地架构与关键工程风险是什么？

---

## 2. 核心分析：以终为始 · 第一性原理 · 奥卡姆剃刀

### 2.1 以终为始：聚焦两个真实终局场景
- **产品经理写入向（Agent → 画布）**：输入 PRD、需求改动或批量文案替换需求，AI 直接在云端项目里新建独立页面，按预设排版规范（样式 A / 样式 B）生成可二次编辑的原生画布内容，PM 在浏览器打开即可评审与微调。
- **软件研发只读向（画布 → Agent）**：研发工程师无需购买官方 Figma 付费席位、无需安装桌面客户端，让 AI 直接读取页面树、节点属性、Design Tokens、导出 PNG / SVG / JSX / HTML 辅助开发（天然同时解决 [`ROADMAP-FIGMA-TO-AGENT.md`](ROADMAP-FIGMA-TO-AGENT.md) 中的只读席位限制痛点）。

### 2.2 第一性原理：拆穿两者底层的本质差异

`Agent to Figma` 之所以采用「MCP Server + 3055 WebSocket 中继 + Figma 开发插件」三件套，本质原因是**官方 Figma 是闭源黑盒**——没有开放的本地 `.fig` 写引擎，也没有可修改画布的云端 REST API，唯一能改画布的执行层只有桌面客户端里的 Plugin API。

而自托管 **OpenFigma（基于 OpenPencil）** 的底层前提完全不同：

| 对比维度 | `Agent to Figma`（官方 Figma 桌面版） | **OpenFigma / OpenPencil Cloud** | 评估结论 |
|---|---|---|---|
| **文件与画布模型** | Figma 内部场景图（Page / Frame / Text / Auto Layout / Fill / Radius） | **原生兼容 `.fig`**（开源 `scene-graph` + `fig` + `kiwi` 编解码） | ✅ 画布模型与排版规范（样式 A / 样式 B）高度兼容 |
| **画布操作引擎** | 依赖运行中的 Figma Desktop + Plugin API（44 个原子 MCP 工具串行拼装） | **无头开源 CLI 引擎（`@open-pencil/cli`）**：内置 `info` / `tree` / `pages` / `find` / `query` / `node` / `tokens` / `variables` / `diff` / `lint` / `export` / `import` / `eval`（支持 `--json` 与 `figma.*` API） | 🌟 无需桌面客户端、无需插件和中继 |
| **前端代码双向能力** | 无原生 HTML/Tailwind 转原生图层能力 | **内置两套前端代码引擎**：<br>① **`@open-pencil/html-engine`**（Rust Blitz / Stylo / Taffy / Parley 编译为 WASM）：无头按真实浏览器规则布局 **HTML / CSS / Tailwind**，直接转为**原生可编辑 `.fig` 图层**（非 iframe 死图）；<br>② **`@open-pencil/design-jsx`**：声明式 JSX 画布语法（`<Frame>` / `<Text markdown>` / `<Sticky>` / `<Connector>` / `defineVars` / 可交互控件 / `replace_id` 原地增量更新）；<br>③ **`export` 反向导出**：支持导出 PNG / SVG / PDF / JSX / HTML | 🌟 AI 可直接用最擅长的 **HTML/Tailwind 或 Design JSX 作为中间语言**，1 条命令生成整页原生图层 |
| **云端同步与权限** | 受官方套餐、席位费、REST/MCP 月限流、`Can view` 禁止跑插件限制 | **自主掌控 REST API + 个人令牌（PAT）**：文档读写、分离图片拉取与上传（`/images/links`、`/images`、`/images/commit`）、版本乐观锁（`baseRevisionId`，冲突返回 `409 revision_conflict`） | 🌟 0 席位费、0 官方限流、研发只读天然无阻 |
| **交互协议选择** | MCP 为主 + CLI 补齐 `create_page` / `scan_all_text` | **CLI + Skill 优于 44 工具 MCP**：0 常驻上下文成本（省去 ~7k tokens/轮）、1 次执行整段脚本或整份 HTML、兼容所有带终端的 Agent 客户端 | ✅ 首选 **纯 CLI + Skill**，不强制走 MCP |

### 2.3 奥卡姆剃刀：明确砍掉 3 个「多余实体」
1. **不将 OpenFigma 引擎并入 `agent-to-figma` 仓库**：
   - `agent-to-figma` 保持轻巧（纯 Node、零重依赖、包体 < 200KB），专注官方 Figma 桌面版；
   - OpenPencil 渲染/无头编辑引擎约 146MB 且强绑定云端存储与账号体系，应作为独立项目或随 OpenFigma CLI 仓库演进；
   - **共享层保持极简**：两者复用同一套 **样式 A / 样式 B 排版规范** 与 **`~/.agents/skills/`** 全局 Skill 范式。
2. **不重复开发 44 工具的 OpenFigma MCP Server**：
   - `@open-pencil/cli` 已有完整读写与导出命令（且上游本身自带 `@open-pencil/mcp` 用于连本地应用）；面对云端文档场景，薄封装 CLI + Skill 在速度、Token 成本和跨客户端兼容性上全面占优。
3. **第一阶段不做「AI 实时推送到在线协作房间」**：
   - 实时协作房间涉及多写者同步与快照膨胀风险；第一阶段严格采用「拉取 → 本地无头编辑/新建隔离页 → 乐观锁提交新版本 → 浏览器刷新查看」的不可变版本流，安全且随时可回滚。

---

## 3. 推荐目标架构：`OpenFigma CLI + Skill`

```text
AI Agent (任意带终端的客户端)
  │  加载 ~/.agents/skills/agent-to-openfigma/（安全红线 + 样式 A/B 模板 + 命令速查）
  ▼
OpenFigma Bridge CLI（账号 PAT 鉴权 + 本地按 revisionId 缓存 + 云端图片闭环）
  ├── 只读研发流：info / tree / find / tokens / export (PNG / SVG / JSX / HTML)
  ├── PM 写入流 A（首选评估）：HTML + CSS/Tailwind ──▶ @open-pencil/html-engine ──▶ 原生 .fig
  ├── PM 写入流 B（增量/精细）：Design JSX / figma.* 脚本 ──▶ @open-pencil/core ──▶ 原生 .fig
  ▼
OpenFigma Cloud REST API（/api/documents/:id + /images/links + /uploads + baseRevisionId 乐观锁）
```

---

## 4. 落地前必须补齐的 4 项工程缺口（Backlog）

| 优先级 | 缺口与风险 | 建议解法 |
|---|---|---|
| **P0（数据完整性）** | **云端图片分离存储闭环**：OpenFigma Cloud 将图片独立存于对象存储，直接下载裸 `.fig` 或空 `images: []` 提交会导致已有截图变白丢失 | 在桥接 CLI 中统一接入 `POST /api/documents/:id/images/links`（下载并打包进本地临时 `.fig`）以及 `/images` + `/images/commit` + `commit.images`（上传回填引用），保证编辑往返零丢图 |
| **P0（研发读 + 性能）** | **高频只读命令与本地版本缓存**：避免每次查询都重新下载全量 `.fig` | 按 `(documentId, currentRevisionId)` 建立本地缓存目录，透传 `info` / `tree` / `find` / `tokens` / `export`（统一支持 `--json`） |
| **P1（字体与离线网络）** | **无头 HTML 引擎字体注册与远程字体阻塞**：`@open-pencil/html-engine` 本身不内置字体（缺字体会导致文本段落排空）；且无头 `eval` 在受限网络下访问 `fonts.google.com` 可能卡顿数十秒 | 显式注册本机可用的中英文字体（如 Inter / PingFang SC / 思源黑体 / 系统黑体），并配置离线字体策略或直接调用 `@open-pencil/core` 规避外网字体请求阻塞 |
| **P1（并发安全 + Skill）** | **协作房间冲突与跨项目规范复用** | 利用服务端 `baseRevisionId` 乐观锁明确拦截 `409 revision_conflict`；配套发布 `~/.agents/skills/agent-to-openfigma/`（写前提醒关闭浏览器同文档编辑或新建隔离页/副本，并复用样式 A / 样式 B 选择流程） |

---

## 5. 下一步验证实验清单（MVP Gate）

在正式改造桥接 CLI 前，建议按以下顺序做 3 个最小验证实验（均在本地离线完成，不碰线上原文档）：

- [ ] **实验 1（HTML → `.fig` 还原度与中文字体）**：用样式 B 写一段包含中文标题、多列卡片、提示块、状态表的 HTML/CSS，实测 `openpencil import` → `.fig` → `openpencil export -f png`，验证中文排版、Auto Layout 转换质量与图层可编辑性。
- [ ] **实验 2（Design JSX 能力与增量修改）**：实测用 Design JSX（`<Frame>` / `<Text markdown>` / `defineVars`）生成同款卡片，并验证 `replace_id` 原地局部更新已有图层的稳定性。
- [ ] **实验 3（含图片云端文档无损往返）**：对一份包含多张截图的测试文档执行「下载（含 `/images/links`）→ 修改文案/新增页面 → 带 `images` 回传新版本 → 浏览器打开验收」，并验证并发修改时 `409 revision_conflict` 的拦截表现。
