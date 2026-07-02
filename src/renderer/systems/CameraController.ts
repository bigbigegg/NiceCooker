import { Container, Application, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js';

/** 相机缩放范围 */
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;

/** 缩放灵敏度 */
const ZOOM_SENSITIVITY = 0.001;

/**
 * 相机控制器
 *
 * 支持右键拖拽平移场景、滚轮缩放。
 * 通过修改 worldContainer 的 position 和 scale 实现。
 */
export class CameraController {
  private world: Container;
  private app: Application;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private worldStartX = 0;
  private worldStartY = 0;
  private currentScale = 1;

  /** 边界限制（场景坐标） */
  private bounds = {
    minX: -500,
    minY: -500,
    maxX: 1500,
    maxY: 1500,
  };

  constructor(world: Container, app: Application) {
    this.world = world;
    this.app = app;
  }

  /** 设置场景边界 */
  setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.bounds = { minX, minY, maxX, maxY };
  }

  /** 启用相机控制 */
  enable(): void {
    const stage = this.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    // 阻止右键菜单
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.addEventListener('contextmenu', this.onContextMenu);

    // 拖拽平移
    stage.on('rightclickdown', this.onPanStart, this);
    stage.on('globalpointermove', this.onPanMove, this);
    stage.on('rightclickup', this.onPanEnd, this);
    stage.on('rightclickupoutside', this.onPanEnd, this);

    // 滚轮缩放
    stage.on('wheel', this.onWheel, this);
  }

  /** 禁用相机控制 */
  disable(): void {
    const stage = this.app.stage;
    stage.off('rightclickdown', this.onPanStart);
    stage.off('globalpointermove', this.onPanMove);
    stage.off('rightclickup', this.onPanEnd);
    stage.off('rightclickupoutside', this.onPanEnd);
    stage.off('wheel', this.onWheel);

    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  /** 重置相机到默认位置 */
  reset(): void {
    this.world.position.set(0, 0);
    this.world.scale.set(1);
    this.currentScale = 1;
  }

  /** 聚焦到指定世界坐标 */
  focusOn(worldX: number, worldY: number): void {
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;
    this.world.position.set(
      screenW / 2 - worldX * this.currentScale,
      screenH / 2 - worldY * this.currentScale,
    );
  }

  /** 右键按下 */
  private onPanStart = (event: FederatedPointerEvent): void => {
    this.isDragging = true;
    this.dragStartX = event.global.x;
    this.dragStartY = event.global.y;
    this.worldStartX = this.world.position.x;
    this.worldStartY = this.world.position.y;
  };

  /** 指针移动 */
  private onPanMove = (event: FederatedPointerEvent): void => {
    if (!this.isDragging) return;

    const dx = event.global.x - this.dragStartX;
    const dy = event.global.y - this.dragStartY;

    let newX = this.worldStartX + dx;
    let newY = this.worldStartY + dy;

    // 边界限制
    const worldW = this.bounds.maxX - this.bounds.minX;
    const worldH = this.bounds.maxY - this.bounds.minY;
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    const minWorldX = -this.bounds.maxX * this.currentScale + screenW;
    const maxWorldX = -this.bounds.minX * this.currentScale;
    const minWorldY = -this.bounds.maxY * this.currentScale + screenH;
    const maxWorldY = -this.bounds.minY * this.currentScale;

    newX = Math.max(minWorldX, Math.min(maxWorldX, newX));
    newY = Math.max(minWorldY, Math.min(maxWorldY, newY));

    this.world.position.set(newX, newY);
  };

  /** 右键松开 */
  private onPanEnd = (): void => {
    this.isDragging = false;
  };

  /** 滚轮缩放 */
  private onWheel = (event: FederatedWheelEvent): void => {
    const delta = -event.deltaY * ZOOM_SENSITIVITY;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.currentScale + delta));

    if (newScale === this.currentScale) return;

    // 以鼠标位置为中心缩放
    const worldPos = this.world.position;
    const mouseX = event.global.x;
    const mouseY = event.global.y;

    // 鼠标指向的世界坐标不变
    const worldX = (mouseX - worldPos.x) / this.currentScale;
    const worldY = (mouseY - worldPos.y) / this.currentScale;

    this.currentScale = newScale;
    this.world.scale.set(newScale);

    // 调整位置使鼠标指向的世界坐标保持不变
    const newWorldPosX = mouseX - worldX * newScale;
    const newWorldPosY = mouseY - worldY * newScale;
    this.world.position.set(newWorldPosX, newWorldPosY);
  };

  /** 阻止右键菜单 */
  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  /** 销毁 */
  destroy(): void {
    this.disable();
  }
}
