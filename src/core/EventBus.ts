type Listener<T> = (data: T) => void;

/**
 * 游戏事件总线（单例）
 * 发布-订阅模式，解耦各系统间的通信
 */
export class GameEventBus {
  private listeners = new Map<string, Set<Listener<any>>>();

  /** 注册事件监听 */
  on<T>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /** 注册一次性事件监听 */
  once<T>(event: string, listener: Listener<T>): void {
    const wrapper: Listener<T> = (data: T) => {
      listener(data);
      off();
    };
    const off = this.on(event, wrapper);
  }

  /** 触发事件 */
  emit<T>(event: string, data: T): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[EventBus] Error in listener for "${event}":`, error);
      }
    }
  }

  /** 移除事件的所有监听 */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /** 清空所有事件监听 */
  clear(): void {
    this.listeners.clear();
  }
}

/** 全局单例 */
export const eventBus = new GameEventBus();
