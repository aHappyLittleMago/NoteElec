# 场景模块（Scene Module）

## 一、模块概述
场景模块是2D游戏引擎的**核心基础模块**，定位为「游戏世界的独立容器」，用于封装单个游戏单元（如关卡、主菜单、结算界面）的所有资源与逻辑。

### 核心定位
- 统一管理场景内的实体（玩家、道具等）、更新逻辑、渲染逻辑；
- 实现场景生命周期的完整管控（激活/销毁），支持场景间无缝切换；
- 作为游戏循环（GameLoop）与实体（Player）的中间调度层，解耦全局循环与具体游戏内容。

### 依赖模块
需依赖以下4个核心模块（外部传入或自动创建），无额外冗余依赖：
| 依赖模块       | 作用                                                                 |
|----------------|----------------------------------------------------------------------|
| `GameLoop`     | 全局游戏循环实例，提供帧更新/渲染回调注册，确保整个游戏唯一“心跳”。   |
| `Renderer`     | 全局渲染实例，负责Canvas绘制（清屏、实体绘制），共享画布资源。        |
| `EntityPool`   | 实体池模块，场景内自动创建专属实例，实现实体的托管与隔离。            |
| `Player`       | 实体类（当前仅支持Player，后续可扩展为Entity基类），需实现`update`方法。 |

### 核心价值
- 低耦合：通过依赖注入（外部传入Loop/Renderer）避免模块强绑定，支持全局资源复用；
- 高内聚：场景内实体、更新、渲染逻辑统一管控，避免分散管理导致的混乱；
- 可扩展：通过生命周期钩子支持自定义逻辑，兼容后续功能扩展（如相机、碰撞、UI）。

## 二、核心功能实现
模块的核心能力围绕「场景生命周期管理」「实体调度」「更新/渲染联动」展开，以下是关键功能的实现逻辑：

### 1. 生命周期管理（激活/销毁）
核心目标：确保场景仅在激活状态下参与游戏循环，销毁时彻底释放资源。
- **激活（activate）**：
  1. 校验场景状态，避免重复激活；
  2. 向GameLoop注册`update`（更新）和`render`（渲染）回调，接入全局循环；
  3. 标记`isActive`为`true`，触发`onActivate`钩子（用于初始化实体/资源）。
- **销毁（destroy）**：
  1. 校验场景状态，避免重复销毁；
  2. 解绑GameLoop的更新/渲染回调，防止回调残留导致内存泄漏；
  3. 清空场景专属实体池（调用实体池`destroy`方法）；
  4. 标记`isActive`为`false`，触发`onDestroy`钩子（用于清理自定义资源）。

### 2. 实体统一托管
核心目标：实现同一场景内实体的集中管理，不同场景实体隔离。
- 场景初始化时自动创建专属`EntityPool`实例，避免跨场景实体干扰；
- 提供`addEntity`/`removeEntity`/`getEntity`方法，代理实体池的核心操作，简化外部调用；
- 实体的更新、渲染由场景统一调度，外部无需直接操作实体池。

### 3. 帧更新调度
核心目标：按帧触发场景内所有实体的更新逻辑，同时支持自定义场景逻辑。
- 游戏循环按帧调用场景`update`方法（通过注册的回调）；
- 内部逻辑：
  1. 校验场景激活状态，未激活则跳过；
  2. 遍历场景专属实体池，调用每个实体的`update`方法（需实体实现该方法）；
  3. 触发`onUpdate`钩子，执行自定义场景逻辑（如关卡倒计时、事件触发）。

### 4. 渲染调度
核心目标：按帧完成场景绘制，确保渲染逻辑与更新逻辑同步。
- 游戏循环按帧调用场景`render`方法（通过注册的回调）；
- 内部逻辑：
  1. 校验场景激活状态，未激活则跳过；
  2. 调用Renderer的`clear`方法，使用场景背景色清屏；
  3. 遍历场景专属实体池，调用Renderer的`drawEntity`方法绘制所有实体；
  4. 触发`onRender`钩子，执行自定义渲染逻辑（如UI、文字提示）。

### 5. 场景切换（SceneManager）
核心目标：通过单例管理器实现多场景的注册与切换，确保切换过程无冲突。
- 单例模式：全局仅一个`SceneManager`实例，避免多管理器混乱；
- 场景注册：通过`registerScene`方法存储场景实例，禁止重复注册同一ID的场景；
- 场景切换：通过`switchScene`方法销毁当前激活场景、激活目标场景，确保切换无缝衔接。

## 三、基础用法
以下是场景模块的完整使用流程，包含依赖初始化、场景创建、切换、启动循环等核心步骤：

