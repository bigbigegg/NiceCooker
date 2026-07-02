import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application } from 'pixi.js';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * PixiJS 画布 — 简化版
 * 使用 fixed size，避免 resize 问题
 */
export function GameCanvas({ containerRef }: GameCanvasProps) {
  const appRef = useRef<Application | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || appRef.current) return;

    let cancelled = false;

    const initPixi = async () => {
      try {
        const app = new Application();
        await app.init({
          width: container.clientWidth || 800,
          height: container.clientHeight || 600,
          background: '#EFEBE9',
          antialias: false,
          resolution: 1,
        });

        if (cancelled) {
          app.destroy(true);
          return;
        }

        appRef.current = app;
        container.appendChild(app.canvas as HTMLCanvasElement);
        (app.canvas as HTMLCanvasElement).style.display = 'block';
      } catch {
        setWebglError(true);
      }
    };

    initPixi();

    return () => {
      cancelled = true;
      if (appRef.current) {
        try { appRef.current.destroy(true); } catch { /* PixiJS 8 清理异常 */ }
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

  return null;
}
