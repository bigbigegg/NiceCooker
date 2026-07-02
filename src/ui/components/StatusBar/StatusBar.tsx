import { usePlayerStore } from '@/stores/playerStore';
import { useTimeStore } from '@/stores/timeStore';
import { gameLoop } from '@/core/GameLoop';
import './StatusBar.css';

const phaseLabel: Record<string, string> = {
  dawn: '🌅 黎明', morning: '🌤️ 清晨', rush_am: '☀️ 早高峰',
  forenoon: '🌤️ 上午', noon: '☀️ 午高峰', afternoon: '🌤️ 下午',
  tea_time: '🍵 下午茶', evening: '🌅 傍晚', rush_pm: '🌙 晚高峰',
  closing: '🌙 打烊', closed: '🌙 闭店',
};

/** 顶部状态栏 */
export function StatusBar() {
  const gold = usePlayerStore((s) => s.gold);
  const diamond = usePlayerStore((s) => s.diamond);
  const level = usePlayerStore((s) => s.level);
  const time = useTimeStore((s) => s.time);

  const cycleSpeed = () => {
    const speeds: (1 | 2 | 4)[] = [1, 2, 4];
    const current = speeds.indexOf(time.speed);
    const next = speeds[(current + 1) % speeds.length]!;
    gameLoop.timeManager.setSpeed(next);
    // 直接更新 store 中的 speed
    useTimeStore.getState().setTime({ ...time, speed: next });
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
        <button className="status-bar__speed" onClick={cycleSpeed} title="切换速度">
          ⏩ {time.speed}x
        </button>
      </div>
      <div className="status-bar__right">
        <span className="status-bar__gold">🪙 {gold.toLocaleString()}</span>
        <span className="status-bar__diamond">💎 {diamond}</span>
        <span className="status-bar__level">⭐ Lv.{level}</span>
      </div>
    </div>
  );
}
