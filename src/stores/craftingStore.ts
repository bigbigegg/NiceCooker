import { create } from 'zustand';

interface CraftingState {
  /** 正在制作的顾客 ID 列表（支持多槽位） */
  activeCustomerIds: string[];
  /** 制作进度 0-100（最后更新的任务进度） */
  progress: number;
  /** 制作结果文本 */
  result: string | null;

  addCrafting: (customerId: string) => void;
  removeCrafting: (customerId: string) => void;
  setProgress: (progress: number) => void;
  completeCrafting: (customerId: string, result: string) => void;
  reset: () => void;
  clearResult: () => void;
  isCrafting: (customerId: string) => boolean;
}

/**
 * 制作进度 Store
 */
export const useCraftingStore = create<CraftingState>((set, get) => ({
  activeCustomerIds: [],
  progress: 0,
  result: null,

  addCrafting: (customerId) =>
    set((s) => ({
      activeCustomerIds: s.activeCustomerIds.includes(customerId)
        ? s.activeCustomerIds
        : [...s.activeCustomerIds, customerId],
      progress: 0,
      result: null,
    })),

  removeCrafting: (customerId) =>
    set((s) => ({
      activeCustomerIds: s.activeCustomerIds.filter((id) => id !== customerId),
    })),

  setProgress: (progress) => set({ progress }),

  completeCrafting: (customerId, result) =>
    set((s) => ({
      result,
      progress: 100,
      activeCustomerIds: s.activeCustomerIds.filter((id) => id !== customerId),
    })),

  reset: () => set({ activeCustomerIds: [], progress: 0, result: null }),
  clearResult: () => set({ result: null }),

  isCrafting: (customerId) => get().activeCustomerIds.includes(customerId),
}));
