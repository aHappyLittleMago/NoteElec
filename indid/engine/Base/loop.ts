/**
 * 管理游戏循环
 */
class GameLoop {
    // 私有成员
    private isRunning: boolean; // 循环是否运行
    private lastTime: number; // 上一帧时间戳（毫秒）
    private updateCallback: (deltaTime: number) => void; // 更新回调（接收时间差，单位：秒）
    private renderCallback: () => void; // 渲染回调（无参数）

    // 初始化
    constructor(){
        this.isRunning = false;
        this.lastTime = 0;
        this.updateCallback = ()=>{};
        this.renderCallback = ()=>{};
    }
  
    // 启动循环
    start(): void {
      if (this.isRunning) return; // 避免重复启动

      // 初始化
      this.isRunning = true;
      this.lastTime = performance.now(); // 初始化时间戳（毫秒）
      this.#loop(performance.now()); // 调用循环函数
    }
  
    // 停止循环
    stop(): void {
      this.isRunning = false;
    }
  
    // 注册更新回调（每帧执行逻辑更新）
    // （需接收时间差）
    onUpdate(callback: (deltaTime: number) => void): void {
      this.updateCallback = callback;
    }
  
    // 注册渲染回调（每帧执行画面绘制）
    onRender(callback: () => void): void {
      this.renderCallback = callback;
    }
  
    // 私有循环方法（使用requestAnimationFrame驱动）
    // 接收当前时间戳
    #loop(timestamp: number): void {
      if (!this.isRunning) return; // 标识false停止循环
  
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

  export {GameLoop}; 