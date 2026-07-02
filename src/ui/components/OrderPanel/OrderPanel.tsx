import { useState, useEffect } from 'react';
import { eventBus } from '@/core/EventBus';
import { useRecipeStore } from '@/stores/recipeStore';
import { useCraftingStore } from '@/stores/craftingStore';
import { RECIPES_BY_ID } from '@/config/recipes';
import { logger } from '@/utils/Logger';
import './OrderPanel.css';

interface OrderInfo { customerId: string; typeId: string; orderRecipeId: string | null; state: string; }

const TYPE_NAMES: Record<string, string> = {
  officeWorker: '👔 上班族', student: '👩‍🎓 学生', retiree: '👵 退休老人',
  influencer: '📸 网红博主', business: '💼 商务人士', artist: '🎨 文艺青年', special: '🐱 特殊顾客',
};

export function OrderPanel() {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const crafting = useCraftingStore();

  useEffect(() => {
    return eventBus.on<OrderInfo>('customer:click', (info) => {
      logger.info('app', `👆 点击顾客 id=${info.customerId} type=${info.typeId} state=${info.state} recipe=${info.orderRecipeId ?? '无'}`);
      setOrder(info);
    });
  }, []);

  if (!order) return null;

  const recipe = order.orderRecipeId ? RECIPES_BY_ID.get(order.orderRecipeId) : null;
  const isCrafting = crafting.activeCustomerId === order.customerId;

  const handleCraft = () => {
    if (!recipe) return;
    const ok = useRecipeStore.getState().startCrafting(recipe.id, 'coffee_machine');
    if (ok) {
      logger.info('app', `🔨 开始制作 ${recipe.name} for customer=${order.customerId}`);
      crafting.startCrafting(order.customerId);
    } else {
      // 槽位已满，不更新 result（保留之前的完成信息）
      logger.warn('app', `⏳ 制作队列已满 for customer=${order.customerId}`);
    }
  };

  const handleClose = () => {
    logger.debug('app', `✕ 关闭订单面板 customer=${order.customerId}`);
    setOrder(null);
  };

  return (
    <div className="order-panel">
      <div className="order-panel__header">
        <span>{TYPE_NAMES[order.typeId] ?? order.typeId}</span>
        <button className="order-panel__close" onClick={handleClose}>✕</button>
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

        {crafting.result && <div className="order-panel__result">{crafting.result}</div>}

        {isCrafting && !crafting.result && (
          <div className="order-panel__crafting">
            <div>⏳ 制作中... {crafting.progress}%</div>
            <div className="order-panel__progress-bar">
              <div className="order-panel__progress-fill" style={{ width: `${crafting.progress}%` }} />
            </div>
          </div>
        )}

        {recipe && !isCrafting && !crafting.result && (
          <button className="order-panel__craft-btn" onClick={handleCraft}>☕ 制作 {recipe.name}</button>
        )}
      </div>
    </div>
  );
}
