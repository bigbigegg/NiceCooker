/**
 * 食谱与制作状态管理（Zustand Store）
 *
 * 管理食谱解锁状态、熟练度记录以及当前制作任务。
 * 与 CraftingSystem 协作用于 UI 展示与交互。
 */

import { create } from 'zustand';
import { ALL_RECIPES, RECIPES_BY_ID } from '@/config/recipes';
import { eventBus } from '@/core/EventBus';
import { craftingSystem } from '@/core/systems/recipe/CraftingSystem';
import { usePlayerStore } from './playerStore';
import type { RecipeConfig } from '@/config/recipes';
import type { CraftingTask, RecipeProficiency, ProductQuality } from '@/types/recipe';

// ============================================================
// Store 接口
// ============================================================

interface RecipeState {
  /** 已解锁食谱 ID 集合 */
  unlockedRecipeIds: Set<string>;

  /** 食谱熟练度记录（recipeId -> proficiency） */
  proficiencies: Record<string, RecipeProficiency>;

  /** 制作进行中（读取自 CraftingSystem） */
  activeTaskCount: number;

  // ========================================
  // Actions
  // ========================================

  /**
   * 初始化食谱系统：
   * - 解锁初始食谱
   * - 初始化 CraftingSystem
   * - 注册事件监听
   */
  init: () => void;

  /**
   * 解锁指定食谱
   * @param recipeId - 食谱 ID
   * @returns 是否成功解锁
   */
  unlockRecipe: (recipeId: string) => boolean;

  /**
   * 检查食谱是否已解锁
   * @param recipeId - 食谱 ID
   */
  isRecipeUnlocked: (recipeId: string) => boolean;

  /**
   * 获取当前等级可解锁的食谱列表
   */
  getUnlockableRecipes: () => RecipeConfig[];

  /**
   * 开始制作
   * @param recipeId - 食谱 ID
   * @param stationId - 工作站 ID
   * @returns 是否成功发起制作
   */
  startCrafting: (recipeId: string, stationId: string) => boolean;

  /**
   * 更新制作进度（由事件驱动，通常不需要外部调用）
   * @deprecated 进度由 CraftingSystem 自动管理
   */
  updateCraftProgress: (recipeId: string, progress: number) => void;

  /**
   * 完成制作后的处理：增加熟练度、经验等
   * @param recipeId - 食谱 ID
   * @param quality - 品质等级
   */
  completeCrafting: (recipeId: string, quality: ProductQuality) => void;

  /**
   * 获取食谱熟练度
   * @param recipeId - 食谱 ID
   */
  getProficiency: (recipeId: string) => RecipeProficiency | undefined;

  /**
   * 获取当前进行中的所有制作任务
   */
  getActiveTasks: () => CraftingTask[];

  /**
   * 同步激活任务计数（从 CraftingSystem 拉取）
   */
  syncTaskCount: () => void;
}

// ============================================================
// 初始解锁食谱（Lv1 即可用）
// ============================================================

function getInitialUnlockedRecipes(): Set<string> {
  return new Set(
    ALL_RECIPES.filter((r) => r.unlockLevel === 1).map((r) => r.id),
  );
}

// ============================================================
// Store 实现
// ============================================================

