/**

 * 示例demo

 * 方向键控制矩形移动，含多实体 AABB 碰撞测试

 * 使用 Config 单例读取 canvas / player 默认配置

 */

import { useEffect, useRef } from 'react';

import { Input } from "../../engine/core/io/io";

import { GameLoop } from "../../engine/core/loop/loop";

import { Renderer } from "../../engine/core/render/render";

import { Scene } from '../../engine/core/scene/scene';

import { Player } from '../../engine/core/entities/Player/player';

import { Config } from '../../engine/core/config/config';



const LOCAL_PLAYER_ID = 'local-player';



const OBSTACLES = [

  { id: 'obstacle-1', location: [200, 150] as [number, number], size: [120, 40] as [number, number] },

  { id: 'obstacle-2', location: [450, 300] as [number, number], size: [80, 160] as [number, number] },

  { id: 'obstacle-3', location: [150, 400] as [number, number], size: [200, 50] as [number, number] },

];



const Demo = () => {

  const gameLoopRef = useRef<GameLoop | null>(null);

  const rendererRef = useRef<Renderer | null>(null);

  const inputRef = useRef<Input | null>(null);

  const sceneRef = useRef<Scene | null>(null);



  useEffect(() => {

    const config = Config.getInstance();
    const playerConfig = config.get('player');



    inputRef.current = new Input();

    rendererRef.current = new Renderer('gameCanvas');

    gameLoopRef.current = new GameLoop();



    const gameLoop = gameLoopRef.current;

    const renderer = rendererRef.current;

    const input = inputRef.current;



    if (!gameLoop || !renderer || !input) {

      console.error("核心模块初始化失败，终止Demo启动");

      return;

    }



    const gameScene = new Scene(

      {

        id: "gameDemoScene",

        gameLoop,

        renderer,

        background: "#24E063"

      },

      {

        onActivate: (scene) => {

          const canvasSize = renderer.getSize();

          const [defaultW, defaultH] = playerConfig.defaultSize;



          OBSTACLES.forEach(({ id, location, size }) => {

            const obstacle = new Player({

              id,

              location,

              size,

              shape: "rect",

              background: "#DC2626",

              border: { width: 2, color: "#991B1B" },

            });

            scene.addEntity(obstacle);

          });



          const player = new Player({

            id: LOCAL_PLAYER_ID,

            speed: playerConfig.defaultSpeed,

            location: [

              (canvasSize.width - defaultW) / 2,

              (canvasSize.height - defaultH) / 2

            ],

            size: playerConfig.defaultSize,

            shape: "rect",

            background: "#1E293B",

            border: { width: 2, color: "#fff" },

            update: function (this: Player, deltaTime: number) {

              const size = renderer.getSize();

              const [playerW, playerH] = this.getSize();

              let [currentX, currentY] = this.getLocation();

              const speed = this.speed ?? 0;



              if (input.isKeyPressed('ArrowUp')) currentY -= speed * deltaTime;

              if (input.isKeyPressed('ArrowDown')) currentY += speed * deltaTime;

              if (input.isKeyPressed('ArrowLeft')) currentX -= speed * deltaTime;

              if (input.isKeyPressed('ArrowRight')) currentX += speed * deltaTime;



              currentX = Math.max(0, Math.min(size.width - playerW, currentX));

              currentY = Math.max(0, Math.min(size.height - playerH, currentY));



              this.setLocation(currentX, currentY);

            }

          });



          scene.addEntity(player);

          console.log(`[Demo] 本地玩家与 ${OBSTACLES.length} 个障碍物已添加，可通过方向键控制`);

        },

      }

    );



    sceneRef.current = gameScene;

    gameScene.activate();

    gameLoop.start();



    return () => {

      gameLoop.stop();

      sceneRef.current?.destroy();

      inputRef.current = null;

      rendererRef.current = null;

      gameLoopRef.current = null;

      sceneRef.current = null;

      console.log("[Demo] 组件卸载，所有资源已清理");

    };

  }, []);



  const config = Config.getInstance();

  const { width, height } = config.get('canvas');



  return (

    <>

      <canvas

        id="gameCanvas"

        width={width}

        height={height}

        style={{ border: '1px solid #000', display: 'block', margin: '20px auto' }}

      />

      <p style={{ textAlign: 'center', marginTop: 10 }}>

        使用方向键控制矩形移动，红色方块为静态障碍物（AABB 碰撞测试）

      </p>

    </>

  );

};



export { Demo };

