/**
 * 制作流程管理系统
 *
 * 负责制作任务的创建、进度推进、完成判定与品质计算。
 *
 * - 监听 `craft:start` 事件创建新制作任务
 * - 每帧推进所有进行中任务的进度
 * - 任务进度达到 100% 时调用品质计算并触发 `craft:complete` 事件
 * - 最多支持 2 个并行制作槽位
 * - 注册到 GameLoop（priority=20）
 */

import { eventBus } from '@/core/EventBus';
import { gameLoop } from '@/core/GameLoop';
import { RECIPES_BY_ID, MAX_CRAFTING_SLOTS } from '@/config/recipes';
import { calculateQuality } from './QualityCalculator';
import type { RecipeConfig } from '@/config/recipes';
import type { CraftingTask, IngredientQuality, ProductQuality } from '@/types/recipe';

// ============================================================
// 系统常量
// ============================================================

/** GameLoop 注册的系统名称 */
const SYSTEM_NAME = 'CraftingSystem';

/** GameLoop 优先级 */
const SYSTEM_PRIORITY = 20;

/** 员工工作站 ID 前缀 */
const EMPLOYEE_STATION_PREFIX = 'employee_';

// ============================================================
// CraftingSystem 类
// ============================================================

/**
 * 制作流程系统（单例）
 *
 * 管理所有进行中的制作任务，驱动进度并触发品质结算。
 *
 * @example
 * ```ts
 * // 启动系统
 * craftingSystem.init();
 *
 * // 发起制作
 * eventBus.emit('craft:start', { recipeId: 'C03', stationId: 'counter_1' });
 *
 * // 获取进行中任务
 * const tasks = craftingSystem.getActiveTasks();
 * ```
 */
export class CraftingSystem {
  /** 进行中的制作任务 Map（taskId -> task） */
  private tasks: Map<string, CraftingTask> = new Map();

  /** 可用槽位数 */
  private maxSlots: number;

  /** 是否已初始化 */
  private initialized = false;

  /** 默认原料品质 */
  private defaultIngredientQuality: IngredientQuality = 'normal';

  /** 默认设备等级 */
  private defaultEquipmentLevel = 1;

  /** 默认员工加成系数 */
  private defaultEmployeeBonus = 0;

  /** 任务 ID 计数器 */
  private idCounter = 0;

  constructor() {
    this.maxSlots = MAX_CRAFTING_SLOTS;
  }

  // ==========================================================
  // 生命周期
  // ==========================================================

  /**
   * 初始化系统：注册到 GameLoop 并监听事件
   */
  init(): void {
    if (this.initialized) return;

    gameLoop.registerSystem(SYSTEM_NAME, this.update.bind(this), SYSTEM_PRIORITY);
    eventBus.on('craft:start', this.onCraftStart.bind(this));

    this.initialized = true;
  }

  /**
   * 销毁系统：注销事件监听并清空任务
   */
  destroy(): void {
    eventBus.off('craft:start');
    gameLoop.setSystemEnabled(SYSTEM_NAME, false);
    this.tasks.clear();
    this.initialized = false;
  }

  // ==========================================================
  // 公共 API
  // ==========================================================

  /**
   * 获取当前进行中的所有制作任务
   */
  getActiveTasks(): CraftingTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取可用槽位数量
   */
  getAvailableSlots(): number {
    return Math.max(0, this.maxSlots - this.tasks.size);
  }

  /**
   * 获取已占用槽位数量
   */
  getOccupiedSlots(): number {
    return this.tasks.size;
  }

  /**
   * 设置最大槽位数
   */
  setMaxSlots(slots: number): void {
    this.maxSlots = Math.max(1, slots);
  }

  /**
   * 设置默认原料品质（用于非玩家手动制作的场景）
   */
  setDefaultIngredientQuality(quality: IngredientQuality): void {
    this.defaultIngredientQuality = quality;
  }

  /**
   * 设置默认设备等级
   */
  setDefaultEquipmentLevel(level: number): void {
    this.defaultEquipmentLevel = Math.max(1, level);
  }

  /**
   * 设置默认员工加成系数
   */
  setDefaultEmployeeBonus(bonus: number): void {
    this.defaultEmployeeBonus = Math.max(0, Math.min(1, bonus));
  }

