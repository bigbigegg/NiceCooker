import { useEffect, useRef, type RefObject } from 'react';
import { Application } from 'pixi.js';
import { SceneManager } from '@/renderer/SceneManager';
import { RenderSystem } from '@/renderer/systems/RenderSystem';
import { eventBus } from '@/core/EventBus';

interface GameCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

/** 全局场景管理器实例（供其他模块引用） */
export let sceneManager: SceneManager | null = null;

/** 全局渲染系统实例（供其他模块引用） */
export let renderSystem: RenderSystem | null = null;

/**
 * PixiJS 画布挂载点
 *
 * 将 PixiJS Application 挂载到 DOM 容器中，
 * 初始化 SceneManager 和 RenderSystem，并通过 eventBus 通知就绪。
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
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';

      // 初始化场景管理器
      if (!sceneManager) {
        sceneManager = new SceneManager();
      }
      sceneManager.init(app);

      // 初始化渲染系统
      if (!renderSystem) {
        renderSystem = new RenderSystem(sceneManager);
      }
      renderSystem.init(app);

      // 通过事件总线通知渲染系统已就绪
      eventBus.emit('renderer:ready', {
        sceneManager,
        renderSystem,
      });
    });

    return () => {
      // 清理渲染系统
      if (renderSystem) {
        renderSystem.destroy();
        renderSystem = null;
      }

      // 清理场景管理器
      if (sceneManager) {
        sceneManager.destroy();
        sceneManager = null;
      }

      // 销毁 PixiJS Application
      app.destroy(true);
      appRef.current = null;
    };
  }, [containerRef]);

  return null;
}
