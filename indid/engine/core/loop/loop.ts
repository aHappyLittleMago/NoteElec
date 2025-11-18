/**
 * Loop类
 * 管理游戏循环
 */
class GameLoop {
  // 私有成员
  private isRunning: boolean = false; // 循环是否运行
  private lastTime: number = 0; // 上一帧时间戳

  private updateCallback: (deltaTime: number) => void = () => { }; // 更新回调（时间差：秒）
  private renderCallback: () => void = () => { }; // 渲染回调

  /**
   * 启动循环
   * @returns void
   */
  start(): void {
    if (this.isRunning) return;

    // 初始化
    this.isRunning = true;
    this.lastTime = performance.now(); // 初始化时间戳（毫秒）
    this.#loop(this.lastTime); // 调用循环函数
  }

  /**
   * 停止循环
   * @returns void
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * 注册更新回调函数，逻辑更新
   * @param callback ：更新回调
   */
  onUpdate(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  /**
   * 注册渲染回调
   * @param callback 渲染回调
   */
  onRender(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * 循环函数
   * @param timestamp 当前时间戳
   * @returns void
   */
  #loop(timestamp: number): void {
    if (!this.isRunning) return;

    // 计算每帧时间差（转换为秒）
    const deltaTime: number = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp; // 更新时间戳标记（更新时）

    // 触发更新和渲染回调
    this.updateCallback(deltaTime);
    this.renderCallback();

    // 继续下一帧
    requestAnimationFrame((t) => this.#loop(t));
  }
}

export { GameLoop }; 