/**
 * 示例demo
 * 方向键控制矩形移动
 */
import { useEffect, useRef } from 'react'; // 引入React钩子
import { Input } from "../../engine/io";
import { GameLoop } from "../../engine/loop";
import { Renderer } from "../../engine/render";
import { ServerModule } from './startServer';

const Demo = () => {
    // 创建实例容器
  const gameLoopRef = useRef<GameLoop | null>(null); // 游戏循环
  const rendererRef = useRef<Renderer | null>(null); // 渲染函数
  const inputRef = useRef<Input | null>(null); // 输入输出函数
  const playerRef = useRef({ // 定义player实例
    x: 400,
    y: 300,
    width: 50,
    height: 50,
    speed: 200,
    color: '#4a90e2'
  });

  // 用useEffect在组件挂载后初始化（确保Canvas已存在）
  useEffect(() => {
    // 初始化输入输出实例
    const input = new Input();
    inputRef.current = input;

    // 获取已挂载的Canvas元素
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas元素未找到');
      return;
    }
    // 初始化渲染实例
    const renderer = new Renderer('gameCanvas');
    rendererRef.current = renderer;

    // 初始化游戏循环实例
    const gameLoop = new GameLoop();
    gameLoopRef.current = gameLoop;

    // 注册更新逻辑
    gameLoop.onUpdate((deltaTime) => {
      const renderer = rendererRef.current;
      const input = inputRef.current;
      const player = playerRef.current;
      if (!renderer || !input || !player) return;

      // 获取画布尺寸
      const { width: canvasWidth, height: canvasHeight } = renderer.getSize();
      // 移动逻辑
      if (input.isPressed('ArrowUp')) player.y -= player.speed * deltaTime;
      if (input.isPressed('ArrowDown')) player.y += player.speed * deltaTime;
      if (input.isPressed('ArrowLeft')) player.x -= player.speed * deltaTime;
      if (input.isPressed('ArrowRight')) player.x += player.speed * deltaTime;
      // 边界限制
      player.x = Math.max(0, Math.min(canvasWidth - player.width, player.x));
      player.y = Math.max(0, Math.min(canvasHeight - player.height, player.y));
    });

    // 5. 注册渲染逻辑
    gameLoop.onRender(() => {
      const renderer = rendererRef.current;
      const player = playerRef.current;
      if (!renderer || !player) return;

      renderer.clear('#24E063'); // 清屏
      renderer.drawEntity(player); // 绘制实例
    });

    // 启动循环
    gameLoop.start();

    // 组件卸载时停止循环
    return () => {
      gameLoop.stop();
    };
  }, []);

  // 返回Canvas元素
  return (
    <>
    <canvas 
      id="gameCanvas" 
      width="800" 
      height="600" 
      style={{ border: '1px solid #000' }}
    /></>
    
  );
};

export { Demo };