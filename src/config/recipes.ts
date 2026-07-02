/**
 * 食谱数值配置
 *
 * 基于 Game-Design.md 第4章「产品与食谱数值」
 * 包含食谱的基础数值：制作时间、原料、成本、售价、经验、解锁条件、制作步骤。
 */

/** 食谱分类 */
export type RecipeCategory =
  | 'coffee'
  | 'dessert'
  | 'cold_drink'
  | 'special'
  | 'pour_over'
  | 'seasonal'
  | 'hidden';

/** 单个食谱配置 */
export interface RecipeConfig {
  /** 食谱唯一 ID（如 C01, D02） */
  id: string;
  /** 食谱名称（中文） */
  name: string;
  /** 食谱分类 */
  category: RecipeCategory;
  /** 制作时间（游戏秒） */
  baseTime: number;
  /** 原料列表: [原料ID, 数量] */
  ingredients: [string, number][];
  /** 原料总成本（金币） */
  cost: number;
  /** 基础售价（金币） */
  basePrice: number;
  /** 基础经验值 */
  baseExp: number;
  /** 解锁所需等级 */
  unlockLevel: number;
  /** 解锁所需金币（可选） */
  unlockGold?: number;
  /** 所需设备（可选） */
  requiredEquipment?: string;
  /** 制作步骤名称（中文，3-5个步骤） */
  steps: string[];
}

// ============================================================
// 经典咖啡 (8种)
// ============================================================

/** 浓缩咖啡 — 最基础的浓缩，一切咖啡的起点 */
export const C01_ESPRESSO: RecipeConfig = {
  id: 'C01',
  name: '浓缩咖啡',
  category: 'coffee',
  baseTime: 10,
  ingredients: [
    ['coffee_bean', 1],
    ['water', 1],
  ],
  cost: 5,
  basePrice: 25,
  baseExp: 10,
  unlockLevel: 1,
  steps: ['研磨咖啡豆', '填压咖啡粉', '萃取浓缩'],
};

/** 美式咖啡 — 浓缩加水，清爽提神 */
export const C02_AMERICANO: RecipeConfig = {
  id: 'C02',
  name: '美式咖啡',
  category: 'coffee',
  baseTime: 12,
  ingredients: [
    ['coffee_bean', 1],
    ['water', 2],
  ],
  cost: 5,
  basePrice: 30,
  baseExp: 12,
  unlockLevel: 1,
  steps: ['研磨咖啡豆', '萃取浓缩', '加入热水'],
};

/** 拿铁 — 浓缩与牛奶的经典融合 */
export const C03_LATTE: RecipeConfig = {
  id: 'C03',
  name: '拿铁',
  category: 'coffee',
  baseTime: 18,
  ingredients: [
    ['coffee_bean', 1],
    ['milk', 1],
  ],
  cost: 8,
  basePrice: 40,
  baseExp: 15,
  unlockLevel: 1,
  steps: ['研磨咖啡豆', '萃取浓缩', '打发牛奶', '融合拉花'],
};

/** 卡布奇诺 — 厚奶泡的经典意式咖啡 */
export const C04_CAPPUCCINO: RecipeConfig = {
  id: 'C04',
  name: '卡布奇诺',
  category: 'coffee',
  baseTime: 20,
  ingredients: [
    ['coffee_bean', 1],
    ['milk', 1.5],
  ],
  cost: 10,
  basePrice: 50,
  baseExp: 18,
  unlockLevel: 2,
  steps: ['研磨咖啡豆', '萃取浓缩', '打发厚奶泡', '倒入奶泡'],
};

/** 摩卡 — 巧克力与咖啡的甜蜜碰撞 */
export const C05_MOCHA: RecipeConfig = {
  id: 'C05',
  name: '摩卡',
  category: 'coffee',
  baseTime: 22,
  ingredients: [
    ['coffee_bean', 1],
    ['milk', 1],
    ['chocolate_syrup', 1],
  ],
  cost: 17,
  basePrice: 60,
  baseExp: 20,
  unlockLevel: 3,
  steps: ['研磨咖啡豆', '萃取浓缩', '加入巧克力酱', '打发牛奶', '挤上奶油顶'],
};

/** 玛奇朵 — 焦糖印记点缀的精致咖啡 */
export const C06_MACCHIATO: RecipeConfig = {
  id: 'C06',
  name: '玛奇朵',
  category: 'coffee',
  baseTime: 16,
  ingredients: [
    ['coffee_bean', 1],
    ['milk', 0.5],
    ['caramel', 1],
  ],
  cost: 13,
  basePrice: 55,
  baseExp: 18,
  unlockLevel: 3,
  steps: ['研磨咖啡豆', '萃取浓缩', '加入焦糖', '倒入牛奶'],
};

