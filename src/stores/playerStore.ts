import { create } from 'zustand';

interface PlayerState {
  gold: number;
  diamond: number;
  level: number;
  totalExp: number;
  reputation: number;    // 0-100 店铺口碑

  // Actions
  earnGold: (amount: number, source: string) => void;
  spendGold: (amount: number, reason: string) => boolean;
  earnDiamond: (amount: number) => void;
  spendDiamond: (amount: number) => boolean;
  addExp: (amount: number) => void;
  adjustReputation: (delta: number) => void;
  canAfford: (gold: number, diamond?: number) => boolean;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  gold: 500,
  diamond: 10,
  level: 1,
  totalExp: 0,
  reputation: 50,

  earnGold: (amount, source) => {
    set((s) => ({ gold: s.gold + amount }));
  },

  spendGold: (amount, reason) => {
    const state = get();
    if (state.gold < amount) return false;
    set((s) => ({ gold: s.gold - amount }));
    return true;
  },

  earnDiamond: (amount) => {
    set((s) => ({ diamond: s.diamond + amount }));
  },

  spendDiamond: (amount) => {
    const state = get();
    if (state.diamond < amount) return false;
    set((s) => ({ diamond: s.diamond - amount }));
    return true;
  },

  addExp: (amount) => {
    set((s) => ({ totalExp: s.totalExp + amount }));
  },

  adjustReputation: (delta) => {
    set((s) => ({
      reputation: Math.max(0, Math.min(100, s.reputation + delta)),
    }));
  },

  canAfford: (gold, diamond = 0) => {
    const state = get();
    return state.gold >= gold && state.diamond >= diamond;
  },
}));
