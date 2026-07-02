# 咖啡厅经营小游戏 — 技术设计文档（TDD）

> 版本：v1.0 | 日期：2026-07-02 | 状态：初稿
>
> 基于 PRD v1.0 编写

---

## 目录

1. [整体架构](#1-整体架构)
2. [技术选型详解](#2-技术选型详解)
3. [核心模块设计](#3-核心模块设计)
4. [组件树设计](#4-组件树设计)
5. [数据流设计](#5-数据流设计)
6. [关键接口与类型定义](#6-关键接口与类型定义)
7. [性能优化策略](#7-性能优化策略)
8. [开发规范](#8-开发规范)

---

## 1. 整体架构

### 1.1 仓库结构

本项目目标架构为**单仓库（Monorepo）**，使用 `pnpm workspace` 管理多包。MVP 阶段建议采用单应用结构（`src/` 目录拆分），降低初期搭建复杂度，V1.0 时迁移至完整 Monorepo。选择 Monorepo 作为目标架构的理由：

- 项目规模适中，不涉及独立发布的多个 npm 包
- 游戏逻辑与 UI 紧密耦合，频繁交叉引用
- 统一的构建、测试、lint 配置，降低维护成本
- 团队成员可在一个仓库中完成全部开发

```
NiceCooker/
├── .github/                        # GitHub 配置
│   ├── workflows/                  # CI/CD 流水线
│   │   ├── ci.yml                  # 代码检查 + 类型检查 + 测试
│   │   └── deploy.yml              # 部署到 GitHub Pages / Vercel
│   └── PULL_REQUEST_TEMPLATE.md    # PR 模板
├── .vscode/                        # VSCode 工作区配置
│   ├── settings.json               # 统一编辑器设置
│   └── extensions.json             # 推荐插件列表
├── packages/
│   ├── game-core/                  # 游戏核心逻辑（纯 TypeScript，无 DOM/React 依赖）
│   │   ├── src/
│   │   │   ├── ecs/                # ECS 实体组件系统
│   │   │   ├── systems/            # 游戏系统（制作系统、顾客系统、经济系统等）
│   │   │   ├── events/             # 事件总线
│   │   │   ├── config/             # 游戏数值配置表
│   │   │   ├── utils/              # 工具函数
│   │   │   └── index.ts            # 包入口
│   │   ├── __tests__/              # 单元测试
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── game-renderer/              # Canvas 渲染引擎（封装 PixiJS）
│   │   ├── src/
│   │   │   ├── scenes/             # 场景（咖啡厅主场景、装修预览场景等）
│   │   │   ├── layers/             # 渲染层（地面层、家具层、角色层等）
│   │   │   ├── sprites/            # 精灵封装（顾客、员工、家具精灵）
│   │   │   ├── animations/         # 动画控制器
│   │   │   ├── camera/             # 摄像机控制（平移、缩放）
│   │   │   ├── assets/             # 资源加载与管理
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── game-ui/                    # React UI 面板
│   │   ├── src/
│   │   │   ├── components/         # UI 组件
│   │   │   │   ├── layout/         # 布局组件（StatusBar、BottomNav）
│   │   │   │   ├── panels/         # 功能面板（ShopPanel、DecoratePanel...）
│   │   │   │   ├── common/         # 通用组件（Button、Modal、ProgressBar）
│   │   │   │   └── game-hud/       # 游戏内 HUD（订单显示、制作进度）
│   │   │   ├── hooks/              # 自定义 Hooks
│   │   │   ├── stores/             # Zustand Stores
│   │   │   ├── styles/             # 样式文件（CSS Modules / Tailwind）
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── app/                        # 应用入口（Vite + React）
│       ├── src/
│       │   ├── App.tsx             # 根组件
│       │   ├── main.tsx            # 入口文件
│       │   ├── vite-env.d.ts
│       │   └── index.css           # 全局样式
│       ├── public/
│       │   ├── assets/             # 静态资源（精灵图、音频、字体）
│       │   │   ├── sprites/        # 精灵图 / 图集
│       │   │   ├── audio/          # 音频文件
│       │   │   └── fonts/          # 字体文件
│       │   └── manifest.json       # PWA 清单
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── package.json
├── scripts/                        # 构建与工具脚本
│   ├── generate-config.ts          # 从 CSV 生成配置表 TypeScript 类型
│   └── sprite-packer.mjs           # 精灵图打包脚本
├── docs/                           # 项目文档
│   ├── PRD.md                      # 产品需求文档
│   └── TDD.md                      # 技术设计文档（本文档）
├── pnpm-workspace.yaml             # pnpm workspace 配置
├── package.json                    # 根 package.json
├── tsconfig.base.json              # 共享 TypeScript 配置
├── .eslintrc.cjs                   # ESLint 配置
├── .prettierrc                     # Prettier 配置
└── vitest.config.ts                # 测试配置
```

### 1.2 架构分层图

整体架构划分为三层：**展示层**、**游戏逻辑层**、**数据层**。层间通过明确接口通信，下层不依赖上层。

```
┌────────────────────────────────────────────────────────────────┐
│                        展示层 (Presentation)                     │
│                                                                 │
│  ┌──────────────────────┐    ┌─────────────────────────────┐   │
│  │      Canvas 渲染       │    │        React UI 面板          │   │
│  │  (game-renderer)     │    │       (game-ui)              │   │
│  │                      │    │                             │   │
│  │  ┌────────────────┐  │    │  ┌───────────────────────┐  │   │
│  │  │  Scene Manager  │  │    │  │  StatusBar            │  │   │
│  │  │  Layer Manager  │  │    │  │  BottomNav            │  │   │
│  │  │  Sprite System  │  │    │  │  ShopPanel            │  │   │
│  │  │  Animation Sys  │  │    │  │  DecoratePanel        │  │   │
│  │  │  Camera System  │  │    │  │  EmployeePanel        │  │   │
│  │  └────────────────┘  │    │  │  RecipePanel           │  │   │
│  └──────────┬───────────┘    │  │  StoragePanel          │  │   │
│             │                │  │  QuestPanel            │  │   │
│             │                │  └───────────────────────┘  │   │
│             │                └──────────────┬──────────────┘   │
│             │                               │                  │
├─────────────┼───────────────────────────────┼──────────────────┤
│             │    游戏逻辑层 (Game Logic)      │                  │
│             │                               │                  │
│  ┌──────────▼───────────────────────────────▼──────────────┐   │
│  │                   Event Bus (事件总线)                     │   │
│  │  GameEventBus (typed event emitter)                      │   │
│  └──────────┬───────────────────────────────┬──────────────┘   │
│             │                               │                  │
│  ┌──────────▼──────────┐    ┌──────────────▼──────────────┐   │
│  │    ECS 实体系统       │    │     Game Systems            │   │
│  │   (game-core/ecs)   │    │   (game-core/systems)       │   │
│  │                     │    │                             │   │
│  │  Entity             │    │  BrewSystem (制作系统)        │   │
│  │  Component          │    │  CustomerSystem (顾客AI)      │   │
│  │  System             │    │  EconomySystem (经济系统)      │   │
│  │  World              │    │  InventorySystem (库存系统)    │   │
│  │                     │    │  EmployeeSystem (员工AI)      │   │
│  │                     │    │  QuestSystem (任务系统)       │   │
│  │                     │    │  TimeSystem (时间系统)        │   │
│  │                     │    │  WeatherSystem (天气系统)      │   │
│  └─────────────────────┘    └─────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         数据层 (Data)                            │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │    Zustand Stores     │  │    IndexedDB (Dexie.js)      │    │
│  │   (game-ui/stores)   │  │                              │    │
│  │                      │  │  SaveManager                 │    │
│  │  useGameStore        │  │  ├── saveGame(slot, data)    │    │
│  │  useCustomerStore    │  │  ├── loadGame(slot)          │    │
│  │  useInventoryStore   │  │  ├── deleteSave(slot)        │    │
│  │  useEmployeeStore    │  │  ├── listSaves()             │    │
│  │  useShopStore        │  │  └── exportSave()            │    │
│  │  useRecipeStore      │  │                              │    │
│  │  useUIStore          │  │  ConfigLoader                │    │
│  │  useQuestStore       │  │  ├── loadRecipes()           │    │
│  │                      │  │  ├── loadFurniture()         │    │
│  └──────────────────────┘  │  ├── loadEquipments()        │    │
│                            │  └── loadIngredients()       │    │
│                            └──────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**分层职责：**

| 层级 | 包 | 职责 | 依赖方向 |
|------|-----|------|---------|
| 展示层 | `game-renderer`, `game-ui` | Canvas 渲染场景、React 渲染 UI 面板、响应用户交互 | 依赖逻辑层 + 数据层 |
| 游戏逻辑层 | `game-core` | 实体管理、系统 ECS 循环、事件分发、数值计算 | 依赖数据层 |
| 数据层 | IndexedDB + Zustand | 状态存储、存档读写、配置加载 | 无依赖（底层） |

### 1.3 核心设计模式

#### 1.3.1 ECS-Lite（实体-组件-系统）

本项目不引入完整的 ECS 框架（如 bitecs），而是采用 **ECS-Lite** 模式，在保持 TypeScript 类型安全的前提下实现灵活的组合式游戏对象架构。

**选择 ECS-Lite 的理由：**

- 游戏对象种类多（顾客、员工、家具、设备、装饰），行为各异
- 传统 OOP 继承链会导致"脆弱的基类"问题（BaseGameObject → Character → Employee → Barista 过于深层）
- Component 组合带来灵活性：一个"可移动的家具"= PositionComponent + RenderableComponent + InteractableComponent
- 性能：System 按组件组合批量处理实体，缓存友好

**核心概念：**

```typescript
// packages/game-core/src/ecs/Entity.ts

/** 实体唯一标识符 */
type EntityId = number;

/** 实体：仅是一个 ID 的容器，所有属性由 Component 提供 */
class Entity {
  public readonly id: EntityId;
  public readonly components: Map<string, Component> = new Map();

  constructor(id: EntityId) {
    this.id = id;
  }

  addComponent<T extends Component>(component: T): this {
    this.components.set(component.type, component);
    return this;
  }

  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  removeComponent(type: string): void {
    this.components.delete(type);
  }

  hasComponents(...types: string[]): boolean {
    return types.every((t) => this.components.has(t));
  }
}
```

```typescript
// packages/game-core/src/ecs/Component.ts

/** 组件基类：纯数据，不含逻辑 */
abstract class Component {
  abstract readonly type: string;
}

/** 位置组件 */
class PositionComponent extends Component {
  readonly type = 'Position';
  constructor(
    public x: number,
    public y: number,
    public z: number = 0,     // 排序层级（等距场景中 y 越大越靠前）
  ) {}
}

/** 可渲染组件 */
class RenderableComponent extends Component {
  readonly type = 'Renderable';
  constructor(
    public spriteKey: string,  // 精灵图键名
    public visible: boolean = true,
    public alpha: number = 1,
    public scale: number = 1,
    public tint: number = 0xFFFFFF,
  ) {}
}

/** 顾客 AI 组件 */
class CustomerAIComponent extends Component {
  readonly type = 'CustomerAI';
  state: CustomerState;
  patience: number;
  maxPatience: number;
  orderId: string | null;
  satisfaction: number;

  constructor(config: CustomerConfig) {
    super();
    this.state = CustomerState.Entering;
    this.patience = config.patience;
    this.maxPatience = config.patience;
    this.orderId = null;
    this.satisfaction = 3; // 初始中等满意度
  }
}

/** 员工 AI 组件 */
class EmployeeAIComponent extends Component {
  readonly type = 'EmployeeAI';
  role: EmployeeRole;
  level: number;
  mood: number;
  skill: EmployeeSkill;
  state: EmployeeState;

  constructor(config: EmployeeConfig) {
    super();
    this.role = config.role;
    this.level = config.level;
    this.mood = 100;
    this.skill = config.skill;
    this.state = EmployeeState.Idle;
  }
}

/** 库存组件（挂载在设备/仓库上） */
class InventoryComponent extends Component {
  readonly type = 'Inventory';
  items: Map<string, number> = new Map();

  addItem(itemId: string, quantity: number): void { /* ... */ }
  removeItem(itemId: string, quantity: number): boolean { /* ... */ }
  hasItem(itemId: string, quantity: number): boolean { /* ... */ }
}
```

```typescript
// packages/game-core/src/ecs/System.ts

/** 系统基类：纯逻辑，无状态（或仅含查询缓存） */
abstract class System {
  /** 该系统关注哪些组件组合 */
  abstract readonly requiredComponents: string[];

  /** 每帧执行 */
  abstract update(world: World, deltaTime: number): void;
}

/** 顾客行为系统：处理顾客状态转换 */
class CustomerBehaviorSystem extends System {
  readonly requiredComponents = ['Position', 'CustomerAI'];

  update(world: World, dt: number): void {
    const entities = world.query(this.requiredComponents);
    for (const entity of entities) {
      const pos = entity.getComponent<PositionComponent>('Position')!;
      const ai = entity.getComponent<CustomerAIComponent>('CustomerAI')!;

      switch (ai.state) {
        case CustomerState.Entering:
          this.handleEntering(entity, pos, ai, dt);
          break;
        case CustomerState.Queueing:
          this.handleQueueing(entity, pos, ai, dt);
          break;
        case CustomerState.Ordering:
          this.handleOrdering(entity, pos, ai, dt);
          break;
        case CustomerState.Waiting:
          this.handleWaiting(entity, pos, ai, dt);
          break;
        case CustomerState.Eating:
          this.handleEating(entity, pos, ai, dt);
          break;
        case CustomerState.Leaving:
          this.handleLeaving(entity, pos, ai, dt);
          break;
      }
    }
  }
  // ...各状态处理函数
}
```

```typescript
// packages/game-core/src/ecs/World.ts

/** 世界：管理所有实体和系统 */
class World {
  private entities: Map<EntityId, Entity> = new Map();
  private systems: System[] = [];
  private nextEntityId: EntityId = 1;

  createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(id: EntityId): void {
    this.entities.delete(id);
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  /** 按组件组合查询实体 */
  query(componentTypes: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.hasComponents(...componentTypes)) {
        result.push(entity);
      }
    }
    return result;
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(this, deltaTime);
    }
  }
}
```

#### 1.3.2 事件驱动架构

游戏内部通信采用 **EventBus（事件总线）** 模式，解耦各 Systems 和 UI 组件。

```typescript
// packages/game-core/src/events/GameEventBus.ts

type EventHandler<T = any> = (payload: T) => void;

interface GameEventMap {
  'customer:entered': { customerId: EntityId };
  'customer:ordered': { customerId: EntityId; orderId: string };
  'customer:satisfied': { customerId: EntityId; tip: number };
  'customer:left': { customerId: EntityId; satisfaction: number };
  'customer:angry': { customerId: EntityId };

  'brew:started': { equipmentId: EntityId; recipeId: string };
  'brew:completed': { productId: string; quality: number };
  'brew:perfect': { productId: string };

  'economy:goldChanged': { amount: number; newBalance: number; reason: string };
  'economy:diamondChanged': { amount: number; newBalance: number; reason: string };
  'economy:xpGained': { amount: number; newLevel: number };

  'inventory:itemAdded': { itemId: string; quantity: number };
  'inventory:itemRemoved': { itemId: string; quantity: number };
  'inventory:itemExpired': { itemId: string; quantity: number };

  'employee:levelUp': { employeeId: EntityId; newLevel: number };
  'employee:moodChanged': { employeeId: EntityId; mood: number };

  'shop:levelUp': { newLevel: number; unlockedFeatures: string[] };
  'shop:decorated': { furnitureId: string; position: Position };

  'quest:completed': { questId: string; rewards: Reward[] };
  'achievement:unlocked': { achievementId: string };

  'time:hourChanged': { hour: number; dayPeriod: DayPeriod };
  'time:dayEnded': { day: number };

  'weather:changed': { weather: WeatherType };
  'event:triggered': { eventType: string; payload: any };

  'ui:panelOpened': { panelId: string };
  'ui:panelClosed': { panelId: string };

  'save:completed': { slotId: number };
  'load:completed': { slotId: number };
}

class GameEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on<K extends keyof GameEventMap>(
    event: K,
    handler: EventHandler<GameEventMap[K]>,
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    // 返回取消订阅函数
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        handler(payload);
      }
    }
  }

  off<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  clear(): void {
    this.handlers.clear();
  }
}

// 全局单例
const eventBus = new GameEventBus();
export { eventBus, GameEventBus };
export type { GameEventMap };
```

#### 1.3.3 命令模式（Command Pattern）

对于需要支持撤销操作的功能（如装修模式），使用命令模式：

```typescript
// packages/game-core/src/utils/CommandPattern.ts

interface ICommand {
  execute(): void;
  undo(): void;
}

class PlaceFurnitureCommand implements ICommand {
  constructor(
    private world: World,
    private furnitureId: string,
    private position: Position,
    private rotation: number,
  ) {}

  execute(): void {
    // 在家具管理系统中放置家具
    FurnitureManager.place(this.world, this.furnitureId, this.position, this.rotation);
  }

  undo(): void {
    FurnitureManager.remove(this.world, this.furnitureId);
  }
}

class CommandHistory {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxSize: number = 50;

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // 新命令清空 redo 栈
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
}
```

---

## 2. 技术选型详解

### 2.1 渲染引擎：PixiJS v8 vs Phaser 3

| 维度 | PixiJS v8 | Phaser 3 | 本项目倾向 |
|------|-----------|----------|-----------|
| **定位** | 纯粹 2D 渲染引擎 | 完整游戏框架 | PixiJS |
| **包体积** | ~500KB (min+gzip) | ~1.2MB (min+gzip) | PixiJS（更轻量） |
| **渲染性能** | WebGL 优先，极优 | WebGL + Canvas 双模式 | 持平 |
| **内置物理引擎** | 无（需第三方） | Arcade / Matter.js | Phaser（但本项目物理需求低） |
| **音效管理** | 无（需自行处理） | 内置音频管理器 | Phaser（但会用 Howler.js 替代） |
| **场景管理** | 无（需自行实现） | 内置场景管理器 | Phaser |
| **React 集成** | 轻量级封装即可 | 封装较重，有现成 react-phaser | PixiJS（更灵活） |
| **TypeScript 支持** | 官方类型完备 | 官方类型完备 | 持平 |
| **学习曲线** | 较低，API 直观 | 较高，概念较多 | PixiJS |
| **社区与生态** | 极活跃，插件丰富 | 极活跃，教程更多 | 持平 |
| **定制化能力** | 极高（渲染层完全可控） | 中等（框架约束较多） | PixiJS |

**最终选择：PixiJS v8**

选择 PixiJS 的核心理由：

1. **职责分离更清晰**：本项目 UI 层使用 React + DOM，仅场景渲染使用 Canvas。PixiJS 作为纯粹渲染引擎，与 React 的边界更清晰；Phaser 作为"游戏框架"会与 React 的渲染循环、状态管理产生更多冲突。
2. **定制 ECS 更自然**：本项目自行实现 ECS-Lite，PixiJS 不提供内置的游戏循环/物理/场景，反而是优势——避免框架概念与我们架构设计的碰撞。
3. **Tree-shaking 更友好**：PixiJS v8 模块化设计，按需引入；Phaser 引入即全量。
4. **PWA 场景下的体积优势**：首屏加载体积是 Web 游戏的关键指标，PixiJS 更小的体积意味着更快的启动速度。
5. **2.5D 等距渲染无物理需求**：本游戏不需要碰撞检测、弹道等物理系统，Phaser 的物理引擎成为冗余。

### 2.2 状态管理：Zustand

选择 Zustand 而非 Redux / Jotai / MobX 的理由：

| 维度 | Zustand | Redux Toolkit | Jotai | MobX |
|------|---------|---------------|-------|------|
| 包体积 | ~2KB | ~12KB | ~3KB | ~16KB |
| 学习成本 | 极低 | 中等 | 低 | 中等 |
| TypeScript | 优秀 | 优秀 | 良好 | 良好 |
| 性能 | 选择性子渲染 | 选择性子渲染 | 原子化，天然优化 | 自动追踪 |
| 中间件 | persist, immer, devtools | 内置 | 有限 | 有限 |
| 游戏场景适配 | 极佳（可脱离 React 使用） | 耦合 React | 耦合 React | 需 React Context |

**Zustand 在游戏场景中的独特优势：**

- **可脱离 React 使用**：`useGameStore.getState()` 和 `useGameStore.setState()` 可在 game-core 中直接调用，游戏逻辑层不依赖 React
- **persist 中间件**：一行代码接入 localStorage / IndexedDB 持久化
- **subscribeWithSelector**：可按字段粒度订阅，避免不必要的重渲染

**Store 拆分方案（详见第 5 章）：**

```typescript
// packages/game-ui/src/stores/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  // 游戏时间
  gameTime: GameTime;
  // 店铺状态
  shopLevel: number;
  shopName: string;
  shopRating: number;
  // 货币
  gold: number;
  diamond: number;
  // 当前面板
  activePanel: PanelId | null;
  // 游戏阶段
  gamePhase: GamePhase; // 'daytime' | 'closing' | 'paused'

  // Actions
  addGold: (amount: number, reason: string) => void;
  addDiamond: (amount: number, reason: string) => void;
  setActivePanel: (panel: PanelId | null) => void;
  advanceTime: (deltaMinutes: number) => void;
}

const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      gameTime: { day: 1, hour: 7, minute: 0 },
      shopLevel: 1,
      shopName: '街角小店',
      shopRating: 3.0,
      gold: 500,
      diamond: 10,
      activePanel: null,
      gamePhase: 'daytime',

      addGold: (amount, reason) => {
        const newBalance = get().gold + amount;
        set({ gold: Math.max(0, newBalance) });
        eventBus.emit('economy:goldChanged', { amount, newBalance, reason });
      },

      addDiamond: (amount, reason) => {
        const newBalance = get().diamond + amount;
        set({ diamond: Math.max(0, newBalance) });
        eventBus.emit('economy:diamondChanged', { amount, newBalance, reason });
      },

      setActivePanel: (panel) => set({ activePanel: panel }),

      advanceTime: (deltaMinutes) => {
        const current = get().gameTime;
        let totalMinutes = current.hour * 60 + current.minute + deltaMinutes;
        let day = current.day;
        while (totalMinutes >= 24 * 60) {
          totalMinutes -= 24 * 60;
          day += 1;
          eventBus.emit('time:dayEnded', { day });
        }
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        set({ gameTime: { day, hour, minute } });
        eventBus.emit('time:hourChanged', {
          hour,
          dayPeriod: getDayPeriod(hour),
        });
      },
    }),
    {
      name: 'game-storage',
      // 使用 IndexedDB 而非 localStorage（通过 Dexie.js 适配器）
    },
  ),
);
```

### 2.3 动画方案

采用**分层动画策略**，不同场景使用最合适的方案：

| 动画类型 | 方案 | 适用场景 |
|---------|------|---------|
| **角色帧动画** | PixiJS AnimatedSprite + 精灵图序列帧 | 顾客行走、员工工作、宠物走动 |
| **场景过渡动画** | GSAP (GreenSock) | 面板弹出/关闭、场景切换、摄像机移动 |
| **UI 微交互** | CSS Transition / Animation | 按钮悬停、状态变化、数字跳动 |
| **粒子特效** | PixiJS ParticleContainer | 咖啡热气、金币飞出、星星冒出 |
| **数值动画** | GSAP + React | 金币增减动画、经验条增长 |

**GSAP 使用示例：**

```typescript
// packages/game-renderer/src/animations/TransitionAnimations.ts
import gsap from 'gsap';

