/**
 * 示例demo
 * 方向键控制矩形移动
 */
import { useEffect, useRef } from 'react';
import { Input } from "../../engine/core/io/io";
import { GameLoop } from "../../engine/core/loop/loop";
import { Renderer } from "../../engine/core/render/render";
import { EntityPool } from '../../engine/core/entities/entitiesPool';
import { Player } from '../../engine/core/entities/Player/player';
import { PlayerStateType } from '../../engine/core/entities/Player/player.type';

const Demo = (props: { client: any }) => {
  // 创建实例容器
  const gameLoopRef = useRef<GameLoop | null>(null); // 循环实例容器
  const rendererRef = useRef<Renderer | null>(null); // 渲染实例容器
  const inputRef = useRef<Input | null>(null); // IO实例容器
  const entityPoolRef = useRef<EntityPool<Player> | null>(null); // 实体池实例容器
  const playerRef = useRef<PlayerStateType | null>(null); // 实体实例容器

  // 结构出客户端实例
  const { client } = props;

  // 用useEffect在组件挂载后初始化（确保Canvas已存在）
  useEffect(() => {
    // 初始化输入输出实例
    inputRef.current = new Input();

    // 初始化渲染实例
    rendererRef.current = new Renderer('gameCanvas'); // 自定义canvas id

    // 初始化游戏循环实例
    gameLoopRef.current = new GameLoop();

    // 初始化实体池实例
    entityPoolRef.current = new EntityPool();

    // 初始化实体实例（在画布中间）
    playerRef.current = new Player({
      speed: 200,
      id: client?.current?.id,
      // 从renderer的尺寸对象中获取宽高（width和height属性）
      location: [
        // x坐标：(画布宽度 - 玩家宽度) / 2
        (rendererRef.current.getSize().width - 1) / 2,
        // y坐标：(画布高度 - 玩家高度) / 2
        (rendererRef.current.getSize().height - 1) / 2
      ],
      size: [50, 50]
    });

    // 注册更新逻辑
    gameLoopRef.current.onUpdate((deltaTime) => {
      // 实例校验
      const renderer = rendererRef.current;
      const input = inputRef.current;
      const player = playerRef.current;
      if (!renderer || !input || !player) return;

      // 获取画布尺寸
      const { width: canvasWidth, height: canvasHeight } = renderer.getSize();

      // 移动逻辑
      // 移动逻辑（基于新Player类调整）
      if (player) { // 先判断玩家实例是否存在，避免空引用错误
        // 获取当前位置和尺寸（使用类提供的getter方法）
        let currentX = player.getX();
        let currentY = player.getY();
        const playerW = player.getW(); // 宽度
        const playerH = player.getH(); // 高度

        // 根据按键计算新位置
        if (input.isPressed('ArrowUp')) {
          currentY -= player.speed * deltaTime;
        }
        if (input.isPressed('ArrowDown')) {
          currentY += player.speed * deltaTime;
        }
        if (input.isPressed('ArrowLeft')) {
          currentX -= player.speed * deltaTime;
        }
        if (input.isPressed('ArrowRight')) {
          currentX += player.speed * deltaTime;
        }

        // 边界限制（确保玩家不会超出画布范围）
        const limitedX = Math.max(0, Math.min(canvasWidth - playerW, currentX));
        const limitedY = Math.max(0, Math.min(canvasHeight - playerH, currentY));

        // 使用类提供的setter方法设置新位置（确保状态修改符合类的设计规范）
        player.setLocation(limitedX, limitedY);
      }

      client.current?.sendPlayerState(player);

    });

    // 5. 注册渲染逻辑
    gameLoopRef.current.onRender(() => {
      const renderer = rendererRef.current;
      const player = playerRef.current;
      if (!renderer || !player) return;

      renderer.clear('#24E063'); // 清屏
      renderer.drawEntity(player); // 绘制实例
    });

    // 启动循环
    gameLoopRef.current.start();

    // 组件卸载时停止循环
    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
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