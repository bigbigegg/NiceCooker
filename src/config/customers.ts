import type { CustomerTypeId } from '@/types/customer';

/** 顾客类型基础默认值（未在具体类型中指定的字段将使用此默认值） */
const CUSTOMER_DEFAULTS = {
  patience: 120,
  spendingPower: 1.0,
  tipRate: 0.1,
  preferences: [] as string[],
  appearTimes: ['all'] as string[],
  speedSensitivity: 0.5,
  qualitySensitivity: 0.5,
  environmentSensitivity: 0.3,
  appearWeight: 0.1,
  minSpending: 10,
  maxSpending: 30,
  returnThreshold: 5,
  returnSpendingBonus: 0.1,
};

/** 单类顾客配置 */
export interface CustomerTypeConfig {
  patience: number;
  spendingPower: number;
  tipRate: number;
  preferences: string[];
  appearTimes: string[];
  speedSensitivity: number;
  qualitySensitivity: number;
  environmentSensitivity: number;
  appearWeight: number;
  minSpending: number;
  maxSpending: number;
  returnThreshold: number;
  returnSpendingBonus: number;
}

/** 7 种顾客类型配置（Game-Design 3.1.2） */
export const CUSTOMER_TYPES: Record<CustomerTypeId, CustomerTypeConfig> = {
  officeWorker: {
    patience: 60,
    spendingPower: 1.0,
    tipRate: 0.05,
    preferences: ['americano', 'latte'],
    appearTimes: ['07-09', '12-13'],
    speedSensitivity: 0.9,
    qualitySensitivity: 0.3,
    environmentSensitivity: 0.2,
    appearWeight: 0.25,
    minSpending: 15,
    maxSpending: 40,
    returnThreshold: 5,
    returnSpendingBonus: 0.1,
  },

  student: {
    patience: 180,
    spendingPower: 0.7,
    tipRate: CUSTOMER_DEFAULTS.tipRate,
    preferences: ['mocha', 'dessert'],
    appearTimes: ['14-18'],
    speedSensitivity: CUSTOMER_DEFAULTS.speedSensitivity,
    qualitySensitivity: CUSTOMER_DEFAULTS.qualitySensitivity,
    environmentSensitivity: CUSTOMER_DEFAULTS.environmentSensitivity,
    appearWeight: 0.2,
    minSpending: CUSTOMER_DEFAULTS.minSpending,
    maxSpending: CUSTOMER_DEFAULTS.maxSpending,
    returnThreshold: 3,
    returnSpendingBonus: CUSTOMER_DEFAULTS.returnSpendingBonus,
  },

  retiree: {
    patience: 300,
    spendingPower: 0.9,
    tipRate: CUSTOMER_DEFAULTS.tipRate,
    preferences: ['classic'],
    appearTimes: ['all'],
    speedSensitivity: CUSTOMER_DEFAULTS.speedSensitivity,
    qualitySensitivity: CUSTOMER_DEFAULTS.qualitySensitivity,
    environmentSensitivity: CUSTOMER_DEFAULTS.environmentSensitivity,
    appearWeight: 0.15,
    minSpending: CUSTOMER_DEFAULTS.minSpending,
    maxSpending: CUSTOMER_DEFAULTS.maxSpending,
    returnThreshold: CUSTOMER_DEFAULTS.returnThreshold,
    returnSpendingBonus: CUSTOMER_DEFAULTS.returnSpendingBonus,
  },

  influencer: {
    patience: 120,
    spendingPower: 1.3,
    tipRate: CUSTOMER_DEFAULTS.tipRate,
    preferences: ['special', 'latte_art'],
    appearTimes: ['14-17'],
    speedSensitivity: CUSTOMER_DEFAULTS.speedSensitivity,
    qualitySensitivity: 0.7,
    environmentSensitivity: 0.8,
    appearWeight: CUSTOMER_DEFAULTS.appearWeight,
    minSpending: CUSTOMER_DEFAULTS.minSpending,
    maxSpending: CUSTOMER_DEFAULTS.maxSpending,
    returnThreshold: CUSTOMER_DEFAULTS.returnThreshold,
    returnSpendingBonus: CUSTOMER_DEFAULTS.returnSpendingBonus,
  },

  business: {
    patience: 90,
    spendingPower: 1.5,
    tipRate: CUSTOMER_DEFAULTS.tipRate,
    preferences: ['single_origin'],
    appearTimes: ['all'],
    speedSensitivity: 0.7,
    qualitySensitivity: 0.9,
    environmentSensitivity: CUSTOMER_DEFAULTS.environmentSensitivity,
    appearWeight: CUSTOMER_DEFAULTS.appearWeight,
    minSpending: CUSTOMER_DEFAULTS.minSpending,
    maxSpending: CUSTOMER_DEFAULTS.maxSpending,
    returnThreshold: CUSTOMER_DEFAULTS.returnThreshold,
    returnSpendingBonus: CUSTOMER_DEFAULTS.returnSpendingBonus,
  },

  artist: {
    patience: 200,
    spendingPower: 1.1,
    tipRate: 0.25,
    preferences: ['pour_over', 'cold_brew'],
    appearTimes: ['all'],
    speedSensitivity: CUSTOMER_DEFAULTS.speedSensitivity,
    qualitySensitivity: 0.8,
    environmentSensitivity: 0.9,
    appearWeight: CUSTOMER_DEFAULTS.appearWeight,
    minSpending: CUSTOMER_DEFAULTS.minSpending,
    maxSpending: CUSTOMER_DEFAULTS.maxSpending,
    returnThreshold: CUSTOMER_DEFAULTS.returnThreshold,
    returnSpendingBonus: CUSTOMER_DEFAULTS.returnSpendingBonus,
  },

  special: {
    patience: 240,
    spendingPower: 1.8,
    tipRate: 0.5,
    preferences: [],
    appearTimes: ['all'],
    speedSensitivity: CUSTOMER_DEFAULTS.speedSensitivity,
    qualitySensitivity: CUSTOMER_DEFAULTS.qualitySensitivity,
    environmentSensitivity: CUSTOMER_DEFAULTS.environmentSensitivity,
    appearWeight: 0.05,
    minSpending: 50,
    maxSpending: 200,
    returnThreshold: CUSTOMER_DEFAULTS.returnThreshold,
    returnSpendingBonus: 0.5,
  },
};

