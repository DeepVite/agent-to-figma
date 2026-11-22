# 下一步计划与待研方向：Figma to Agent（只读研发场景）

> 状态：**规划调研中（Draft / Backlog）**  
> 创建日期：2026-11-22  
> 关联阶段：已完成 `Agent to Figma` v0.2.0（面向具备编辑权限的画布读写桥接），本文件用于沉淀下一阶段 **「Figma to Agent」只读研发读稿场景** 的业务规则、候选架构与待确认问题，供后续立项研究。

---

## 1. 背景与核心痛点

当前 `Agent to Figma` 解决的是「AI Agent 读写自己拥有编辑权限的 Figma 文件」。

但在实际软件研发协作中，存在一个非常高频的反向场景（**Figma to Agent**）：
- **角色**：前端 / 客户端 / 全栈软件开发工程师，希望让 AI Coding Agent 读取 Figma 设计稿的结构、文案、间距、颜色、组件与切图来辅助编码。
- **权限限制**：研发人员通常只是 **访客（Guest）** 或 **被邀请查看者（`Can view`）**，**没有文件编辑权限**。
- **现有方案为何失效**：Figma 禁止 `Can view` 用户在 Design 模式下运行任何设计插件（包括本地开发插件 `Plugins → Development`），因此基于 Design 插件的 `Agent to Figma` 无法直接在原文件上运行。

---

## 2. Figma 业务规则速查（调研基准：2026-11）

理解「只读研发读稿」绕不开 Figma 的 **3 套独立规则**（容易混淆，后续设计方案必须同时对齐）：

### 2.1 文件权限（File Permission）
- **`Can edit`**：可修改画布，可在 Design 模式下运行普通插件与本地开发插件。
- **`Can view`**：仅查看/评论，**在 Design 模式下彻底禁用插件运行**（无法加载 `Agent to Figma` 这类开发插件）。

### 2.2 席位（Seat）与团队套餐（Plan）限流
即使走官方 MCP 或 REST API 只读，Figma 也会同时校验 **「Token/操作者所属席位」** 与 **「文件所在团队套餐」**：

| 操作者席位 / 文件所在套餐 | Dev Mode & 桌面官方 MCP (`127.0.0.1:3845`) | 官方远程 MCP (`https://mcp.figma.com/mcp`) | REST API（Tier 1：读文件/节点/切图） |
|---|---|---|---|
| **免费 Starter 团队** 或 **付费团队内的 View / Collab 席位** | ❌ 不可用 | ⚠️ 强限流（约 **20 次/月**，超限返回 `429`） | ⚠️ 强限流（约 **20 次/月**） |
| **付费团队（Pro / Org）+ Dev 或 Full 席位** | ✅ 可用 | ✅ 约 **200 次/天**（10–15 次/分） | ✅ 约 **10–15 次/分** |
| **企业版（Enterprise）+ Dev 或 Full 席位** | ✅ 可用 | ✅ 约 **600 次/天**（20 次/分） | ✅ 约 **20 次/分** |

**两个关键约束**：
1. **木桶效应（双门槛）**：即使研发买了付费 Dev 席位，只要设计稿放在**免费 Starter 团队/个人草稿**里，API/MCP 仍按 Starter 限流；反之，文件在付费团队里，但研发是免费 **View 席位**，同样被按月限流。
2. **PAT 绑定席位**：免费 View 账号生成的 Personal Access Token（PAT）无法绕过上述 REST API 限流。

### 2.3 防拷贝开关（文件级安全设置）
- 入口：`Share → Advanced Settings → Viewers can copy, save, and export from this file`（**默认开启**）。
- **开启时（默认）**：`Can view` 用户可以复制图层、导出切图，并可点击 **`Duplicate to your drafts`** 将文件复制到个人草稿箱——**副本归个人所有，立刻拥有 `Can edit` 权限**。
- **关闭时（防泄密）**：`Can view` 用户被禁止复制、导出切图、Duplicate 到 Drafts 以及保存 `.fig`；注意 Figma 将「复制 / 副本 / 导出切图」捆绑在同一开关下，关闭后连带影响 Dev Mode 切图导出。

---

## 3. 候选技术路线对比

