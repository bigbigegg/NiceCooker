import { useEffect, useRef, useState, type RefObject } from 'react';
import { Application } from 'pixi.js';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function GameCanvas({ containerRef }: GameCanvasProps) {
  const appRef = useRef<Application | null>(null);
  const [webglError, setWebglError] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    console.log('[GameCanvas] useEffect triggered, container:', container);
    console.log('[GameCanvas] container.clientWidth:', container?.clientWidth);
    console.log('[GameCanvas] container.clientHeight:', container?.clientHeight);

    if (!container || appRef.current) {
      console.log('[GameCanvas] skip — no container or already initialized');
      return;
    }

    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return;
      attemptRef.current++;
      const w = container.clientWidth;
      const h = container.clientHeight;
      console.log(`[GameCanvas] attempt #${attemptRef.current} — clientWidth=${w}, clientHeight=${h}`);

      if (w === 0 || h === 0) {
        console.log('[GameCanvas] container size is 0, waiting...');
        requestAnimationFrame(tryInit);
        return;
      }

      console.log(`[GameCanvas] ✓ container ready (${w}x${h}), creating PixiJS Application...`);

      const app = new Application();
      appRef.current = app;

      const initOptions = {
        width: w,
        height: h,
        background: '#EFEBE9',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      };
      console.log('[GameCanvas] app.init options:', initOptions);

      app.init(initOptions).then(() => {
        if (cancelled) {
          console.log('[GameCanvas] cancelled after init, destroying');
          app.destroy(true);
          return;
        }

        console.log('[GameCanvas] PixiJS init successful');
        console.log('[GameCanvas] app.renderer.width:', app.renderer.width);
        console.log('[GameCanvas] app.renderer.height:', app.renderer.height);
        console.log('[GameCanvas] app.canvas:', app.canvas);
        console.log('[GameCanvas] app.renderer.type:', app.renderer.type); // 1=WebGL, 2=Canvas

        const canvas = app.canvas as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        if (canvasWrapperRef.current) {
          canvasWrapperRef.current.appendChild(canvas);
          console.log('[GameCanvas] ✓ canvas appended to wrapper');
          console.log('[GameCanvas] wrapper.children:', canvasWrapperRef.current.children.length);
        } else {
          console.error('[GameCanvas] ✗ canvasWrapperRef is null!');
        }
      }).catch((err) => {
        console.error('[GameCanvas] ✗ app.init failed:', err);
        if (!cancelled) setWebglError(true);
      });
    };

    console.log('[GameCanvas] starting init loop...');
    requestAnimationFrame(tryInit);

    return () => {
      console.log('[GameCanvas] cleanup');
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

  return <div ref={canvasWrapperRef} style={{ width: '100%', height: '100%', background: '#EFEBE9' }} />;
}