export const useRecipeStore = create<RecipeState>((set, get) => ({
  unlockedRecipeIds: getInitialUnlockedRecipes(),
  proficiencies: {},
  activeTaskCount: 0,

  // ========================================
  // 初始化
  // ========================================

  init: () => {
    // 初始化 CraftingSystem
    craftingSystem.init();

    // 监听完成事件
    eventBus.on('craft:complete', (data: { recipeId: string; quality: number }) => {
      const quality = data.quality as ProductQuality;
      get().completeCrafting(data.recipeId, quality);
      // 同步激活任务数
      get().syncTaskCount();
    });

    // 监听失败事件
    eventBus.on('craft:fail', () => {
      get().syncTaskCount();
    });
  },

  // ========================================
  // 食谱解锁
  // ========================================

  unlockRecipe: (recipeId: string): boolean => {
    const recipe = RECIPES_BY_ID.get(recipeId);
    if (!recipe) return false;

    const state = get();
    if (state.unlockedRecipeIds.has(recipeId)) return false;

    // 检查等级要求
    const playerState = usePlayerStore.getState();
    if (playerState.level < recipe.unlockLevel) return false;

    // 检查金币要求
    if (recipe.unlockGold && !playerState.canAfford(recipe.unlockGold)) return false;

    // 检查设备要求
    // TODO: 设备检查需接入 EquipmentStore
    // if (recipe.requiredEquipment && !equipmentStore.hasEquipment(recipe.requiredEquipment)) return false;

    // 消耗金币
    if (recipe.unlockGold) {
      playerState.spendGold(recipe.unlockGold, `解锁食谱: ${recipe.name}`);
    }

    // 解锁
    set((s) => {
      const newUnlocked = new Set(s.unlockedRecipeIds);
      newUnlocked.add(recipeId);
      return { unlockedRecipeIds: newUnlocked };
    });

    eventBus.emit('shop:unlock', { contentId: recipeId, contentType: 'recipe' });
    return true;
  },

  isRecipeUnlocked: (recipeId: string): boolean => {
    return get().unlockedRecipeIds.has(recipeId);
  },

  getUnlockableRecipes: (): RecipeConfig[] => {
    const state = get();
    const playerState = usePlayerStore.getState();

    return ALL_RECIPES.filter((r) => {
      // 已解锁的不算
      if (state.unlockedRecipeIds.has(r.id)) return false;
      // 等级不够的不算
      if (playerState.level < r.unlockLevel) return false;
      // 金币不够的不算
      if (r.unlockGold && !playerState.canAfford(r.unlockGold)) return false;
      return true;
    });
  },

  // ========================================
  // 制作管理
  // ========================================

  startCrafting: (recipeId: string, stationId: string): boolean => {
    const state = get();

    // 检查食谱是否解锁
    if (!state.unlockedRecipeIds.has(recipeId)) return false;

    // 检查槽位
    if (craftingSystem.getAvailableSlots() <= 0) return false;

    // 发起制作事件（CraftingSystem 会监听并创建任务）
    eventBus.emit('craft:start', { recipeId, stationId });

    // 同步任务计数
    get().syncTaskCount();

    return true;
  },

  updateCraftProgress: (_recipeId: string, _progress: number): void => {
    // 进度由 CraftingSystem 自动管理
    // 此方法保留以兼容外部调用，实际操作由 CraftingSystem.update() 完成
    // 仅刷新任务计数
    get().syncTaskCount();
  },

  completeCrafting: (recipeId: string, quality: ProductQuality): void => {
    const recipe = RECIPES_BY_ID.get(recipeId);
    if (!recipe) return;

    const playerState = usePlayerStore.getState();

    // 增加经验
    playerState.addExp(recipe.baseExp);

    // 增加金币（基础售价 × 品质系数）
    const qualityCoefficients: Record<ProductQuality, number> = {
      1: 0.7, 2: 0.8, 3: 0.9, 4: 1.2, 5: 1.5,
    };
    const income = Math.round(recipe.basePrice * qualityCoefficients[quality]);
    playerState.earnGold(income, `出售: ${recipe.name}`);

    // 更新熟练度
    set((s) => {
      const existing = s.proficiencies[recipeId];
      const newProficiency: RecipeProficiency = existing
        ? {
            ...existing,
            craftCount: existing.craftCount + 1,
            bestQuality: Math.max(existing.bestQuality, quality) as ProductQuality,
            stabilityBonus: Math.min(3, Math.floor(existing.craftCount / 10) - 1),
          }
        : {
            recipeId,
            craftCount: 1,
            bestQuality: quality,
            stabilityBonus: 0,
          };

      return {
        proficiencies: {
          ...s.proficiencies,
          [recipeId]: newProficiency,
        },
      };
    });
  },

  getProficiency: (recipeId: string): RecipeProficiency | undefined => {
    return get().proficiencies[recipeId];
  },

  getActiveTasks: (): CraftingTask[] => {
    return craftingSystem.getActiveTasks();
  },

  syncTaskCount: (): void => {
    const count = craftingSystem.getOccupiedSlots();
    set({ activeTaskCount: count });
  },
}));