| 路线 | 核心原理 | 权限与成本门槛 | 优点 | 主要局限 |
|---|---|---|---|---|
| **路线 1：Figma 官方 MCP** | 直接接入 Figma Remote MCP 或 Desktop MCP | 付费团队 + 研发具备 **Dev / Full 席位** | 官方原厂、结构/Variables/Code Connect/截图最准确、零自研维护 | 研发人数多时 Dev 席位按人头付费成本高；View 席位月限额不足以支撑日常开发 |
| **路线 2：只读 REST API MCP + 缓存层** | 通过 REST API（如 `Figma-Context-MCP` 或自建裁剪层）拉取节点 JSON 与切图并压缩给 LLM | 至少需要一个 **付费团队 Dev/Full 席位** 拉取数据 | 研发无需安装 Figma 桌面版、只读安全、可深度裁剪 JSON 降低 Token 消耗 | 免费 View Token 仍受月限流；共用账号拉取需评估团队/企业合规与缓存一致性 |
| **路线 3：Dev Mode 只读插件桥** | 在插件 `manifest.json` 声明 `editorType: ["dev"]` 与 `capabilities: ["inspect"]`，在 Dev Mode 监听选中节点推给本地 Agent | 文件只需 `Can view`，但账号仍需 **Dev 席位** | **不消耗 REST API 限流额度**，支持「点哪读哪」的交互体验 | 仍受 Dev 席位费用限制 |
| **路线 4：副本流（零成本复用现有插件）** | `Can view` 研发将页面/Frame 复制或 Duplicate 到个人 Drafts，在副本里运行 `Agent to Figma` 只读命令 | **免费账号即可**，只需原文件未关闭「防拷贝开关」 | **0 费用、0 限流**，直接复用现有工具链 | 副本是静态快照，原稿更新需重新同步；若原文件开启防拷贝则完全不可用 |
| **路线 5：设计师侧「Handoff Bundle」交付包** | 由有编辑权的设计师一键导出「结构化精简 JSON + Design Tokens + 页面/组件截图」，随需求入库 Git 或共享目录，研发 Agent 直接读本地文件 | **设计师侧导出，研发 0 权限、0 席位费、无需装 Figma** | **彻底绕开席位费、API 限流、防拷贝和外网限制**；天然带版本快照，最贴合 AI 编程工作流 | 需要设计师（或自动化流程）在定稿/变更时触发导出 |

---

## 4. 待确认问题清单（Open Questions）

下次重启该方向研究时，需先对齐以下决策点：

1. **目标团队的 Figma 付费与席位现状**
   - [ ] 主要是免费 Starter 版，还是付费 Pro / Org / Enterprise 团队？
   - [ ] 研发人员是否已有（或愿意采购）Dev 席位，还是必须保证「View 席位 0 增费可用」？
2. **文件来源与协作关系**
   - [ ] 设计稿以公司内部设计师产出为主（可配合安装插件/导出交付包），还是外部甲方/第三方发来的只读链接（无法要求对方配合）？
   - [ ] 实际项目里是否常见关闭「允许查看者复制与导出」的防泄密文件？
3. **产品定位与仓库归属**
   - [ ] 定位是内部研发提效工具，还是面向开源社区的通用工具？
   - [ ] 作为独立仓库（`figma-to-agent`）演进，还是在当前 `agent-to-figma` 内新增只读导出 / Dev Mode 模式？
4. **Agent 消费的上下文形态**
   - [ ] 研发更偏好「贴一个 Figma 链接实时查询（MCP）」，还是「本地设计规范包 + 截图（Git 随代码走）」？
   - [ ] 需要哪些核心字段才能高还原生成代码？（Auto Layout、Spacing/Radius/Color Tokens、字体层级、组件复用映射、切图资源、交互说明等）
5. **安全与合规边界**
   - [ ] 严格遵守 Figma 服务条款与企业数据防泄漏要求（不绕过防拷贝/访问控制，不共享明文个人 Token）。

---

## 5. 后续调研与验证 Backlog

等第 4 节问题收敛后，按优先级推进以下验证实验：

- [ ] **实测限流基线**：用真实 View 席位与 Dev 席位账号实测 Figma 官方 Remote MCP 与 REST API 在不同文件位置（Starter vs Paid Team）下的实际配额与 `429` 返回头。
- [ ] **评估路线 5 MVP（设计师侧 Handoff Bundle）**：在 `Agent to Figma` 中验证「选中页面/Frame → 一键导出 LLM 友好的精简 JSON + Tokens + PNG 截图包」的体积、Token 占用与代码还原度。
- [ ] **评估路线 3 MVP（Dev Mode Inspect 插件）**：验证 `editorType: ["figma", "dev"]` + `capabilities: ["inspect"]` 在 `Can view` + Dev 席位文件上的实际读写能力边界。
- [ ] **竞品与开源方案拆解**：调研官方 Figma MCP 与主流开源只读 MCP（如 Framelink `Figma-Context-MCP`）在节点树裁剪、样式归一化和切图拉取上的实现细节。
