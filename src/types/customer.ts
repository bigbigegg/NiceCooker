/** 顾客类型 ID */
export type CustomerTypeId =
  | 'officeWorker'
  | 'student'
  | 'retiree'
  | 'influencer'
  | 'business'
  | 'artist'
  | 'special';

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

/** 顾客状态 */
export type CustomerStateType =
  | 'entering'
  | 'ordering'
  | 'waiting'
  | 'eating'
  | 'leaving';

/**
 * 顾客实例（运行时数据）
 *
 * 每个进入店内的顾客都有一个实例，包含其类型配置的引用和当前状态。
 */
export interface CustomerInstance {
  /** 唯一标识 */
  id: string;
  /** 顾客类型 */
  typeId: CustomerTypeId;
  /** 类型配置引用（不可变） */
  config: CustomerTypeConfig;
  /** 当前状态 */
  state: CustomerStateType;
  /** 当前剩余耐心（秒） */
  patience: number;
  /** 最大耐心（秒） */
  maxPatience: number;
  /** 点选的菜品 ID */
  orderRecipeId: string | null;
  /** 满意度 0-100 */
  satisfaction: number;
  /** 来访次数 */
  visitCount: number;
  /** 是否为回头客 */
  isReturnCustomer: boolean;
  /** 是否已被服务（收到餐品） */
  isServed: boolean;
  /** 被服务的餐品品质星级 */
  servedQuality: number;
  /** 当前状态已持续时间（秒） */
  stateElapsed: number;
  /** 进入等待状态的时间戳（用于计算实际等待时间） */
  waitStartTime: number;
  /** 累计等待时间（秒） */
  totalWaitTime: number;
}

/**
 * 顾客来访记录（持久化数据）
 *
 * 用于判断回头客和消费历史追踪
 */
export interface CustomerVisitRecord {
  /** 顾客类型 */
  typeId: CustomerTypeId;
  /** 累计来访次数 */
  visitCount: number;
  /** 累计消费金额 */
  totalSpending: number;
  /** 上次来访日期 */
  lastVisitDay: number;
}

/**
 * 满意度计算参数
 */
export interface SatisfactionParams {
  /** 餐品品质星级 (1-5) */
  qualityStars: number;
  /** 店铺环境分 (0-100) */
  environmentScore: number;
  /** 顾客实际等待时间（秒） */
  actualWaitTime: number;
  /** 顾客耐心上限（秒） */
  maxPatience: number;
  /** 顾客品质敏感度 */
  qualitySensitivity: number;
  /** 顾客环境敏感度 */
  environmentSensitivity: number;
  /** 顾客速度敏感度 */
  speedSensitivity: number;
}
