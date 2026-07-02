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

/**
 * App 根组件
 * 架构：顶部状态栏 + 中间游戏画布 + 底部导航栏
 */
export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const setLoading = useUIStore((s) => s.setLoading);
  const isLoading = useUIStore((s) => s.isLoading);

  useEffect(() => {
    // 初始化配方 Store
    useRecipeStore.getState().init();

    // 启动顾客系统
    customerSystem.start();

    // 启动游戏主循环
    gameLoop.start();

    // 同步时间到 UI（仅当时分变化时更新，避免每帧渲染）
    let lastDisplay = '';
    const unsub = eventBus.on<{ time: GameTime }>('time:tick', ({ time }) => {
      const display = `${time.hour}:${time.minute}`;
      if (display !== lastDisplay) {
        lastDisplay = display;
        useTimeStore.getState().setTime(time);
      }
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