export class TransitionAnimations {
  /** 面板滑入动画 */
  static slideInPanel(element: HTMLElement, direction: 'left' | 'right' | 'bottom' = 'bottom'): gsap.core.Tween {
    const fromVars: gsap.TweenVars = {
      bottom: { y: '100%', opacity: 0 },
      left: { x: '-100%', opacity: 0 },
      right: { x: '100%', opacity: 0 },
    };

    return gsap.fromTo(
      element,
      { ...fromVars[direction], duration: 0 },
      { x: 0, y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
    );
  }

  /** 金币弹出动画 */
  static coinPopup(container: PIXI.Container, x: number, y: number, amount: number): void {
    const text = new PIXI.Text(`+${amount}🪙`, {
      fontSize: 20,
      fill: 0xFFD700,
      fontFamily: 'Arial',
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    container.addChild(text);

    gsap.to(text, {
      y: y - 80,
      alpha: 0,
      duration: 1.2,
      ease: 'power2.out',
      onComplete: () => container.removeChild(text),
    });
  }

  /** 摄像机缓动 */
  static panCamera(camera: PIXI.Container, targetX: number, targetY: number, duration: number = 0.8): gsap.core.Tween {
    return gsap.to(camera, {
      x: targetX,
      y: targetY,
      duration,
      ease: 'power3.inOut',
    });
  }
}
```

**帧动画（精灵图）方案：**

```typescript
// packages/game-renderer/src/animations/FrameAnimation.ts

interface FrameAnimationConfig {
  /** 精灵图纹理 */
  texture: PIXI.Texture;
  /** 帧数 */
  frameCount: number;
  /** 每行帧数 */
  framesPerRow: number;
  /** 帧宽 */
  frameWidth: number;
  /** 帧高 */
  frameHeight: number;
  /** 动画速度（帧/秒） */
  animationSpeed?: number;
  /** 是否循环 */
  loop?: boolean;
}

class FrameAnimation {
  private textures: PIXI.Texture[];
  private animatedSprite: PIXI.AnimatedSprite;

  constructor(config: FrameAnimationConfig) {
    this.textures = [];
    const baseTexture = config.texture.baseTexture;

    for (let i = 0; i < config.frameCount; i++) {
      const col = i % config.framesPerRow;
      const row = Math.floor(i / config.framesPerRow);
      const rect = new PIXI.Rectangle(
        col * config.frameWidth,
        row * config.frameHeight,
        config.frameWidth,
        config.frameHeight,
      );
      this.textures.push(new PIXI.Texture(baseTexture, rect));
    }

    this.animatedSprite = new PIXI.AnimatedSprite(this.textures);
    this.animatedSprite.animationSpeed = config.animationSpeed ?? 0.1;
    this.animatedSprite.loop = config.loop ?? true;
  }

  play(): void {
    this.animatedSprite.play();
  }

  stop(): void {
    this.animatedSprite.stop();
  }

  /** 播放一次后回调 */
  playOnce(onComplete?: () => void): void {
    this.animatedSprite.loop = false;
    this.animatedSprite.gotoAndPlay(0);
    if (onComplete) {
      this.animatedSprite.onComplete = onComplete;
    }
  }

  get sprite(): PIXI.AnimatedSprite {
    return this.animatedSprite;
  }
}
```

### 2.4 音频方案

采用 **Howler.js** 作为音频管理库，封装统一的 AudioManager。

**选择 Howler.js 的理由：**

- 跨浏览器音频兼容性处理（自动降级）
- 音频精灵（Audio Sprite）支持，用一个文件包含多个音效片段
- 空间音频（Spatial Audio）支持
- 自动处理移动端音频解锁问题
- 比 Phaser 内置音频管理器更轻量，且不绑定框架

```typescript
// packages/game-renderer/src/audio/AudioManager.ts
import { Howl, Howler } from 'howler';

type AudioCategory = 'bgm' | 'sfx' | 'ambient';

interface AudioTrack {
  key: string;
  src: string[];
  category: AudioCategory;
  volume?: number;
  loop?: boolean;
}

class AudioManager {
  private tracks: Map<string, Howl> = new Map();
  private currentBGM: string | null = null;
  private masterVolume: number = 1;
  private categoryVolumes: Record<AudioCategory, number> = {
    bgm: 0.7,
    sfx: 0.8,
    ambient: 0.5,
  };
  private muted: boolean = false;

  /** 加载音轨 */
  load(track: AudioTrack): void {
    const howl = new Howl({
      src: track.src,
      volume: (track.volume ?? 1) * this.categoryVolumes[track.category] * this.masterVolume,
      loop: track.loop ?? false,
      preload: true,
    });
    this.tracks.set(track.key, howl);
  }

  /** 批量加载 */
  loadAll(tracks: AudioTrack[]): Promise<void[]> {
    const promises = tracks.map((track) => {
      return new Promise<void>((resolve) => {
        const howl = new Howl({
          src: track.src,
          volume: (track.volume ?? 1) * this.categoryVolumes[track.category] * this.masterVolume,
          loop: track.loop ?? false,
          preload: true,
          onload: () => resolve(),
          onloaderror: (_id: number, error: unknown) => {
            console.warn(`Failed to load audio: ${track.key}`, error);
            resolve(); // 不阻塞，音频加载失败不影响游戏运行
          },
        });
        this.tracks.set(track.key, howl);
      });
    });
    return Promise.all(promises);
  }

  /** 播放背景音乐（淡入） */
  playBGM(key: string, fadeDuration: number = 1000): void {
    if (this.currentBGM === key) return;

    // 淡出当前 BGM
    if (this.currentBGM) {
      const current = this.tracks.get(this.currentBGM);
      if (current) {
        current.fade(current.volume(), 0, fadeDuration);
        setTimeout(() => current.stop(), fadeDuration);
      }
    }

    // 淡入新 BGM
    const next = this.tracks.get(key);
    if (next) {
      next.volume(0);
      next.play();
      next.fade(0, this.categoryVolumes.bgm * this.masterVolume, fadeDuration);
      this.currentBGM = key;
    }
  }

  /** 播放音效 */
  playSFX(key: string): number | undefined {
    if (this.muted) return;
    const track = this.tracks.get(key);
    if (track) {
      return track.play();
    }
  }

  /** 根据天气/时间段切换 BGM */
  updateBGMByContext(hour: number, weather: WeatherType): void {
    let bgmKey: string;
    if (weather === 'rainy') {
      bgmKey = 'bgm_rainy';
    } else if (hour >= 6 && hour < 10) {
      bgmKey = 'bgm_morning';
    } else if (hour >= 10 && hour < 17) {
      bgmKey = 'bgm_daytime';
    } else if (hour >= 17 && hour < 21) {
      bgmKey = 'bgm_evening';
    } else {
      bgmKey = 'bgm_night';
    }
    this.playBGM(bgmKey);
  }

  /** 设置主音量 */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  /** 静音切换 */
  toggleMute(): boolean {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    return this.muted;
  }

  /** 销毁所有音轨 */
  destroy(): void {
    this.tracks.forEach((howl) => howl.unload());
    this.tracks.clear();
    this.currentBGM = null;
  }
}

export const audioManager = new AudioManager();
```

**音频资源规划：**

| 类别 | 文件 | 格式 | 时长 |
|------|------|------|------|
| BGM - 早晨 | bgm_morning.mp3 | MP3/OGG | 3min loop |
| BGM - 白天 | bgm_daytime.mp3 | MP3/OGG | 3min loop |
| BGM - 傍晚 | bgm_evening.mp3 | MP3/OGG | 3min loop |
| BGM - 夜晚 | bgm_night.mp3 | MP3/OGG | 3min loop |
| BGM - 雨天 | bgm_rainy.mp3 | MP3/OGG | 3min loop |
| SFX 集合 | sfx_coffee.mp3 | 精灵音频 | ~30s |
| SFX 集合 | sfx_ui.mp3 | 精灵音频 | ~15s |
| SFX 集合 | sfx_ambient.mp3 | 精灵音频 | ~20s |

---

## 3. 核心模块设计

### 3.1 游戏主循环

采用 **requestAnimationFrame + 固定时间步长（Fixed Timestep）** 模式，保证逻辑更新与渲染分离：

```typescript
// packages/game-core/src/GameLoop.ts

class GameLoop {
  private world: World;
  private renderer: GameRenderer;
  private running: boolean = false;
  private rafId: number = 0;

  /** 固定逻辑更新时间步长（毫秒），对应 60fps 逻辑更新 */
  private readonly FIXED_DT: number = 1000 / 60;
  /** 最大帧时间（防止切后台后追帧） */
  private readonly MAX_FRAME_TIME: number = 200;

  private accumulator: number = 0;
  private lastTime: number = 0;
  private gameSpeed: number = 1; // 游戏加速倍率

  constructor(world: World, renderer: GameRenderer) {
    this.world = world;
    this.renderer = renderer;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    // 不重置 accumulator，保留状态
  }

  resume(): void {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.accumulator = 0;
      this.rafId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  setGameSpeed(speed: number): void {
    this.gameSpeed = Math.max(0.5, Math.min(3, speed));
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 防止切后台后追帧
    if (frameTime > this.MAX_FRAME_TIME) {
      frameTime = this.MAX_FRAME_TIME;
    }

    // 累加时间
    this.accumulator += frameTime * this.gameSpeed;

    // 固定时间步长逻辑更新
    while (this.accumulator >= this.FIXED_DT) {
      // 1. 更新时间系统（游戏内时间推进）
      this.world.getSystem<TimeSystem>('TimeSystem').update(this.world, this.FIXED_DT);
      // 2. 更新所有游戏系统（按优先级顺序）
      this.world.update(this.FIXED_DT);
      this.accumulator -= this.FIXED_DT;
    }

    // 3. 插值渲染（使用 accumulator / FIXED_DT 做插值因子）
    const alpha = this.accumulator / this.FIXED_DT;
    this.renderer.render(this.world, alpha);

    // 4. UI 状态同步（高频但轻量的操作）
    this.syncUIState();

    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  /** 同步高频 UI 状态（如顾客排队数量、当前制作进度） */
  private syncUIState(): void {
    // 使用 requestIdleCallback 降低优先级
    // 仅在值真正变化时才更新 store
  }
}
```

**系统执行优先级（update 顺序）：**

```
1. TimeSystem         - 游戏时间推进（最先，其他系统依赖时间）
2. InputSystem        - 处理用户输入
3. CustomerSystem     - 顾客 AI 行为
4. EmployeeSystem     - 员工 AI 行为
5. BrewSystem         - 制作系统
6. EconomySystem      - 经济结算
7. InventorySystem    - 库存更新
8. QuestSystem        - 任务进度检查
9. EventSystem        - 随机事件触发
10. AnimationSystem   - 动画状态更新
11. UISyncSystem      - UI 状态同步（最后）
```

### 3.2 场景管理器

```typescript
// packages/game-renderer/src/scenes/SceneManager.ts

type SceneId = 'main_cafe' | 'decorate_mode' | 'recipe_book' | 'shop_browser';

interface IScene {
  readonly id: SceneId;
  enter(params?: Record<string, any>): Promise<void>;
  leave(): Promise<void>;
  update(dt: number): void;
  render(alpha: number): void;
  resize(width: number, height: number): void;
}

class SceneManager {
  private scenes: Map<SceneId, IScene> = new Map();
  private currentScene: IScene | null = null;
  private transitioning: boolean = false;

  register(scene: IScene): void {
    this.scenes.set(scene.id, scene);
  }

  async switchTo(sceneId: SceneId, params?: Record<string, any>): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;

    const nextScene = this.scenes.get(sceneId);
    if (!nextScene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    // 淡出过渡
    await this.fadeOut();

    // 离开当前场景
    if (this.currentScene) {
      await this.currentScene.leave();
    }

    // 进入新场景
    await nextScene.enter(params);
    this.currentScene = nextScene;

    // 淡入过渡
    await this.fadeIn();

    this.transitioning = false;
  }

  update(dt: number): void {
    this.currentScene?.update(dt);
  }

  render(alpha: number): void {
    this.currentScene?.render(alpha);
  }

  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      // GSAP 控制全屏黑色遮罩 alpha 0 → 1
      gsap.to('#scene-fade-overlay', {
        opacity: 1, duration: 0.3, ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }

  private fadeIn(): Promise<void> {
    return new Promise((resolve) => {
      gsap.to('#scene-fade-overlay', {
        opacity: 0, duration: 0.3, ease: 'power2.out',
        onComplete: () => resolve(),
      });
    });
  }
}
```

### 3.3 实体系统设计

#### 3.3.1 实体类型枚举

```typescript
// packages/game-core/src/ecs/EntityTypes.ts

enum EntityType {
  // 顾客
  Customer = 'customer',
  // 员工
  Employee = 'employee',
  // 设备（咖啡机、烤箱等，可交互）
  Equipment = 'equipment',
  // 家具（桌椅、装饰品）
  Furniture = 'furniture',
  // 装饰（墙面、地板、窗户等）
  Decoration = 'decoration',
  // 宠物（店猫）
  Pet = 'pet',
  // 产品（制作完成的咖啡/甜品）
  Product = 'product',
  // 特效（粒子、飘字）
  Effect = 'effect',
}
```

#### 3.3.2 实体工厂

```typescript
// packages/game-core/src/ecs/EntityFactory.ts

class EntityFactory {
  constructor(private world: World) {}

  /** 创建顾客实体 */
  createCustomer(config: CustomerConfig, spawnPosition: Position): Entity {
    const entity = this.world.createEntity();
    entity
      .addComponent(new TypeComponent(EntityType.Customer, config.type))
      .addComponent(new PositionComponent(spawnPosition.x, spawnPosition.y, spawnPosition.z))
      .addComponent(new RenderableComponent(`customer_${config.type}`, true, 1, 1))
      .addComponent(new CustomerAIComponent(config))
      .addComponent(new MovementComponent(0, config.walkSpeed ?? 80))
      .addComponent(new AnimationComponent('idle'))
      .addComponent(new SatisfactionComponent());
    return entity;
  }

  /** 创建员工实体 */
  createEmployee(config: EmployeeConfig, spawnPosition: Position): Entity {
    const entity = this.world.createEntity();
    entity
      .addComponent(new TypeComponent(EntityType.Employee, config.name))
      .addComponent(new PositionComponent(spawnPosition.x, spawnPosition.y, spawnPosition.z))
      .addComponent(new RenderableComponent(`employee_${config.role}`))
      .addComponent(new EmployeeAIComponent(config))
      .addComponent(new MovementComponent(0, config.walkSpeed ?? 60))
      .addComponent(new AnimationComponent('idle'))
      .addComponent(new SalaryComponent(config.salary));
    return entity;
  }

  /** 创建设备实体 */
  createEquipment(config: EquipmentConfig, position: Position): Entity {
    const entity = this.world.createEntity();
    entity
      .addComponent(new TypeComponent(EntityType.Equipment, config.type))
      .addComponent(new PositionComponent(position.x, position.y, 0))
      .addComponent(new RenderableComponent(`equipment_${config.type}`, true, 1, 1))
      .addComponent(new EquipmentComponent(config))
      .addComponent(new InteractableComponent('tap', config.interactionRadius));
    return entity;
  }

  /** 创建家具实体 */
  createFurniture(config: FurnitureConfig, gridPosition: GridPosition): Entity {
    const worldPos = gridToWorld(gridPosition);
    const entity = this.world.createEntity();
    entity
      .addComponent(new TypeComponent(EntityType.Furniture, config.category))
      .addComponent(new PositionComponent(worldPos.x, worldPos.y, worldPos.y)) // z = y for isometric depth sort
      .addComponent(new RenderableComponent(`furniture_${config.id}`))
      .addComponent(new FurnitureComponent(config, gridPosition))
      .addComponent(new GridOccupancyComponent(config.gridWidth, config.gridHeight));
    return entity;
  }
}
```

### 3.4 顾客状态机

顾客是游戏中最复杂的实体，采用**有限状态机（FSM）** 管理行为：

```typescript
// packages/game-core/src/systems/CustomerStateMachine.ts

enum CustomerState {
  Entering    = 'entering',     // 进门，走向排队点
  Queueing    = 'queueing',     // 排队中
  Ordering    = 'ordering',     // 正在点单
  Waiting     = 'waiting',      // 等待制作
  Eating      = 'eating',       // 享用产品
  Chatting    = 'chatting',     // 与其他顾客闲聊
  Leaving     = 'leaving',      // 离店
  Angry       = 'angry',        // 生气离开
}

// 状态转换图（文本表示）:
//
//   Entering ──→ Queueing ──→ Ordering ──→ Waiting ──→ Eating
//                                                   │         │
//                                                   │         │
//                    Angry ←── (超时)                │         │
//                      │                            │         │
//                      └──────── Leaving ←──────────┘         │
//                                 ↑                           │
//                                 └───────────────────────────┘

interface CustomerStateHandler {
  onEnter?(entity: Entity, world: World): void;
  onUpdate(entity: Entity, world: World, dt: number): void;
  onExit?(entity: Entity, world: World): void;
}

const customerStateHandlers: Record<CustomerState, CustomerStateHandler> = {
  [CustomerState.Entering]: {
    onUpdate(entity, world, dt) {
      const pos = entity.getComponent<PositionComponent>('Position')!;
      const move = entity.getComponent<MovementComponent>('Movement')!;
      const target = world.getSingleton('queue_entrance_position')!;

      // 移动到排队入口
      moveTowards(pos, target, move.speed, dt);

      if (distanceBetween(pos, target) < 5) {
        transitionState(entity, CustomerState.Queueing);
      }
    },
  },

  [CustomerState.Queueing]: {
    onEnter(entity, world) {
      // 加入排队队列
      const queue = world.getSingleton<CustomerQueue>('customer_queue')!;
      queue.enqueue(entity.id);
    },
    onUpdate(entity, world, dt) {
      const queue = world.getSingleton<CustomerQueue>('customer_queue')!;
      if (queue.isFirst(entity.id)) {
        // 轮到该顾客
        if (world.getSingleton('counter_available')) {
          queue.dequeue();
          transitionState(entity, CustomerState.Ordering);
        }
      }
      // 排队中逐渐降低耐心
      decrementPatience(entity, dt);
    },
    onExit(entity, world) {
      const queue = world.getSingleton<CustomerQueue>('customer_queue')!;
      queue.remove(entity.id);
    },
  },

  [CustomerState.Ordering]: {
    onEnter(entity, world) {
      const ai = entity.getComponent<CustomerAIComponent>('CustomerAI')!;
      // 根据顾客偏好随机选择订单
      const order = OrderGenerator.generate(entity, world);
      ai.orderId = order.id;
      eventBus.emit('customer:ordered', {
        customerId: entity.id,
        orderId: order.id,
      });
      // 占用柜台位置
      world.setSingleton('counter_available', false);
    },
    onUpdate(entity, world, dt) {
      // 等待订单被接收
      if (world.getSingleton('orders_ready')?.has(ai.orderId)) {
        transitionState(entity, CustomerState.Eating);
        world.setSingleton('counter_available', true);
      }
      decrementPatience(entity, dt);
    },
  },

  [CustomerState.Eating]: {
    onEnter(entity, world) {
      // 移动到座位
      const seat = findAvailableSeat(world);
      if (seat) {
        entity.addComponent(new SeatComponent(seat.id));
        seat.occupy();
        moveToSeat(entity, seat, world);
      }
      // 设置享用时间（受满意度影响）
      setEatingDuration(entity);
    },
    onUpdate(entity, world, dt) {
      // 用餐中，时间到则结账离开
      decrementEatingTime(entity, dt);
      if (eatingTimeUp(entity)) {
        checkout(entity, world);
        transitionState(entity, CustomerState.Leaving);
      }
    },
    onExit(entity, world) {
      const seatComp = entity.getComponent<SeatComponent>('Seat');
      if (seatComp) {
        const seat = world.getEntity(seatComp.seatId);
        seat?.getComponent<SeatComponent>('Seat')?.vacate();
      }
    },
  },

  // ...其他状态处理
};

function transitionState(entity: Entity, newState: CustomerState): void {
  const ai = entity.getComponent<CustomerAIComponent>('CustomerAI')!;
  const oldState = ai.state;

  // 调用旧状态 exit
  customerStateHandlers[oldState].onExit?.(entity, world);

  // 切换状态
  ai.state = newState;

  // 调用新状态 enter
  const anim = entity.getComponent<AnimationComponent>('Animation');
  if (anim) {
    anim.current = getAnimationForState(newState);
  }

  customerStateHandlers[newState].onEnter?.(entity, world);
}
```

---

## 4. 组件树设计

### 4.1 React 组件树

```
<App>
├── <ErrorBoundary>                          # 全局错误捕获
│   ├── <GameCanvas>                         # Canvas 挂载容器
│   │   └── <div id="pixi-container" />      # PixiJS Application 挂载点
│   │
│   ├── <UILayer>                            # UI 覆盖层（DOM）
│   │   ├── <StatusBar>                      # 顶部状态栏
│   │   │   ├── <TimeDisplay />              # 游戏时间 + 天气图标
│   │   │   ├── <CurrencyDisplay />          # 金币/钻石显示
│   │   │   ├── <ShopLevel />                # 店铺等级
│   │   │   └── <GameMenuButton />           # 暂停/设置按钮
│   │   │
│   │   ├── <BottomNavBar>                   # 底部导航栏
│   │   │   ├── <NavButton icon="shop" />    # 商城
│   │   │   ├── <NavButton icon="decorate" /># 装修
│   │   │   ├── <NavButton icon="employee" /># 员工
│   │   │   ├── <NavButton icon="recipe" />  # 食谱
│   │   │   ├── <NavButton icon="storage" /> # 仓库
│   │   │   └── <NavButton icon="quest" />   # 任务
│   │   │
│   │   ├── <GameHUD>                        # 游戏内 HUD
│   │   │   ├── <OrderDisplay />             # 当前订单显示
│   │   │   ├── <BrewProgress />             # 制作进度条
│   │   │   └── <CustomerThoughtBubble />    # 顾客头顶气泡
│   │   │
│   │   └── <PanelContainer>                 # 面板区域（右侧/底部弹出）
│   │       ├── <ShopPanel />                # 商城面板
│   │       │   ├── <CategoryTabs />
│   │       │   ├── <ItemGrid>
│   │       │   │   └── <ShopItemCard />     # (×N)
│   │       │   └── <ItemDetail />
│   │       ├── <DecoratePanel />            # 装修面板
│   │       │   ├── <FurnitureCategoryList />
│   │       │   ├── <FurnitureGrid />
│   │       │   └── <DecorateActions />       # 保存/撤销/重置
│   │       ├── <EmployeePanel />            # 员工面板
│   │       │   ├── <EmployeeList />
│   │       │   │   └── <EmployeeCard />     # (×N)
│   │       │   └── <EmployeeDetail />
│   │       ├── <RecipePanel />              # 食谱面板
│   │       │   ├── <RecipeCategoryTabs />
│   │       │   ├── <RecipeGrid />
│   │       │   │   └── <RecipeCard />       # (×N)
│   │       │   └── <RecipeDetail />
│   │       ├── <StoragePanel />             # 仓库面板
│   │       │   ├── <InventoryGrid />
│   │       │   ├── <PurchasePanel />
│   │       │   └── <ExpiredWarning />
│   │       ├── <QuestPanel />               # 任务面板
│   │       │   ├── <DailyQuests />
│   │       │   ├── <AchievementList />
│   │       │   └── <EventNotification />
│   │       └── <SettingsPanel />            # 设置面板
│   │           ├── <AudioSettings />
│   │           ├── <GameSpeedControl />
│   │           ├── <SaveLoadSection />
│   │           └── <AboutSection />
│   │
│   ├── <ModalLayer>                         # 模态弹窗层
│   │   ├── <CustomerDialogModal />          # 顾客对话弹窗
│   │   ├── <LevelUpModal />                 # 升级庆祝弹窗
│   │   ├── <AchievementUnlockModal />       # 成就解锁弹窗
│   │   ├── <EventModal />                   # 特殊事件弹窗
│   │   ├── <SaveLoadModal />                # 存档管理弹窗
│   │   ├── <ConfirmDialog />                # 通用确认框
│   │   └── <Toast />                        # 提示 Toast
│   │
│   └── <TransitionOverlay />                # 场景切换黑幕过渡
```

### 4.2 Canvas 渲染层级规划

等距场景的核心渲染顺序（由远到近，保证遮挡关系正确）：

```
Layer 0: BackgroundLayer       # 背景层（天空/远景/街道）
Layer 1: FloorLayer            # 地板层（木地板/瓷砖/地毯）
Layer 2: WallLayer             # 墙壁层（墙纸/窗户/挂饰）
Layer 3: FurnitureBackLayer    # 家具后层（大型家具的后面部分）
Layer 4: ShadowLayer           # 阴影层（角色和移动物体的阴影）
Layer 5: CharacterLayer        # 角色层（顾客/员工/宠物）
Layer 6: FurnitureFrontLayer   # 家具前层（遮挡角色的部分）
Layer 7: EquipmentLayer        # 设备层（咖啡机等交互设备）
Layer 8: ProductLayer          # 产品层（制作完成的咖啡/甜品）
Layer 9: EffectLayer           # 特效层（粒子/飘字/气泡）
Layer 10: UIOverlayLayer       # Canvas 内的 UI 叠加层（点击热区高亮）
```

**等距深度排序算法：**

```typescript
// packages/game-renderer/src/layers/IsometricSorter.ts

/**
 * 等距场景的深度排序：
 * 规则：y 坐标越大，越靠前（遮挡 y 小的物体）
 * 同一 y 坐标时，z 坐标决定（z 越大越靠前）
 * 静态物体（家具）优先于动态物体（角色）
 */
function isometricSort(a: PIXI.DisplayObject, b: PIXI.DisplayObject): number {
  const posA = (a as any).__isoPosition as Position3D;
  const posB = (b as any).__isoPosition as Position3D;

  if (!posA || !posB) return 0;

  // 主要按 Y 排序（等距场景中 Y 轴代表深度）
  if (posA.y !== posB.y) {
    return posA.y - posB.y;
  }
  // 其次按 Z 排序（桌上的物体在角色之上）
  if (posA.z !== posB.z) {
    return posA.z - posB.z;
  }
  // 最后按 X 排序
  return posA.x - posB.x;
}
```

### 4.3 UI 面板组件拆解（以商城面板为例）

```
ShopPanel
├── ShopPanelHeader
│   ├── PanelTitle ("商城")
│   └── CloseButton
├── ShopCategoryTabs              # 左侧竖排分类标签
│   └── ShopCategoryTab × N       # 设备/家具/装饰/原料
├── ShopContent
│   ├── ShopSubCategoryFilter     # 子分类过滤（如家具→桌椅/灯具）
│   ├── ShopItemGrid              # 商品网格
│   │   └── ShopItemCard × N
│   │       ├── ItemPreview       # 商品缩略图（Canvas 渲染的 3D 预览？）
│   │       ├── ItemName
│   │       ├── PriceTag          # 显示金币/钻石价格
│   │       └── OwnedBadge        # "已拥有"标签
│   └── ShopItemDetail            # 点击商品后的详情
│       ├── ItemLargePreview
│       ├── ItemDescription
│       ├── ItemStats             # 属性展示（如速度+10%）
│       ├── PurchaseButton
│       └── UpgradeButton
└── ShopFooter
    └── CurrencyDisplay           # 底部显示当前金币/钻石余额
```

---

## 5. 数据流设计

### 5.1 Zustand Store 拆分方案

```
stores/
├── useGameStore.ts           # 核心游戏状态
├── useCustomerStore.ts       # 顾客相关
├── useInventoryStore.ts      # 库存管理
├── useEmployeeStore.ts       # 员工管理
├── useShopStore.ts           # 商城/设备状态
├── useRecipeStore.ts         # 食谱图鉴
├── useQuestStore.ts          # 任务/成就
├── useDecorationStore.ts     # 装修状态
├── useUIStore.ts             # UI 状态
└── useSettingsStore.ts       # 玩家设置
```

**各 Store 职责详述：**

#### useGameStore — 核心游戏状态

```typescript
interface GameState {
  // === 游戏进度 ===
  gamePhase: GamePhase;           // 'menu' | 'daytime' | 'closing' | 'paused'
  gameSpeed: number;              // 时间流速倍率 (0.5 | 1 | 2 | 3)
  gameTime: GameTime;             // { day, hour, minute }

  // === 店铺状态 ===
  shopLevel: number;
  shopName: string;
  shopRating: number;             // 综合评分 1.0-5.0
  shopExp: number;
  shopExpToNextLevel: number;

  // === 货币 ===
  gold: number;
  diamond: number;

  // === 每日统计 ===
  dailyStats: DailyStats;

  // === Actions ===
  addGold: (amount: number, reason: string) => void;
  spendGold: (amount: number, reason: string) => boolean;
  addDiamond: (amount: number, reason: string) => void;
  addExp: (amount: number) => void;
  setGamePhase: (phase: GamePhase) => void;
  setGameSpeed: (speed: number) => void;
  advanceTime: (deltaMinutes: number) => void;
  resetDailyStats: () => void;
}
```

#### useCustomerStore — 顾客管理

```typescript
interface CustomerState {
  // === 当前店内顾客 ===
  activeCustomers: Map<string, CustomerRuntimeData>;
  // === 顾客图鉴 ===
  customerBook: CustomerBookEntry[];   // 已遇到的顾客类型
  regularCustomers: RegularCustomer[]; // 回头客数据
  // === 排队 ===
  queue: string[];                     // 排队顾客 ID 列表

  // === Actions ===
  registerCustomer: (data: CustomerRuntimeData) => void;
  removeCustomer: (id: string) => void;
  updateCustomerState: (id: string, state: CustomerState) => void;
  addToCustomerBook: (entry: CustomerBookEntry) => void;
  enqueueCustomer: (id: string) => void;
  dequeueCustomer: () => string | undefined;
  getQueueLength: () => number;
}
```

#### useInventoryStore — 库存管理

```typescript
interface InventoryState {
  // === 库存 ===
  items: Record<string, InventoryItem>;  // itemId → { quantity, quality, expiryTime }
  storageCapacity: number;               // 当前容量上限

  // === 采购 ===
  suppliers: Supplier[];                 // 已解锁供应商

  // === Actions ===
  addItem: (itemId: string, quantity: number, quality: Quality) => void;
  removeItem: (itemId: string, quantity: number) => boolean;
  hasEnough: (itemId: string, quantity: number) => boolean;
  checkExpiredItems: () => ExpiredItem[];
  removeExpiredItems: () => void;
  upgradeStorage: (newCapacity: number) => void;
  purchaseFromSupplier: (supplierId: string, itemId: string, quantity: number) => boolean;
}
```

#### useEmployeeStore — 员工管理

```typescript
interface EmployeeState {
  // === 员工 ===
  employees: Map<string, EmployeeRuntimeData>;
  maxEmployees: number;                // 当前可雇佣上限

  // === 排班 ===
  schedule: DaySchedule[];

  // === Actions ===
  hireEmployee: (type: EmployeeRole, name: string) => boolean;
  fireEmployee: (id: string) => void;
  upgradeEmployee: (id: string) => boolean;
  paySalary: (id: string) => void;
  giveBonus: (id: string, amount: number) => void;
  restEmployee: (id: string) => void;
  setSchedule: (day: number, assignments: ShiftAssignment[]) => void;
}
```

#### useShopStore — 商城/设备

```typescript
interface ShopState {
  // === 设备 ===
  equipments: Map<string, EquipmentRuntimeData>;  // 已购买设备实例
  unlockedEquipments: string[];                    // 可购买的设备类型 ID

  // === 家具 ===
  furnitures: Map<string, FurnitureRuntimeData>;   // 已拥有家具
  unlockedFurnitures: string[];                     // 可购买的家具 ID

  // === 装饰 ===
  decorations: Map<string, DecorationRuntimeData>;  // 已拥有装饰

  // === Actions ===
  purchaseEquipment: (typeId: string) => boolean;
  upgradeEquipment: (instanceId: string) => boolean;
  purchaseFurniture: (furnitureId: string) => boolean;
  purchaseDecoration: (decorationId: string) => boolean;
  placeFurniture: (furnitureId: string, position: GridPosition, rotation: number) => void;
  removeFurniture: (instanceId: string) => void;
}
```

#### useUIStore — UI 状态

```typescript
interface UIState {
  // === 面板 ===
  activePanel: PanelId | null;
  previousPanel: PanelId | null;
  openModal: ModalId | null;
  modalData: Record<string, any>;

  // === 对话 ===
  currentDialog: DialogEntry | null;
  dialogQueue: DialogEntry[];

  // === Toast ===
  toasts: ToastMessage[];

  // === 相机 ===
  cameraTarget: { x: number; y: number } | null;
  cameraZoom: number;

  // === Actions ===
  openPanel: (panelId: PanelId) => void;
  closePanel: () => void;
  togglePanel: (panelId: PanelId) => void;
  openModal: (modalId: ModalId, data?: Record<string, any>) => void;
  closeModal: () => void;
  showToast: (message: string, type: ToastType) => void;
  pushDialog: (entry: DialogEntry) => void;
  setCameraFocus: (target: { x: number; y: number } | null) => void;
  setCameraZoom: (zoom: number) => void;
}
```

### 5.2 数据流向图

```
                         ┌──────────────────┐
                         │   用户交互/输入    │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │Canvas 点击  │ │ UI 按钮   │ │ 键盘快捷键 │
            └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                  │             │             │
                  ▼             ▼             ▼
            ┌───────────────────────────────────────┐
            │           Event Bus (事件分发)          │
            │  customer:entered                     │
            │  brew:completed → economy:goldChanged │
            │  shop:levelUp → ui:panelOpened        │
            └───────┬───────────────────┬───────────┘
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐  ┌──────────────────┐
        │   Game Systems     │  │   Zustand Stores  │
        │   (ECS Systems)    │  │                   │
        │                   │  │  useGameStore     │
        │  CustomerSystem   │──→│  useCustomerStore │
        │  BrewSystem       │──→│  useInventoryStore│
        │  EconomySystem    │──→│  useEmployeeStore │
        │  EmployeeSystem   │──→│  useShopStore     │
        │  InventorySystem  │──→│  useRecipeStore   │
        │  QuestSystem      │──→│  useUIStore       │
        └─────────┬─────────┘  └────────┬─────────┘
                  │                     │
                  │          ┌──────────┘
                  │          ▼
                  │  ┌───────────────────┐
                  │  │  IndexedDB (存档)  │
                  │  │  Dexie.js         │
                  │  └───────────────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  Renderer (PixiJS) │
        │  根据 State 渲染   │
        │  精灵/动画/特效    │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  React UI (DOM)   │
        │  订阅 Store 渲染   │
        │  面板/HUD/弹窗    │
        └───────────────────┘
```

**数据流向规则：**

1. **用户输入 → EventBus**：所有交互通过 EventBus 发出事件，不直接修改 State
2. **EventBus → Game Systems**：系统监听事件，执行游戏逻辑，产出新状态
3. **Game Systems → Zustand Store**：状态变更写入对应 Store
4. **Store → Renderer + React UI**：渲染层订阅 Store 变化，更新画面
5. **定时存档**：每游戏天结束（或每 5 分钟现实时间）自动写入 IndexedDB

### 5.3 存档数据结构设计

```typescript
// packages/game-ui/src/stores/SaveDataTypes.ts

interface SaveData {
  /** 存档元信息 */
  meta: SaveMeta;

  /** 游戏进度 */
  gameProgress: GameProgressData;

  /** 店铺数据 */
  shop: ShopData;

  /** 货币 */
  currency: CurrencyData;

  /** 库存 */
  inventory: InventoryData;

  /** 员工 */
  employees: EmployeeData[];

  /** 设备 */
  equipments: EquipmentData[];

  /** 家具与装修 */
  decorations: DecorationData;

  /** 食谱解锁 */
  recipes: RecipeProgressData;

  /** 顾客 */
  customers: CustomerProgressData;

  /** 任务与成就 */
  quests: QuestProgressData;

  /** 统计 */
  statistics: StatisticsData;

  /** 当前游戏内事件 */
  activeEvents: ActiveEventData[];
}

interface SaveMeta {
  version: string;              // 存档格式版本号（用于迁移）
  slotId: number;               // 存档槽位 (0-2)
  saveTime: number;             // 保存时间戳（现实时间）
  playTime: number;             // 累计游玩时间（秒）
  gameVersion: string;          // 游戏版本号
}

interface GameProgressData {
  gameDay: number;
  gameHour: number;
  gameMinute: number;
  gamePhase: GamePhase;
  weather: WeatherType;
  season: Season;
}

interface ShopData {
  level: number;
  name: string;
  rating: number;               // 1.0 - 5.0
  exp: number;
  expToNext: number;
  gridWidth: number;            // 店内网格宽度
  gridHeight: number;           // 店内网格高度
}

interface CurrencyData {
  gold: number;
  diamond: number;
}

interface InventoryData {
  items: Array<{
    itemId: string;
    quantity: number;
    quality: Quality;
    expiryGameDay: number | null;  // null 表示不过期
  }>;
  storageCapacity: number;
}

interface EmployeeData {
  id: string;
  role: EmployeeRole;
  name: string;
  level: number;
  exp: number;
  mood: number;                 // 0-100
  skillLevels: Partial<Record<EmployeeSkill, number>>;
  salary: number;
  isResting: boolean;
  restUntilDay: number;
}

interface EquipmentData {
  id: string;
  type: string;
  level: number;
  position: { x: number; y: number };
  durability: number;           // 0-100
}

interface DecorationData {
  placedFurnitures: Array<{
    instanceId: string;
    furnitureId: string;
    gridX: number;
    gridY: number;
    rotation: number;           // 0 | 90 | 180 | 270
    theme: string | null;       // 所属主题套装
  }>;
  currentWallpaper: string;
  currentFloor: string;
  currentTheme: string | null;
  savedLayouts: Array<{
    name: string;
    furnishings: DecorationData['placedFurnitures'];
  }>;
}

interface RecipeProgressData {
  unlockedRecipes: string[];
  recipeLevels: Record<string, number>;   // recipeId → 熟练度 1-5
  hiddenRecipesDiscovered: string[];
}

interface CustomerProgressData {
  customerBook: Array<{
    customerType: string;
    visitCount: number;
    favoriteProduct: string;
    lastVisitDay: number;
  }>;
  regularCustomers: Array<{
    customerType: string;
    name: string;
    visits: number;
    totalSpent: number;
  }>;
}

interface QuestProgressData {
  completedDailyQuests: string[];
  dailyQuestProgress: Record<string, number>;
  unlockedAchievements: string[];
  achievementProgress: Record<string, number>;
  lastDailyResetDay: number;
}

interface StatisticsData {
  totalGoldEarned: number;
  totalCustomersServed: number;
  totalPerfectBrews: number;
  totalProductsSold: number;
  busiestDay: number;
  longestStreak: number;
  // 按产品统计销量
  productSales: Record<string, number>;
}

interface ActiveEventData {
  eventType: string;
  startDay: number;
  endDay: number;
  progress: number;
}
```

---

## 6. 关键接口与类型定义

以下定义游戏中至少 25 个核心 TypeScript 接口/类型：

### 6.1 基础类型

```typescript
// === 基础坐标与位置 ===

/** 二维位置（像素坐标） */
interface Position {
  x: number;
  y: number;
}

/** 三维位置（含 Z 轴，用于等距排序） */
interface Position3D extends Position {
  z: number;
}

/** 网格坐标（装修模式使用） */
interface GridPosition {
  gridX: number;
  gridY: number;
}

// === 游戏时间 ===

/** 游戏内时间 */
interface GameTime {
  day: number;
  hour: number;   // 0-23
  minute: number; // 0-59
}

/** 时段划分 */
type DayPeriod =
  | 'early_morning'   // 5:00-6:59
  | 'morning'         // 7:00-9:59 (早高峰)
  | 'late_morning'    // 10:00-11:59
  | 'afternoon'       // 12:00-13:59
  | 'tea_time'        // 14:00-16:59 (下午茶高峰)
  | 'evening'         // 17:00-18:59
  | 'night_peak'      // 19:00-20:59 (晚高峰)
  | 'night'           // 21:00-22:59 (打烊准备)
  | 'closed';         // 23:00-4:59

/** 游戏阶段 */
type GamePhase = 'menu' | 'daytime' | 'closing' | 'paused';

/** 季节 */
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 天气 */
type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
```

### 6.2 顾客相关

```typescript
// === 顾客 ===

/** 顾客类型（PRD 中的顾客分类） */
type CustomerCategory =
  | 'office_worker'     // 上班族
  | 'student'           // 学生
  | 'retired'           // 退休老人
  | 'influencer'        // 网红博主
  | 'business'          // 商务人士
  | 'artist'            // 文艺青年
  | 'special';          // 特殊顾客

/** 顾客配置表数据（静态） */
interface CustomerConfig {
  /** 显示名称 */
  name: string;
  /** 顾客类型 */
  category: CustomerCategory;
  /** 出现条件 */
  spawnConditions: SpawnCondition[];
  /** 偏好产品类型 */
  preferences: string[];              // recipeId 列表
  /** 基础耐心值（秒，游戏内时间） */
  patience: number;
  /** 行走速度（像素/秒） */
  walkSpeed: number;
  /** 预算范围 [min, max] */
  budgetRange: [number, number];
  /** 小费概率 (0-1) */
  tipProbability: number;
  /** 小费比例 (0-1, 占订单总金额) */
  tipRate: number;
  /** 对话模板 ID 列表 */
  dialogTemplateIds: string[];
  /** 出现权重（同时段竞争出现时） */
  spawnWeight: number;
  /** 最大同时存在数量 */
  maxConcurrent: number;
}

/** 顾客出现条件 */
interface SpawnCondition {
  type: 'shop_level' | 'day_period' | 'weather' | 'season' | 'day_of_week' | 'shop_rating';
  operator: '>=' | '<=' | '==' | '!=';
  value: number | string;
}

/** 顾客运行时数据 */
interface CustomerRuntimeData {
  id: string;
  configId: string;
  entityId: number;            // ECS 实体 ID
  name: string;
  state: CustomerState;
  patience: number;
  maxPatience: number;
  satisfaction: number;        // 1-5
  orderId: string | null;
  hasTipped: boolean;
  arrivalTime: GameTime;
  seatEntityId?: number;
}

/** 顾客状态枚举 */
type CustomerState =
  | 'entering'
  | 'queueing'
  | 'ordering'
  | 'waiting'
  | 'eating'
  | 'chatting'
  | 'leaving'
  | 'angry';

/** 顾客图鉴条目 */
interface CustomerBookEntry {
  customerType: string;
  name: string;
  visitCount: number;
  favoriteProduct: string | null;
  firstMetDay: number;
  lastVisitDay: number;
}

/** 回头客数据 */
interface RegularCustomer {
  customerType: string;
  name: string;
  visits: number;
  totalSpent: number;
  averageSatisfaction: number;
  isVIP: boolean;
}
```

### 6.3 产品与食谱

```typescript
// === 产品/食谱 ===

/** 产品类别 */
type ProductCategory =
  | 'classic_coffee'     // 经典咖啡
  | 'specialty_drink'    // 特调饮品
  | 'cold_drink'         // 冷饮系列
  | 'dessert'            // 甜品
  | 'seasonal'           // 季节限定
  | 'hidden';            // 隐藏食谱

/** 食谱配置（静态数据） */
interface RecipeConfig {
  /** 食谱唯一 ID */
  id: string;
  /** 名称 */
  name: string;
  /** 类别 */
  category: ProductCategory;
  /** 制作步骤序列 */
  steps: RecipeStep[];
  /** 所需原料 */
  requiredIngredients: IngredientRequirement[];
  /** 所需设备 */
  requiredEquipment: string | null;  // equipment type id
  /** 基础售价 */
  basePrice: number;
  /** 基础制作时间（秒） */
  baseBrewTime: number;
  /** 经验值奖励 */
  expReward: number;
  /** 解锁条件 */
  unlockCondition: UnlockCondition;
  /** 品质加成因子（设备/原料等级每提升 1 级，品质加多少） */
  qualityFactors: QualityFactors;
  /** 图标资源键 */
  iconKey: string;
  /** 展示名称（可包含 emoji） */
  displayName: string;
  /** 描述 */
  description: string;
}

/** 制作步骤 */
interface RecipeStep {
  order: number;
  name: string;               // 步骤名称：磨豆/萃取/打奶泡/拉花
  duration: number;            // 持续时间（秒）
  interactionType: 'click' | 'swipe' | 'hold' | 'drag';
  qualityImpact: number;       // 该步骤对品质的影响权重 (0-1)
  animationKey: string;        // 对应的动画资源键
}

/** 原料需求 */
interface IngredientRequirement {
  ingredientId: string;
  quantity: number;
  /** 是否可替换（如可用燕麦奶替代牛奶） */
  substitutable: boolean;
  substitutes?: string[];
}

/** 解锁条件 */
interface UnlockCondition {
  type: 'shop_level' | 'equipment_purchased' | 'recipe_mastered' | 'event' | 'initial';
  value: number | string;
}

/** 品质影响因子 */
interface QualityFactors {
  equipmentLevel: number;      // 设备等级对品质的加成权重
  ingredientQuality: number;   // 原料品质对品质的加成权重
  operationAccuracy: number;   // 操作准确度对品质的加成权重
  employeeSkill: number;       // 员工技能对品质的加成权重
}

/** 产品运行时数据 */
interface ProductRuntimeData {
  id: string;
  recipeId: string;
  quality: number;             // 1-5 星
  brewProgress: number;        // 制作进度 0-100
  isComplete: boolean;
  assignedCustomerId: string | null;
  createdByEmployeeId: string | null;
  createdAt: GameTime;
}

/** 产品品质 */
type Quality = 1 | 2 | 3 | 4 | 5;
```

### 6.4 员工相关

```typescript
// === 员工 ===

/** 员工职位 */
type EmployeeRole =
  | 'barista'        // 咖啡师
  | 'pastry_chef'    // 甜品师
  | 'waiter'         // 服务员
  | 'cleaner'        // 清洁工
  | 'musician';      // 驻唱歌手

/** 员工技能 */
interface EmployeeSkill {
  /** 制作速度因子 (0.5-2.0)，值越小越快 */
  speedMultiplier: number;
  /** 品质加成 (0-50)，加到产品品质分上 */
  qualityBonus: number;
  /** 可同时处理的任务数 */
  concurrentTasks: number;
  /** 特殊技能 ID 列表 */
  specialSkills: string[];
}

/** 员工配置（静态数据） */
interface EmployeeConfig {
  role: EmployeeRole;
  maxLevel: number;
  baseSalary: number;
  walkSpeed: number;
  baseSkill: EmployeeSkill;
  /** 每级技能成长 */
  skillGrowthPerLevel: Partial<EmployeeSkill>;
  /** 特殊技能解锁条件 */
  specialSkillUnlocks: Array<{ level: number; skillId: string }>;
  /** 心情衰减速度 (每分钟心情值下降量) */
  moodDecayRate: number;
}

/** 员工运行时数据 */
interface EmployeeRuntimeData {
  id: string;
  name: string;
  role: EmployeeRole;
  level: number;
  exp: number;
  expToNext: number;
  mood: number;                // 0-100
  skill: EmployeeSkill;
  salary: number;
  state: EmployeeState;
  currentTask: EmployeeTask | null;
  entityId: number;
  hireDay: number;
  totalDaysWorked: number;
}

/** 员工状态 */
type EmployeeState =
  | 'idle'           // 空闲
  | 'working'        // 工作中
  | 'resting'        // 休息中
  | 'on_break';      // 强制休息（心情过低）

/** 员工任务 */
interface EmployeeTask {
  type: 'brew' | 'serve' | 'clean' | 'decorate' | 'perform';
  targetId: string;            // 目标实体/产品 ID
  priority: number;            // 1 (最高) - 10 (最低)
  assignedAt: GameTime;
  estimatedDuration: number;
}

/** 排班表 */
interface DaySchedule {
  day: number;
  assignments: ShiftAssignment[];
}

interface ShiftAssignment {
  employeeId: string;
  startHour: number;
  endHour: number;
  role: EmployeeRole;
}
```

### 6.5 设备与家具

```typescript
// === 设备 ===

/** 设备类型 */
type EquipmentType =
  | 'espresso_machine'    // 意式咖啡机
  | 'grinder'             // 磨豆机
  | 'milk_foamer'         // 奶泡机
  | 'pour_over_set'       // 手冲壶套装
  | 'oven'                // 烤箱
  | 'refrigerator'        // 冷藏柜
  | 'cash_register';      // 收银机

/** 设备配置（静态数据） */
interface EquipmentConfig {
  type: EquipmentType;
  name: string;
  maxLevel: number;
  /** 每级升级费用 */
  upgradeCosts: number[];
  /** 每级属性 */
  statsPerLevel: EquipmentStats[];
  /** 占地面积（网格数） */
  gridSize: { width: number; height: number };
  /** 交互半径（像素） */
  interactionRadius: number;
  /** 解锁该设备需要的店铺等级 */
  unlockShopLevel: number;
  /** 基础购买价格 */
  basePrice: number;
  /** 该设备能制作的食谱类型 */
  supportedCategories: ProductCategory[];
}

/** 设备属性 */
interface EquipmentStats {
  speedMultiplier: number;        // 制作速度倍率 (0.5-2.0)
  qualityBonus: number;           // 品质加成 (0-50)
  capacity: number;               // 容量（冷藏柜/仓库）
  durability: number;             // 耐久度 (0-100)
}

/** 设备运行时数据 */
interface EquipmentRuntimeData {
  instanceId: string;
  type: EquipmentType;
  level: number;
  position: GridPosition;
  durability: number;
  isWorking: boolean;             // 是否正在工作
  currentProductId: string | null;
  entityId: number;
}

// === 家具 ===

/** 家具类别 */
type FurnitureCategory =
  | 'table'    | 'chair'   | 'counter'  | 'sofa'
  | 'lamp'     | 'plant'   | 'wall_decor'| 'rug'
  | 'window'   | 'door'    | 'sign'     | 'speaker'
  | 'pet_bed';

/** 家具配置（静态数据） */
interface FurnitureConfig {
  id: string;
  name: string;
  category: FurnitureCategory;
  /** 主题 */
  theme: string | null;            // 所属主题套装
  /** 价格 */
  price: number;
  /** 占地面积 */
  gridSize: { width: number; height: number };
  /** 是否占用座位（table=4, counter=2 等） */
  seatCapacity: number;
  /** 环境加成 */
  atmosphereBonus: number;
  /** 精灵键 */
  spriteKey: string;
  /** 解锁条件 */
  unlockCondition: UnlockCondition;
  /** 是否可旋转 */
  rotatable: boolean;
}

/** 家具运行时数据 */
interface FurnitureRuntimeData {
  instanceId: string;
  furnitureId: string;
  gridPosition: GridPosition;
  rotation: number;
  entityId: number;
  isPlaced: boolean;             // 是否已放置在场景中
}

// === 装修 ===

/** 装修主题 */
interface ThemeSet {
  id: string;
  name: string;
  furnitureIds: string[];         // 包含的家具 ID
  wallpaperId: string;
  floorId: string;
  ambianceBonus: number;          // 整套使用的额外加成
  season: Season | null;          // 季节限定的主题
}
```

### 6.6 库存与原料

```typescript
// === 库存/原料 ===

/** 原料类别 */
type IngredientCategory =
  | 'coffee_bean'
  | 'milk'
  | 'syrup'
  | 'baking'
  | 'cup'
  | 'other';

/** 原料配置（静态数据） */
interface IngredientConfig {
  id: string;
  name: string;
  category: IngredientCategory;
  qualityLevels: QualityLevel[];
  /** 基础价格（每单位） */
  basePrice: number;
  /** 是否易过期 */
  perishable: boolean;
  /** 保质期（游戏天数，null 表示不限期） */
  shelfLife: number | null;
  /** 供应商 */
  supplierId: string;
  /** 关联食谱（展示该原料用于哪些食谱） */
  usedInRecipes: string[];
}

/** 品质等级 */
interface QualityLevel {
  quality: Quality;
  name: string;               // 普通 / 精品 / 庄园级
  priceMultiplier: number;    // 价格倍率
  qualityBonus: number;       // 对产品品质的加成
}

/** 库存物品运行时数据 */
interface InventoryItem {
  itemId: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  quality: Quality;
  purchaseDay: number;         // 购买的游戏天数
  expiryDay: number | null;    // 过期游戏天数
  isExpired: boolean;
}

// === 供应商 ===

/** 供应商配置 */
interface SupplierConfig {
  id: string;
  name: string;
  /** 供应的原料类别 */
  supplies: IngredientCategory[];
  /** 提供的品质等级 */
  qualityLevels: Quality[];
  /** 解锁条件 */
  unlockCondition: UnlockCondition;
  /** 送货时间（游戏小时） */
  deliveryHours: number[];
  /** 价格折扣 (0-1, 0.9 = 9折) */
  discount: number;
}
```

### 6.7 任务与成就

```typescript
// === 任务 ===

/** 任务类型 */
type QuestType = 'daily' | 'achievement' | 'event' | 'tutorial';

/** 任务配置（静态数据） */
interface QuestConfig {
  id: string;
  type: QuestType;
  name: string;
  description: string;
  /** 任务目标 */
  objectives: QuestObjective[];
  /** 奖励 */
  rewards: Reward[];
  /** 前置任务 ID */
  prerequisites?: string[];
  /** 是否为隐藏任务 */
  hidden: boolean;
  /** 分类标签 */
  tags: string[];
}

/** 任务目标 */
interface QuestObjective {
  type: 'sell_product' | 'serve_customer' | 'earn_gold'
      | 'perfect_brew' | 'unlock_recipe' | 'upgrade_equipment'
      | 'hire_employee' | 'collect_furniture' | 'reach_level'
      | 'consecutive_days' | 'get_review';
  target: number;              // 目标数量
  tracker: string;             // 跟踪的事件 key
}

/** 奖励 */
interface Reward {
  type: 'gold' | 'diamond' | 'exp' | 'item' | 'recipe' | 'furniture' | 'title';
  amount?: number;
  itemId?: string;
}

/** 任务运行时进度 */
interface QuestProgress {
  questId: string;
  objectives: Record<string, number>;  // objectiveIndex → currentProgress
  isCompleted: boolean;
  isClaimed: boolean;
  startedAt: GameTime;
}

// === 成就 ===

/** 成就配置 */
interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'brewing' | 'customer' | 'decoration' | 'employee' | 'hidden';
  tiers: AchievementTier[];
  iconKey: string;
}

/** 成就等级 */
interface AchievementTier {
  level: number;               // 1=铜, 2=银, 3=金, 4=钻石
  requirement: number;
  rewards: Reward[];
}
```

### 6.8 订单与结算

```typescript
// === 订单 ===

/** 顾客订单 */
interface CustomerOrder {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  placedAt: GameTime;
  deadline: GameTime;           // 超时则顾客不满
  status: OrderStatus;
  priority: number;             // 制作优先级
}

/** 订单项 */
interface OrderItem {
  recipeId: string;
  quantity: number;
  specialRequest: string | null; // 特殊要求（如"多奶泡"、"少糖"）
  assignedTo: string | null;     // 分配给哪个员工/设备
  status: 'pending' | 'brewing' | 'completed' | 'delivered';
}

/** 订单状态 */
type OrderStatus =
  | 'placed'       // 已下单
  | 'accepted'     // 已被厨房接受
  | 'brewing'      // 制作中
  | 'ready'        // 制作完成，待送餐
  | 'serving'      // 送餐中
  | 'completed'    // 已送达
  | 'cancelled';   // 已取消

// === 结算 ===

/** 订单结算 */
interface OrderSettlement {
  orderId: string;
  customerId: string;
  /** 各产品的品质评分 */
  productRatings: Array<{ productId: string; quality: Quality }>;
  /** 总金额 */
  totalAmount: number;
  /** 小费 */
  tip: number;
  /** 顾客满意度 */
  satisfaction: number;
  /** 结算时间 */
  settledAt: GameTime;
  /** 是否因超时导致不满 */
  wasLate: boolean;
}
```

### 6.9 随机事件

```typescript
// === 随机事件 ===

/** 游戏随机事件 */
interface GameEventConfig {
  id: string;
  type: 'rush_hour' | 'vip_visit' | 'weather_change'
      | 'festival' | 'malfunction' | 'lucky_day' | 'special_customer';
  name: string;
  description: string;
  /** 触发概率权重 */
  weight: number;
  /** 触发条件 */
  conditions: SpawnCondition[];
  /** 持续时间（游戏分钟，0 表示瞬时事件） */
  duration: number;
  /** 事件效果 */
  effects: GameEventEffect[];
  /** 是否可重复触发 */
  repeatable: boolean;
  /** 冷却时间（游戏天数） */
  cooldownDays: number;
}

/** 事件效果 */
interface GameEventEffect {
  type: 'modify_customer_rate' | 'modify_price' | 'modify_brew_speed'
      | 'modify_tip_rate' | 'unlock_recipe' | 'spawn_npc'
      | 'add_gold' | 'add_diamond';
  target: string;
  modifier: number;
  duration: number;            // 0 表示永久
}
```

### 6.10 存档与设置

```typescript
// === 存档 ===

/** 存档槽信息 */
interface SaveSlotInfo {
  slotId: number;
  shopName: string;
  shopLevel: number;
  gameDay: number;
  gold: number;
  playTime: number;
  saveTime: number;
  thumbnail: string;           // Base64 缩略图
}

// === 玩家设置 ===

/** 游戏设置 */
interface GameSettings {
  /** 主音量 0-1 */
  masterVolume: number;
  /** BGM 音量 0-1 */
  bgmVolume: number;
  /** 音效音量 0-1 */
  sfxVolume: number;
  /** 是否静音 */
  muted: boolean;
  /** 语言 */
  language: 'zh-CN' | 'en-US';
  /** 自动存档间隔（游戏天数） */
  autoSaveInterval: number;
  /** 性能模式 */
  performanceMode: 'auto' | 'high' | 'medium' | 'low';
  /** 粒子特效开关 */
  showParticles: boolean;
  /** 屏幕震动开关 */
  screenShake: boolean;
  /** 是否显示教程 */
  showTutorial: boolean;
}
```

---

## 7. 性能优化策略

### 7.1 Canvas 渲染优化

#### 7.1.1 视口裁剪（Viewport Culling）

只渲染当前摄像机视野内的对象，显著减少绘制调用：

```typescript
// packages/game-renderer/src/optimization/ViewportCuller.ts

class ViewportCuller {
  /** 判断对象是否在视口内（含缓冲区） */
  static isInViewport(
    object: { x: number; y: number; width: number; height: number },
    camera: PIXI.Container,
    screenWidth: number,
    screenHeight: number,
    buffer: number = 100,  // 缓冲区像素
  ): boolean {
    const screenPos = camera.toGlobal(new PIXI.Point(object.x, object.y));

    return (
      screenPos.x + object.width > -buffer &&
      screenPos.x - object.width < screenWidth + buffer &&
      screenPos.y + object.height > -buffer &&
      screenPos.y - object.height < screenHeight + buffer
    );
  }
}
```

#### 7.1.2 纹理图集（Texture Atlas）

使用 TexturePacker 将多个精灵图打包为一张大图，减少 GPU 纹理切换：

```
资源组织方案：
- atlas_scene_common.png/json     # 场景通用元素（地板、墙壁、门窗）
- atlas_furniture.png/json        # 全部家具精灵
- atlas_characters.png/json       # 全部角色精灵（顾客 + 员工）
- atlas_effects.png/json          # 粒子特效图集
- atlas_ui_icons.png/json         # UI 图标图集
```

```typescript
// packages/game-renderer/src/assets/AssetLoader.ts

class AssetLoader {
  private loadedBundles: Set<string> = new Set();

  /** 分阶段加载资源 */
  async loadBootAssets(): Promise<void> {
    // 启动阶段：仅加载 loading 界面 + 关键 UI
    await this.loadBundle('boot', ['atlas_ui_icons', 'font_main']);
  }

  async loadCoreAssets(): Promise<void> {
    // 核心资源：主场景 + 角色
    await this.loadBundle('core', [
      'atlas_scene_common',
      'atlas_characters',
    ]);
  }

  async loadGameplayAssets(): Promise<void> {
    // 玩法资源：家具 + 特效（可后台加载）
    await this.loadBundle('gameplay', [
      'atlas_furniture',
      'atlas_effects',
    ]);
  }

  async loadOnDemandAssets(keys: string[]): Promise<void> {
    // 按需加载：特定面板使用的资源
    const unloaded = keys.filter((k) => !this.loadedBundles.has(k));
    if (unloaded.length > 0) {
      await this.loadBundle('on_demand', unloaded);
    }
  }

  private async loadBundle(name: string, keys: string[]): Promise<void> {
    // 使用 PIXI.Assets 批量加载
    const promises = keys.map((key) => PIXI.Assets.load(key));
    await Promise.all(promises);
    keys.forEach((k) => this.loadedBundles.add(k));
  }
}
```

#### 7.1.3 对象池（Object Pool）

频繁创建/销毁的对象（飘字、粒子、顾客气泡）使用对象池：

```typescript
// packages/game-renderer/src/optimization/ObjectPool.ts

class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (item: T) => void;
  private activeCount: number = 0;

  constructor(
    factory: () => T,
    reset: (item: T) => void,
    initialSize: number = 10,
  ) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.factory();
    }
    this.activeCount++;
    return item;
  }

  release(item: T): void {
    this.reset(item);
    this.pool.push(item);
    this.activeCount--;
  }

  get activeCount(): number {
    return this.activeCount;
  }

  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }
}

// 使用示例：漂浮文字对象池
const floatingTextPool = new ObjectPool<PIXI.Text>(
  () => new PIXI.Text('', { fontSize: 20, fill: 0xFFD700 }),
  (text) => {
    text.visible = false;
    text.alpha = 1;
    text.text = '';
  },
  20,
);
```

#### 7.1.4 脏矩形检测

对于等距场景的静态部分（地板、墙壁、已放置的家具），仅在变更时重绘：

```typescript
// packages/game-renderer/src/optimization/DirtyRectManager.ts

class DirtyRectManager {
  private dirtyRects: PIXI.Rectangle[] = [];
  private staticLayerCache: Map<string, PIXI.RenderTexture> = new Map();

