import { useEffect, useRef } from 'react';
import { StatusBar } from '@/ui/components/StatusBar/StatusBar';
import { NavBar } from '@/ui/components/NavBar/NavBar';
import { GameCanvas } from '@/ui/GameCanvas';
import { useUIStore } from '@/stores/uiStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useTimeStore } from '@/stores/timeStore';
import { gameLoop } from '@/core/GameLoop';
import { eventBus } from '@/core/EventBus';
import type { GameTime } from '@/types';

import './App.css';

/**
 * App 根组件
 * 架构：顶部状态栏 + 中间游戏画布 + 底部导航栏
 */
export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const setLoading = useUIStore((s) => s.setLoading);
  const isLoading = useUIStore((s) => s.isLoading);

  useEffect(() => {
    // 启动游戏主循环
    gameLoop.start();

    // 同步时间状态到 UI
    const unsub = eventBus.on<{ time: GameTime }>('time:tick', ({ time }) => {
      useTimeStore.getState().setTime(time);
    });

    setLoading(false);

    return () => {
      gameLoop.stop();
      unsub();
    };
  }, [setLoading]);

  if (isLoading) {
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
