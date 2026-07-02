import { useEffect, useRef, type RefObject } from 'react';
import { Application } from 'pixi.js';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * PixiJS 画布挂载点
 *
 * 将 PixiJS Application 挂载到 DOM 容器中，
 * 后续由 SceneManager 管理场景内容。
 */
export function GameCanvas({ containerRef }: GameCanvasProps) {
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || appRef.current) return;

    const app = new Application();
    appRef.current = app;

    app.init({
      resizeTo: container,
      background: '#EFEBE9',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      container.appendChild(app.canvas as HTMLCanvasElement);
      app.canvas.style.position = 'absolute';
      app.canvas.style.top = '0';
      app.canvas.style.left = '0';
    });

    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, [containerRef]);

  return null;
}
