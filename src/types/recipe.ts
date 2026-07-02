/**
 * 食谱与制作系统相关类型定义
 */

/** 产品品质等级：1-5星，0表示未完成 */
export type ProductQuality = 1 | 2 | 3 | 4 | 5;

/** 完美品质（特殊等级，仅品质分>=101时触发） */
export const PERFECT_QUALITY = 999 as const;
export type PerfectQuality = typeof PERFECT_QUALITY;

/** 品质值（含未完成与完美） */
export type QualityValue = 0 | ProductQuality | PerfectQuality;

/** 原料品质等级 */
export type IngredientQuality = 'normal' | 'premium' | 'estate';

/**
 * 制作任务
 * 表示一个正在进行的制作任务的状态
 */
export interface CraftingTask {
  /** 任务唯一 ID */
  id: string;
  /** 对应食谱 ID */
  recipeId: string;
  /** 制作台/工作站 ID */
  stationId: string;
  /** 制作进度 0-100 */
  progress: number;
  /** 当前制作步骤索引 */
  currentStep: number;
  /** 品质等级，0 表示尚未完成 */
  quality: QualityValue;
  /** 是否由员工自动制作 */
  isEmployeeCraft: boolean;
  /** 任务开始时间戳 */
  startedAt: number;
}

/**
 * 品质计算结果
 */
export interface QualityResult {
  /** 品质总分 (0-110) */
  score: number;
  /** 对应星级 */
  star: ProductQuality;
  /** 是否为完美品质 */
  isPerfect: boolean;
}

/**
 * 食谱熟练度信息
 */
export interface RecipeProficiency {
  /** 食谱 ID */
  recipeId: string;
  /** 制作次数 */
  craftCount: number;
  /** 最高品质等级（曾达到的） */
  bestQuality: ProductQuality;
  /** 品质稳定性加成（-3 ~ +3，随熟练度提升而减少波动范围） */
  stabilityBonus: number;
}
