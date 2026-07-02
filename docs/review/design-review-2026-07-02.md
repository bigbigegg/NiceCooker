# NiceCooker 文档设计评审（2026-07-02）

## 结论

当前文档覆盖面很完整，但存在多处**跨文档规则冲突**与**关键公式不一致**，会直接影响实现和联调效率。优先建议先做“规则统一版”修订，再进入开发。

---

## 高优先级问题（建议先修）

### 1) 品质系数公式与示例值矛盾（会导致实现错误）

- 证据：
  - [docs/Game-Design.md](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L227) 写的是 `品质系数 = 0.7 + (星级 - 1) × 0.2`，但同一行示例写成 `2星=0.8, 3星=0.9`。
- 问题：
  - 按该公式计算应为 `2星=0.9, 3星=1.1`，与示例冲突。
- 建议：
  - 二选一统一：
  - 若目标是线性增长 0.7/0.9/1.1/1.3/1.5，修正示例。
  - 若目标是 0.7/0.8/0.9/1.2/1.5，改成分段表，不要用线性公式。

### 2) “无惩罚设计”与“扣店铺评价”冲突（核心体验冲突）

- 证据：
  - [docs/PRD.md:125](/Users/liangwenbin/projects/NiceCooker/docs/PRD.md#L125) 写“等待过久会生气离开（扣减店铺评价）”。
  - [docs/PRD.md:460](/Users/liangwenbin/projects/NiceCooker/docs/PRD.md#L460) 写“失败不扣钱，只少赚”。
  - [docs/Game-Design.md:166](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L166) 写“无惩罚”。
  - [docs/Game-Design.md:570](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L570) 又写“极不满意：店铺评价-3”。
- 问题：
  - 规则口径不统一，开发时无法确定是否存在负反馈惩罚。
- 建议：
  - 明确“惩罚边界”：
  - 方案A：完全无惩罚（只损失机会收益，不降评价）。
  - 方案B：轻惩罚（仅降口碑，不扣货币），并在 PRD/Game-Design 全文统一。

### 3) 时间系统定义冲突（会导致 TimeManager 设计返工）

- 证据：
  - [docs/Sprint-Plan.md:198](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L198) 规定从 7:00 开始、22:00 打烊。
  - [docs/Game-Design.md:1356](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L1356) 规定营业 06:00-22:00。
  - [docs/Game-Design.md:1357](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L1357) 写闭店 22:00-06:00。
  - [docs/Game-Design.md:1383](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L1383) 又写深夜 22:00-05:00。
- 问题：
  - 开店时刻和闭店时长冲突，直接影响客流、任务刷新、自动存档触发点。
- 建议：
  - 固化唯一时间基线（例如：06:00 开门、22:00 打烊、22:00-06:00 闭店），并同步到 PRD/TDD/Sprint/UI 文档。

### 4) 存档规则冲突（会导致存档模块接口不稳定）

- 证据：
  - [docs/Sprint-Plan.md:160](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L160) 自动存档每 3 分钟。
  - [docs/TDD.md:1823](/Users/liangwenbin/projects/NiceCooker/docs/TDD.md#L1823) 每游戏天结束或每 5 分钟。
  - [docs/UI-UX-Spec.md:1635](/Users/liangwenbin/projects/NiceCooker/docs/UI-UX-Spec.md#L1635) UI 写“每5分钟”。
  - [docs/Sprint-Plan.md:161](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L161) 手动存档 5 槽。
  - [docs/TDD.md:1873](/Users/liangwenbin/projects/NiceCooker/docs/TDD.md#L1873) `slotId (0-2)`；[docs/TDD.md:3080](/Users/liangwenbin/projects/NiceCooker/docs/TDD.md#L3080) 也写最多 3 槽。
- 问题：
  - SaveManager、设置页、测试用例无法共用同一验收标准。
- 建议：
  - 统一为一套配置：`autoSaveInterval`、`maxSlots`、`dayEndAutoSave` 是否开启，并把数值集中到单一配置源（建议 TDD + config）。

---

## 中优先级问题（建议本周修）

### 5) 架构方案冲突：Monorepo 多包 vs 单应用目录

- 证据：
  - [docs/TDD.md:26](/Users/liangwenbin/projects/NiceCooker/docs/TDD.md#L26) 明确 Monorepo + `packages/*`。
  - [docs/Sprint-Plan.md:98](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L98) 却按 `src/core` 单应用目录拆分。
- 问题：
  - 任务拆解与仓库结构不一致，影响分工和 CI 配置。
- 建议：
  - 先定最终形态：
  - 若保留 Monorepo：Sprint 任务路径全部改为 `packages/...`。
  - 若改单应用：TDD 架构章节应整体降级为单包实现。

### 6) 满意度体系口径不一致（5星制 vs 100分制）

- 证据：
  - [docs/Sprint-Plan.md:292](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L292) 满意度按 5 星计算。
  - [docs/Game-Design.md:563](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L563) 满意度输出 0-100。
- 问题：
  - 结算、UI 展示、统计、任务条件会出现双口径数据。
- 建议：
  - 采用“内部 0-100，展示转 1-5 星”的双层模型，并在文档写明转换规则（例如四舍五入或区间映射）。

### 7) 店铺升级公式冲突

- 证据：
  - [docs/Sprint-Plan.md:325](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L325) 用 `floor(sqrt(totalExp / 100))`。
  - [docs/Game-Design.md:807](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L807) 用 `100 × 等级^1.6 × (1 + 等级 × 0.05)`。
- 问题：
  - 等级节奏完全不同，影响解锁时机和经济平衡。
- 建议：
  - 以 Game-Design 为单一数值真源，Sprint 仅引用“来自 Game-Design 配置表”。

### 8) 装修网格规格冲突（等距 64×32 vs 正方 64×64）

- 证据：
  - [docs/UI-UX-Spec.md:584](/Users/liangwenbin/projects/NiceCooker/docs/UI-UX-Spec.md#L584) 规定等距网格 64×32。
  - [docs/Sprint-Plan.md:456](/Users/liangwenbin/projects/NiceCooker/docs/Sprint-Plan.md#L456) 规定 64×64。
- 问题：
  - 装修系统坐标换算、碰撞占格、渲染排序实现会不一致。
- 建议：
  - 明确 MVP 是否先用“俯视正方网格”降级方案；若是，UI 文档需标“V1.0 前临时 64×64，后续切换 64×32”。

### 9) 设备升级成本曲线过陡，和“不肝”目标存在风险

- 证据：
  - [docs/Game-Design.md:297](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L297) 意式机累计升级成本达到 2,026,739。
  - [docs/Game-Design.md:207](/Users/liangwenbin/projects/NiceCooker/docs/Game-Design.md#L207) Lv10 日净收入上限约 12,500。
- 问题：
  - 单设备升级天数可能过长，玩家会明显感到卡进度。
- 建议：
  - 在数值模拟里增加“关键设备可达天数”约束，例如 Lv10 阶段核心升级 ≤ 3-5 天可达。

---

## 建议的修订顺序

1. 先统一“时间、存档、满意度、升级公式”四个基础规则（P0）。
2. 再统一架构与任务拆解口径（Monorepo vs 单应用）。
3. 最后做数值重平衡（重点检查关键设备升级可达性）。

## 评审备注

- 本次评审主要聚焦“跨文档一致性”和“可实现性”。
- 文档内容本身很丰富，问题集中在“规则有多份真相”，修正后可执行性会明显提升。
