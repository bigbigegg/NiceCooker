import { TimeManager } from './TimeManager';
import { eventBus } from './EventBus';

type System = {
  name: string;
  priority: number;
  update: (deltaSeconds: number) => void;
  enabled: boolean;
};

/**
 * 游戏主循环
 *
 * 使用 requestAnimationFrame 驱动，固定逻辑更新频率。
 * 渲染与逻辑分离：逻辑更新以 delta time 驱动，渲染由 PixiJS 的 Ticker 处理。
 */
export class GameLoop {
  private systems: System[] = [];
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private _timeManager: TimeManager;

  constructor() {
    this._timeManager = new TimeManager();
  }

  get timeManager(): TimeManager {
    return this._timeManager;
  }

  /** 注册系统（按 priority 排序执行） */
  registerSystem(
    name: string,
    update: (deltaSeconds: number) => void,
    priority = 0,
  ): void {
    this.systems.push({ name, priority, update, enabled: true });
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  /** 启用/禁用系统 */
  setSystemEnabled(name: string, enabled: boolean): void {
    const system = this.systems.find((s) => s.name === name);
    if (system) system.enabled = enabled;
  }

  /** 启动主循环 */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  /** 停止主循环 */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  /** 单帧 */
  private tick = (now: number): void => {
    if (!this.running) return;

    const deltaSeconds = Math.min((now - this.lastTime) / 1000, 0.1); // 上限 100ms
    this.lastTime = now;

    // 1. 更新时间
    this._timeManager.update(deltaSeconds);
    eventBus.emit('time:tick', { time: this._timeManager.gameTime });

    // 2. 更新各系统
    for (const system of this.systems) {
      if (system.enabled) {
        try {
          system.update(deltaSeconds);
        } catch (error) {
          console.error(`[GameLoop] Error in system "${system.name}":`, error);
        }
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}

/** 全局单例 */
export const gameLoop = new GameLoop();
