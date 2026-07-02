import { Container, Application } from 'pixi.js';

/**
 * 渲染层级顺序（数字越大越靠前）
 */
export enum RenderLayer {
  FLOOR = 0,       // 地板
  WALL = 1,        // 墙壁
  FURNITURE = 2,   // 家具
  EQUIPMENT = 3,   // 设备
  CHARACTER = 4,   // 角色（顾客、员工）
  EFFECT = 5,      // 特效
  OVERLAY = 6,     // 覆盖层
}

/** 层级总数 */
const LAYER_COUNT = 7;

/**
 * 场景管理器
 *
 * 管理渲染层级，每个层级是一个 PixiJS Container。
 * 所有层级容器挂载在 worldContainer 下，方便相机统一变换。
 */
export class SceneManager {
  private layers: Map<RenderLayer, Container>;
  private app: Application | null;
  private _worldContainer: Container;
  private _initialized = false;

  constructor() {
    this.layers = new Map();
    this.app = null;
    this._worldContainer = new Container();
    this._worldContainer.label = 'world';
  }

  /** 世界容器（用于相机平移/缩放） */
  get worldContainer(): Container {
    return this._worldContainer;
  }

  /** 是否已初始化 */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * 初始化场景，创建各层级 Container 并挂载到 PixiJS stage
   */
  init(app: Application): void {
    if (this._initialized) return;
    this.app = app;

    // 将世界容器挂载到 stage
    app.stage.addChild(this._worldContainer);

    // 按顺序创建各层级容器
    for (let i = 0; i < LAYER_COUNT; i++) {
      const container = new Container();
      container.label = `layer-${RenderLayer[i] ?? i}`;
      this.layers.set(i as RenderLayer, container);
      this._worldContainer.addChild(container);
    }

    this._initialized = true;
  }

  /**
   * 获取指定层级的 Container
   */
  getLayer(layer: RenderLayer): Container {
    const container = this.layers.get(layer);
    if (!container) {
      throw new Error(`[SceneManager] RenderLayer ${layer} not found`);
    }
    return container;
  }

  /**
   * 将子元素添加到指定层级
   */
  addToLayer(layer: RenderLayer, child: Container): void {
    this.getLayer(layer).addChild(child);
  }

  /**
   * 从指定层级移除子元素
   */
  removeFromLayer(layer: RenderLayer, child: Container): void {
    const container = this.layers.get(layer);
    if (container && child.parent === container) {
      container.removeChild(child);
    }
  }

  /**
   * 清空所有层级内容
   */
  clear(): void {
    for (const [, container] of this.layers) {
      container.removeChildren();
    }
  }

  /**
   * 销毁场景管理器
   */
  destroy(): void {
    this.clear();
    this.layers.clear();
    if (this._worldContainer.parent) {
      this._worldContainer.parent.removeChild(this._worldContainer);
    }
    this._worldContainer.destroy({ children: true });
    this.app = null;
    this._initialized = false;
  }
}
