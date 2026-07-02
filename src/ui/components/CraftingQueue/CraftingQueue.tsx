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
 * 制作队列面板（独立浮动组件，支持折叠）
 */
export function CraftingQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const unsubStart = eventBus.on<{ recipeId: string; stationId: string }>(
      'craft:start',
      (data) => {
        setQueue((prev) => [
          ...prev,
          { taskId: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, recipeId: data.recipeId, progress: 0 },
        ]);
        setCollapsed(false); // 有新任务时自动展开
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
    <div className={`crafting-queue ${collapsed ? 'crafting-queue--collapsed' : ''}`}>
      {/* 折叠时显示边缘标签 */}
      {collapsed && (
        <div className="crafting-queue__tab" onClick={() => setCollapsed(false)} title="展开制作队列">
          🔨 {queue.length}
        </div>
      )}
      <div className="crafting-queue__header" onClick={() => setCollapsed(!collapsed)}>
        <span>🔨 制作队列 ({queue.length})</span>
        <span className="crafting-queue__toggle">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (

        <div className="crafting-queue__body">
          {queue.map((item) => {
            const recipe = RECIPES_BY_ID.get(item.recipeId);
            return (
              <div key={item.taskId} className="crafting-queue__item">
                <span className="crafting-queue__name">{recipe?.name ?? item.recipeId}</span>
                <div className="crafting-queue__bar">
                  <div className="crafting-queue__fill" style={{ width: `${item.progress}%` }} />
                </div>
                <span className="crafting-queue__pct">{item.progress}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