  /** 标记区域需要重绘 */
  markDirty(rect: PIXI.Rectangle): void {
    // 合并重叠的脏矩形
    let merged = false;
    for (const existing of this.dirtyRects) {
      if (this.overlaps(existing, rect)) {
        existing.enlarge(rect);
        merged = true;
        break;
      }
    }
    if (!merged) {
      this.dirtyRects.push(rect.clone());
    }
  }

  /** 将静态层渲染到 RenderTexture 中缓存 */
  cacheStaticLayer(key: string, container: PIXI.Container, renderer: PIXI.Renderer): void {
    const rt = PIXI.RenderTexture.create({
      width: container.width,
      height: container.height,
    });
    renderer.render(container, { renderTexture: rt });
    this.staticLayerCache.set(key, rt);

    // 用 Sprite 替换 container 内容
    const sprite = new PIXI.Sprite(rt);
    container.removeChildren();
    container.addChild(sprite);
  }

  /** 使静态层缓存失效 */
  invalidateStaticLayer(key: string): void {
    const rt = this.staticLayerCache.get(key);
    if (rt) {
      rt.destroy(true);
      this.staticLayerCache.delete(key);
    }
    // 标记关联区域为脏
    this.markDirty(this.getLayerBounds(key));
  }
}
```

#### 7.1.5 降低像素比

在低端设备上使用更低的渲染分辨率：

```typescript
// 根据设备性能动态调整分辨率
const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
const resolution = performanceMode === 'low' ? 1 : devicePixelRatio;

app.renderer.resolution = resolution;
app.renderer.resize(screenWidth, screenHeight);
```

### 7.2 资源加载策略

```
资源加载时间线：

应用启动 (0ms)
  │
  ├─→ [0-500ms]   加载 Boot 资源
  │    ├── 关键 CSS / 字体
  │    ├── Loading 界面精灵
  │    └── UI 图标图集（底部导航栏图标）
  │
  ├─→ [500-2000ms] 加载核心资源（显示 Loading 进度条）
  │    ├── 场景通用图集 (atlas_scene_common)
  │    ├── 角色图集 (atlas_characters)
  │    ├── 核心音频 (BGM)
  │    └── 核心配置表 (JSON)
  │
  ├─→ [进入游戏主场景]
  │
  ├─→ [后台加载]   加载玩法资源
  │    ├── 家具图集 (atlas_furniture)
  │    ├── 特效图集 (atlas_effects)
  │    └── 全部音效 (SFX)
  │
  └─→ [按需懒加载] 面板打开时加载
       ├── 食谱大图
       ├── 顾客立绘
       └── 成就图标
```

```typescript
// packages/game-renderer/src/assets/ProgressiveLoader.ts

class ProgressiveLoader {
  private loadingQueue: Array<{ keys: string[]; priority: number }> = [];
  private isProcessing: boolean = false;

