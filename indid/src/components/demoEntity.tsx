/**
 * 示例demo
 * 方向键控制矩形移动（仅用Scene模块，轻量版）
 * 核心：复用Scene的实体托管、自动循环绑定，移除冗余SceneManager
 */
import { useEffect, useRef } from 'react';
import { Input } from "../../engine/core/io/io";
import { GameLoop } from "../../engine/core/loop/loop";
import { Renderer } from "../../engine/core/render/render";
import { Scene } from '../../engine/core/scene/scene'; // 仅导入Scene
import { Player } from '../../engine/core/entities/Player/player';

const Demo = (props: { client: any }) => {
  // 核心实例容器（仅保留必要模块，轻量管理）
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<Input | null>(null);
  const sceneRef = useRef<Scene | null>(null); // 直接存储Scene实例
  const playerIdRef = useRef<string | null>(null);

  const { client } = props;

  useEffect(() => {
    // ========== 1. 前置校验与初始化准备 ==========
    playerIdRef.current = client?.current?.id || "-1";
    if (!client?.current?.id) {
      console.warn("客户端实例或玩家ID未初始化，使用默认ID：-1");
    }

    // ========== 2. 创建全局核心基础设施（轻量初始化） ==========
    inputRef.current = new Input();
    rendererRef.current = new Renderer('gameCanvas');
    gameLoopRef.current = new GameLoop();

    const gameLoop = gameLoopRef.current;
    const renderer = rendererRef.current;
    const input = inputRef.current;
    const playerId = playerIdRef.current;

    if (!gameLoop || !renderer || !input) {
      console.error("核心模块初始化失败，终止Demo启动");
      return;
    }

    // ========== 3. 创建并初始化Scene实例（核心步骤） ==========
    const gameScene = new Scene(
      {
        id: "gameDemoScene", // 场景ID（仅用于标识，无需注册）
        gameLoop, // 传入游戏循环，自动绑定回调
        renderer, // 传入渲染器，自动调度渲染
        background: "#24E063" // 场景背景色（自动清屏）
      },
      {
        // 场景激活时：创建Player并添加到场景（实体托管）
        onActivate: (scene) => {
          const canvasSize = renderer.getSize();
          // 创建Player，update方法封装移动逻辑
          const player = new Player({
            id: playerId,
            speed: 200,
            location: [
              (canvasSize.width - 50) / 2, // 水平居中
              (canvasSize.height - 50) / 2 // 垂直居中
            ],
            size: [50, 50],
            shape: "rect",
            background: "#1E293B",
            border: { width: 2, color: "#fff" },
            // 核心：Player.update封装移动行为
            update: function (deltaTime:number) {
              const canvasSize = renderer.getSize();
              const [playerW, playerH] = this.getSize();
              let [currentX, currentY] = this.getLocation();

              // 方向键控制逻辑（通过Input模块获取按键状态）
              if (input.isKeyPressed('ArrowUp')) currentY -= this.speed * deltaTime;
              if (input.isKeyPressed('ArrowDown')) currentY += this.speed * deltaTime;
              if (input.isKeyPressed('ArrowLeft')) currentX -= this.speed * deltaTime;
              if (input.isKeyPressed('ArrowRight')) currentX += this.speed * deltaTime;

              // 边界限制：不超出画布范围
              currentX = Math.max(0, Math.min(canvasSize.width - playerW, currentX));
              currentY = Math.max(0, Math.min(canvasSize.height - playerH, currentY));

              // 安全更新位置（调用Player的set方法，带类型校验）
              this.setLocation(currentX, currentY);
            }
          });

          // 场景托管Player（内部实体池自动管理）
          scene.addEntity(player);
          console.log(`[Demo] 玩家${playerId}已添加到场景，可通过方向键控制`);
        },

        // 帧更新后：同步玩家状态到服务端（场景级逻辑分离）
        onUpdate: (scene) => {
          const player = scene.getEntity(playerId as string);
          if (player && client.current) {
            // 仅同步核心状态数据（避免传递完整实例）
            client.current.sendPlayerState({
              id: player.id,
              location: player.getLocation(),
              size: player.getSize(),
              timestamp: Date.now()
            });
          }
        }
      }
    );

    // 存储场景实例，用于后续清理
    sceneRef.current = gameScene;

    // ========== 4. 激活场景 + 启动游戏循环（简化流程） ==========
    gameScene.activate(); // 激活场景：自动绑定Loop的update/render回调
    gameLoop.start(); // 启动循环，触发帧更新和渲染

    // ========== 5. 组件卸载时：清理资源（Scene自动处理） ==========
    return () => {
      // 停止游戏循环
      gameLoop.stop();
      // 销毁场景：自动解绑Loop回调、清空实体池、释放资源
      sceneRef.current?.destroy();
      // 重置引用，避免内存泄漏
      playerIdRef.current = null;
      inputRef.current = null;
      rendererRef.current = null;
      gameLoopRef.current = null;
      sceneRef.current = null;
      console.log("[Demo] 组件卸载，所有资源已清理");
    };
  }, [client]);

  // 渲染Canvas（保持原UI结构）
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