# NiceCooker 开发规范

> 版本：v1.0 | 日期：2026-07-02 | 适用范围：全体开发者

---

## 目录

1. [Git 工作流](#1-git-工作流)
2. [分支命名规范](#2-分支命名规范)
3. [Commit 规范](#3-commit-规范)
4. [代码风格](#4-代码风格)
5. [命名规范](#5-命名规范)
6. [项目目录结构](#6-项目目录结构)
7. [TypeScript 规范](#7-typescript-规范)
8. [React 组件规范](#8-react-组件规范)
9. [游戏模块规范](#9-游戏模块规范)
10. [Code Review 规范](#10-code-review-规范)
11. [文档规范](#11-文档规范)
12. [CI/CD 规范](#12-cicd-规范)
13. [数值配置规范](#13-数值配置规范)

---

## 1. Git 工作流

### 1.1 总体策略：Trunk-Based Development

```
main ─────────────────────────────────────────────────────→
  │                    │                    │
  ├─ feature/xxx ──→──┤                    │
  │                    ├─ feature/yyy ──→──┤
  │                    │                    ├─ hotfix/zzz ──→
```

- `main` 分支始终可发布
- 所有开发在短生命周期 feature 分支上进行
- feature 分支存活时间 ≤ 3 个工作日
- 通过 PR 合入 main

### 1.2 操作流程

```bash
# 1. 从 main 创建 feature 分支
git checkout main
git pull origin main
git checkout -b feature/<任务编号>-<简短描述>

# 2. 开发 & 提交（见第3章 commit 规范）

# 3. 推送并创建 PR
git push -u origin feature/<任务编号>-<简短描述>

# 4. Code Review 通过后，使用 Squash Merge 合入 main
# （在 GitHub 上操作，不要本地 merge）

# 5. 删除远程 feature 分支
git push origin --delete feature/<任务编号>-<简短描述>
```

### 1.3 禁止事项

- ❌ 直接 push 到 main
- ❌ 使用 `git push --force` 到共享分支
- ❌ feature 分支存活超过 1 周
- ❌ 在 main 上进行修复或开发

---

## 2. 分支命名规范

```
<类型>/<任务编号>-<kebab-case-简短描述>
```

| 类型前缀 | 用途 | 示例 |
|---------|------|------|
| `feature/` | 新功能开发 | `feature/T1-2-coffee-making-loop` |
| `fix/` | Bug 修复 | `fix/T3-7-customer-patience-timer` |
| `refactor/` | 代码重构（无功能变更） | `refactor/T5-1-grid-system-extract` |
| `docs/` | 文档更新 | `docs/readme-setup-instructions` |
| `chore/` | 工程配置、依赖更新 | `chore/eslint-config-setup` |
| `hotfix/` | 紧急线上修复 | `hotfix/save-corruption-on-new-game` |

任务编号沿用 Sprint-Plan.md 中的任务 ID（如 T1.2、M3-C2）。

---

## 3. Commit 规范

### 3.1 格式：Conventional Commits

```
<type>(<scope>): <subject>

[body - 可选，说明变更原因和细节]

[footer - 可选，关闭 issue 编号]
```

### 3.2 Type 定义

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 代码重构 |
| `style` | 代码格式（空格、分号等，不影响逻辑） |
| `docs` | 文档变更 |

| `chore` | 构建/工具/依赖变更 |
| `perf` | 性能优化 |

### 3.3 Scope 定义

| Scope | 适用范围 |
|-------|---------|
| `core` | 游戏核心逻辑（ECS、GameLoop、TimeManager） |
| `renderer` | PixiJS 渲染层（场景、动画、精灵） |
| `ui` | React UI 面板和组件 |
| `store` | Zustand 状态管理 |
| `customer` | 顾客系统 |
| `recipe` | 食谱/制作系统 |
| `economy` | 经济系统 |
| `decoration` | 装修系统 |
| `employee` | 员工系统 |
| `inventory` | 库存系统 |
| `quest` | 任务/成就系统 |
| `save` | 存档系统 |
| `config` | 数值/配置文件 |
| `build` | 构建/CI/工具链 |

### 3.4 示例

```bash
git commit -m "feat(customer): 实现顾客状态机 Enter→Order→Wait→Serve→Leave"

git commit -m "fix(renderer): 修复等距排序在奇数坐标下的 Z-order 错乱

使用拓扑排序替代简单的 Y 坐标比较，消除了深层嵌套物体的遮挡关系错误"

git commit -m "refactor(store): 将 gameStore 拆分为 playerStore + timeStore + shopStore

- 拆分后每个 store < 100 行
- playerStore 独立 persist 中间件，存档粒度更细"

git commit -m "docs(readme): 添加本地开发环境搭建指南"
```

---

## 4. 代码风格

### 4.1 格式化工具

- **格式化**：Prettier（统一配置，保存时自动格式化）
- **Lint**：ESLint（TypeScript 规则 + React 规则）

### 4.2 Prettier 配置

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 4.3 通用规则

- **缩进**：2 空格，禁用 Tab
- **行宽**：≤ 100 字符
- **语句结尾**：必须加分号
- **引号**：字符串用单引号，JSX 属性用双引号
- **尾逗号**：多行结构必须有尾逗号
- **换行符**：LF（Unix 风格）

### 4.4 空格与空行

```typescript
// ✅ 正确
function serveCustomer(customer: Customer, product: Product): void {  // 花括号前有空格
  if (customer.isWaiting) {  // 关键字后有空格
    const price = calculatePrice(product, customer.tipRate);  // 逗号后有空格
    customer.satisfaction += 10;  // 运算符两侧有空格
  }
}

// ❌ 错误
function serveCustomer(customer:Customer,product:Product):void{
  if(customer.isWaiting){
    const price=calculatePrice(product,customer.tipRate);
    customer.satisfaction+=10;
  }
}
```

### 4.5 注释规范

```typescript
/**
 * 计算顾客满意度分数（0-100）
 *
 * 满意度由四个维度加权得出：
 * - 品质分：咖啡品质 1-5 星 → 0-25 分
 * - 环境分：店铺环境分 0-100 → 0-15 分
 * - 速度分：等待时间 vs 耐心值 → 0-20 分
 * - 惩罚分：超时等待 → 0-30 分扣减
 *
 * @param customer - 顾客实例
 * @param product - 提供的产品（含品质星级）
 * @param waitTime - 实际等待时间（秒）
 * @returns 满意度分数 0-100
 *
 * @see Game-Design.md 第3.3.1节满意度计算公式
 */
function calculateSatisfaction(
  customer: Customer,
  product: Product,
  waitTime: number,
): number {
  // ...
}
```

- 公共 API / 导出函数必须 JSDoc
- 复杂算法需要注释解释逻辑
- 避免"注释写什么"式的废话注释（`// i++  // i 自增`）
- TODO/FIXME/HACK 标记需注明负责人和日期：

```typescript
// TODO(liangwenbin 2026-07-15): 等距渲染需要改为拓扑排序
// HACK: MVP 阶段用简单 Y 轴排序过渡
function sortByDepth(entities: Entity[]): Entity[] {
  return entities.sort((a, b) => a.y - b.y);
}
```

---

## 5. 命名规范

### 5.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `CustomerBubble.tsx` |
| React Hook | camelCase，`use` 前缀 | `useGameTime.ts` |
| Zustand Store | camelCase，`Store` 后缀 | `customerStore.ts` |
| 工具函数 | camelCase | `calculatePrice.ts` |
| 类型定义 | PascalCase | `Customer.ts`, `index.ts` |
| 常量/配置 | camelCase | `economyConfig.ts` |

| 样式文件 | 同源文件 + `.module.css` | `StatusBar.module.css` |

### 5.2 变量命名

```typescript
// ✅ 正确
const customerCount = 5;                  // 小驼峰
const MAX_TABLE_SEATS = 4;               // 全大写 + 下划线（常量）
const isWaiting = true;                   // 布尔值用 is/has/can 前缀
const hasUnlockedRecipe = false;

// ❌ 错误
const CustomerCount = 5;                  // 不要大驼峰
const cnt = 5;                            // 不要缩写（除公认的 id、url、api）
const waiting = true;                     // 布尔值缺少前缀
```

### 5.3 类型/接口命名

```typescript
// ✅ 正确
interface CustomerConfig { id: string; }
type ProductQuality = 1 | 2 | 3 | 4 | 5;
enum CustomerState { Entering, Ordering, Waiting, Eating, Leaving }

// ❌ 错误
interface ICustomerConfig {}              // 不使用 I 前缀
type productQuality = 1 | 2 | 3 | 4 | 5; // 类型用 PascalCase
```

### 5.4 函数命名

| 模式 | 示例 | 说明 |
|------|------|------|
| `动词 + 名词` | `serveCustomer()`, `unlockRecipe()` | 有副作用的函数 |
| `get/calculate + 名词` | `getDailyRevenue()` | 纯计算/查询 |
| `on/handle + 事件` | `onCustomerArrive()`, `handleClick()` | 事件处理 |
| `is/can/has + 名词` | `isStoreOpen()`, `canAfford()` | 条件判断 |
| `create/make + 名词` | `createCustomer()` | 工厂/构造函数 |

---

## 6. 项目目录结构

### 6.1 MVP 阶段（单应用）

```
NiceCooker/
├── .github/
│   └── workflows/            # CI/CD
│       └── ci.yml
├── public/                   # 静态资源（不经过构建处理）
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── core/                 # 游戏核心（纯逻辑，无渲染依赖）
│   │   ├── ecs/              # Entity-Component-System
│   │   │   ├── Entity.ts
│   │   │   ├── Component.ts
│   │   │   ├── System.ts
│   │   │   └── World.ts
│   │   ├── systems/          # 各子系统逻辑
│   │   │   ├── customer/     # 顾客 AI、状态机
│   │   │   ├── economy/      # 金币、钻石、价格计算
│   │   │   ├── recipe/       # 食谱、制作流程、品质计算
│   │   │   ├── employee/     # 员工 AI、升级
│   │   │   ├── inventory/    # 库存、采购
│   │   │   ├── decoration/   # 装修网格、碰撞检测
│   │   │   └── quest/        # 任务、成就、事件
│   │   ├── GameLoop.ts       # 主循环 (rAF + 固定步长)
│   │   ├── TimeManager.ts    # 游戏时间管理
│   │   └── EventBus.ts       # 游戏事件总线
│   │
│   ├── renderer/             # Canvas 渲染层（PixiJS）
│   │   ├── scenes/           # 场景管理
│   │   ├── layers/           # 渲染层级
│   │   ├── sprites/          # 精灵/动画
│   │   └── effects/          # 粒子/特效
│   │
│   ├── ui/                   # React UI 层
│   │   ├── components/       # 通用组件
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── ProgressBar/
│   │   │   └── Toast/
│   │   ├── panels/           # 功能面板
│   │   │   ├── StatusBar/
│   │   │   ├── NavBar/
│   │   │   ├── ShopPanel/
│   │   │   ├── DecorationPanel/
│   │   │   ├── EmployeePanel/
│   │   │   ├── RecipeBook/
│   │   │   └── InventoryPanel/
│   │   ├── hooks/            # 通用 Hooks
│   │   └── layouts/          # 布局组件
│   │
│   ├── stores/               # Zustand 状态管理
│   │   ├── playerStore.ts
│   │   ├── customerStore.ts
│   │   ├── timeStore.ts
│   │   ├── shopStore.ts
│   │   ├── inventoryStore.ts
│   │   ├── employeeStore.ts
│   │   ├── recipeStore.ts
│   │   ├── decorationStore.ts
│   │   ├── questStore.ts
│   │   └── uiStore.ts
│   │
│   ├── config/               # 数值配置（可热更新）
│   │   ├── recipes.ts
│   │   ├── customers.ts
│   │   ├── equipment.ts
│   │   ├── furniture.ts
│   │   ├── employees.ts
│   │   ├── economy.ts
│   │   ├── quests.ts
│   │   └── time.ts
│   │
│   ├── utils/                # 工具函数
│   │   ├── math.ts
│   │   ├── random.ts
│   │   ├── format.ts
│   │   └── isometric.ts      # 等距坐标转换
│   │
│   ├── assets/               # 静态资源（经过构建处理）
│   │   ├── images/
│   │   ├── sprites/
│   │   ├── audio/
│   │   └── fonts/
│   │
│   ├── types/                # 全局 TypeScript 类型
│   │   ├── customer.ts
│   │   ├── product.ts
│   │   ├── save.ts
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│

├── docs/                     # 设计文档（已存在）
├── .editorconfig
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

### 6.2 文件组织原则

1. **就近原则**：样式文件放在同级目录
2. **桶导出**：每个目录有 `index.ts`，统一导出
3. **单入口**：`core/` 不引用 `renderer/` 和 `ui/`；`renderer/` 不引用 `ui/`
4. **配置分离**：所有数值放在 `config/`，不与逻辑代码混在一起

---

## 7. TypeScript 规范

### 7.1 严格模式

`tsconfig.json` 必须开启：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 7.2 类型优先

```typescript
// ✅ 正确：明确的类型定义
interface CustomerSatisfaction {
  score: number;        // 0-100
  starRating: 1 | 2 | 3 | 4 | 5;
  tips: number;
}

// ❌ 错误：使用 any
const data: any = loadGame(slotId);  // 禁止 any

// ❌ 错误：过度使用类型断言
const score = data as number;        // 尽量少用 as
```

### 7.3 避免类型体操

```typescript
// ✅ 正确：简单直观
type StarRating = 1 | 2 | 3 | 4 | 5;

// ❌ 过度：为了"酷"而写
type ExtractStarFromTernary<
  T extends number,
  Acc extends unknown[] = []
> = Acc['length'] extends T ? ... // 杀鸡用牛刀
```

### 7.4 空值处理

```typescript
// ✅ 正确：显式处理 null/undefined
const customer = customerStore.findById(id);
if (!customer) {
  console.warn(`Customer ${id} not found`);
  return;
}
// 此处 customer 类型收窄为 Customer

// ❌ 错误
const customer = customerStore.findById(id)!;  // 危险的 ! 断言
customer.serve();  // 可能运行时错误
```

---

## 8. React 组件规范

### 8.1 函数组件 + Hooks

```typescript
// ✅ 正确
import { useState, useCallback } from 'react';

interface StatusBarProps {
  gold: number;
  diamond: number;
  level: number;
}

export function StatusBar({ gold, diamond, level }: StatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="status-bar" onClick={handleClick}>
      <span>🪙 {gold.toLocaleString()}</span>
      <span>💎 {diamond}</span>
      <span>⭐ Lv.{level}</span>
    </div>
  );
}
```

### 8.2 组件规范

- **一个组件一个文件**：禁止多个组件定义在一个文件中
- **Props 必须显式类型**：必须定义 interface（除非仅一个原始类型 prop）
- **导出方式**：优先 named export（`export function StatusBar`），避免 default export
- **组件大小**：单个组件 ≤ 200 行，超过则拆分
- **无副作用渲染**：render 函数本身不应有副作用

### 8.3 Hooks 规范

```typescript
// ✅ 正确：自定义 Hook 封装逻辑
function useGameTime() {
  const time = useTimeStore((s) => s.time);
  const phase = useTimeStore((s) => s.phase);

  return useMemo(() => ({
    formattedTime: formatGameTime(time),
    isBusinessHours: phase !== 'closed',
    currentPhase: phase,
  }), [time, phase]);
}
```

- 自定义 Hook 必须以 `use` 开头
- Hook 必须在组件顶层调用，不在条件/循环中

---

## 9. 游戏模块规范

### 9.1 ECS 规范

```typescript
// Component: 纯数据，无逻辑
interface PositionComponent {
  type: 'position';
  x: number;
  y: number;
}

// System: 纯逻辑，操作 Component
class MovementSystem implements System {
  update(world: World, deltaTime: number): void {
    for (const entity of world.query(['position', 'velocity'])) {
      const pos = entity.get<PositionComponent>('position');
      const vel = entity.get<VelocityComponent>('velocity');
      pos.x += vel.x * deltaTime;
      pos.y += vel.y * deltaTime;
    }
  }
}
```

### 9.2 状态机规范

所有有状态流转的实体（顾客、员工、设备）使用状态机模式：

```typescript
interface State<S extends string, C> {
  name: S;
  enter(context: C): void;
  update(context: C, deltaTime: number): S | null;  // 返回 null 表示停留
  exit(context: C): void;
}

class StateMachine<S extends string, C> {
  private states = new Map<S, State<S, C>>();
  private current: State<S, C> | null = null;

  transition(newState: S, context: C): void {
    this.current?.exit(context);
    this.current = this.states.get(newState) ?? null;
    this.current?.enter(context);
  }
}
```

### 9.3 Config 加载规范

```typescript
// ✅ 正确：配置集中管理，不可变
// src/config/recipes.ts
export const RECIPES: Record<string, RecipeConfig> = {
  americano: {
    id: 'C02',
    name: '美式咖啡',
    baseTime: 12,       // 秒
    ingredients: [['coffee_bean', 1], ['water', 2]],
    basePrice: 30,
    baseExp: 12,
    unlockLevel: 1,
  },
  // ...
} as const;  // 保持只读，防止意外修改
```

---

## 10. Code Review 规范

### 11.1 PR 要求

- PR 描述必须包含：做了什么、为什么这样做
- PR 关联对应的 Sprint-Plan 任务 ID
- 单次 PR 变更 ≤ 400 行（超出需拆分）
- CI 全部通过后才能请求 Review

### 11.2 Reviewer 检查清单

```
□ 逻辑正确性：边界条件、空值处理、状态流转
□ 性能风险：不必要渲染、大对象拷贝、循环中的闭包
□ 可读性：命名清晰、注释合理、无过度抽象
□ 一致性：遵循本文档的命名/风格/结构规范
□ 安全性：无 XSS 风险、用户输入校验
```

### 11.3 Review 礼仪

- 24 小时内响应 Review 请求
- 区分 "必须修"（blocking）和 "建议修"（non-blocking）
- 使用 Conventional Comments：

```
nit: 小建议，不改也可以
suggestion: 建议改进，有利代码质量
issue: 需要讨论的设计问题
todo: 当前可以合入，但需要后续跟进
```

---

## 11. 文档规范

### 12.1 文档存放位置

| 文档类型 | 位置 | 示例 |
|---------|------|------|
| 设计文档 | `docs/` | PRD、TDD、Game-Design |
| 项目说明 | 根目录 | README.md、CONTRIBUTING.md |
| 开发规范 | 根目录 | DEVELOPING.md（本文件） |
| 组件文档 | `src/ui/components/<Name>/README.md` | 复杂组件 |
| 模块文档 | `src/core/systems/<name>/README.md` | 复杂子系统 |

### 12.2 必须更新的文档

- 新增/修改 API：更新 TDD.md 中的类型定义
- 数值调优：更新 Game-Design.md 中的配置表
- 新功能：更新 Sprint-Plan.md 中的任务状态
- 架构变更：更新 TDD.md 中的架构章节

---

## 12. CI/CD 规范

### 13.1 CI 流程

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  lint:       # ESLint + Prettier 检查
  typecheck:  # tsc --noEmit
  build:      # vite build（确认可构建）
```

### 13.2 质量门禁

| 检查项 | 阈值 | 不通过行为 |
|--------|------|-----------|
| ESLint errors | 0 | 阻止合入 |
| TypeScript errors | 0 | 阻止合入 |
| 包体积 | ≤ 500KB（gzip） | 警告 |

---

## 13. 数值配置规范

### 14.1 配置与逻辑分离

所有可调数值必须放在 `src/config/` 中，不在业务逻辑中硬编码：

```typescript
// ❌ 错误：硬编码
if (customer.waitTime > 60) { leave(); }

// ✅ 正确：引用配置
import { CUSTOMER_CONFIG } from '@/config/customers';
const officeWorker = CUSTOMER_CONFIG.types.officeWorker;
if (customer.waitTime > officeWorker.patience) { leave(); }
```

### 14.2 配置结构

```typescript
// src/config/customers.ts
export const CUSTOMER_CONFIG = {
  types: {
    officeWorker: {
      id: 'office_worker',
      name: '上班族',
      patience: 60,              // 秒
      spendingPower: 1.0,        // 消费系数
      tipRate: 0.05,             // 小费概率
      preferences: ['americano', 'latte'],
      appearTimes: ['07-09', '12-13'],
      environmentSensitivity: 0.2,
      qualitySensitivity: 0.3,
      speedSensitivity: 0.9,
      appearWeight: 0.25,
    },
    // ...
  },
  // 全局参数
  global: {
    maxQueueMultiplier: 0.5,     // 排队人数 = 座位数 × 0.5
    returnCustomerThreshold: 3,  // 回头客来访次数阈值
  },
} as const;
```

### 14.3 调参流程

1. 所有数值首次填入以 Game-Design.md 为准
2. 内测阶段通过配置文件或调试面板实时调参
3. 确认的数值更新回 Game-Design.md
4. 数值变更必须走 PR + Code Review

---

## 附录

### A. 推荐 VS Code 插件

- ESLint
- Prettier
- Pretty TypeScript Errors
- GitLens

### B. 推荐 VS Code 设置

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### C. 常用命令

```bash
# 开发
pnpm dev                  # 启动开发服务器

# 质量
pnpm lint                 # ESLint 检查
pnpm lint:fix             # ESLint 自动修复
pnpm typecheck            # TypeScript 类型检查

# 构建
pnpm build                # 生产构建
pnpm preview              # 预览生产构建
```
