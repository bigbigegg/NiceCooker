import type { GamePhase, GameTime } from '@/types';
import { eventBus } from './EventBus';

/** 阶段顺序（循环） */
const PHASE_ORDER: GamePhase[] = [
  'dawn', 'morning', 'rush_am', 'forenoon', 'noon',
  'afternoon', 'tea_time', 'evening', 'rush_pm', 'closing', 'closed',
];

/** 各阶段持续时长（现实秒，1x速度） */
const PHASE_REAL_DURATION: Record<GamePhase, number> = {
  dawn: 30, morning: 30, rush_am: 60, forenoon: 60, noon: 60,
  afternoon: 30, tea_time: 60, evening: 60, rush_pm: 90, closing: 30, closed: 210,
};

/** 1 现实秒对应的游戏秒数（720 现实秒 = 86400 游戏秒 → 1:120） */
const GAME_SECONDS_PER_REAL_SECOND = 120;

/** 各阶段对应的现实起始秒（相对于每天 00:00） */
function buildPhaseStartTimes(): { phase: GamePhase; startRealSec: number }[] {
  const result: { phase: GamePhase; startRealSec: number }[] = [];
  let accumulated = 0;
  for (const phase of PHASE_ORDER) {
    result.push({ phase, startRealSec: accumulated });
    accumulated += PHASE_REAL_DURATION[phase];
  }
  return result;
}
const PHASE_STARTS = buildPhaseStartTimes();

/**
 * 游戏时间管理器
 *
 * 1 游戏天 = 所有阶段时长之和 = 720 现实秒 = 12 现实分钟（1x速度）
 * 时间基于累积「游戏秒」计数器，避免浮点累计误差。
 */
export class TimeManager {
  private _gameTime: GameTime;
  private _totalGameSeconds = 0; // 累计游戏秒

  constructor(startHour = 6, startMinute = 0) {
    // 初始游戏秒
    this._totalGameSeconds = (startHour * 60 + startMinute) * 60;
    const phase = TimeManager.hourToPhase(startHour);
    this._gameTime = {
      day: 1, hour: startHour, minute: startMinute,
      phase, speed: 1, paused: false,
    };
  }

  static hourToPhase(hour: number): GamePhase {
    if (hour < 5 || hour >= 22) return 'closed';
    if (hour < 6) return 'dawn';
    if (hour < 7) return 'morning';
    if (hour < 9) return 'rush_am';
    if (hour < 11) return 'forenoon';
    if (hour < 13) return 'noon';
    if (hour < 14) return 'afternoon';
    if (hour < 16) return 'tea_time';
    if (hour < 18) return 'evening';
    if (hour < 21) return 'rush_pm';
    return 'closing';
  }

  get gameTime(): Readonly<GameTime> {
    return this._gameTime;
  }

  /** 每帧更新 */
  update(deltaSeconds: number): void {
    if (this._gameTime.paused) return;

    // 累积游戏秒
    this._totalGameSeconds += deltaSeconds * this._gameTime.speed * GAME_SECONDS_PER_REAL_SECOND;

    // 计算当前天、时、分
    const totalGameMinutes = Math.floor(this._totalGameSeconds / 60);
    const day = Math.floor(totalGameMinutes / (24 * 60)) + 1;
    const hour = Math.floor(totalGameMinutes / 60) % 24;
    const minute = totalGameMinutes % 60;
    const phase = TimeManager.hourToPhase(hour);

    // 阶段变化
    if (phase !== this._gameTime.phase) {
      const prevPhase = this._gameTime.phase;
      const prevDay = this._gameTime.day;
      this._gameTime.phase = phase;
      this._gameTime.day = day;
      this._gameTime.hour = hour;
      this._gameTime.minute = minute;
      eventBus.emit('time:phaseChange', { from: prevPhase, to: phase });
      if (day > prevDay) {
        eventBus.emit('time:dayEnd', { day: prevDay });
      }
    } else {
      this._gameTime.day = day;
      this._gameTime.hour = hour;
      this._gameTime.minute = minute;
    }
  }

  togglePause(): void { this._gameTime.paused = !this._gameTime.paused; }
  setSpeed(speed: 1 | 2 | 4): void { this._gameTime.speed = speed; }
}