  /** 添加加载任务 */
  enqueue(keys: string[], priority: number = 0): void {
    this.loadingQueue.push({ keys, priority });
    this.loadingQueue.sort((a, b) => b.priority - a.priority);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.loadingQueue.length === 0) return;
    this.isProcessing = true;

    // 使用 requestIdleCallback 在浏览器空闲时加载
    const processNext = async () => {
      const task = this.loadingQueue.shift();
      if (!task) {
        this.isProcessing = false;
        return;
      }
      await AssetLoader.loadOnDemandAssets(task.keys);
      this.isProcessing = false;
      this.processQueue();
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => processNext(), { timeout: 2000 });
    } else {
      setTimeout(processNext, 100);
    }
  }
}
```

### 7.3 内存管理

```typescript
// packages/game-renderer/src/optimization/MemoryManager.ts

class MemoryManager {
  private disposeQueue: Array<{ dispose: () => void }> = [];
  private gcThreshold: number = 50; // 累积 50 个待销毁对象后批量 GC

  /** 注册可销毁对象 */
  register(disposable: { dispose: () => void }): void {
    this.disposeQueue.push(disposable);
    if (this.disposeQueue.length >= this.gcThreshold) {
      this.collect();
    }
  }

  /** 批量销毁 */
  collect(): void {
    for (const item of this.disposeQueue) {
      item.dispose();
    }
    this.disposeQueue.length = 0;
  }