### 1. 前置准备：补充Player模块的update方法
场景的更新调度依赖实体的`update`方法，需在`Player`类中实现：
```typescript
// Player.ts
export class Player {
  id: string;
  location: [number, number]; // 实体位置（世界坐标）
  speed: number; // 移动速度（像素/秒）
  size: [number, number]; // 实体尺寸

  constructor(options: {
    id: string;
    location: [number, number];
    speed: number;
    size: [number, number];
  }) {
    this.id = options.id;
    this.location = options.location;
    this.speed = options.speed;
    this.size = options.size;
  }

  /** 实体专属更新逻辑（由场景调度） */
  update(deltaTime: number): void {
    // 示例：水平移动（可替换为输入控制、AI逻辑等）
    this.location[0] += this.speed * deltaTime;
  }
}
```

### 2. 核心步骤：初始化与使用场景
```typescript
// 1. 导入依赖模块
import { GameLoop } from "../loop/loop";
import { Renderer } from "../render/render";
import { Scene, SceneManager } from "./scene";
import { Player } from "../entities/Player/player";

// 2. 初始化全局核心依赖（GameLoop + Renderer）
const gameLoop = new GameLoop(); // 全局唯一循环实例
const renderer = new Renderer("gameCanvas"); // 绑定页面Canvas（id为gameCanvas）

// 3. 创建场景实例（以关卡1为例）
const level1Scene = new Scene(
  // 场景配置
  {
    id: "level1", // 场景唯一ID（不可重复）
    gameLoop: gameLoop, // 传入全局循环实例
    renderer: renderer, // 传入全局渲染实例
    background: "#1E293B" // 自定义背景色（默认 #24E063）
  },
  // 生命周期钩子（可选，用于扩展逻辑）
  {
    // 场景激活时触发：初始化实体
    onActivate: (scene) => {
      console.log("[Level1] 场景激活，初始化玩家实体");
      const player = new Player({
        id: "player_001", // 实体唯一ID
        location: [400, 300], // 初始位置（画布中心）
        speed: 200, // 移动速度
        size: [50, 50] // 实体尺寸
      });
      scene.addEntity(player); // 添加实体到场景
    },

    // 帧更新时触发：自定义场景逻辑
    onUpdate: (scene, deltaTime) => {
      const player = scene.getEntity("player_001");
      if (player && player.location[0] > 800) {
        console.log("[Level1] 玩家到达右边界！");
      }
    },

    // 帧渲染时触发：自定义渲染逻辑
    onRender: (scene) => {
      // 绘制场景文字提示（需Renderer支持drawText方法）
      scene.renderer.drawText?.({
        text: "关卡1：移动到右边界",
        location: [20, 30],
        color: "#ffffff",
        fontSize: 16
      });
    },

    // 场景销毁时触发：清理资源
    onDestroy: () => {
      console.log("[Level1] 场景销毁");
    }
  }
);

// 4. 注册场景并切换
const sceneManager = SceneManager.getInstance();
sceneManager.registerScene(level1Scene); // 注册场景到管理器
sceneManager.switchScene("level1"); // 切换到level1场景

// 5. 启动游戏循环（最后执行，启动全局“心跳”）
gameLoop.start();
```

### 3. 扩展用法：场景切换示例
创建主菜单场景，实现“主菜单→关卡1”的切换：
```typescript
// 创建主菜单场景
const menuScene = new Scene(
  {
    id: "menu",
    gameLoop: gameLoop,
    renderer: renderer,
    background: "#0F172A"
  },
  {
    onActivate: (scene) => {
      console.log("[Menu] 主菜单场景激活，3秒后自动进入关卡1");
      // 模拟3秒后切换场景
      setTimeout(() => {
        sceneManager.switchScene("level1");
      }, 3000);
    }
  }
);

// 注册并切换到主菜单场景
sceneManager.registerScene(menuScene);
sceneManager.switchScene("menu");
```

### 关键API调用说明
| 操作目标         | 调用代码示例                                  | 说明                                                                 |
|------------------|-----------------------------------------------|----------------------------------------------------------------------|
| 创建场景         | `new Scene(config, hooks)`                    | 传入场景配置和生命周期钩子，返回场景实例。                           |
| 添加实体         | `scene.addEntity(player)`                     | 向场景添加Player实例，需保证实体ID唯一。                             |
| 查询实体         | `scene.getEntity("player_001")`               | 按ID查询场景内的实体，返回Player实例或undefined。                    |
| 移除实体         | `scene.removeEntity("player_001")`            | 按ID从场景移除实体，同时从实体池删除。                               |
| 注册场景         | `sceneManager.registerScene(scene)`           | 将场景实例注册到管理器，不可重复注册同一ID。                         |
| 切换场景         | `sceneManager.switchScene("level1")`          | 销毁当前场景，激活目标场景，需先注册目标场景。                       |
| 获取当前场景     | `sceneManager.getCurrentScene()`              | 返回当前激活的场景实例，未激活时返回null。                           |