import type { GamePhase, GameTime } from '@/types';
import { eventBus } from './EventBus';

/** 各阶段持续时长（现实秒，1x速度） */
const PHASE_DURATION: Record<GamePhase, number> = {
  dawn: 30,
  morning: 30,
  rush_am: 60,
  forenoon: 60,
  noon: 60,
  afternoon: 30,
  tea_time: 60,
  evening: 60,
  rush_pm: 90,
  closing: 30,
  closed: 210,
};

/** 阶段顺序 */
const PHASE_ORDER: GamePhase[] = [
  'dawn', 'morning', 'rush_am', 'forenoon', 'noon',
  'afternoon', 'tea_time', 'evening', 'rush_pm', 'closing', 'closed',
];

/**
 * 游戏时间管理器
 *
 * 1 游戏日 = 12 现实分钟（1x速度）
 * 营业时间 06:00-22:00，闭店 22:00-06:00
 */
export class TimeManager {
  private _gameTime: GameTime;
  private _phaseElapsed = 0;    // 当前阶段已过（现实秒）
  private _prevPhase: GamePhase;

  constructor(startHour = 6, startMinute = 0) {
    const phase = TimeManager.hourToPhase(startHour);
    this._gameTime = {
      day: 1,
      hour: startHour,
      minute: startMinute,
      phase,
      speed: 1,
      paused: false,
    };
    this._prevPhase = phase;
  }

  /** 计算指定小时对应的阶段 */
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

  get isBusinessHours(): boolean {
    return this._gameTime.phase !== 'closed' && this._gameTime.phase !== 'dawn';
  }

  /** 每帧更新（deltaTime = 现实秒） */
  update(deltaSeconds: number): void {
    if (this._gameTime.paused) return;

    const effectiveDelta = deltaSeconds * this._gameTime.speed;
    this._phaseElapsed += effectiveDelta;

    if (this._phaseElapsed >= PHASE_DURATION[this._gameTime.phase]) {
      this._phaseElapsed -= PHASE_DURATION[this._gameTime.phase];
      this.advancePhase();
    }

    this.updateClock(effectiveDelta);
  }

  /** 推进到下一阶段 */
  private advancePhase(): void {
    const currentIdx = PHASE_ORDER.indexOf(this._gameTime.phase);
    const nextIdx = (currentIdx + 1) % PHASE_ORDER.length;
    const nextPhase = PHASE_ORDER[nextIdx]!;

    const prevPhase = this._gameTime.phase;
    this._gameTime.phase = nextPhase;

    eventBus.emit('time:phaseChange', { from: prevPhase, to: nextPhase });

    // 新一天开始
    if (nextIdx === 0) {
      this._gameTime.day++;
      eventBus.emit('time:dayEnd', { day: this._gameTime.day - 1 });
    }
  }

  /** 更新游戏内时钟 */
  private updateClock(deltaSeconds: number): void {
    // 1 现实秒 = 120 游戏秒（2 游戏分钟）
    const gameSeconds = deltaSeconds * 120;
    const totalMinutes = this._gameTime.hour * 60 + this._gameTime.minute + Math.floor(gameSeconds / 60);
    this._gameTime.hour = Math.floor(totalMinutes / 60) % 24;
    this._gameTime.minute = totalMinutes % 60;
  }

  /** 暂停/恢复 */
  togglePause(): void {
    this._gameTime.paused = !this._gameTime.paused;
  }

  /** 设置速度 */
  setSpeed(speed: 1 | 2 | 4): void {
    this._gameTime.speed = speed;
  }
}