  /** 场景切换时强制 GC */
  forceCollect(): void {
    this.collect();
    // 清理纹理缓存
    PIXI.utils.destroyTextureCache();
    // 清理 BaseTexture 缓存
    PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.LINEAR;
  }

  /** 获取当前内存使用信息 */
  getMemoryInfo(): MemoryInfo {
    return {
      textureCount: PIXI.utils.TextureCache['_textures']?.size ?? 0,
      disposedCount: this.disposeQueue.length,
      // 使用 performance.memory (Chrome only) 获取堆大小
      heapUsed: (performance as any).memory?.usedJSHeapSize ?? 0,
    };
  }
}
```

**内存管理要点：**

1. **及时销毁纹理**：离开场景或替换精灵时，调用 `texture.destroy(true)` 释放 GPU 内存
2. **弱引用缓存**：使用 `WeakMap` 存储实体到显示对象的映射，实体销毁时渲染对象自动回收
3. **音频资源**：长时间不用的音效调用 `howl.unload()` 释放
4. **场景切换**：离开场景时，销毁场景内全部渲染对象和纹理缓存
5. **存档限制**：最多保留 3 个存档槽，IndexedDB 总大小控制在 10MB 以内

---

## 8. 开发规范

### 8.1 命名规范

#### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件文件 | PascalCase | `StatusBar.tsx`, `ShopPanel.tsx` |
| React Hook 文件 | camelCase, `use` 前缀 | `useGameStore.ts`, `useCustomerAI.ts` |
| 游戏类/模块文件 | PascalCase | `GameLoop.ts`, `SceneManager.ts` |
| 工具函数文件 | camelCase | `isometricUtils.ts`, `mathHelpers.ts` |
| 类型定义文件 | PascalCase, `Types` 后缀 或 `types.ts` | `EntityTypes.ts`, `saveTypes.ts` |
| 配置文件 | camelCase | `recipeConfig.ts`, `equipmentConfig.ts` |
| 测试文件 | `*.test.ts` / `*.spec.ts` | `GameLoop.test.ts` |
| 样式文件 | `*.module.css` 或 `*.css` | `ShopPanel.module.css` |
| 常量文件 | camelCase | `gameConstants.ts` |
| 目录 | kebab-case 或 camelCase | `game-core/`, `game-renderer/` |

#### 变量/函数命名

```typescript
// === 变量命名 ===
// 接口/类型: PascalCase, I 前缀不强制
interface CustomerConfig { }        // ✅
interface ICustomerConfig { }       // ✅ 也可

