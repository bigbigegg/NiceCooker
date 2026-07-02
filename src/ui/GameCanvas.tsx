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
 * 使用 ResizeObserver 手动处理画布尺寸（避免 PixiJS 8 resizeTo 的 _cancelResize bug）
 */
export function GameCanvas({ containerRef }: GameCanvasProps) {
  const appRef = useRef<Application | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || appRef.current) return;

    const app = new Application();
    appRef.current = app;

    app.init({
      width: container.clientWidth,
      height: container.clientHeight,
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

      // 手动监听容器尺寸变化
      const observer = new ResizeObserver(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        app.renderer.resize(w, h);
      });
      observer.observe(container);
      resizeObserverRef.current = observer;

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
      eventBus.emit('renderer:ready', { sceneManager, renderSystem });
    });

    return () => {
      // 停止 resize 监听
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

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

      // 销毁 PixiJS Application（PixiJS 8 resizeTo 有 _cancelResize bug，手动 resize 避开）
      try {
        app.destroy(true);
      } catch {
        // PixiJS 8 内部清理偶发异常，静默处理
      }
      appRef.current = null;
    };
  }, [containerRef]);

  return null;
}