  /**
   * 取消指定制作任务
   *
   * @param taskId - 任务 ID
   * @returns 是否成功取消
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    this.tasks.delete(taskId);
    eventBus.emit('craft:fail', { recipeId: task.recipeId, reason: 'cancelled' });
    return true;
  }

  // ==========================================================
  // 内部方法
  // ==========================================================

  /**
   * 处理 `craft:start` 事件：创建新的制作任务
   */
  private onCraftStart(data: { recipeId: string; stationId: string }): void {
    const { recipeId, stationId } = data;
    console.log(`[CraftingSystem] craft:start received — recipeId=${recipeId} stationId=${stationId} slots=${this.tasks.size}/${this.maxSlots}`);

    // 检查槽位
    if (this.tasks.size >= this.maxSlots) {
      console.warn(`[CraftingSystem] 制作槽位已满 (${this.tasks.size}/${this.maxSlots})，无法开始制作 ${recipeId}`);
      return;
    }

    // 查找食谱
    const recipe = RECIPES_BY_ID.get(recipeId);
    if (!recipe) {
      console.warn(`[CraftingSystem] 食谱 ${recipeId} 不存在`);
      return;
    }

    // 创建任务
    const task = this.createTask(recipe, stationId);
    this.tasks.set(task.id, task);
  }

  /**
   * 创建新的 CraftingTask
   */
  private createTask(recipe: RecipeConfig, stationId: string): CraftingTask {
    const id = `task_${++this.idCounter}_${Date.now()}`;
    return {
      id,
      recipeId: recipe.id,
      stationId,
      progress: 0,
      currentStep: 0,
      quality: 0,
      isEmployeeCraft: stationId.startsWith(EMPLOYEE_STATION_PREFIX),
      startedAt: Date.now(),
    };
  }

  /**
   * 每帧更新：推进所有进行中任务的进度
   */
  private update(deltaSeconds: number): void {
    if (this.tasks.size === 0) return;

    const completedTaskIds: string[] = [];

    for (const [taskId, task] of this.tasks) {
      const recipe = RECIPES_BY_ID.get(task.recipeId);
      if (!recipe) {
        console.warn(`[CraftingSystem] 任务 ${taskId} 的食谱 ${task.recipeId} 不存在，移除任务`);
        completedTaskIds.push(taskId);
        continue;
      }

      // 推进进度
      const progressIncrement = (deltaSeconds / recipe.baseTime) * 100;
      task.progress = Math.min(100, task.progress + progressIncrement);

      // 更新当前步骤索引
      const stepsCount = recipe.steps.length;
      const stepProgress = stepsCount > 0 ? task.progress / 100 : 0;
      task.currentStep = Math.min(stepsCount - 1, Math.floor(stepProgress * stepsCount));

      // 发射进度事件
      eventBus.emit('craft:progress', {
        recipeId: task.recipeId,
        progress: task.progress,
      });

      // 检查是否完成
      if (task.progress >= 100) {
        console.log(`[CraftingSystem] ✅ 制作完成 recipeId=${task.recipeId} taskId=${taskId}`);
        completedTaskIds.push(taskId);
      }
    }

    // 完成所有已完成的任务
    for (const taskId of completedTaskIds) {
      this.completeTask(taskId);
    }
  }

  /**
   * 完成任务：计算品质并发射 `craft:complete` 事件
   */
  private completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const recipe = RECIPES_BY_ID.get(task.recipeId);
    if (!recipe) {
      this.tasks.delete(taskId);
      return;
    }

    // 计算品质
    // 员工制作：使用默认参数
    // 玩家制作：使用实际参数（此处以默认值计算，实际由外部调用时传入）
    const qualityResult = calculateQuality(
      recipe,
      this.defaultEquipmentLevel,
      this.defaultIngredientQuality,
      0.8, // 默认操作准确度 80%
      this.defaultEmployeeBonus,
    );

    // 更新任务品质
    task.quality = qualityResult.isPerfect ? (999 as unknown as ProductQuality) : qualityResult.star;

    // 保留 progress=100 的任务片刻（供 UI 展示），然后移除
    this.tasks.delete(taskId);

    // 发射完成事件
    eventBus.emit('craft:complete', {
      recipeId: task.recipeId,
      quality: qualityResult.isPerfect ? 5 : qualityResult.star,
    });
  }
}

/** 全局单例 */
export const craftingSystem = new CraftingSystem();
