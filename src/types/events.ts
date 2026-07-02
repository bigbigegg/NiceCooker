import type { GameTime, Currency } from '@/types';

// === 事件类型定义 ===

export type GameEventMap = {
  // 时间事件
  'time:tick': { time: GameTime };
  'time:phaseChange': { from: GameTime['phase']; to: GameTime['phase'] };
  'time:dayEnd': { day: number };

  // 顾客事件
  'customer:arrive': { customerId: string };
  'customer:order': { customerId: string; recipeId: string };
  'customer:serve': { customerId: string; satisfaction: number };
  'customer:leave': { customerId: string; reason: 'served' | 'impatient' | 'full' };

  // 经济事件
  'economy:earn': { amount: number; source: string };
  'economy:spend': { amount: number; reason: string };
  'economy:tip': { amount: number; customerId: string };

  // 制作事件
  'craft:start': { recipeId: string; stationId: string };
  'craft:progress': { recipeId: string; progress: number };
  'craft:complete': { recipeId: string; quality: number };
  'craft:fail': { recipeId: string; reason: string };

  // 店铺事件
  'shop:levelUp': { newLevel: number };
  'shop:unlock': { contentId: string; contentType: string };

  // 存档事件
  'save:completed': { slotId: number };
  'save:loaded': { slotId: number };
};

export type GameEventName = keyof GameEventMap;
export type GameEventData<T extends GameEventName> = GameEventMap[T];