// 枚举: PascalCase, 成员 PascalCase 或 SCREAMING_SNAKE_CASE
enum CustomerState {
  Entering = 'entering',            // ✅ PascalCase
}
enum ITEM_CATEGORY {                // ✅ SCREAMING 也可
  COFFEE = 'coffee',
}

// 变量: camelCase
const activeCustomers: Customer[] = [];
const isPanelOpen: boolean = false;
let gameSpeed: number = 1;

// 常量: SCREAMING_SNAKE_CASE 或 camelCase (模块作用域)
const MAX_TABLES = 20;
const DEFAULT_GAME_SPEED = 1;
const gameConfig = { /* ... */ };   // 如果是对象，可用 camelCase

// 函数: camelCase, 动词开头
function calculateSatisfaction(): number { }
function isValidPosition(): boolean { }
function spawnCustomer(): Entity { }
async function loadSaveData(): Promise<SaveData> { }

// 事件处理函数: handle + 事件名
const handlePanelOpen = () => { };
const handleCustomerClick = () => { };
const handleBrewComplete = () => { };

// Store actions: 动词 + 名词
addGold(); removeItem(); updateState(); setActivePanel();

// 私有成员: _ 前缀（可选）
private _accumulator: number = 0;
private _running: boolean = false;
```

#### 组件命名

```typescript
// React 组件: PascalCase, 描述性名称
function StatusBar() { }
function ShopItemCard() { }
function CustomerThoughtBubble() { }

