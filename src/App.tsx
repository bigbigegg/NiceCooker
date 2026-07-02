import { useEffect, useRef } from 'react';
import { StatusBar } from '@/ui/components/StatusBar/StatusBar';
import { NavBar } from '@/ui/components/NavBar/NavBar';
import { GameCanvas } from '@/ui/GameCanvas';
import { useUIStore } from '@/stores/uiStore';
import { useTimeStore } from '@/stores/timeStore';
import { gameLoop } from '@/core/GameLoop';
import { eventBus } from '@/core/EventBus';
import { customerSystem } from '@/core/systems/customer/CustomerSystem';
import { useRecipeStore } from '@/stores/recipeStore';
import type { GameTime } from '@/types';
import './App.css';

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isLoading = useUIStore((s) => s.isLoading);
  const setLoading = useUIStore((s) => s.setLoading);

  useEffect(() => {
    // 初始化配方 Store
    useRecipeStore.getState().init();
    // 启动顾客系统
    customerSystem.start();
    // 启动时间循环
    gameLoop.start();

    // 同步时间到 UI（每帧同步，Zustand 浅比较自动跳过未变化的状态）
    const unsubTime = eventBus.on<{ time: GameTime }>('time:tick', ({ time }) => {
      useTimeStore.getState().setTime(time);
    });

    setLoading(false);

    return () => {
      gameLoop.stop();
      customerSystem.stop();
      unsubTime();
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
