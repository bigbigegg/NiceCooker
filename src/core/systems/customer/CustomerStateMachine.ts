import { eventBus } from '@/core/EventBus';
import { useCustomerStore } from '@/stores/customerStore';
import { usePlayerStore } from '@/stores/playerStore';
import { CUSTOMER_GLOBAL } from '@/config/customers';
import type { CustomerInstance, SatisfactionParams, CustomerStateType } from '@/types/customer';

/**
 * 将品质分数转换为星级 (1-5)
 */
function qualityToStars(quality: number): number {
  if (quality >= 85) return 5;
  if (quality >= 65) return 4;
  if (quality >= 45) return 3;
  if (quality >= 25) return 2;
  return 1;
}

/**
 * 计算顾客满意度（Game-Design 3.3.1）
 *
 * ```
 * baseSatisfaction + qualityBonus + envBonus + speedBonus - waitPenalty
 * qualityBonus = (星级 - 3) × 10 × qualitySensitivity
 * envBonus = (环境分 - 30) × 0.3 × environmentSensitivity
 * speedBonus = max(0, (patience - 实际等待) / patience × 10 × (1 - speedSensitivity))
 * waitPenalty(when wait > 0.7 × patience) = (wait / patience - 0.7) × 30 × speedSensitivity
 * clamp(0, 100)
 * ```
 *
 * @param params - 满意度计算参数
 * @returns 满意度分数 0-100
 */
export function calculateSatisfaction(params: SatisfactionParams): number {
  const {
    qualityStars,
    environmentScore,
    actualWaitTime,
    maxPatience,
    qualitySensitivity,
    environmentSensitivity,
    speedSensitivity,
  } = params;

  const baseSatisfaction = 60;

  // 品质加成
  const qualityBonus = (qualityStars - 3) * 10 * qualitySensitivity;

  // 环境加成
  const envBonus = (environmentScore - 30) * 0.3 * environmentSensitivity;

  // 速度加成
  const waitRatio = maxPatience > 0 ? actualWaitTime / maxPatience : 0;
  const speedBonus = Math.max(0, (1 - waitRatio) * 10 * (1 - speedSensitivity));

  // 等待惩罚（超过 70% 耐心时触发）
  let waitPenalty = 0;
  if (waitRatio > 0.7) {
    waitPenalty = (waitRatio - 0.7) * 30 * speedSensitivity;
  }

  const satisfaction = baseSatisfaction + qualityBonus + envBonus + speedBonus - waitPenalty;
  return Math.max(0, Math.min(100, Math.round(satisfaction)));
}

/**
 * 顾客状态机
 *
 * 管理单个顾客的状态流转：entering → ordering → waiting → eating → leaving
 *
 * 生命周期：
 * 1. 由 CustomerSystem 创建并每帧调用 update()
 * 2. update() 返回 true 表示顾客已离店，应由 CustomerSystem 移除
 * 3. 通过 eventBus 发射顾客相关事件
 */
export class CustomerStateMachine {
  private customerId: string;

  /** 可选的菜单项 ID 列表（由外部注入） */
  private availableRecipes: string[];

  constructor(customerId: string, availableRecipes: string[] = []) {
    this.customerId = customerId;
    this.availableRecipes = availableRecipes;
  }

  /**
   * 每帧更新状态机
   *
   * @param deltaSeconds - 帧间隔（秒）
   * @returns true 表示顾客已离店，调用方应移除该顾客
   */
  update(deltaSeconds: number): boolean {
    const store = useCustomerStore.getState();
    const customer = store.customers[this.customerId];
    if (!customer) return true;

    // 更新时间计数
    const newStateElapsed = customer.stateElapsed + deltaSeconds;
    store.updateCustomer(this.customerId, { stateElapsed: newStateElapsed });

    switch (customer.state) {
      case 'entering':
        return this.updateEntering(customer, newStateElapsed);
      case 'ordering':
        return this.updateOrdering(customer, newStateElapsed);
      case 'waiting':
        return this.updateWaiting(customer, deltaSeconds);
      case 'eating':
        return this.updateEating(customer, newStateElapsed);
      case 'leaving':
        return this.updateLeaving(customer, newStateElapsed);
      default:
        return false;
    }
  }

  /**
   * 进入状态：进店动画，持续 enterDuration 秒
   */
  private updateEntering(customer: CustomerInstance, elapsed: number): boolean {
    if (elapsed >= CUSTOMER_GLOBAL.enterDuration) {
      // 检查店内容量
      const customerCount = useCustomerStore.getState().getCustomerCount();
      if (customerCount > CUSTOMER_GLOBAL.maxCustomersInStore) {
        this.transitionTo(customer, 'leaving');
        eventBus.emit('customer:leave', { customerId: customer.id, reason: 'full' });
        return true;
      }

      this.transitionTo(customer, 'ordering');
    }
    return false;
  }