// 容器组件 vs 展示组件（可选区分）
function ShopPanelContainer() { }   // 容器（含逻辑）
function ShopPanelView() { }        // 纯展示

// 高阶组件: with + 功能名
function withErrorBoundary<P>(Component: React.ComponentType<P>) { }

// Render Props 组件
function MouseTracker(props: { render: (pos: Position) => React.ReactNode }) { }
```

### 8.2 Git 分支策略

采用 **Trunk-Based Development** 简化版，适合小团队快速迭代：

```
main (受保护分支)
  │
  ├── develop                    # 开发主分支（日常开发合并到这里）
  │   │
  │   ├── feature/M1-core-loop   # MVP M1: 核心循环
  │   ├── feature/M2-customer-ai # MVP M2: 顾客 AI
  │   ├── feature/M3-economy     # MVP M3: 经济系统
  │   ├── feature/M4-decoration  # MVP M4: 装修系统
  │   └── feature/*              # 其他功能分支
  │
  ├── hotfix/*                   # 紧急修复（直接从 main 切出）
  │
  └── release/v1.0               # 发布分支（从 develop 切出，合并到 main）
```

**分支规则：**

| 分支 | 用途 | 生命周期 | 合并目标 |
|------|------|---------|---------|
| `main` | 可随时部署的稳定版本 | 永久 | — |
| `develop` | 日常开发集成分支 | 永久 | — |
| `feature/*` | 新功能开发 | 功能完成后删除 | `develop` |
| `hotfix/*` | 线上紧急修复 | 修复发布后删除 | `main` + `develop` |
| `release/*` | 发布前准备（版本号更新、文档） | 发布后删除 | `main` + `develop` |

**Commit Message 规范（Conventional Commits）：**

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 代码重构
- `style`: 代码风格（不影响功能）
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建/工具/依赖更新
- `perf`: 性能优化

示例：
```
feat(game-core): 实现顾客状态机的订购状态处理

- 添加 Ordering 状态的 enter/update/exit 处理
- 集成订单生成器 OrderGenerator
- 实现顾客偏好匹配逻辑

Refs: #42
```

```
fix(renderer): 修复等距场景中家具渲染层级错误

问题：沙发遮挡了其后的顾客，导致无法点击。
根因：深度排序未考虑家具的 gridHeight。

Closes: #67
```

### 8.3 代码审查标准

#### PR 提交要求

1. **PR 标题**：遵循 Conventional Commits 格式
2. **PR 描述模板**：

```markdown
## 变更概述
简要描述本次变更内容

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 性能优化
- [ ] 文档

## 测试
- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 无 TypeScript 类型错误

## 截图/录屏
（如涉及 UI 变更，附上截图）

## 相关 Issue
Closes #xxx
```

#### 代码质量检查（CI 自动执行）

```yaml
# .github/workflows/ci.yml 中的检查项：

1. TypeScript 类型检查：pnpm typecheck
   - tsconfig 启用 strict: true
   - 禁用 any（使用 eslint no-explicit-any 规则限制）
   - 导出函数/类必须有明确返回类型

2. ESLint 检查：pnpm lint
   关键规则：
   - @typescript-eslint/no-unused-vars: error
   - @typescript-eslint/explicit-function-return-type: warn
   - react-hooks/rules-of-hooks: error
   - react-hooks/exhaustive-deps: warn
   - no-console: warn (生产环境 error)
   - prefer-const: error

3. 单元测试：pnpm test
   - 核心逻辑覆盖率 > 80%（game-core 包）
   - 渲染层覆盖率 > 60%（game-renderer 包）
   - UI 组件覆盖率 > 50%（game-ui 包）

4. 构建检查：pnpm build
   - 生产构建无错误
   - 包体积在预算内：
     - game-core < 50KB (min+gzip)
     - game-renderer < 30KB (min+gzip, 不含 PixiJS)
     - game-ui < 80KB (min+gzip, 不含 React)
     - app 总包 < 1MB (min+gzip, 不含资源文件)

5. 格式化检查：prettier --check
```

#### 审查要点（Review Checklist）

```
□ 代码逻辑正确性
  □ 边界条件处理（空数组、null、undefined）
  □ 异步操作错误处理
  □ 数值溢出/精度问题（金币使用整数，避免浮点累加）

□ 性能
  □ 避免在渲染循环中创建对象（使用对象池）
  □ React 组件避免不必要的重渲染（React.memo、useMemo、useCallback）
  □ 大列表使用虚拟滚动或分页
  □ Canvas 操作使用了对象池/缓存

□ 可维护性
  □ 函数单一职责，不超过 50 行
  □ 魔法数字替换为命名常量
  □ 复杂条件提取为命名函数
  □ 注释解释"为什么"而非"是什么"

□ 类型安全
  □ 无 any 类型（除非有充分理由并注释说明）
  □ 使用 discriminated union 代替 string 枚举
  □ 函数参数不超过 4 个（超出用对象参数）

□ 游戏特定
  □ 新增系统是否正确注册到 World
  □ 状态变更是否通过 EventBus 通知相关方
  □ 存档兼容性：新增字段是否可选（?）
  □ 数值更改是否同步更新配置表
```

### 8.4 TypeScript 严格配置

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    // 严格模式
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,

    // 模块
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    // 路径别名
    "baseUrl": ".",
    "paths": {
      "@game-core/*": ["packages/game-core/src/*"],
      "@game-renderer/*": ["packages/game-renderer/src/*"],
      "@game-ui/*": ["packages/game-ui/src/*"]
    },

    // 其他
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 8.5 目录导入规范

```typescript
// === 推荐的导入顺序 ===

// 1. Node 内置模块
import path from 'node:path';

// 2. 第三方库
import { create } from 'zustand';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// 3. 内部包（使用路径别名）
import { World, EntityFactory } from '@game-core/ecs';
import { SceneManager } from '@game-renderer/scenes';
import { useGameStore } from '@game-ui/stores';

// 4. 同包内相对路径导入
import { calculateQuality } from '../utils/qualityUtils';
import type { CustomerConfig } from '../types/customerTypes';

// 5. 样式文件
import './ShopPanel.module.css';
```

---

## 附录 A：等距坐标转换

```typescript
// packages/game-renderer/src/utils/isometricUtils.ts

/**
 * 等距坐标系统：
 *
 * 屏幕坐标 (screenX, screenY) ←→ 等距世界坐标 (worldX, worldY)
 *
 * 等距转换矩阵：
 *   screenX = (worldX - worldY) * TILE_WIDTH / 2
 *   screenY = (worldX + worldY) * TILE_HEIGHT / 2 - worldZ * TILE_HEIGHT
 */

