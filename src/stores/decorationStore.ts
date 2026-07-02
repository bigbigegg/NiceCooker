import { create } from 'zustand';
import { GridSystem } from '@/core/systems/decoration/GridSystem';
import { FURNITURE_CATALOG, GRID_SIZE } from '@/config/furniture';
import { usePlayerStore } from '@/stores/playerStore';
import { logger } from '@/utils/Logger';
import type { FurnitureData } from '@/renderer/types';
import type { FurnitureCatalogItem } from '@/config/furniture';
import type { Position } from '@/types';

const gridSystem = new GridSystem();

interface DecorationState {
  placedFurniture: FurnitureData[];
  /** 拥有的家具数量（id → count，购买后即使移除了也保留） */
  inventory: Record<string, number>;
  /** 当前选中的目录物品 ID */
  selectedCatalogId: string | null;
  /** 当前选中的已放置家具 ID */
  selectedPlacedId: string | null;
  /** 预览虚影位置（像素） */
  ghostPosition: Position | null;
  /** 虚影是否有效 */
  ghostValid: boolean;
  /** 当前环境分 */
  environmentScore: number;

  // Actions
  init: () => void;
  selectCatalogItem: (id: string | null) => void;
  selectPlacedFurniture: (id: string | null) => void;
  setGhostPosition: (pos: Position | null, valid: boolean) => void;
  buyAndPlace: (catalogId: string, row: number, col: number) => boolean;
  moveFurniture: (furnitureId: string, newRow: number, newCol: number) => void;
  removeFurniture: (furnitureId: string) => void;
  recalculateEnvScore: () => void;
}

export const useDecorationStore = create<DecorationState>((set, get) => ({
  placedFurniture: [],
  inventory: {},
  selectedCatalogId: null,
  selectedPlacedId: null,
  ghostPosition: null,
  ghostValid: false,
  environmentScore: 0,

  init: () => {
    // 初始赠送 2 张 2人桌
    const tables: FurnitureData[] = [
      createFurnitureData('table2_basic', 2, 3),
      createFurnitureData('table2_basic', 6, 3),
    ];
    set({ placedFurniture: tables, inventory: { table2_basic: 2 } });
    tables.forEach((t) => {
      const item = getCatalogItem(t.catalogId);
      if (item) {
        const pos = gridSystem.pixelToGrid(t.position.x, t.position.y);
        gridSystem.occupy(pos.row, pos.col, item.size.width, item.size.height, t.id);
      }
    });
    get().recalculateEnvScore();
  },

  selectCatalogItem: (id) => set({ selectedCatalogId: id, selectedPlacedId: null }),

  selectPlacedFurniture: (id) => set({ selectedPlacedId: id, selectedCatalogId: null }),

  setGhostPosition: (pos, valid) => set({ ghostPosition: pos, ghostValid: valid }),

  buyAndPlace: (catalogId, row, col) => {
    const item = getCatalogItem(catalogId);
    if (!item) return false;

    // 检查金币
    const player = usePlayerStore.getState();
    if (!player.canAfford(item.cost)) {
      logger.warn('decoration', `金币不足: 需要 ${item.cost}, 当前 ${player.gold}`);
      return false;
    }

    // 检查网格
    if (!gridSystem.canPlace(row, col, item.size.width, item.size.height)) {
      logger.warn('decoration', `无法放置 ${item.name} at (${row},${col})`);
      return false;
    }

    // 扣钱
    player.spendGold(item.cost, 'furniture');

    // 创建家具数据
    const furniture = createFurnitureData(catalogId, col, row);
    gridSystem.occupy(row, col, item.size.width, item.size.height, furniture.id);

    set((s) => ({
      placedFurniture: [...s.placedFurniture, furniture],
      inventory: { ...s.inventory, [catalogId]: (s.inventory[catalogId] ?? 0) + 1 },
      selectedCatalogId: null,
      ghostPosition: null,
    }));

    get().recalculateEnvScore();
    logger.info('decoration', `🪑 放置 ${item.name} at (${row},${col}) 花费 ${item.cost}💰`);
    return true;
  },

  moveFurniture: (furnitureId, newRow, newCol) => {
    const state = get();
    const furniture = state.placedFurniture.find((f) => f.id === furnitureId);
    if (!furniture) return;

    const item = getCatalogItem(furniture.catalogId);
    if (!item) return;

    if (!gridSystem.canPlace(newRow, newCol, item.size.width, item.size.height)) return;

    // 释放旧位置，占用新位置
    gridSystem.release(furnitureId);
    gridSystem.occupy(newRow, newCol, item.size.width, item.size.height, furnitureId);

    const newPos = gridSystem.gridToPixel(newRow, newCol);
    set((s) => ({
      placedFurniture: s.placedFurniture.map((f) =>
        f.id === furnitureId ? { ...f, position: newPos } : f,
      ),
    }));
    logger.debug('decoration', `🔄 移动家具 ${item.name} → (${newRow},${newCol})`);
  },

  removeFurniture: (furnitureId) => {
    const furniture = get().placedFurniture.find((f) => f.id === furnitureId);
    if (!furniture) return;

    gridSystem.release(furnitureId);
    set((s) => ({
      placedFurniture: s.placedFurniture.filter((f) => f.id !== furnitureId),
      selectedPlacedId: s.selectedPlacedId === furnitureId ? null : s.selectedPlacedId,
    }));
    get().recalculateEnvScore();
    logger.info('decoration', `🗑️ 移除家具 ${furniture.catalogId}`);
  },

  recalculateEnvScore: () => {
    const state = get();
    let score = 0;
    for (const f of state.placedFurniture) {
      const item = getCatalogItem(f.catalogId);
      if (item) score += item.envScore;
    }
    set({ environmentScore: Math.min(100, score) });
  },
}));

/** 辅助函数 */
let furnitureIdCounter = 0;
function createFurnitureData(catalogId: string, col: number, row: number): FurnitureData & { catalogId: string } {
  const item = getCatalogItem(catalogId)!;
  const pos = gridSystem.gridToPixel(row, col);
  return {
    id: `furn_${++furnitureIdCounter}`,
    catalogId,
    type: item.furnitureType,
    position: pos,
    width: item.size.width * GRID_SIZE,
    height: item.size.height * GRID_SIZE,
    variant: item.variant,
    rotation: 0,
  };
}

function getCatalogItem(catalogId: string): FurnitureCatalogItem | undefined {
  return FURNITURE_CATALOG.find((i) => i.id === catalogId);
}
