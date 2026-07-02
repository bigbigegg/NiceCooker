import { Container, Graphics } from 'pixi.js';
import type { Application } from 'pixi.js';
import { gameLoop } from '@/core/GameLoop';
import { SceneManager, RenderLayer } from '@/renderer/SceneManager';
import { FurnitureSprite } from '@/renderer/sprites/FurnitureSprite';
import { useDecorationStore } from '@/stores/decorationStore';
import { useUIStore } from '@/stores/uiStore';
import { GRID_COLS, GRID_ROWS, GRID_SIZE, FURNITURE_CATALOG } from '@/config/furniture';
import { logger } from '@/utils/Logger';

/**
 * 装修渲染系统 — 管理编辑模式下的网格叠加层和家具精灵
 * 注册到 GameLoop priority=90（在 RenderSystem 之前）
 */
export class DecorationRenderSystem {
  private sceneManager: SceneManager;
  private furnitureSprites = new Map<string, FurnitureSprite>();
  private gridOverlay: Graphics | null = null;
  private ghostOverlay: Graphics | null = null;
  private initialized = false;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  init(app: Application): void {
    gameLoop.registerSystem('DecorationRenderer', () => this.update(), 90);
    this.createGridOverlay(app);
    this.initialized = true;
  }

  private createGridOverlay(app: Application): void {
    const g = new Graphics();
    for (let r = 0; r <= GRID_ROWS; r++) {
      g.rect(0, r * GRID_SIZE, GRID_COLS * GRID_SIZE, 1);
      g.fill({ color: 0x8D6E63, alpha: 0.3 });
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      g.rect(c * GRID_SIZE, 0, 1, GRID_ROWS * GRID_SIZE);
      g.fill({ color: 0x8D6E63, alpha: 0.3 });
    }
    g.visible = false;
    this.gridOverlay = g;
    this.sceneManager.addToLayer(RenderLayer.OVERLAY, g);

    // 虚影
    const ghost = new Graphics();
    ghost.visible = false;
    this.ghostOverlay = ghost;
    this.sceneManager.addToLayer(RenderLayer.OVERLAY, ghost);
  }

  private update(): void {
    if (!this.initialized) return;
    const isEditMode = useUIStore.getState().isEditMode;

    // 切换网格可见性
    if (this.gridOverlay) {
      this.gridOverlay.visible = isEditMode;
    }

    if (isEditMode) {
      this.syncFurniture();
      this.updateGhost();
    }
  }

  private syncFurniture(): void {
    const store = useDecorationStore.getState();
    const currentIds = new Set(store.placedFurniture.map((f) => f.id));

    // 新增
    for (const data of store.placedFurniture) {
      if (!this.furnitureSprites.has(data.id)) {
        const sprite = new FurnitureSprite(data);
        // 点击事件在编辑模式下处理
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.on('pointerdown', () => {
          logger.debug('decoration', `👆 点击家具: ${data.id}`);
          useDecorationStore.getState().selectPlacedFurniture(data.id);
        });
        this.sceneManager.addToLayer(RenderLayer.FURNITURE, sprite);
        this.furnitureSprites.set(data.id, sprite);
      }
    }

    // 更新位置
    for (const data of store.placedFurniture) {
      const sprite = this.furnitureSprites.get(data.id);
      if (sprite) {
        sprite.updatePosition(data.position.x, data.position.y);
        const isSelected = store.selectedPlacedId === data.id;
        sprite.showHighlight(isSelected);
      }
    }

    // 移除
    for (const [id, sprite] of this.furnitureSprites) {
      if (!currentIds.has(id)) {
        this.sceneManager.getLayer(RenderLayer.FURNITURE).removeChild(sprite);
        sprite.destroy();
        this.furnitureSprites.delete(id);
      }
    }
  }

  private updateGhost(): void {
    if (!this.ghostOverlay) return;
    const store = useDecorationStore.getState();
    if (!store.ghostPosition) {
      this.ghostOverlay.visible = false;
      return;
    }

    this.ghostOverlay.visible = true;
    this.ghostOverlay.clear();

    // 根据选中的目录物品确定尺寸
    let w = 64, h = 64;
    if (store.selectedCatalogId) {
      const item = FURNITURE_CATALOG.find((i) => i.id === store.selectedCatalogId);
      if (item) { w = item.size.width * 64; h = item.size.height * 64; }
    }

    const x = store.ghostPosition.x - w / 2;
    const y = store.ghostPosition.y - h / 2;
    const color = store.ghostValid ? 0x4CAF50 : 0xF44336;

    this.ghostOverlay.roundRect(x, y, w, h, 4);
    this.ghostOverlay.fill({ color, alpha: 0.3 });
    this.ghostOverlay.roundRect(x, y, w, h, 4);
    this.ghostOverlay.stroke({ color, width: 2 });
  }

  destroy(): void {
    gameLoop.setSystemEnabled('DecorationRenderer', false);
    for (const [, sprite] of this.furnitureSprites) sprite.destroy();
    this.furnitureSprites.clear();
    if (this.gridOverlay) this.gridOverlay.destroy();
    if (this.ghostOverlay) this.ghostOverlay.destroy();
  }
}
