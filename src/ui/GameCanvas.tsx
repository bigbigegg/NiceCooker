import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application, Graphics, Text } from 'pixi.js';
import { SceneManager } from '@/renderer/SceneManager';
import { RenderSystem } from '@/renderer/systems/RenderSystem';
import { DecorationRenderSystem } from '@/renderer/systems/DecorationRenderSystem';
import { useCustomerStore } from '@/stores/customerStore';
import { useUIStore } from '@/stores/uiStore';
import { useDecorationStore } from '@/stores/decorationStore';
import { FURNITURE_CATALOG, GRID_SIZE } from '@/config/furniture';
import { eventBus } from '@/core/EventBus';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export let sceneManager: SceneManager | null = null;
export let renderSystem: RenderSystem | null = null;
export let decorationRenderer: DecorationRenderSystem | null = null;

export function GameCanvas({ containerRef }: GameCanvasProps) {
  const appRef = useRef<Application | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || appRef.current) return;
    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) { requestAnimationFrame(tryInit); return; }

      const app = new Application();
      appRef.current = app;

      app.init({
        width: w, height: h,
        background: '#D7CCC8',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      }).then(() => {
        if (cancelled) { app.destroy(true); return; }

        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvasWrapperRef.current?.appendChild(canvas);

        // 画地板网格
        drawFloor(app);

        // 点击空白处关闭面板（顾客 sprite 已 stopPropagation，不会触发这里）
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.renderer.screen;
        app.stage.on('pointerdown', () => eventBus.emit('order:close', null));

        if (!sceneManager) sceneManager = new SceneManager();
        sceneManager.init(app);
        if (!renderSystem) renderSystem = new RenderSystem(sceneManager);
        renderSystem.init(app);

        // 初始化装修渲染系统
        if (!decorationRenderer) decorationRenderer = new DecorationRenderSystem(sceneManager);
        decorationRenderer.init(app);

        eventBus.emit('renderer:ready', { sceneManager, renderSystem });

        // 编辑模式下禁用面板关闭 + 处理装修交互
        app.stage.off('pointerdown');
        app.stage.on('pointerdown', (e) => {
          if (useUIStore.getState().isEditMode) {
            handleEditClick(e.globalX, e.globalY);
          } else {
            eventBus.emit('order:close', null);
          }
        });

        // 鼠标移动跟踪虚影
        app.stage.on('pointermove', (e) => {
          if (useUIStore.getState().isEditMode) {
            handleEditHover(e.globalX, e.globalY);
          }
        });

        setStatus('ready');
      }).catch(() => { if (!cancelled) setStatus('error'); });
    };

    requestAnimationFrame(tryInit);

    return () => {
      cancelled = true;
      if (appRef.current) { try { appRef.current.destroy(true); } catch { /* */ } appRef.current = null; }
      sceneManager = null;
      renderSystem = null;
    };
  }, [containerRef]);

  if (status === 'error') {
    return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#8D6E63' }}>
      <div style={{textAlign:'center'}}><div style={{fontSize:48}}>☕</div><p>WebGL 不可用</p></div>
    </div>;
  }

  // 阻止 canvas 点击冒泡到 game-area（避免触发 order:close）
  return <div ref={canvasWrapperRef} style={{ width:'100%', height:'100%' }}
    onClick={(e) => e.stopPropagation()} />;
}

/** 地板网格 */
function drawFloor(app: Application) {
  const g = new Graphics();
  const gridSize = 64;
  const cols = Math.ceil(app.renderer.width / gridSize);
  const rows = Math.ceil(app.renderer.height / gridSize);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.rect(c * gridSize, r * gridSize, gridSize, gridSize);
      g.fill({ color: 0xD7CCC8 });
      g.rect(c * gridSize, r * gridSize, gridSize, gridSize);
      g.stroke({ color: 0xBCAAA4, width: 1 });
    }
  }
  app.stage.addChild(g);

  const title = new Text({
    text: '☕ 暖阳镇咖啡厅',
    style: { fontSize: 16, fontFamily: 'PingFang SC, sans-serif', fill: 0x5D4037 },
  });
  title.x = 16; title.y = 12;
  app.stage.addChild(title);

  // 店内人数计数器（每帧更新）
  const counter = new Text({
    text: '👤 店内: 0 人',
    style: { fontSize: 13, fontFamily: 'PingFang SC, sans-serif', fill: 0x795548 },
  });
  counter.x = 16;
  counter.y = 36;
  counter.label = 'customer-counter';
  app.stage.addChild(counter);

  // 用 PixiJS ticker 每秒更新计数器
  let elapsed = 0;
  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS;
    if (elapsed >= 1000) {
      elapsed = 0;
      const count = Object.keys(useCustomerStore.getState().customers).length;
      counter.text = `👤 店内: ${count} 人`;
    }
  });
}

/** 编辑模式：点击处理 */
function handleEditClick(px: number, py: number): void {
  const store = useDecorationStore.getState();
  if (!store.selectedCatalogId) return;
  const col = Math.floor(px / GRID_SIZE);
  const row = Math.floor(py / GRID_SIZE);
  store.buyAndPlace(store.selectedCatalogId, row, col);
}

/** 编辑模式：鼠标移动更新虚影 */
function handleEditHover(px: number, py: number): void {
  const store = useDecorationStore.getState();
  if (!store.selectedCatalogId) { store.setGhostPosition(null, false); return; }
  const col = Math.floor(px / GRID_SIZE);
  const row = Math.floor(py / GRID_SIZE);
  const item = FURNITURE_CATALOG.find((i) => i.id === store.selectedCatalogId);
  if (!item) return;
  const valid = row >= 0 && col >= 0 && row + item.size.height <= 8 && col + item.size.width <= 10;
  store.setGhostPosition(
    { x: col * GRID_SIZE + GRID_SIZE / 2, y: row * GRID_SIZE + GRID_SIZE / 2 },
    valid,
  );
}
