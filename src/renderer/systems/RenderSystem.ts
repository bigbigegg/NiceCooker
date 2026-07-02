import { useCustomerStore } from '@/stores/customerStore';
import { gameLoop } from '@/core/GameLoop';
import { SceneManager, RenderLayer } from '../SceneManager';
import { CustomerSprite } from '../sprites/CustomerSprite';
import type { Application } from 'pixi.js';
import type { Position } from '@/types';

/**
 * 渲染系统 — 每帧从 Zustand stores 同步状态到 PixiJS 场景
 * 注册到 GameLoop priority=100
 */
export class RenderSystem {
  private sceneManager: SceneManager;
  private customerSprites = new Map<string, CustomerSprite>();
  private initialized = false;

  private seatPositions: Position[] = [
    { x: 200, y: 300 }, { x: 350, y: 300 }, { x: 500, y: 300 }, { x: 650, y: 300 },
    { x: 275, y: 420 }, { x: 425, y: 420 }, { x: 575, y: 420 },
    { x: 275, y: 520 }, { x: 425, y: 520 }, { x: 575, y: 520 },
  ];
  private seatOccupancy = new Map<string, Position>();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  init(app: Application): void {
    this.sceneManager.init(app);
    gameLoop.registerSystem('RenderSystem', () => this.update(), 100);
    this.initialized = true;
  }

  private update(): void {
    if (!this.initialized) return;
    this.syncCustomers();
  }

  private syncCustomers(): void {
    const store = useCustomerStore.getState();
    const customers = store.customers;
    const currentIds = new Set(Object.keys(customers));

    // 分配座位
    for (const id of currentIds) {
      if (!this.seatOccupancy.has(id)) {
        const occupied = new Set(
          Array.from(this.seatOccupancy.values()).map((p) => `${p.x},${p.y}`),
        );
        const free = this.seatPositions.find((p) => !occupied.has(`${p.x},${p.y}`));
        if (free) this.seatOccupancy.set(id, free);
      }
    }

    // 新增顾客精灵
    for (const id of currentIds) {
      if (!this.customerSprites.has(id)) {
        const customer = customers[id]!;
        const seat = this.seatOccupancy.get(id);
        if (seat) {
          const sprite = new CustomerSprite(customer, seat);
          this.sceneManager.addToLayer(RenderLayer.CHARACTER, sprite);
          this.customerSprites.set(id, sprite);
        }
      }
    }

    // 更新状态
    for (const [id, sprite] of this.customerSprites) {
      if (currentIds.has(id)) {
        sprite.updateState(customers[id]!);
      }
    }

    // 移除离店顾客
    for (const [id, sprite] of this.customerSprites) {
      if (!currentIds.has(id)) {
        sprite.animateLeave(() => {
          this.sceneManager.getLayer(RenderLayer.CHARACTER).removeChild(sprite);
          sprite.destroy();
        });
        this.customerSprites.delete(id);
        this.seatOccupancy.delete(id);
      }
    }
  }

  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /** 销毁渲染系统，清理所有精灵 */
  destroy(): void {
    gameLoop.setSystemEnabled('RenderSystem', false);
    for (const [, sprite] of this.customerSprites) {
      sprite.destroy();
    }
    this.customerSprites.clear();
    this.seatOccupancy.clear();
    this.sceneManager.destroy();
    this.initialized = false;
  }
}