const TILE_WIDTH = 128;   // 菱形瓦片宽度
const TILE_HEIGHT = 64;   // 菱形瓦片高度

function worldToScreen(worldX: number, worldY: number, worldZ: number = 0): { x: number; y: number } {
  return {
    x: (worldX - worldY) * (TILE_WIDTH / 2),
    y: (worldX + worldY) * (TILE_HEIGHT / 2) - worldZ * TILE_HEIGHT,
  };
}

function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
  const worldX = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const worldY = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
  return { x: Math.round(worldX), y: Math.round(worldY) };
}

/** 网格坐标（装修模式）→ 世界坐标 */
function gridToWorld(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: gridX * TILE_WIDTH + TILE_WIDTH / 2,
    y: gridY * TILE_HEIGHT + TILE_HEIGHT / 2,
  };
}

/** 世界坐标 → 网格坐标 */
function worldToGrid(worldX: number, worldY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(worldX / TILE_WIDTH),
    gridY: Math.floor(worldY / TILE_HEIGHT),
  };
}
```

---

## 附录 B：数值配置表设计

游戏中的数值不应硬编码，而是维护在独立的配置文件中，方便策划调参：

```typescript
// packages/game-core/src/config/GameBalanceConfig.ts

/**
 * 游戏平衡性配置表
 * 所有数值都可在此调整，无需修改业务代码
 */
const GameBalanceConfig = {
  // === 时间 ===
  time: {
    /** 游戏内 1 分钟 = 现实多少秒（1x 速度下） */
    realSecondsPerGameMinute: 0.5,
    /** 一天的游戏分钟数 */
    gameMinutesPerDay: 24 * 60,
    /** 营业开始时间（小时） */
    openingHour: 7,
    /** 营业结束时间（小时） */
    closingHour: 23,
    /** 加速倍率选项 */
    speedOptions: [0.5, 1, 2, 3] as const,
  },

  // === 货币 ===
  currency: {
    /** 初始金币 */
    initialGold: 500,
    /** 初始钻石 */
    initialDiamond: 10,
    /** 每日登陆钻石奖励 */
    dailyLoginDiamond: 2,
  },

  // === 顾客 ===
  customer: {
    /** 基础生成间隔（游戏分钟） */
    baseSpawnInterval: 15,
    /** 最大店内人数（Level 1） */
    baseMaxCustomers: 5,
    /** 每店铺等级增加的店内上限 */
    maxCustomersPerLevel: 1,
    /** 排队最大长度 */
    maxQueueLength: 6,
    /** 基础耐心值（游戏分钟） */
    basePatience: 10,
    /** 满意到生气的耐心阈值（游戏分钟） */
    angerThreshold: 5,
  },

  // === 制作 ===
  brewing: {
    /** 基础制作时间（秒） */
    baseBrewTime: 8,
    /** 操作准确度对品质的影响权重 */
    accuracyWeight: 0.4,
    /** 设备等级对品质的影响权重 */
    equipmentWeight: 0.3,
    /** 原料品质对品质的影响权重 */
    ingredientWeight: 0.2,
    /** 员工技能对品质的影响权重 */
    employeeWeight: 0.1,
    /** 完美咖啡品质阈值 (0-100) */
    perfectThreshold: 95,
    /** 5星品质阈值 */
    fiveStarThreshold: 90,
    /** 4星品质阈值 */
    fourStarThreshold: 75,
    /** 3星品质阈值 */
    threeStarThreshold: 55,
    /** 2星品质阈值 */
    twoStarThreshold: 30,
  },

  // === 经济 ===
  economy: {
    /** 小费基础概率 */
    baseTipProbability: 0.1,
    /** 满意度为 5 星时的额外小费概率加成 */
    perfectSatisfactionTipBonus: 0.4,
    /** 小费金额占订单金额的比例 */
    tipRate: 0.1,
    /** 员工工资支付间隔（游戏天数） */
    salaryIntervalDays: 3,
  },

  // === 升级 ===
  shopLeveling: {
    /** 升级所需经验值公式 */
    expRequired: (level: number): number => Math.floor(100 * level * 1.5),
    /** 每级解锁员工位 */
    employeesPerLevel: (level: number): number => {
      if (level >= 20) return 5;
      if (level >= 10) return 3;
      if (level >= 5) return 1;
      return 0;
    },
  },
} as const;
```

---

## 附录 C：关键风险与技术债务追踪

| 风险 | 等级 | 缓解措施 | 负责人 |
|------|------|---------|--------|
| PixiJS 与 React 渲染循环冲突 | 中 | 游戏循环独立于 React 渲染循环，通过 Store 单向同步 | 前端 |
| 等距场景复杂遮挡计算 | 中 | MVP 使用简化 2D 平铺视角，后续迭代引入真正等距 | 前端 |
| 移动端 Canvas 性能不足 | 中 | 降级策略：减少粒子特效、降低帧率到 30fps、减小渲染分辨率 | 前端 |
| IndexedDB 存档兼容性（版本升级） | 低 | 存档版本号机制 + 数据迁移脚本 | 全栈 |
| 音频在移动端自动播放受限 | 低 | 首次用户交互后解锁音频上下文 | 前端 |
| 大量家具影响装修模式性能 | 低 | 装修模式使用简化渲染（静态快照 + 半透明占位） | 前端 |

---

> 文档结束。
>
> 本文档将随着开发推进持续更新。如有疑问，请提交 Issue 或联系技术负责人。