/** 白咖啡 — 奶油顶的丝滑诱惑 */
export const C07_WHITE_COFFEE: RecipeConfig = {
  id: 'C07',
  name: '白咖啡',
  category: 'coffee',
  baseTime: 20,
  ingredients: [
    ['coffee_bean', 1],
    ['milk', 1.5],
    ['cream', 1],
  ],
  cost: 18,
  basePrice: 65,
  baseExp: 22,
  unlockLevel: 5,
  steps: ['研磨咖啡豆', '萃取浓缩', '打发牛奶', '加入奶油', '融合'],
};

/** 澳白(Flat White) — 丝滑薄奶泡的精品 */
export const C08_FLAT_WHITE: RecipeConfig = {
  id: 'C08',
  name: '澳白',
  category: 'coffee',
  baseTime: 18,
  ingredients: [
    ['coffee_bean', 1.5],
    ['milk', 1],
  ],
  cost: 12,
  basePrice: 55,
  baseExp: 20,
  unlockLevel: 6,
  steps: ['研磨咖啡豆', '萃取浓缩', '打发丝滑奶泡', '融合'],
};

// ============================================================
// 甜品 (MVP 至少 D01-D02)
// ============================================================

/** 黄油曲奇 — 经典黄油香味，酥脆可口 */
export const D01_BUTTER_COOKIE: RecipeConfig = {
  id: 'D01',
  name: '黄油曲奇',
  category: 'dessert',
  baseTime: 25,
  ingredients: [
    ['flour', 1],
    ['butter', 1],
    ['sugar', 1],
  ],
  cost: 12,
  basePrice: 40,
  baseExp: 15,
  unlockLevel: 5,
  requiredEquipment: 'oven',
  steps: ['混合黄油与糖', '加入面粉搅拌', '揉成面团', '压模成型', '烘烤'],
};

/** 巧克力曲奇 — 浓郁巧克力，曲奇爱好者的最爱 */
export const D02_CHOCOLATE_COOKIE: RecipeConfig = {
  id: 'D02',
  name: '巧克力曲奇',
  category: 'dessert',
  baseTime: 25,
  ingredients: [
    ['flour', 1],
    ['butter', 1],
    ['sugar', 1],
    ['chocolate_syrup', 1],
  ],
  cost: 18,
  basePrice: 50,
  baseExp: 18,
  unlockLevel: 5,
  requiredEquipment: 'oven',
  steps: ['混合黄油与糖', '加入面粉与巧克力', '揉成面团', '压模成型', '烘烤'],
};

// ============================================================
// 冷饮 (MVP 至少 I01)
// ============================================================

/** 冰美式 — 清爽冰凉的经典美式 */
export const I01_ICED_AMERICANO: RecipeConfig = {
  id: 'I01',
  name: '冰美式',
  category: 'cold_drink',
  baseTime: 15,
  ingredients: [
    ['coffee_bean', 1],
    ['ice', 1],
  ],
  cost: 6,
  basePrice: 35,
  baseExp: 15,
  unlockLevel: 6,
  requiredEquipment: 'ice_machine',
  steps: ['研磨咖啡豆', '萃取浓缩', '加入冰块', '加入水'],
};

// ============================================================
// 食谱汇总表
// ============================================================

/**
 * 所有食谱配置的数组
 * MVP 阶段包含经典咖啡（8种）、甜品（2种）、冷饮（1种）
 */
export const ALL_RECIPES: RecipeConfig[] = [
  // 经典咖啡
  C01_ESPRESSO,
  C02_AMERICANO,
  C03_LATTE,
  C04_CAPPUCCINO,
  C05_MOCHA,
  C06_MACCHIATO,
  C07_WHITE_COFFEE,
  C08_FLAT_WHITE,
  // 甜品
  D01_BUTTER_COOKIE,
  D02_CHOCOLATE_COOKIE,
  // 冷饮
  I01_ICED_AMERICANO,
];

/**
 * 以 ID 为 key 的食谱 Map，便于快速查找
 */
export const RECIPES_BY_ID: ReadonlyMap<string, RecipeConfig> = new Map(
  ALL_RECIPES.map((r) => [r.id, r]),
);

// ============================================================
// 制作系统常量
// ============================================================

/** 同时制作槽位上限 */
export const MAX_CRAFTING_SLOTS = 2;

/** 默认设备等级（无设备时） */
export const DEFAULT_EQUIPMENT_LEVEL = 1;

/** 烹饪过程操作步骤数（至少） */
export const MIN_CRAFTING_STEPS = 2;
