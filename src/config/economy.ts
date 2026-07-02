/** 经济系统配置 */

/** 品质系数查找表 */
export const QUALITY_COEFFICIENT: Record<number, number> = {
  1: 0.7,
  2: 0.8,
  3: 0.9,
  4: 1.2,
  5: 1.5,
};

/** 品质对应的顾客满意度贡献 */
export const QUALITY_SATISFACTION_BONUS = {
  0: -20,   // 0-24 分 → 1星
  1: -20,
  2: -10,   // 25-44 分 → 2星
  3: 0,      // 45-64 分 → 3星
  4: 12,     // 65-84 分 → 4星
  5: 25,     // 85-100 分 → 5星
};

/** 店铺等级经验公式: 100 * level^1.6 * (1 + level * 0.05) */
export function expForNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.6) * (1 + level * 0.05));
}

/** 环境分对客流的上限加成 */
export const ENVIRONMENT_MAX_BONUS = 0.3;

/** 环境分对收入的上限加成 */
export function environmentIncomeBonus(envScore: number): number {
  return Math.min(envScore / 500, ENVIRONMENT_MAX_BONUS);
}
