import { create } from 'zustand';

interface CraftingState {
  /** 正在制作的顾客 ID（null = 无制作任务） */
  activeCustomerId: string | null;
  /** 制作进度 0-100 */
  progress: number;
  /** 制作结果文本 */
  result: string | null;

  startCrafting: (customerId: string) => void;
  setProgress: (progress: number) => void;
  completeCrafting: (result: string) => void;
  reset: () => void;
}

/**
 * 制作进度 Store
 *
 * 独立于 React 组件生命周期，OrderPanel 关闭/重开不会丢失状态。
 */
export const useCraftingStore = create<CraftingState>((set) => ({
  activeCustomerId: null,
  progress: 0,
  result: null,

  startCrafting: (customerId) =>
    set({ activeCustomerId: customerId, progress: 0, result: null }),

  setProgress: (progress) => set({ progress }),

  completeCrafting: (result) => set({ result, progress: 100 }),

  reset: () => set({ activeCustomerId: null, progress: 0, result: null }),
}));
