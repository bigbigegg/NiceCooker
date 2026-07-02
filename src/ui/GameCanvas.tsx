import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application } from 'pixi.js';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * PixiJS 画布
 *
 * 等待容器有有效尺寸后再初始化，并用 CSS 让 canvas 填满容器。
 */
export function GameCanvas({ containerRef }: GameCanvasProps) {
  const appRef = useRef<Application | null>(null);
  const [webglError, setWebglError] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || appRef.current) return;

    let cancelled = false;

    const tryInit = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) {
        // 容器尚未布局完成，等待下一帧
        if (!cancelled) requestAnimationFrame(tryInit);
        return;
      }

      const app = new Application();
      appRef.current = app;

      app.init({
        width: w,
        height: h,
        background: '#EFEBE9',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      }).then(() => {
        if (cancelled) { app.destroy(true); return; }

        // 挂载 canvas
        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        if (canvasWrapperRef.current) {
          canvasWrapperRef.current.appendChild(canvas);
        }
      }).catch(() => {
        if (!cancelled) setWebglError(true);
      });
    };

    // 延迟一帧确保容器已布局
    requestAnimationFrame(tryInit);

    return () => {
      cancelled = true;
      if (appRef.current) {
        try { appRef.current.destroy(true); } catch { /* PixiJS 8 */ }
        appRef.current = null;
      }
    };
  }, [containerRef]);

  if (webglError) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#8D6E63', fontSize: 14,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>☕</div>
          <p>WebGL 不可用，请使用支持 WebGL 的浏览器</p>
        </div>
      </div>
    );
  }

  return <div ref={canvasWrapperRef} style={{ width: '100%', height: '100%' }} />;
}
