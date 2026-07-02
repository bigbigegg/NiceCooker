import { usePlayerStore } from '@/stores/playerStore';
import { useTimeStore } from '@/stores/timeStore';
import './StatusBar.css';

/** 顶部状态栏：时间 | 天气 | 金币 | 钻石 | 等级 */
export function StatusBar() {
  const gold = usePlayerStore((s) => s.gold);
  const diamond = usePlayerStore((s) => s.diamond);
  const level = usePlayerStore((s) => s.level);
  const time = useTimeStore((s) => s.time);

  const phaseLabel: Record<string, string> = {
    dawn: '🌅 黎明',
    morning: '🌤️ 清晨',
    rush_am: '☀️ 早高峰',
    forenoon: '🌤️ 上午',
    noon: '☀️ 午高峰',
    afternoon: '🌤️ 下午',
    tea_time: '🍵 下午茶',
    evening: '🌅 傍晚',
    rush_pm: '🌙 晚高峰',
    closing: '🌙 打烊',
    closed: '🌙 闭店',
  };

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <span className="status-bar__time">
          {phaseLabel[time.phase] ?? time.phase} Day {time.day}
        </span>
        <span className="status-bar__clock">
          {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
        </span>
      </div>
      <div className="status-bar__right">
        <span className="status-bar__gold">🪙 {gold.toLocaleString()}</span>
        <span className="status-bar__diamond">💎 {diamond}</span>
        <span className="status-bar__level">⭐ Lv.{level}</span>
      </div>
    </div>
  );
}
