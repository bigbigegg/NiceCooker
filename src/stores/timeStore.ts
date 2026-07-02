import { create } from 'zustand';
import type { GamePhase, GameTime } from '@/types';

interface TimeState {
  time: GameTime;
  isBusinessHours: boolean;

  // Actions
  setTime: (time: GameTime) => void;
  setBusinessHours: (open: boolean) => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  time: {
    day: 1,
    hour: 6,
    minute: 0,
    phase: 'morning',
    speed: 1,
    paused: false,
  },
  isBusinessHours: true,

  setTime: (time) => set({ time }),
  setBusinessHours: (open) => set({ isBusinessHours: open }),
}));
