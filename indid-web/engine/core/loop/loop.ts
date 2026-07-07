/**
 * 游戏循环管理器
 * 负责协调游戏逻辑更新与渲染，支持帧率控制、暂停/继续、多回调管理等功能
 */

type UpdateCallback = (deltaTime: number) => void;
type RenderCallback = () => void;
type ErrorHandler = (error: Error) => void;


class GameLoop {
  // 核心状态控制
  private isRunning: boolean = false; // 循环是否处于运行状态
  private isPaused: boolean = false; // 循环是否处于暂停状态
  private lastTime: number = 0; // 上一帧时间戳（毫秒）
  private pauseStartTime: number = 0; // 暂停开始时间（用于恢复时修正时间差）

  // 帧率控制
  private maxFps: number | null = null; // 最大帧率限制（null表示不限制）
  private frameInterval: number = 0; // 基于最大帧率的每帧最小间隔（毫秒）

  // 回调管理（支持多个回调函数）
  private updateCallbacks: Array<(deltaTime: number) => void> = []; // 逻辑更新回调队列
  private renderCallbacks: Array<() => void> = []; // 渲染回调队列
  private errorCallback?: (error: Error) => void; // 错误处理回调

  // 性能监控
  private frameCount: number = 0; // 帧率计算用的帧数统计
  private lastFpsUpdate: number = 0; // 上一次更新FPS的时间戳
  public currentFps: number = 0; // 当前实时帧率（每秒更新一次）

  /**
   * 启动游戏循环
   * @param immediate 是否立即执行第一帧（默认true）
   */
  start(immediate: boolean = true): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.frameCount = 0;
    this.currentFps = 0;

    // 立即执行第一帧或等待下一帧
    if (immediate) {
      this.#loop(this.lastTime);
    } else {
      requestAnimationFrame((t) => this.#loop(t));
    }
  }

  /**
   * 停止游戏循环（完全终止，需重新start才能恢复）
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.updateCallbacks = [];
    this.renderCallbacks = [];
  }

  /**
   * 暂停游戏循环（可通过resume恢复）
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = performance.now();
  }

  /**
   * 恢复游戏循环
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    // 修正lastTime：减去暂停的时长，避免恢复后deltaTime突变
    const pauseDuration = performance.now() - this.pauseStartTime;
    this.lastTime += pauseDuration;
  }

  /**
   * 设置最大帧率限制
   * @param fps 目标帧率（必须>0，null表示取消限制）
   */
  setMaximumFps(fps: number | null): void {
    if (fps !== null && (typeof fps !== 'number' || fps <= 0)) {
      throw new Error('最大帧率必须是正数或null');
    }
    this.maxFps = fps;
    this.frameInterval = fps ? 1000 / fps : 0; // 计算每帧最小间隔（毫秒）
  }

  /**
   * 添加逻辑更新回调（支持多个）
   * @param callback 更新回调（接收deltaTime：秒级时间差）
   * @returns 用于移除回调的函数
   */
  addUpdateCallback(callback: UpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    // 返回移除当前回调的函数
    return () => this.removeUpdateCallback(callback);
  }

  /**
   * 移除指定的更新回调
   * @param callback 要移除的回调
   */
  removeUpdateCallback(callback: UpdateCallback): void {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
  }

  /**
   * 添加渲染回调（支持多个）
   * @param callback 渲染回调
   * @returns 用于移除回调的函数
   */
  addRenderCallback(callback: RenderCallback): () => void {
    this.renderCallbacks.push(callback);
    return () => this.removeRenderCallback(callback);
  }

  /**
   * 移除指定的渲染回调
   * @param callback 要移除的回调
   */
  removeRenderCallback(callback: RenderCallback): void {
    this.renderCallbacks = this.renderCallbacks.filter(cb => cb !== callback);
  }

  /**
   * 设置错误处理回调（捕获回调执行中的错误）
   * @param callback 错误处理函数
   */
  onError(callback: ErrorHandler): void {
    this.errorCallback = callback;
  }

  /**
   * 核心循环函数（私有，通过requestAnimationFrame驱动）
   * @param timestamp 当前时间戳（毫秒）
   */
  #loop(timestamp: number): void {
    // 如果循环已停止，终止递归
    if (!this.isRunning) return;

    // 若处于暂停状态，仅继续请求下一帧，不执行逻辑和渲染
    if (this.isPaused) {
      requestAnimationFrame((t) => this.#loop(t));
      return;
    }

    // 计算时间差（毫秒）
    const elapsed = timestamp - this.lastTime;

    // 帧率限制：如果设置了最大帧率，且当前帧间隔小于最小间隔，跳过本次执行
    if (this.maxFps && elapsed < this.frameInterval) {
      requestAnimationFrame((t) => this.#loop(t));
      return;
    }

    // 计算deltaTime（转换为秒），并限制最大值（避免页面隐藏后时间差过大导致逻辑异常）
    const deltaTime = Math.min(elapsed / 1000, 0.2); // 最大允许0.2秒（200ms）的时间差

    // 更新时间戳
    this.lastTime = timestamp;

    // 执行所有更新回调（带错误捕获）
    this.updateCallbacks.forEach(callback => {
      try {
        callback(deltaTime);
      } catch (error) {
        this.#handleError(error as Error, 'update');
      }
    });

    // 执行所有渲染回调（带错误捕获）
    this.renderCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        this.#handleError(error as Error, 'render');
      }
    });

    // 计算并更新FPS（每秒更新一次）
    this.frameCount++;
    const fpsElapsed = timestamp - this.lastFpsUpdate;
    if (fpsElapsed >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / fpsElapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }

    // 继续下一帧循环
    requestAnimationFrame((t) => this.#loop(t));
  }

  /**
   * 错误处理内部方法
   * @param error 错误对象
   * @param type 错误来源（'update'或'render'）
   */
  #handleError(error: Error, type: 'update' | 'render'): void {
    console.error(`[GameLoop] ${type} callback error:`, error);
    if (this.errorCallback) {
      try {
        this.errorCallback(error);
      } catch (err) {
        console.error('[GameLoop] Error handler failed:', err);
      }
    }
  }
}

export { GameLoop };