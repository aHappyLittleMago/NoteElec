/**
 * 示例demo
 * 方向键控制矩形移动
 * 符合实体池最佳实践：Player实例由实体池统一托管、查询、管理
 */
import { useEffect, useRef } from 'react';
import { Input } from "../../engine/core/io/io";
import { GameLoop } from "../../engine/core/loop/loop";
import { Renderer } from "../../engine/core/render/render";
import { EntityPool } from '../../engine/core/entities/pool/entitiesPool';
import { Player } from '../../engine/core/entities/Player/player';

const Demo = (props: { client: any }) => {
  // 创建实例容器
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<Input | null>(null);
  const entityPoolRef = useRef<EntityPool | null>(null);
  // 存储玩家ID（替代原playerRef，仅保留ID用于从实体池查询）
  const playerIdRef = useRef<string | null>(null);
  // 存储回调移除函数
  const removeUpdateCallbackRef = useRef<(() => void) | null>(null);
  const removeRenderCallbackRef = useRef<(() => void) | null>(null);

  const { client } = props;

  useEffect(() => {
    // ========== 核心校验：确保client和玩家ID存在 ==========
    if (!client?.current?.id) {
      console.warn("客户端实例或玩家ID未初始化");
      playerIdRef.current = "-1";
    } else {
      const playerId = client.current.id;
      playerIdRef.current = playerId;
    }


    // ========== 初始化核心引擎实例 ==========
    inputRef.current = new Input();
    rendererRef.current = new Renderer('gameCanvas');
    gameLoopRef.current = new GameLoop();

    // ========== 初始化实体池（添加生命周期钩子，便于调试） ==========
    entityPoolRef.current = new EntityPool({
      onAdd: (entity) => console.log(`[实体池] 玩家${entity.id}已托管`),
      onRemove: (entity) => console.log(`[实体池] 玩家${entity.id}已取消托管`),
      onClear: () => console.log(`[实体池] 已清空所有托管实体`)
    });

    const renderer = rendererRef.current;
    const canvasSize = renderer.getSize();

    // ========== 创建Player实例并添加到实体池（核心：托管） ==========
    const player = new Player({
      speed: 200,
      id: playerIdRef.current, // 用客户端ID作为玩家唯一标识
      location: [
        (canvasSize.width - 50) / 2, // 画布水平居中
        (canvasSize.height - 50) / 2 // 画布垂直居中
      ],
      size: [50, 50], // 宽50，高50
      shape: "rect" // 显式指定形状为矩形（匹配渲染逻辑）
    });
    // 将Player实例添加到实体池，完成托管
    entityPoolRef.current.add(player);

    // ========== 注册游戏循环更新回调（从实体池获取Player） ==========
    const gameLoop = gameLoopRef.current;
    if (gameLoop) {
      removeUpdateCallbackRef.current = gameLoop.addUpdateCallback((deltaTime) => {
        // 前置校验：核心实例是否存在
        const currentRenderer = rendererRef.current;
        const currentInput = inputRef.current;
        const currentEntityPool = entityPoolRef.current;
        if (!currentRenderer || !currentInput || !currentEntityPool || !playerIdRef.current) return;

        // ========== 从实体池获取托管的Player实例（核心） ==========
        const player = currentEntityPool.get(playerIdRef.current);
        if (!player) {
          console.warn(`[更新逻辑] 未从实体池找到玩家${playerIdRef.current}`);
          return;
        }

        // 获取画布尺寸
        const { width: canvasWidth, height: canvasHeight } = currentRenderer.getSize();
        // 玩家尺寸
        const playerW = player.getW();
        const playerH = player.getH();
        // 当前坐标
        let currentX = player.getX();
        let currentY = player.getY();

        // 方向键移动逻辑
        if (currentInput.isKeyPressed('ArrowUp')) currentY -= player.speed * deltaTime;
        if (currentInput.isKeyPressed('ArrowDown')) currentY += player.speed * deltaTime;
        if (currentInput.isKeyPressed('ArrowLeft')) currentX -= player.speed * deltaTime;
        if (currentInput.isKeyPressed('ArrowRight')) currentX += player.speed * deltaTime;

        // 边界限制：防止玩家超出画布
        const limitedX = Math.max(0, Math.min(canvasWidth - playerW, currentX));
        const limitedY = Math.max(0, Math.min(canvasHeight - playerH, currentY));

        // 通过Player自身方法更新坐标（符合实体池纯托管原则）
        player.setLocation(limitedX, limitedY);

        // 发送玩家状态到服务端(仅当连接有效时)
        client.current&&client.current.sendPlayerState({ ...player, id: playerIdRef.current });
      });
    }

    // ========== 注册游戏循环渲染回调（从实体池获取Player） ==========
    if (gameLoop) {
      removeRenderCallbackRef.current = gameLoop.addRenderCallback(() => {
        const currentRenderer = rendererRef.current;
        const currentEntityPool = entityPoolRef.current;
        if (!currentRenderer || !currentEntityPool || !playerIdRef.current) return;

        // 从实体池获取Player实例
        const player = currentEntityPool.get(playerIdRef.current);
        if (!player) {
          console.warn(`[渲染逻辑] 未从实体池找到玩家${playerIdRef.current}`);
          return;
        }

        // 清屏并绘制玩家
        currentRenderer.clear('#24E063');
        currentRenderer.drawEntity(player);
      });
    }

    // 启动游戏循环
    gameLoop.start();

    // ========== 组件卸载时的清理逻辑（符合实体池最佳实践） ==========
    return () => {
      // 移除循环回调，避免内存泄漏
      removeUpdateCallbackRef.current?.();
      removeRenderCallbackRef.current?.();
      // 停止游戏循环
      gameLoopRef.current?.stop();
      // 清空实体池（取消所有实体托管，触发onClear钩子）
      entityPoolRef.current?.clear();
      // 若实体池提供destroy方法，可调用彻底销毁（新版实体池新增）
      // entityPoolRef.current?.destroy();
      // 重置ref
      playerIdRef.current = null;
      inputRef.current = null;
      rendererRef.current = null;
      entityPoolRef.current = null;
      gameLoopRef.current = null;
    };
  }, [client]); // 依赖client，确保client更新时重新初始化

  // 渲染Canvas
  return (
    <>
      <canvas
        id="gameCanvas"
        width="800"
        height="600"
        style={{ border: '1px solid #000', display: 'block', margin: '20px auto' }}
      />
      <p style={{ textAlign: 'center', marginTop: 10 }}>使用方向键控制矩形移动</p>
    </>
  );
};

export { Demo };