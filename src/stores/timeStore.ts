import { create } from 'zustand';
import type { GamePhase, GameTime } from '@/types';

interface TimeState {
  time: GameTime;
  isBusinessHours: boolean;

  setTime: (time: GameTime) => void;
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

  setTime: (time) => set({
    time,
    isBusinessHours: time.phase !== 'closed' && time.phase !== 'dawn',
  }),
}));
