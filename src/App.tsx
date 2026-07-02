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
import { useCraftingStore } from '@/stores/craftingStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { RECIPES_BY_ID } from '@/config/recipes';
import { logger } from '@/utils/Logger';
import { OrderPanel } from '@/ui/components/OrderPanel/OrderPanel';
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

    // 同步时间到 UI
    const unsubTime = eventBus.on<{ time: GameTime }>('time:tick', ({ time }) => {
      useTimeStore.getState().setTime({ ...time });
    });

    // 制作进度 → craftingStore
    const unsubCraftProgress = eventBus.on<{ recipeId: string; progress: number }>(
      'craft:progress',
      (data) => {
        useCraftingStore.getState().setProgress(Math.round(data.progress));
      },
    );

    // 制作完成 → craftingStore + 自动服务 + 结算
    const unsubCraftComplete = eventBus.on<{ recipeId: string; quality: number }>(
      'craft:complete',
      (data) => {
        const quality = Math.floor(data.quality);
        const stars = quality >= 85 ? 5 : quality >= 65 ? 4 : quality >= 45 ? 3 : quality >= 25 ? 2 : 1;
        const recipe = RECIPES_BY_ID.get(data.recipeId);
        const store = useCraftingStore.getState();
        const resultText = `✅ ${recipe?.name ?? ''} 完成！品质: ${'⭐'.repeat(stars)}`;
        store.completeCrafting(resultText);
        logger.info('craft', resultText, { recipeId: data.recipeId, quality, stars });

        // 自动服务
        const customerId = store.activeCustomerId;
        if (customerId) {
          const customer = useCustomerStore.getState().customers[customerId];
          if (customer?.state === 'waiting') {
            useCustomerStore.getState().markServed(customerId, quality);
            const multiplier = [0, 0.7, 0.8, 0.9, 1.2, 1.5][stars] ?? 1;
            const earned = Math.round((recipe?.basePrice ?? 30) * multiplier);
            usePlayerStore.getState().earnGold(earned, 'service');
            usePlayerStore.getState().addExp(recipe?.baseExp ?? 12);
            logger.info('economy', `💰 金币 +${earned} (${recipe?.name} ${stars}星) | EXP +${recipe?.baseExp ?? 12} | customer=${customerId}`);
          }
        }
      },
    );

    setLoading(false);

    return () => {
      gameLoop.stop();
      customerSystem.stop();
      unsubTime();
      unsubCraftProgress();
      unsubCraftComplete();
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
        <OrderPanel />
      </div>
      <NavBar />
    </div>
  );
}
