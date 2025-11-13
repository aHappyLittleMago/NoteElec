import { useEffect, useRef } from 'react'; // 引入React钩子
import { Input } from "../../engine/io";
import { GameLoop } from "../../engine/loop";
import { Renderer } from "../../engine/render";

const Demo = () => {
  // 用useRef保存模块实例，避免重渲染时重复创建
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<Input | null>(null);
  const playerRef = useRef({
    x: 400,
    y: 300,
    width: 50,
    height: 50,
    speed: 200,
    color: '#4a90e2'
  });

  // 用useEffect在组件挂载后初始化（确保Canvas已存在）
  useEffect(() => {
    // 1. 初始化输入模块（无DOM依赖，可直接创建）
    const input = new Input();
    inputRef.current = input;

    // 2. 获取已挂载的Canvas元素，初始化渲染器
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas元素未找到');
      return;
    }
    const renderer = new Renderer('gameCanvas'); // 此时Canvas已在DOM中
    rendererRef.current = renderer;

    // 3. 初始化游戏循环
    const gameLoop = new GameLoop();
    gameLoopRef.current = gameLoop;

    // 4. 注册更新逻辑
    gameLoop.onUpdate((deltaTime) => {
      const renderer = rendererRef.current;
      const input = inputRef.current;
      const player = playerRef.current;
      if (!renderer || !input || !player) return;

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

      renderer.clear('#24E063');
      renderer.drawEntity(player);
    });

    // 6. 启动循环
    gameLoop.start();

    // 组件卸载时停止循环，避免内存泄漏
    return () => {
      gameLoop.stop();
    };
  }, []); // 空依赖数组：只在组件挂载时执行一次

  // 返回Canvas元素（确保id正确）
  return (
    <canvas 
      id="gameCanvas" 
      width="800" 
      height="600" 
      style={{ border: '1px solid #000' }} // 加边框方便观察
    />
  );
};

export { Demo };