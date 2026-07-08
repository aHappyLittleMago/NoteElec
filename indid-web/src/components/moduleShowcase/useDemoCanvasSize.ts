import { useEffect, useState, type RefObject } from 'react';
import {
  computeDemoCanvasSize,
  DEMO_CANVAS_DEFAULT,
} from './demoLayout';

/** 监听演示区容器尺寸，返回 16:9 画布像素大小 */
function useDemoCanvasSize(containerRef: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(DEMO_CANVAS_DEFAULT);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const { width, height } = computeDemoCanvasSize(
        element.clientWidth,
        element.clientHeight
      );
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);

  return size;
}

export { useDemoCanvasSize };
