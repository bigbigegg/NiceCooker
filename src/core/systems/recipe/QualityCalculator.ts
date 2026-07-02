/**
 * 品质分计算模块
 *
 * 基于 Game-Design.md 4.9.1 节的品质分计算模型：
 *
 * 最终品质分 = 设备品质分 + 原料品质分 + 操作分 + 员工加成 + 随机波动
 *
 * - 设备品质分（满分40分）= equipmentLevel × 4
 * - 原料品质分（满分30分）根据原料品质等级计算
 * - 操作分（满分30分）= operationAccuracy × 30
 * - 员工加成（满分10分）= employeeBonus × 10
 * - 随机波动：±3分
 *
 * 星级判定：
 *   0-24  → 1星
 *  25-44  → 2星
 *  45-64  → 3星
 *  65-84  → 4星
 *  85-100 → 5星
 * 101-110 → 👑完美 (1.8x 售价系数)
 */

import type { RecipeConfig } from '@/config/recipes';
import type {
  IngredientQuality,
  ProductQuality,
  QualityResult,
} from '@/types/recipe';
import { PERFECT_QUALITY } from '@/types/recipe';

// ============================================================
// 品质分系统常量
// ============================================================

/** 设备品质分满分 */
const MAX_EQUIPMENT_SCORE = 40;

/** 设备等级系数：每级 +4 分，最高40分 */
const EQUIPMENT_LEVEL_MULTIPLIER = 4;

/** 原料品质分上限 */
const MAX_INGREDIENT_SCORE = 30;

/** 普通原料每种加分 */
const NORMAL_INGREDIENT_SCORE = 3;

/** 普通原料评分上限 */
const NORMAL_INGREDIENT_CAP = 15;

/** 精品原料每种加分 */
const PREMIUM_INGREDIENT_SCORE = 5;

/** 精品原料评分上限 */
const PREMIUM_INGREDIENT_CAP = 25;

/** 庄园级原料每种加分 */
const ESTATE_INGREDIENT_SCORE = 8;

/** 庄园级原料评分上限 */
const ESTATE_INGREDIENT_CAP = 30;

/** 操作分满分 */
const MAX_OPERATION_SCORE = 30;

/** 员工加成满分 */
const MAX_EMPLOYEE_BONUS_SCORE = 10;

/** 员工加成系数 */
const EMPLOYEE_BONUS_MULTIPLIER = 10;

/** 随机波动范围 */
const RANDOM_FLUCTUATION_RANGE = 3;

/** 完美品质阈值 */
const PERFECT_SCORE_THRESHOLD = 101;

/** 品质总分上限 */
const MAX_TOTAL_SCORE = 110;

// ============================================================
// 星级判定表
// ============================================================

/** 星级判定阈值: [最低分, 最高分] -> 星级 */
const STAR_THRESHOLDS: [number, number, ProductQuality][] = [
  [0, 24, 1],
  [25, 44, 2],
  [45, 64, 3],
  [65, 84, 4],
  [85, 100, 5],
];

// ============================================================
// 导出函数
// ============================================================

/**
 * 计算原料品质分
 *
 * @param ingredientCount - 原料种类数
 * @param quality - 原料品质等级
 * @returns 原料品质分 (0-MAX_INGREDIENT_SCORE)
 */
function calculateIngredientScore(
  ingredientCount: number,
  quality: IngredientQuality,
): number {
  switch (quality) {
    case 'normal':
      return Math.min(ingredientCount * NORMAL_INGREDIENT_SCORE, NORMAL_INGREDIENT_CAP);
    case 'premium':
      return Math.min(ingredientCount * PREMIUM_INGREDIENT_SCORE, PREMIUM_INGREDIENT_CAP);
    case 'estate':
      return Math.min(ingredientCount * ESTATE_INGREDIENT_SCORE, ESTATE_INGREDIENT_CAP);
  }
}

/**
 * 生成随机波动值
 *
 * @returns -3 到 +3 之间的整数
 */
function randomFluctuation(): number {
  return Math.floor(Math.random() * (RANDOM_FLUCTUATION_RANGE * 2 + 1)) - RANDOM_FLUCTUATION_RANGE;
}

/**
 * 将品质总分转换为星级
 *
 * @param totalScore - 品质总分
 * @returns 对应星级（1-5）
 */
function scoreToStar(totalScore: number): ProductQuality {
  for (const [min, max, star] of STAR_THRESHOLDS) {
    if (totalScore >= min && totalScore <= max) {
      return star;
    }
  }
  // 超过 100 分但未达完美，仍算 5 星
  return 5;
}

/**
 * 计算产品制作的最终品质
 *
 * 基于设备等级、原料品质、操作准确度、员工加成
 * 以及随机波动综合计算品质分和星级。
 *
 * @param recipe - 食谱配置
 * @param equipmentLevel - 设备等级
 * @param ingredientQuality - 原料品质等级
 * @param operationAccuracy - 玩家操作准确度 (0-1)
 * @param employeeBonus - 员工品质加成 (0-1)
 * @returns 品质计算结果（分值与星级）
 *
 * @example
 * ```ts
 * const result = calculateQuality(C03_LATTE, 5, 'premium', 0.9, 0.5);
 * // result => { score: 67, star: 4, isPerfect: false }
 * ```
 */
export function calculateQuality(
  recipe: RecipeConfig,
  equipmentLevel: number,
  ingredientQuality: IngredientQuality,
  operationAccuracy: number,
  employeeBonus: number,
): QualityResult {
  // 1. 设备品质分（满分40）
  const equipmentScore = Math.min(
    equipmentLevel * EQUIPMENT_LEVEL_MULTIPLIER,
    MAX_EQUIPMENT_SCORE,
  );

  // 2. 原料品质分（满分30）
  const ingredientCount = recipe.ingredients.length;
  const ingredientScore = calculateIngredientScore(ingredientCount, ingredientQuality);

  // 3. 操作分（满分30）
  const clampedAccuracy = Math.max(0, Math.min(1, operationAccuracy));
  const operationScore = clampedAccuracy * MAX_OPERATION_SCORE;

  // 4. 员工加成（满分10）
  const clampedBonus = Math.max(0, Math.min(1, employeeBonus));
  const employeeScore = clampedBonus * EMPLOYEE_BONUS_MULTIPLIER;

  // 5. 随机波动（±3）
  const fluctuation = randomFluctuation();

  // 计算总分
  const rawScore = equipmentScore + ingredientScore + operationScore + employeeScore + fluctuation;
  const totalScore = Math.max(0, Math.min(rawScore, MAX_TOTAL_SCORE));

  // 判定星级
  const isPerfect = totalScore >= PERFECT_SCORE_THRESHOLD;
  const star = scoreToStar(totalScore);

  return {
    score: totalScore,
    star: isPerfect ? (PERFECT_QUALITY as unknown as ProductQuality) : star,
    isPerfect,
  };
}

/**
 * 获取品质对应的售价系数
 *
 * @param quality - 品质星级
 * @param isPerfect - 是否为完美品质
 * @returns 售价系数
 */
export function getQualityPriceCoefficient(
  quality: ProductQuality,
  isPerfect = false,
): number {
  if (isPerfect) return 1.8;
  const coefficients: Record<ProductQuality, number> = { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.2, 5: 1.5 };
  return coefficients[quality];
}

export { MAX_TOTAL_SCORE, PERFECT_SCORE_THRESHOLD };
