import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application, Graphics, Text, Container } from 'pixi.js';
import { SceneManager } from '@/renderer/SceneManager';
import { RenderSystem } from '@/renderer/systems/RenderSystem';
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
        background: '#A1887F', // 明显的咖啡棕色
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      }).then(() => {
        if (cancelled) { app.destroy(true); return; }

        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        if (canvasWrapperRef.current) {
          canvasWrapperRef.current.appendChild(canvas);
        }

        // 画测试内容：地板网格
        drawTestScene(app);

        // 初始化场景管理器 + 渲染系统
        if (!sceneManager) sceneManager = new SceneManager();
        sceneManager.init(app);
        if (!renderSystem) renderSystem = new RenderSystem(sceneManager);
        renderSystem.init(app);
        eventBus.emit('renderer:ready', { sceneManager, renderSystem });

        setStatus('ready');
      }).catch(() => {
        if (!cancelled) setStatus('error');
      });
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

  return <div ref={canvasWrapperRef} style={{ width:'100%', height:'100%' }} />;
}

/** 测试场景：地板网格 + 吧台 */
function drawTestScene(app: Application) {
  const g = new Graphics();
  const floorColor = 0xD7CCC8;
  const lineColor = 0xBCAAA4;
  const gridSize = 64;
  const cols = Math.ceil(app.renderer.width / gridSize);
  const rows = Math.ceil(app.renderer.height / gridSize);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.rect(c * gridSize, r * gridSize, gridSize, gridSize);
      g.fill({ color: floorColor });
      g.rect(c * gridSize, r * gridSize, gridSize, gridSize);
      g.stroke({ color: lineColor, width: 1 });
    }
  }

  // 吧台
  g.roundRect(gridSize * 2, app.renderer.height / 2 - 30, gridSize * 3, 20, 4);
  g.fill({ color: 0x6D4C41 });
  g.roundRect(gridSize * 2, app.renderer.height / 2 - 30, gridSize * 3, 20, 4);
  g.stroke({ color: 0x3E2723, width: 2 });

  app.stage.addChild(g);

  // 文字
  const text = new Text({
    text: '☕ 暖阳镇咖啡厅',
    style: { fontSize: 18, fontFamily: 'PingFang SC, sans-serif', fill: 0x4E342E },
  });
  text.x = 20;
  text.y = 20;
  app.stage.addChild(text);
}
