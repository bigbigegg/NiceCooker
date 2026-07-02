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
 * 2. update() 返回 true 表示顾客已离店，应由 CustomerSystem 移除状态机
 * 3. 非正常离店（满座、不耐烦）在返回 true 前直接清理 store 和发射事件
 * 4. 正常离店（被服务）在 leaving 状态结算后清理 store
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
   * @returns true 表示顾客已离店，调用方应移除该状态机
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
        return this.updateEntering(newStateElapsed);
      case 'ordering':
        return this.updateOrdering(newStateElapsed);
      case 'waiting':
        return this.updateWaiting(deltaSeconds);
      case 'eating':
        return this.updateEating(newStateElapsed);
      case 'leaving':
        return this.updateLeaving(newStateElapsed);
      default:
        return false;
    }
  }

  /**
   * 进入状态：进店动画，持续 enterDuration 秒
   *
   * 动画结束后检查容量：满座则直接离店，否则进入点单。
   */
  private updateEntering(elapsed: number): boolean {
    if (elapsed < CUSTOMER_GLOBAL.enterDuration) return false;

    // 检查店内容量
    const customerCount = useCustomerStore.getState().getCustomerCount();
    if (customerCount > CUSTOMER_GLOBAL.maxCustomersInStore) {
      this.forceLeave('full');
      return true;
    }

    this.transitionTo('ordering');
    return false;
  }

  /**
   * 点单状态：从可用菜单中选菜品，持续 orderDuration 秒
   *
   * 若无可用菜品，直接离店。
   */
  private updateOrdering(elapsed: number): boolean {
    if (elapsed < CUSTOMER_GLOBAL.orderDuration) return false;

    const customer = useCustomerStore.getState().customers[this.customerId];
    if (!customer) return true;

    const recipeId = this.pickRecipe(customer);
    if (!recipeId) {
      // 没有可点的菜品，离开
      this.forceLeave('full');
      return true;
    }

    const elapsedTime = customer.stateElapsed;
    useCustomerStore.getState().updateCustomer(this.customerId, {
      orderRecipeId: recipeId,
      waitStartTime: elapsedTime,
    });

    eventBus.emit('customer:order', { customerId: customer.id, recipeId });
    this.transitionTo('waiting');
    return false;
  }

  /**
   * 等待状态：耐心衰减，等待出餐
   *
   * 耐心耗尽则不耐烦离开；若已被服务则进入用餐。
   */
  private updateWaiting(deltaSeconds: number): boolean {
    const store = useCustomerStore.getState();
    const customer = store.customers[this.customerId];
    if (!customer) return true;

    const newPatience = customer.patience - deltaSeconds;

    // 耐心耗尽，不耐烦离开
    if (newPatience <= 0) {
      store.updateCustomer(this.customerId, { patience: 0 });
      this.forceLeave('impatient');
      return true;
    }

    store.updateCustomer(this.customerId, { patience: newPatience });

    // 检查是否已被服务
    const freshCustomer = store.customers[this.customerId];
    if (freshCustomer?.isServed) {
      // 记录实际等待时间
      const totalWait = freshCustomer.stateElapsed - freshCustomer.waitStartTime;
      store.updateCustomer(this.customerId, { totalWaitTime: totalWait });
      this.transitionTo('eating');
    }

    return false;
  }

  /**
   * 用餐状态：持续用餐动画，持续 eatDuration 秒
   */
  private updateEating(elapsed: number): boolean {
    if (elapsed >= CUSTOMER_GLOBAL.eatDuration) {
      this.transitionTo('leaving');
    }
    return false;
  }

  /**
   * 离开状态：结算满意度，发射离店事件
   *
   * leaveDuration 秒后执行结算，移除顾客并返回 true。
   */
  private updateLeaving(elapsed: number): boolean {
    if (elapsed < CUSTOMER_GLOBAL.leaveDuration) return false;

    const customer = useCustomerStore.getState().customers[this.customerId];
    if (!customer) return true;

    if (customer.isServed) {
      const satisfaction = this.settleSatisfaction(customer);
      useCustomerStore.getState().updateCustomer(this.customerId, { satisfaction });
      eventBus.emit('customer:leave', { customerId: customer.id, reason: 'served' });

      // 更新口碑
      const reputationDelta = Math.round((satisfaction - 50) / 10);
      if (reputationDelta !== 0) {
        usePlayerStore.getState().adjustReputation(reputationDelta);
      }
    } else {
      // 非服务离店（由 forceLeave 触发的 leaving 状态）
      // leave 事件已在 forceLeave 中发射，此处仅清理
    }

    // 移除顾客
    useCustomerStore.getState().removeCustomer(this.customerId);
    return true;
  }

  /**
   * 非正常离店：直接清理 store 并发射 leave 事件
   *
   * 用于满座、无菜品、不耐烦等非正常离店场景。
   * 与正常 leaving 状态不同，此类离店不经过结算流程。
   */
  private forceLeave(reason: 'full' | 'impatient'): void {
    const customer = useCustomerStore.getState().customers[this.customerId];
    if (customer) {
      eventBus.emit('customer:leave', { customerId: customer.id, reason });
    }
    useCustomerStore.getState().removeCustomer(this.customerId);
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
  private transitionTo(newState: CustomerStateType): void {
    useCustomerStore.getState().updateCustomer(this.customerId, {
      state: newState,
      stateElapsed: 0,
    });
  }
}
