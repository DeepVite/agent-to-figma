# Style B — 靛蓝原型说明系统（v2.0）

适用场景：原型旁白、PRD 模块拆解、交互与异常边界标注、多人评审、需要与业务产品 UI 清晰色彩隔离的说明画布。

---

## 1. 核心设计原则

1. **说明层 != 产品 UI 层**：用深色编辑风头图（`#0F172A`）+ 冷调靛蓝（`#4F46E5`）与 Slate 中性色区隔产品原型自身色彩。
2. **缩放巡检可读性**：正文主力 **`14px/22px`**，**最小字号底线 `12px/18px`**，在 Figma 50%–100% 缩放巡检下依然清晰。
3. **100% 嵌套 Auto-Layout**：所有卡片、表格行、胶囊标签、标点说明项、提示块均使用嵌套 Auto-Layout Frame，禁止散落裸 `Rectangle` 或手工估算 X 坐标拼排。
4. **中英混排**：拉丁/数字 `Inter`，中文回退 `PingFang SC` / 微软雅黑；中英文及数字之间保留半角空格（如 `超过 500 字触发 Toast`）。

## 2. 字号阶梯（9 级，底线 12px）

| Token 名称 | 字号 / 字重 / 行高 | 色值 | 适用场景 |
|---|---|---|---|
| `Spec / Display` | `30px` / Bold 700 / `38px` | `#0F172A` | 画布封面、大型需求总标题 |
| `Spec / H1` | `24px` / Bold 700 / `32px` | `#0F172A` | 页面级分区、主业务流程标题 |
| `Spec / H2` | `20px` / SemiBold 600 / `28px` | `#0F172A` | 原型旁白面板标题、功能块标题 |
| `Spec / H3` | `16px` / SemiBold 600 / `24px` | `#0F172A` | 编号标点标题、表格/表单小节 |
| `Spec / Body-L` | `15px` / Regular 400 / `24px` | `#334155` | 页面背景导语、重要结论说明 |
| `Spec / Body` | `14px` / Regular 400 / `22px` | `#334155` | 默认正文、交互步骤（主力） |
| `Spec / Body-S` | `13px` / Regular 400 / `20px` | `#334155` | 字段规则表、紧凑补充描述 |
| `Spec / Caption` | `12px` / Medium 500 / `18px` | `#64748B` | 表头、标签、时间戳（最小底线） |
| `Spec / Code` | `13px` / SemiBold 600 / `20px` | `#4F46E5` | 接口字段、埋点键名、状态枚举（配浅灰底片） |

## 3. 色彩与语义三元组（主色 / 浅底 / 边框）

- **头图与画布**：
  - 深色头图 `#0F172A`（内嵌元信息卡 `#1E293B` / 描边 `1px #334155`）
  - 画布 `#F8FAFC`
  - 卡片 `#FFFFFF`（描边 `1px #E2E8F0`，圆角 `12px`）
- **中性文字（WCAG AA/AAA）**：
  - `Ink/Primary` `#0F172A` · `Ink/Body` `#334155` · `Ink/Muted` `#64748B` · `Ink/Subtle` `#94A3B8`
- **语义三元组**：
  - `Spec / Brand`（标点 / 链接）：主 `#4F46E5` · 底 `#EEF2FF` · 边 `#C7D2FE`
  - `Status / Added`（已定稿 / 新增）：主 `#047857` · 底 `#ECFDF5` · 边 `#A7F3D0`
  - `Status / Edge`（待确认 / 边界）：主 `#B45309` · 底 `#FFFBEB` · 边 `#FDE68A`
  - `Status / Block`（废弃 / 阻断）：主 `#BE123C` · 底 `#FFF1F2` · 边 `#FECDD3`
  - `Tech / API`（接口 / 埋点）：主 `#0369A1` · 底 `#F0F9FF` · 边 `#BAE6FD`

## 4. 空间节奏与 4 套原型专用组件

- **空间与行宽**：说明文本最佳行宽 **`360–520px`**（单行 25–36 汉字）；段落间距 `12px`、标点条目间距 `16px`、模块间距 `32–48px`；说明面板与原型图右缘保持 **`48–64px`** 安全距离。
- **4 套专用构件**：
  1. **编号标点说明项（`Spec/Comp/Pin`）**：圆形靛蓝标点 `01`/`02`/`03`（`26×26`，圆角 `13`，白字 Bold）+ 标题 + 状态胶囊 + 交互规则，与原型图编号锚点一一对应。
  2. **四类语义提示块（`Spec/Comp/Callout`）**：左侧 `4px` 通高语义色条 + 浅底框（`说明 Info` / `新增 Added` / `边界 Warn` / `废弃 Block`）。
  3. **优先级 / 状态 / 端别标签（`Spec/Comp/Badge`）**：HUG 胶囊（`P0 必做`、`已定稿`、`v2.0 新增`、`iOS / Android`、`仅服务端`）。
  4. **状态与异常兜底表（`Spec/Comp/Table`）**：圆角描边表格，列固定对齐，至少覆盖「正常态 / 空态 / 异常超时兜底」。

## 5. Figma 插件实操避坑（搭 Style B 必看）

- **双列/多列卡片等高对齐**：在横向容器（`HORIZONTAL`）内的同级卡片上，显式调用 `set_layout_sizing({ nodeId, layoutSizingHorizontal: "FILL", layoutSizingVertical: "FILL" })`，避免内容行数不同导致底部参差不齐。
- **Callout 左侧 `4px` 语义色条通高**：不要固定色条高度；把左侧 `4px` 竖条放进 `HORIZONTAL` Callout 容器并设置 `layoutSizingVertical: "FILL"`，它会随右侧多行文本自动拉满全高。
- **透明背景陷阱**：不要给 `create_frame` 传 `fillColor: { ..., a: 0 }`（上游 `parseFloat(a) || 1` 会把它变成不透明 `1`）；省略 `fillColor` 或显式传父容器底色。
- **圆角陷阱**：不要对 `set_corner_radius` 传局部 `corners` 布尔数组（会触发 `figma.mixed` Symbol 序列化报错）；统一使用四边圆角 `radius` 并依赖父 Frame 的 `clipsContent` 裁切。
- **完工必做视觉自检**：对根节点或关键模块调用 `export_node_as_image` 导出 PNG 检查文字折行、对齐与留白。
