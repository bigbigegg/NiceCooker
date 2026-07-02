import { useState, useEffect } from 'react';
import { eventBus } from '@/core/EventBus';
import { RECIPES_BY_ID } from '@/config/recipes';
import './CraftingQueue.css';

interface QueueItem {
  taskId: string;
  recipeId: string;
  progress: number;
  customerId?: string;
}

/**
 * 制作队列面板
 *
 * 显示当前所有制作中的任务及进度条。
 * 监听 craft:start / craft:progress / craft:complete 事件。
 */
export function CraftingQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    const unsubStart = eventBus.on<{ recipeId: string; stationId: string }>(
      'craft:start',
      (data) => {
        setQueue((prev) => [
          ...prev,
          { taskId: `task_${Date.now()}`, recipeId: data.recipeId, progress: 0 },
        ]);
      },
    );

    const unsubProgress = eventBus.on<{ recipeId: string; progress: number }>(
      'craft:progress',
      (data) => {
        setQueue((prev) =>
          prev.map((item) =>
            item.recipeId === data.recipeId ? { ...item, progress: Math.round(data.progress) } : item,
          ),
        );
      },
    );

    const unsubComplete = eventBus.on<{ recipeId: string }>(
      'craft:complete',
      (data) => {
        setQueue((prev) => prev.filter((item) => item.recipeId !== data.recipeId));
      },
    );

    return () => { unsubStart(); unsubProgress(); unsubComplete(); };
  }, []);

  if (queue.length === 0) return null;

  return (
    <div className="crafting-queue">
      <div className="crafting-queue__title">🔨 制作队列</div>
      {queue.map((item) => {
        const recipe = RECIPES_BY_ID.get(item.recipeId);
        return (
          <div key={item.taskId} className="crafting-queue__item">
            <div className="crafting-queue__name">{recipe?.name ?? item.recipeId}</div>
            <div className="crafting-queue__bar">
              <div className="crafting-queue__fill" style={{ width: `${item.progress}%` }} />
            </div>
            <span className="crafting-queue__pct">{item.progress}%</span>
          </div>
        );
      })}
    </div>
  );
}
