import { GameLoop } from "../loop/loop";
import { Renderer } from "../render/render";
import { EntityPool } from "../entities/pool/entitiesPool";
import { Player } from "../entities/Player/player";

// 场景配置类型（仅依赖现有模块）
export type SceneConfig = {
  id: string; // 场景唯一标识（如 "level1"、"menu"）
  gameLoop: GameLoop; // 游戏循环实例（外部传入，避免场景内部创建）
  renderer: Renderer; // 渲染实例（外部传入，共享画布）
  background?: string; // 场景背景色（默认 #24E063）
};

// 场景生命周期钩子（支持自定义扩展逻辑）
export type SceneHooks = {
  onActivate?: (scene: Scene) => void; // 场景激活时触发
  onUpdate?: (scene: Scene, deltaTime: number) => void; // 帧更新时触发（自定义场景逻辑）
  onRender?: (scene: Scene) => void; // 渲染时触发（自定义渲染逻辑）
  onDestroy?: (scene: Scene) => void; // 场景销毁时触发
};

/**
 * 基础场景模块（仅依赖现有4个模块）
 * 核心功能：
 * 1. 场景生命周期管理（激活/销毁）
 * 2. 实体统一托管（通过场景专属实体池）
 * 3. 帧更新/渲染调度（联动GameLoop和Renderer）
 * 4. 最小化耦合，预留扩展接口
 */
export class Scene {
  public readonly id: string;
  public readonly entityPool: EntityPool; // 场景专属实体池（隔离不同场景实体）
  public readonly gameLoop: GameLoop;
  public readonly renderer: Renderer;
  public readonly background: string;
  private readonly hooks: SceneHooks;
  private isActive = false; // 场景是否激活
  // 存储GameLoop回调的移除函数（用于销毁时清理）
  private removeUpdateCallback?: () => void;
  private removeRenderCallback?: () => void;

  constructor(config: SceneConfig, hooks: SceneHooks = {}) {
    this.id = config.id;
    this.gameLoop = config.gameLoop;
    this.renderer = config.renderer;
    this.background = config.background || "#24E063";
    this.hooks = hooks;

    // 初始化场景专属实体池（核心：实体托管隔离）
    this.entityPool = new EntityPool();
  }

  /**
   * 添加实体到场景（代理实体池的add方法）
   * @param player 玩家实体（现有仅支持Player，后续可扩展为Entity基类）
   */
  addEntity(player: Player): void {
    if (!player.id) throw new Error(`[Scene] 实体ID不能为空`);
    this.entityPool.add(player);
    console.log(`[Scene-${this.id}] 实体${player.id}已添加到场景`);
  }

  /**
   * 从场景移除实体（代理实体池的remove方法）
   * @param playerId 实体ID
   */
  removeEntity(playerId: string): void {
    this.entityPool.remove(playerId);
    console.log(`[Scene-${this.id}] 实体${playerId}已从场景移除`);
  }

  /**
   * 从场景获取实体（代理实体池的get方法）
   * @param playerId 实体ID
   */
  getEntity(playerId: string): Player | undefined {
    return this.entityPool.get(playerId);
  }

  /**
   * 激活场景（核心：绑定GameLoop的更新/渲染回调）
   * 激活后场景才会参与游戏循环
   */
  activate(): void {
    if (this.isActive) {
      console.warn(`[Scene-${this.id}] 已处于激活状态，无需重复激活`);
      return;
    }

    // 1. 注册帧更新回调（联动GameLoop，遍历实体更新）
    this.removeUpdateCallback = this.gameLoop.addUpdateCallback((deltaTime) => {
      this.update(deltaTime);
    });

    // 2. 注册渲染回调（联动GameLoop+Renderer，遍历实体渲染）
    this.removeRenderCallback = this.gameLoop.addRenderCallback(() => {
      this.render();
    });

    // 3. 标记激活状态，触发钩子
    this.isActive = true;
    this.hooks.onActivate?.(this);
    console.log(`[Scene-${this.id}] 已激活`);
  }

