import { useEffect, useRef, useState } from 'react';
import { StatusBar } from '@/ui/components/StatusBar/StatusBar';
import { NavBar } from '@/ui/components/NavBar/NavBar';
import { GameCanvas } from '@/ui/GameCanvas';
import { gameLoop } from '@/core/GameLoop';
import { eventBus } from '@/core/EventBus';
import { useTimeStore } from '@/stores/timeStore';
import type { GameTime } from '@/types';
import './App.css';

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 同步时间到 UI（仅当时分变化，避免每帧渲染）
      let lastDisplay = '';
      eventBus.on<{ time: GameTime }>('time:tick', ({ time }) => {
        const display = `${time.hour}:${time.minute}`;
        if (display !== lastDisplay) {
          lastDisplay = display;
          useTimeStore.getState().setTime(time);
        }
      });

      // 启动游戏主循环（仅更新时间，系统注册由各模块自行负责）
      gameLoop.start();
      setReady(true);
    } catch (e) {
      setError(String(e));
    }

    return () => {
      gameLoop.stop();
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, color: 'red', fontFamily: 'monospace' }}>
        <h2>启动失败</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">☕</div>
        <p>暖阳镇咖啡厅 加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <StatusBar />
      <div className="game-area" ref={canvasRef}>
        <GameCanvas containerRef={canvasRef} />
      </div>
      <NavBar />
    </div>
  );
}
