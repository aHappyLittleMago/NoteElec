/**
 * 输入交互模块
 */
class Input {
    // 私有成员变量
    private keys: Map<any, any>;

    constructor() {
      this.keys = new Map(); // 存储按键状态：key -> boolean（是否按下）
      this.#setupEventListeners(); // 初始化键盘监听
    }
  
    // 检查按键是否按下（参数：按键的key值，如'ArrowUp'、'a'）
    isPressed(key: any) {
      return this.keys.get(key) || false;
    }
  
    // 私有方法：绑定键盘事件
    #setupEventListeners() {
      // 按键按下时标记为true
      window.addEventListener('keydown', (e) => {
        this.keys.set(e.key, true);
      });
  
      // 按键松开时标记为false
      window.addEventListener('keyup', (e) => {
        this.keys.set(e.key, false);
      });
  
      // 防止窗口失去焦点时按键状态残留
      window.addEventListener('blur', () => {
        this.keys.clear(); // 清空所有按键状态
      });
    }
  }

  export {Input};