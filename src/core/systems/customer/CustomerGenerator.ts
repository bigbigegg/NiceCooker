import { eventBus } from '@/core/EventBus';
import { useTimeStore } from '@/stores/timeStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCustomerStore } from '@/stores/customerStore';
import {
  CUSTOMER_TYPES,
  CUSTOMER_GLOBAL,
  PHASE_TRAFFIC_MULTIPLIER,
  isCustomerAvailableAtHour,
} from '@/config/customers';
import type { CustomerTypeId, CustomerInstance } from '@/types/customer';

let customerIdCounter = 0;

/**
 * 生成唯一顾客 ID
 */
function generateCustomerId(): string {
  customerIdCounter++;
  return `c_${Date.now()}_${customerIdCounter}`;
}

/**
 * 顾客生成器
 *
 * 每游戏小时检查并生成顾客。
 *
 * 客流公式（Game-Design 3.1）：
 * ```
 * 0.5 × 时段系数 × (1 + (等级 - 1) × 0.08) × (1 + min(环境分 / 200, 0.25)) × random(0.8, 1.2)
 * ```
 */
export class CustomerGenerator {
  /** 上次检查的游戏小时 */
  private lastCheckedHour = -1;

  /**
   * 每帧调用，检查是否需要生成顾客
   *
   * @returns 本帧新生成的顾客实例列表
   */
  update(): CustomerInstance[] {
    const timeState = useTimeStore.getState();
    const currentHour = timeState.time.hour;

    // 只在游戏小时变化时检查一次
    if (currentHour === this.lastCheckedHour) return [];
    this.lastCheckedHour = currentHour;

    // 非营业时间不生成
    if (!timeState.isBusinessHours) return [];

    const expectedCount = this.calculateCustomerCount();
    if (expectedCount <= 0) return [];

    const actualCount = Math.max(1, Math.round(expectedCount));
    const newCustomers: CustomerInstance[] = [];

    for (let i = 0; i < actualCount; i++) {
      const customer = this.createCustomer(currentHour);
      if (customer) {
        newCustomers.push(customer);
      }
    }

    return newCustomers;
  }

  /**
   * 计算当前小时应生成顾客数的期望值
   */
  private calculateCustomerCount(): number {
    const timeState = useTimeStore.getState();
    const playerState = usePlayerStore.getState();

    const phase = timeState.time.phase;
    const trafficMultiplier = PHASE_TRAFFIC_MULTIPLIER[phase] ?? 0;

    // 基础值
    const base = 0.5;

    // 时段系数
    const phaseFactor = trafficMultiplier;

    // 等级系数
    const levelFactor = 1 + (playerState.level - 1) * 0.08;

    // 环境系数
    const envFactor = 1 + Math.min(playerState.reputation / 200, 0.25);

    // 随机波动
    const randomFactor = 0.8 + Math.random() * 0.4; // [0.8, 1.2)

    return base * phaseFactor * levelFactor * envFactor * randomFactor;
  }

  /**
   * 创建单个顾客实例
   */
  private createCustomer(currentHour: number): CustomerInstance | null {
    const typeId = this.selectCustomerType(currentHour);
    if (!typeId) return null;

    const config = CUSTOMER_TYPES[typeId];
    const store = useCustomerStore.getState();
    const visitCount = store.getVisitCount(typeId);
    const isReturnCustomer = visitCount >= config.returnThreshold;

    const customer: CustomerInstance = {
      id: generateCustomerId(),
      typeId,
      config,
      state: 'entering',
      patience: config.patience,
      maxPatience: config.patience,
      orderRecipeId: null,
      satisfaction: 50,
      visitCount,
      isReturnCustomer,
      isServed: false,
      servedQuality: 0,
      stateElapsed: 0,
      waitStartTime: 0,
      totalWaitTime: 0,
    };

    return customer;
  }

  /**
   * 根据当前时段和权重随机选择顾客类型
   */
  private selectCustomerType(currentHour: number): CustomerTypeId | null {
    const typeIds = Object.keys(CUSTOMER_TYPES) as CustomerTypeId[];

    // 筛选当前小时可出现的类型
    const availableTypes = typeIds.filter((typeId) =>
      isCustomerAvailableAtHour(CUSTOMER_TYPES[typeId].appearTimes, currentHour),
    );

    if (availableTypes.length === 0) return null;

    // 按权重加权随机选择
    const weights = availableTypes.map((typeId) => CUSTOMER_TYPES[typeId].appearWeight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight <= 0) {
      // 等权随机
      return availableTypes[Math.floor(Math.random() * availableTypes.length)]!;
    }

    let random = Math.random() * totalWeight;
    for (let i = 0; i < availableTypes.length; i++) {
      random -= weights[i]!;
      if (random <= 0) {
        return availableTypes[i]!;
      }
    }

    // 兜底：返回最后一个
    return availableTypes[availableTypes.length - 1]!;
  }
}
