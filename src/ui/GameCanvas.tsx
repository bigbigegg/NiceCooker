import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application, Graphics, Text } from 'pixi.js';
import { SceneManager } from '@/renderer/SceneManager';
import { RenderSystem } from '@/renderer/systems/RenderSystem';
import { useCustomerStore } from '@/stores/customerStore';
import { eventBus } from '@/core/EventBus';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export let sceneManager: SceneManager | null = null;
export let renderSystem: RenderSystem | null = null;

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

        if (!sceneManager) sceneManager = new SceneManager();
        sceneManager.init(app);
        if (!renderSystem) renderSystem = new RenderSystem(sceneManager);
        renderSystem.init(app);
        eventBus.emit('renderer:ready', { sceneManager, renderSystem });

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
