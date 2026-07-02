import { useUIStore } from '@/stores/uiStore';
import { useDecorationStore } from '@/stores/decorationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { FURNITURE_CATALOG } from '@/config/furniture';
import { logger } from '@/utils/Logger';
import './DecorationPanel.css';

export function DecorationPanel() {
  const activePanel = useUIStore((s) => s.activePanel);
  const isEditMode = useUIStore((s) => s.isEditMode);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const decoration = useDecorationStore();

  if (activePanel !== 'decoration') return null;

  return (
    <div className="deco-panel" onClick={(e) => e.stopPropagation()}>
      <div className="deco-panel__header">
        <span>🎨 装修模式</span>
        <button className="deco-panel__close" onClick={() => togglePanel('decoration')}>✕</button>
      </div>

      <div className="deco-panel__body">
        {/* 环境分 */}
        <div className="deco-panel__score">
          🌟 环境分：<strong>{decoration.environmentScore}</strong> / 100
        </div>

        {/* 当前操作提示 */}
        {decoration.selectedCatalogId && (
          <div className="deco-panel__hint">
            👆 在网格上点击放置
            <button className="deco-panel__cancel" onClick={() => decoration.selectCatalogItem(null)}>取消</button>
          </div>
        )}
        {decoration.selectedPlacedId && (
          <div className="deco-panel__hint">
            ✋ 拖拽移动 / 按 Delete 移除
            <button className="deco-panel__cancel" onClick={() => decoration.selectPlacedFurniture(null)}>取消</button>
          </div>
        )}

        {/* 家具目录 */}
        <div className="deco-panel__section-title">🛒 家具目录</div>
        <div className="deco-panel__catalog">
          {FURNITURE_CATALOG.map((item) => {
            const owned = decoration.inventory[item.id] ?? 0;
            const canAfford = usePlayerStore.getState().canAfford(item.cost);
            const isSelected = decoration.selectedCatalogId === item.id;
            return (
              <div
                key={item.id}
                className={`deco-panel__card ${isSelected ? 'deco-panel__card--selected' : ''} ${!canAfford ? 'deco-panel__card--locked' : ''}`}
                onClick={() => {
                  if (!canAfford) return;
                  decoration.selectCatalogItem(isSelected ? null : item.id);
                  logger.info('decoration', `📋 选中家具: ${item.name} (${item.cost}💰)`);
                }}
              >
                <div className="deco-panel__card-name">{item.name}</div>
                <div className="deco-panel__card-size">{item.size.width}×{item.size.height} 格</div>
                <div className="deco-panel__card-cost">🪙 {item.cost}</div>
                {owned > 0 && <div className="deco-panel__card-owned">已有 {owned}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