  /**
   * 点单状态：从可用菜单中选菜品，持续 orderDuration 秒
   */
  private updateOrdering(customer: CustomerInstance, elapsed: number): boolean {
    if (elapsed >= CUSTOMER_GLOBAL.orderDuration) {
      const recipeId = this.pickRecipe(customer);
      if (!recipeId) {
        // 没有可点的菜品，离开
        this.transitionTo(customer, 'leaving');
        eventBus.emit('customer:leave', { customerId: customer.id, reason: 'full' });
        return true;
      }

      useCustomerStore.getState().updateCustomer(this.customerId, {
        orderRecipeId: recipeId,
        waitStartTime: customer.stateElapsed,
      });

      eventBus.emit('customer:order', { customerId: customer.id, recipeId });
      this.transitionTo(customer, 'waiting');
    }
    return false;
  }

  /**
   * 等待状态：耐心衰减，等待出餐
   */
  private updateWaiting(customer: CustomerInstance, deltaSeconds: number): boolean {
    const newPatience = customer.patience - deltaSeconds;

    // 耐心耗尽，不耐烦离开
    if (newPatience <= 0) {
      useCustomerStore.getState().updateCustomer(this.customerId, { patience: 0 });
      this.transitionTo(customer, 'leaving');
      eventBus.emit('customer:leave', { customerId: customer.id, reason: 'impatient' });
      return true;
    }

    useCustomerStore.getState().updateCustomer(this.customerId, { patience: newPatience });

    // 检查是否已被服务
    const freshCustomer = useCustomerStore.getState().customers[this.customerId];
    if (freshCustomer?.isServed) {
      // 记录实际等待时间
      const totalWait = freshCustomer.stateElapsed - freshCustomer.waitStartTime;
      useCustomerStore.getState().updateCustomer(this.customerId, { totalWaitTime: totalWait });
      this.transitionTo(customer, 'eating');
    }

    return false;
  }

  /**
   * 用餐状态：持续用餐动画，持续 eatDuration 秒
   */
  private updateEating(customer: CustomerInstance, elapsed: number): boolean {
    if (elapsed >= CUSTOMER_GLOBAL.eatDuration) {
      this.transitionTo(customer, 'leaving');
    }
    return false;
  }

  /**
   * 离开状态：结算满意度，发射离店事件
   *
   * 在离开状态的第一帧执行结算逻辑
   */
  private updateLeaving(_customer: CustomerInstance, elapsed: number): boolean {
    if (elapsed < CUSTOMER_GLOBAL.leaveDuration) return false;

    // 结算满意度（仅对正常服务的顾客）
    const freshCustomer = useCustomerStore.getState().customers[this.customerId];
    if (!freshCustomer) return true;

    if (freshCustomer.isServed) {
      const satisfaction = this.settleSatisfaction(freshCustomer);
      useCustomerStore.getState().updateCustomer(this.customerId, { satisfaction });
      eventBus.emit('customer:serve', { customerId: freshCustomer.id, satisfaction });
      eventBus.emit('customer:leave', { customerId: freshCustomer.id, reason: 'served' });

      // 更新口碑
      const reputationDelta = Math.round((satisfaction - 50) / 10);
      if (reputationDelta !== 0) {
        usePlayerStore.getState().adjustReputation(reputationDelta);
      }
    }

    // 移除顾客
    useCustomerStore.getState().removeCustomer(this.customerId);
    return true;
  }

  /**
   * 从可用菜单中随机选取菜品
   *
   * 优先从顾客偏好中选择匹配的菜品，若偏好中无可用的则从全部可用菜单中随机选。
   */
  private pickRecipe(customer: CustomerInstance): string | null {
    if (this.availableRecipes.length === 0) return null;

    const preferences = customer.config.preferences;

    // 筛选偏好中实际可用的菜品
    const preferredAvailable = preferences.filter((pref) =>
      this.availableRecipes.includes(pref),
    );

    if (preferredAvailable.length > 0) {
      return preferredAvailable[Math.floor(Math.random() * preferredAvailable.length)]!;
    }

    // 偏好无匹配，从全部菜单中随机选
    return this.availableRecipes[Math.floor(Math.random() * this.availableRecipes.length)]!;
  }

  /**
   * 结算满意度
   */
  private settleSatisfaction(customer: CustomerInstance): number {
    const qualityStars = qualityToStars(customer.servedQuality);
    const { reputation: environmentScore } = usePlayerStore.getState();

    return calculateSatisfaction({
      qualityStars,
      environmentScore,
      actualWaitTime: customer.totalWaitTime,
      maxPatience: customer.maxPatience,
      qualitySensitivity: customer.config.qualitySensitivity,
      environmentSensitivity: customer.config.environmentSensitivity,
      speedSensitivity: customer.config.speedSensitivity,
    });
  }

  /**
   * 切换到目标状态
   */
  private transitionTo(customer: CustomerInstance, newState: CustomerStateType): void {
    useCustomerStore.getState().updateCustomer(this.customerId, {
      state: newState,
      stateElapsed: 0,
    });
  }
}
