import { useState, useEffect } from 'react';
import { eventBus } from '@/core/EventBus';
import { useRecipeStore } from '@/stores/recipeStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { RECIPES_BY_ID } from '@/config/recipes';
import './OrderPanel.css';

interface OrderInfo {
  customerId: string;
  typeId: string;
  orderRecipeId: string | null;
  state: string;
}

const TYPE_NAMES: Record<string, string> = {
  officeWorker: '👔 上班族', student: '👩‍🎓 学生', retiree: '👵 退休老人',
  influencer: '📸 网红博主', business: '💼 商务人士', artist: '🎨 文艺青年',
  special: '🐱 特殊顾客',
};

export function OrderPanel() {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [crafting, setCrafting] = useState(false);
  const [craftProgress, setCraftProgress] = useState(0);
  const [craftResult, setCraftResult] = useState<string | null>(null);

  useEffect(() => {
    const unsubClick = eventBus.on<OrderInfo>('customer:click', (info) => {
      setOrder(info);
      setCrafting(false);
      setCraftProgress(0);
      setCraftResult(null);
    });

    const unsubProgress = eventBus.on<{ recipeId: string; progress: number }>(
      'craft:progress',
      (data) => setCraftProgress(Math.round(data.progress)),
    );

    return () => { unsubClick(); unsubProgress(); };
  }, []);

  if (!order) return null;

  const recipe = order.orderRecipeId ? RECIPES_BY_ID.get(order.orderRecipeId) : null;

  const handleCraft = () => {
    if (!recipe || !order) return;
    setCrafting(true);

    const store = useRecipeStore.getState();
    const success = store.startCrafting(recipe.id, 'coffee_machine');
    if (!success) { setCraftResult('❌ 制作失败，请重试'); setCrafting(false); return; }

    // 模拟等待制作完成
    const unsub = eventBus.on<{ recipeId: string; quality: number }>('craft:complete', (data) => {
      if (data.recipeId === recipe.id) {
        unsub();
        const quality = Math.floor(data.quality);
        const stars = quality >= 85 ? 5 : quality >= 65 ? 4 : quality >= 45 ? 3 : quality >= 25 ? 2 : 1;
        setCraftResult(`✅ ${recipe.name} 完成！品质: ${'⭐'.repeat(stars)}`);

        // 自动服务顾客
        const customer = useCustomerStore.getState().customers[order.customerId];
        if (customer && customer.state === 'waiting') {
          useCustomerStore.getState().markServed(order.customerId, quality);

          // 结算金币
          const priceMultiplier = [0, 0.7, 0.8, 0.9, 1.2, 1.5][stars] ?? 1;
          const earned = Math.round(recipe.basePrice * priceMultiplier);
          usePlayerStore.getState().earnGold(earned, 'customer_service');
          usePlayerStore.getState().addExp(recipe.baseExp);
        }
      }
    });
  };

  const handleClose = () => setOrder(null);

  return (
    <div className="order-panel">
      <div className="order-panel__header">
        <span>{TYPE_NAMES[order.typeId] ?? order.typeId}</span>
        <button className="order-panel__close" onClick={handleClose}>✕</button>
      </div>
      <div className="order-panel__body">
        {recipe ? (
          <>
            <div className="order-panel__order">
              🛒 已点单：<strong>{recipe.name}</strong>（{recipe.basePrice}💰）
            </div>
            <div className="order-panel__steps">
              {recipe.steps.map((step, i) => (
                <span key={i} className="order-panel__step">{i + 1}. {step}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="order-panel__order">🕐 正在浏览菜单...</div>
        )}
        {craftResult && <div className="order-panel__result">{craftResult}</div>}
        {recipe && !crafting && !craftResult && (
          <button className="order-panel__craft-btn" onClick={handleCraft}>
            ☕ 制作 {recipe.name}
          </button>
        )}
        {crafting && (
          <div className="order-panel__crafting">
            <div>⏳ 制作中... {craftProgress}%</div>
            <div className="order-panel__progress-bar">
              <div className="order-panel__progress-fill" style={{ width: `${craftProgress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
