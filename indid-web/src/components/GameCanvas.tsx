/**
 * 可嵌入的游戏 Canvas 容器
 * 提供固定尺寸 canvas，便于 iframe 或 React 宿主挂载
 */
import { useEffect, useRef } from 'react';
import { Config } from '../../engine/core/config/config';

type GameCanvasProps = {
  id?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (canvas: HTMLCanvasElement) => void;
};

const GameCanvas = ({
  id = 'gameCanvas',
  width,
  height,
  className,
  style,
  onReady,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = Config.getInstance();
  const canvasConfig = config.get('canvas');
  const w = width ?? canvasConfig.width;
  const h = height ?? canvasConfig.height;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    onReady?.(canvas);
  }, [w, h, onReady]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={className}
      style={{ display: 'block', ...style }}
    />
  );
};

export { GameCanvas };
