/** 游戏时间配置 */
export const TIME_CONFIG = {
  /** 1 游戏日 = 12 现实分钟（1x速度） */
  minutesPerGameDay: 12,
  /** 营业开始时间 */
  openHour: 6,
  /** 营业结束时间 */
  closeHour: 22,
  /** 支持的速度档位 */
  speeds: [1, 2, 4] as const,
} as const;

/** 各阶段顾客流量系数 */
export const PHASE_CUSTOMER_FLOW: Record<string, number> = {
  dawn: 0.0,
  morning: 0.3,
  rush_am: 1.2,
  forenoon: 0.6,
  noon: 1.0,
  afternoon: 0.4,
  tea_time: 0.9,
  evening: 0.7,
  rush_pm: 1.3,
  closing: 0.3,
  closed: 0.0,
};