/** 全局顾客系统参数 */
export const CUSTOMER_GLOBAL = {
  /** 排队人数上限 = 座位数 × maxQueueMultiplier */
  maxQueueMultiplier: 0.5,
  /** 成为回头客所需来访次数阈值 */
  returnCustomerThreshold: 3,
  /** 进店动画持续时间（秒） */
  enterDuration: 1.5,
  /** 点单耗时（秒） */
  orderDuration: 1.0,
  /** 用餐持续时间（秒） */
  eatDuration: 3.0,
  /** 结算后动画持续时间（秒） */
  leaveDuration: 1.0,
  /** 顾客生成检查间隔（游戏小时） */
  generationIntervalHours: 1,
  /** 最大店内顾客数 */
  maxCustomersInStore: 20,
} as const;

/**
 * 各游戏阶段客流系数
 *
 * 用于顾客生成公式中的时段系数
 */
export const PHASE_TRAFFIC_MULTIPLIER: Record<string, number> = {
  dawn: 0,
  morning: 0.8,
  rush_am: 1.5,
  forenoon: 1.0,
  noon: 1.6,
  afternoon: 0.7,
  tea_time: 1.3,
  evening: 1.0,
  rush_pm: 1.8,
  closing: 0.5,
  closed: 0,
};

/**
 * 判断顾客类型是否可在当前游戏小时出现
 *
 * @param appearTimes - 顾客类型的出现时间段配置（如 ['07-09', '12-13']）
 * @param currentHour - 当前游戏小时
 * @returns 是否可在此时间段出现
 */
export function isCustomerAvailableAtHour(
  appearTimes: string[],
  currentHour: number,
): boolean {
  if (appearTimes.length === 0) return false;
  if (appearTimes.includes('all')) return true;

  return appearTimes.some((range) => {
    const [startStr, endStr] = range.split('-');
    if (!startStr || !endStr) return false;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return currentHour >= start && currentHour < end;
  });
}
