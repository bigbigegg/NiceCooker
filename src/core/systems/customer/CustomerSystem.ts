import { gameLoop } from '@/core/GameLoop';
import { eventBus } from '@/core/EventBus';
import { useCustomerStore } from '@/stores/customerStore';
import { CustomerGenerator } from './CustomerGenerator';
import { CustomerStateMachine } from './CustomerStateMachine';
import type { CustomerInstance } from '@/types/customer';

/** 默认可用菜单（后续接入 recipeStore 后替换） */
const DEFAULT_RECIPE_IDS: string[] = [
  'americano',
  'latte',
  'cappuccino',
  'mocha',
  'espresso',
  'pour_over',
  'cold_brew',
  'single_origin',
  'classic',
];

/**
 * 顾客系统入口
 *
 * 组合顾客生成器（CustomerGenerator）和状态机（CustomerStateMachine），
 * 管理顾客的完整生命周期：生成 → 进店 → 点单 → 等待 → 用餐 → 离店。
 *
 * 通过 GameLoop.registerSystem 注册，优先级 10。
 */
export class CustomerSystem {
  private generator: CustomerGenerator;
  private stateMachines: Map<string, CustomerStateMachine> = new Map();
  private availableRecipes: string[];
  private unsubServe: (() => void) | null = null;

  constructor(availableRecipes: string[] = DEFAULT_RECIPE_IDS) {
    this.generator = new CustomerGenerator();
    this.availableRecipes = availableRecipes;
  }

  /**
   * 启动顾客系统
   *
   * - 注册到 GameLoop 主循环
   * - 监听服务事件
   */
  start(): void {
    gameLoop.registerSystem('CustomerSystem', (deltaSeconds) => this.update(deltaSeconds), 10);

    // 监听出餐完成事件，标记顾客为已服务
    this.unsubServe = eventBus.on<{ customerId: string; satisfaction: number }>(
      'customer:serve',
      ({ customerId, satisfaction }) => {
        // 顾客可能已经离店，需要检查
        const store = useCustomerStore.getState();
        const customer = store.customers[customerId];
        if (customer) {
          // satisfaction 在此表示餐品品质分数 (0-100)，用于后续满意度计算
          store.markServed(customerId, satisfaction);
        }
      },
    );
  }

  /**
   * 停止顾客系统
   */
  stop(): void {
    gameLoop.setSystemEnabled('CustomerSystem', false);
    this.unsubServe?.();
    this.stateMachines.clear();
  }

  /**
   * 主循环更新
   *
   * 1. 尝试生成新顾客
   * 2. 更新所有现有顾客的状态机
   * 3. 清理已离店的顾客
   */
  private update(deltaSeconds: number): void {
    // 1. 生成新顾客
    const newCustomers = this.generator.update();
    for (const customer of newCustomers) {
      this.onCustomerGenerated(customer);
    }

    // 2. 更新状态机
    const toRemove: string[] = [];
    for (const [customerId, sm] of this.stateMachines) {
      const removed = sm.update(deltaSeconds);
      if (removed) {
        toRemove.push(customerId);
      }
    }

    // 3. 清理已离店的状态机
    for (const id of toRemove) {
      this.stateMachines.delete(id);
    }
  }

  /**
   * 处理新生成的顾客
   */
  private onCustomerGenerated(customer: CustomerInstance): void {
    // 添加到 Store
    useCustomerStore.getState().addCustomer(customer);

    // 创建状态机
    const sm = new CustomerStateMachine(customer.id, this.availableRecipes);
    this.stateMachines.set(customer.id, sm);

    // 发射到达事件
    eventBus.emit('customer:arrive', { customerId: customer.id });
  }
}

/** 全局顾客系统单例 */
export const customerSystem = new CustomerSystem();