  /**
   * 销毁场景（核心：清理资源，避免内存泄漏）
   * 切换场景时必须调用，释放实体池和GameLoop回调
   */
  destroy(): void {
    if (!this.isActive) {
      console.warn(`[Scene-${this.id}] 已处于未激活状态，无需重复销毁`);
      return;
    }

    // 1. 移除GameLoop回调（关键：避免回调残留导致内存泄漏）
    this.removeUpdateCallback?.();
    this.removeRenderCallback?.();

    // 2. 清空场景专属实体池（销毁所有托管实体）
    this.entityPool.destroy((player) => {
      console.log(`[Scene-${this.id}] 实体${player.id}已销毁`);
      // 若Player有destroy方法，可在此调用：player.destroy?.()
    });

    // 3. 标记未激活状态，触发钩子
    this.isActive = false;
    this.hooks.onDestroy?.(this);
    console.log(`[Scene-${this.id}] 已销毁`);
  }

  /**
   * 场景帧更新（内部方法，由GameLoop回调触发）
   * 核心逻辑：遍历实体调用update方法 + 执行自定义场景更新逻辑
   * @param deltaTime 帧间隔时间（秒）
   */
  private update(deltaTime: number): void {
    if (!this.isActive) return;

    // 1. 遍历场景内所有实体，调用实体自身的update方法（核心调度）
    this.entityPool.forEach((player) => {
      // 确保Player有update方法（现有Player需扩展update接口）
      if (typeof player.update === "function") {
        player.update(deltaTime);
      }
    });

    // 2. 执行自定义场景更新逻辑（如关卡倒计时、场景事件）
    this.hooks.onUpdate?.(this, deltaTime);
  }

  /**
   * 场景渲染（内部方法，由GameLoop回调触发）
   * 核心逻辑：清屏 + 遍历实体渲染 + 执行自定义渲染逻辑
   */
  private render(): void {
    if (!this.isActive) return;

    // 1. 清屏（使用场景背景色）
    this.renderer.clear(this.background);

    // 2. 遍历场景内所有实体，调用Renderer绘制
    this.entityPool.forEach((player) => {
      this.renderer.drawEntity(player);
    });

    // 3. 执行自定义渲染逻辑（如场景UI、文字提示，现有无UI模块暂留接口）
    this.hooks.onRender?.(this);
  }
}

/**
 * 场景管理器（简化版，用于场景注册和切换）
 * 后续可扩展：加载动画、场景过渡、多场景管理
 */
export class SceneManager {
  private static instance: SceneManager;
  private scenes = new Map<string, Scene>(); // 存储已注册的场景
  private currentScene: Scene | null = null; // 当前激活的场景

  private constructor() {}

  /** 单例模式：获取场景管理器实例 */
  public static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  /**
   * 注册场景到管理器
   * @param scene 场景实例
   */
  registerScene(scene: Scene): void {
    if (this.scenes.has(scene.id)) {
      throw new Error(`[SceneManager] 场景${scene.id}已注册，不可重复注册`);
    }
    this.scenes.set(scene.id, scene);
    console.log(`[SceneManager] 场景${scene.id}已注册`);
  }

  /**
   * 切换场景（核心：销毁当前场景，激活目标场景）
   * @param sceneId 目标场景ID
   */
  switchScene(sceneId: string): void {
    const targetScene = this.scenes.get(sceneId);
    if (!targetScene) {
      throw new Error(`[SceneManager] 场景${sceneId}未注册，无法切换`);
    }

    // 1. 销毁当前激活的场景
    if (this.currentScene) {
      console.log(`[SceneManager] 正在切换场景：${this.currentScene.id} → ${sceneId}`);
      this.currentScene.destroy();
    }

    // 2. 激活目标场景
    this.currentScene = targetScene;
    this.currentScene.activate();
    console.log(`[SceneManager] 场景切换完成，当前激活场景：${sceneId}`);
  }

  /** 获取当前激活的场景 */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }
}