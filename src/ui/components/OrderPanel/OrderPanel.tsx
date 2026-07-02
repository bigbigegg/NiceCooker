import { useState, useEffect } from 'react';
import { eventBus } from '@/core/EventBus';
import { useRecipeStore } from '@/stores/recipeStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { RECIPES_BY_ID } from '@/config/recipes';
import './OrderPanel.css';

interface OrderInfo {
  customerId: string; typeId: string; orderRecipeId: string | null; state: string;
}

const TYPE_NAMES: Record<string, string> = {
  officeWorker: '👔 上班族', student: '👩‍🎓 学生', retiree: '👵 退休老人',
  influencer: '📸 网红博主', business: '💼 商务人士', artist: '🎨 文艺青年', special: '🐱 特殊顾客',
};

export function OrderPanel() {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [craftingFor, setCraftingFor] = useState<string | null>(null); // customerId
  const [craftProgress, setCraftProgress] = useState(0);
  const [craftResult, setCraftResult] = useState<string | null>(null);

  // 点击顾客
  useEffect(() => {
    return eventBus.on<OrderInfo>('customer:click', (info) => {
      // 点击不同顾客时重置
      if (info.customerId !== order?.customerId) {
        setCraftingFor(null);
        setCraftProgress(0);
        setCraftResult(null);
      }
      setOrder(info);
    });
  }, [order]);

  // 制作进度
  useEffect(() => {
    return eventBus.on<{ recipeId: string; progress: number }>(
      'craft:progress',
      (data) => setCraftProgress(Math.round(data.progress)),
    );
  }, []);

  // 制作完成（自动服务 + 结算，使用 store.getState 避免闭包过期）
  useEffect(() => {
    return eventBus.on<{ recipeId: string; quality: number }>(
      'craft:complete',
      (data) => {
        const quality = Math.floor(data.quality);
        const stars = quality >= 85 ? 5 : quality >= 65 ? 4 : quality >= 45 ? 3 : quality >= 25 ? 2 : 1;
        const recipe = RECIPES_BY_ID.get(data.recipeId);
        setCraftResult(`✅ ${recipe?.name ?? ''} 完成！品质: ${'⭐'.repeat(stars)}`);
        setCraftingFor(null);

        // 自动服务当前制作对应的顾客
        const currentOrder = useCustomerStore.getState().customers[craftingFor ?? ''];
        if (currentOrder?.state === 'waiting') {
          useCustomerStore.getState().markServed(craftingFor!, quality);
          const multiplier = [0, 0.7, 0.8, 0.9, 1.2, 1.5][stars] ?? 1;
          usePlayerStore.getState().earnGold(Math.round((recipe?.basePrice ?? 30) * multiplier), 'service');
          usePlayerStore.getState().addExp(recipe?.baseExp ?? 12);
        }
      },
    );
  }, [craftingFor]);

  if (!order) return null;

  const recipe = order.orderRecipeId ? RECIPES_BY_ID.get(order.orderRecipeId) : null;
  const isCrafting = craftingFor === order.customerId;

  const handleCraft = () => {
    if (!recipe || !order) return;
    const ok = useRecipeStore.getState().startCrafting(recipe.id, 'coffee_machine');
    if (ok) { setCraftingFor(order.customerId); setCraftProgress(0); setCraftResult(null); }
    else setCraftResult('❌ 制作失败');
  };

  return (
    <div className="order-panel">
      <div className="order-panel__header">
        <span>{TYPE_NAMES[order.typeId] ?? order.typeId}</span>
        <button className="order-panel__close" onClick={() => setOrder(null)}>✕</button>
      </div>
      <div className="order-panel__body">
        {recipe ? (
          <>
            <div className="order-panel__order">🛒 已点单：<strong>{recipe.name}</strong>（{recipe.basePrice}💰）</div>
            <div className="order-panel__steps">
              {recipe.steps.map((s, i) => <span key={i} className="order-panel__step">{i + 1}. {s}</span>)}
            </div>
          </>
        ) : (
          <div className="order-panel__order">🕐 正在浏览菜单...</div>
        )}

        {craftResult && <div className="order-panel__result">{craftResult}</div>}

        {isCrafting && (
          <div className="order-panel__crafting">
            <div>⏳ 制作中... {craftProgress}%</div>
            <div className="order-panel__progress-bar">
              <div className="order-panel__progress-fill" style={{ width: `${craftProgress}%` }} />
            </div>
          </div>
        )}

        {recipe && !isCrafting && !craftResult && (
          <button className="order-panel__craft-btn" onClick={handleCraft}>☕ 制作 {recipe.name}</button>
        )}
      </div>
    </div>
  );
}
