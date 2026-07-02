/**
 * 游戏日志系统
 *
 * 分级 + 分类 + 内存缓存 + 一键导出下载。
 * 使用方式：logger.customer.info('顾客进店', { id: 'c_123' });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogCategory = 'customer' | 'craft' | 'time' | 'render' | 'economy' | 'app' | 'store';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

class Logger {
  private buffer: LogEntry[] = [];
  private maxBuffer = 1000;
  private minLevel: LogLevel = 'debug';
  private enabledCategories = new Set<LogCategory>(['customer', 'craft', 'time', 'render', 'economy', 'app', 'store']);

  /** 设置最低日志级别 */
  setLevel(level: LogLevel): void { this.minLevel = level; }

  /** 启用/禁用某分类 */
  toggleCategory(cat: LogCategory, on: boolean): void {
    if (on) this.enabledCategories.add(cat);
    else this.enabledCategories.delete(cat);
  }

  /** 记录日志 */
  private log(level: LogLevel, category: LogCategory, message: string, data?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    if (!this.enabledCategories.has(category)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer = this.buffer.slice(-this.maxBuffer);
    }

    // 同时输出到浏览器控制台
    const prefix = `[${entry.timestamp.slice(11, 23)}] [${category}]`;
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(prefix, message, data ?? '');
  }

  debug(cat: LogCategory, msg: string, data?: unknown): void { this.log('debug', cat, msg, data); }
  info(cat: LogCategory, msg: string, data?: unknown): void { this.log('info', cat, msg, data); }
  warn(cat: LogCategory, msg: string, data?: unknown): void { this.log('warn', cat, msg, data); }
  error(cat: LogCategory, msg: string, data?: unknown): void { this.log('error', cat, msg, data); }

  /** 导出为文本并触发浏览器下载 */
  download(filename = 'nicecooker.log'): void {
    const lines = this.buffer.map((e) =>
      `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.category}] ${e.message} ${e.data ? JSON.stringify(e.data) : ''}`,
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** 获取最近 N 条日志 */
  recent(n = 50): LogEntry[] {
    return this.buffer.slice(-n);
  }

  /** 清空 */
  clear(): void { this.buffer = []; }
}

export const logger = new Logger();

/** 挂载到 window 方便控制台调试 */
if (typeof window !== 'undefined') {
  (window as any).__logger = logger;
}
