/**
 * 输入交互模块
 * 支持键盘、鼠标、触摸输入，提供单次触发、组合键、状态持久化等能力
 * 适配桌面端/移动端，内置事件销毁机制避免内存泄漏
 */

// ========== 类型定义 ==========
  /** 键盘按键名类型（基于DOM KeyboardEvent.key的常用值） */
  type Key =
    | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
    | 'W' | 'A' | 'S' | 'D' | ' ' | 'Enter' | 'Escape'
    | string; // 兼容其他自定义按键

  /** 鼠标按键类型 */
  type MouseButton = 'left' | 'middle' | 'right' | number;

  /** 鼠标状态接口 */
  interface MouseState {
    x: number; // 鼠标X坐标（相对Canvas）
    y: number; // 鼠标Y坐标（相对Canvas）
    buttons: Map<MouseButton, boolean>; // 鼠标按键状态
    wheelDelta: number; // 滚轮偏移量（垂直方向）
  }

  /** 触摸状态接口 */
  interface TouchState {
    isTouching: boolean; // 是否处于触摸状态
    touches: Map<number, { x: number; y: number }>; // 触摸点（id -> 坐标）
  }


class Input {
  // ========== 私有状态 ==========
  /** 键盘持续按下状态：键名 -> 是否按下 */
  private keyStates: Map<Key, boolean>;
  /** 键盘单次触发状态：键名 -> 是否首次按下（触发后重置） */
  private keyDownOnceStates: Map<Key, boolean>;
  /** 鼠标状态 */
  private mouseState: MouseState;
  /** 触摸状态（移动端） */
  private touchState: TouchState;
  /** 事件监听器引用（用于后续销毁） */
  private eventListeners: Array<{
    target: EventTarget;
    type: string;
    handler: EventListener;
  }>;
  /** 关联的Canvas元素（用于计算相对坐标） */
  private canvas?: HTMLCanvasElement;

  // ========== 构造函数 ==========
  /**
   * 初始化输入模块
   * @param canvasId 可选：关联的Canvas元素ID，用于计算鼠标/触摸的相对坐标
   */
  constructor(canvasId?: string) {
    // 初始化键盘状态
    this.keyStates = new Map<Key, boolean>();
    this.keyDownOnceStates = new Map<Key, boolean>();

    // 初始化鼠标状态
    this.mouseState = {
      x: 0,
      y: 0,
      buttons: new Map<MouseButton, boolean>([
        ['left', false],
        ['middle', false],
        ['right', false],
      ]),
      wheelDelta: 0,
    };

    // 初始化触摸状态
    this.touchState = {
      isTouching: false,
      touches: new Map<number, { x: number; y: number }>(),
    };

    // 初始化事件监听器缓存
    this.eventListeners = [];

    // 关联Canvas元素（可选）
    if (canvasId) {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (canvas) {
        this.canvas = canvas;
      } else {
        console.warn(`Input模块：未找到ID为${canvasId}的Canvas元素，将使用窗口坐标计算`);
      }
    }

    // 绑定所有输入事件
    this.#bindAllEvents();
  }

  // ========== 核心键盘方法 ==========
  /**
   * 检查按键是否**持续按下**
   * @param key 按键名（如'ArrowUp'、'W'）
   * @returns 按键是否按下
   */
  isKeyPressed(key: Key): boolean {
    return this.keyStates.get(key) || false;
  }

  /**
   * 检查按键是否**单次触发**（按下一次仅返回true一次，松开后重置）
   * @param key 按键名
   * @returns 是否首次按下
   */
  isKeyPressedOnce(key: Key): boolean {
    const isPressed = this.keyDownOnceStates.get(key) || false;
    if (isPressed) {
      this.keyDownOnceStates.set(key, false); // 触发后立即重置
    }
    return isPressed;
  }

  /**
   * 检查组合键是否**同时按下**
   * @param keys 组合键数组（如['Control', 'C']）
   * @returns 所有按键是否同时按下
   */
  isComboPressed(keys: Key[]): boolean {
    if (keys.length === 0) return false;
    return keys.every(key => this.isKeyPressed(key));
  }

  /**
   * 手动重置单个按键状态
   * @param key 按键名
   */
  resetKeyState(key: Key): void {
    this.keyStates.set(key, false);
    this.keyDownOnceStates.set(key, false);
  }

  /**
   * 重置所有键盘状态
   */
  resetAllKeyStates(): void {
    this.keyStates.clear();
    this.keyDownOnceStates.clear();
  }

  // ========== 核心鼠标方法 ==========
  /**
   * 获取鼠标相对坐标（优先Canvas，无则取窗口坐标）
   * @returns 鼠标{x, y}坐标
   */
  getMousePosition(): { x: number; y: number } {
    return { ...this.mouseState };
  }

  /**
   * 检查鼠标按键是否按下
   * @param button 鼠标按键（left/middle/right 或 数字0/1/2）
   * @returns 是否按下
   */
  isMousePressed(button: MouseButton): boolean {
    return this.mouseState.buttons.get(button) || false;
  }

  /**
   * 获取鼠标滚轮偏移量（垂直方向）
   * @returns 滚轮偏移量（正数向上，负数向下）
   */
  getMouseWheelDelta(): number {
    const delta = this.mouseState.wheelDelta;
    this.mouseState.wheelDelta = 0; // 读取后重置，避免重复触发
    return delta;
  }

  /**
   * 重置鼠标状态
   */
  resetMouseState(): void {
    this.mouseState.x = 0;
    this.mouseState.y = 0;
    this.mouseState.wheelDelta = 0;
    this.mouseState.buttons.forEach((_, key) => {
      this.mouseState.buttons.set(key, false);
    });
  }

  // ========== 核心触摸方法 ==========
  /**
   * 检查是否处于触摸状态（移动端）
   * @returns 是否触摸
   */
  isTouching(): boolean {
    return this.touchState.isTouching;
  }

  /**
   * 获取所有触摸点坐标
   * @returns 触摸点数组（包含id和坐标）
   */
  getTouchPositions(): Array<{ id: number; x: number; y: number }> {
    return Array.from(this.touchState.touches.entries()).map(([id, pos]) => ({
      id,
      ...pos,
    }));
  }

  /**
   * 获取单个触摸点坐标（默认第一个）
   * @param touchId 触摸点ID
   * @returns 触摸点坐标，无则返回{x:0,y:0}
   */
  getSingleTouchPosition(touchId?: number): { x: number; y: number } {
    if (touchId !== undefined) {
      return this.touchState.touches.get(touchId) || { x: 0, y: 0 };
    }
    // 无ID时返回第一个触摸点
    const firstTouch = this.touchState.touches.entries().next().value;
    return firstTouch ? firstTouch[1] : { x: 0, y: 0 };
  }

  /**
   * 重置触摸状态
   */
  resetTouchState(): void {
    this.touchState.isTouching = false;
    this.touchState.touches.clear();
  }

  // ========== 全局重置 ==========
  /**
   * 重置所有输入状态（键盘+鼠标+触摸）
   */
  resetAllStates(): void {
    this.resetAllKeyStates();
    this.resetMouseState();
    this.resetTouchState();
  }

  // ========== 销毁方法 ==========
  /**
   * 销毁输入模块：移除所有事件监听，重置状态
   * （组件卸载/游戏结束时调用，避免内存泄漏）
   */
  destroy(): void {
    // 移除所有事件监听
    this.eventListeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this.eventListeners = [];

    // 重置所有状态
    this.resetAllStates();

    // 清空Canvas引用
    this.canvas = undefined;
  }

  // ========== 私有事件绑定 ==========
  /**
   * 绑定所有输入事件（键盘/鼠标/触摸）
   */
  #bindAllEvents(): void {
    this.#bindKeyboardEvents();
    this.#bindMouseEvents();
    this.#bindTouchEvents();
    this.#bindFocusEvents();
  }

  /**
   * 绑定键盘事件
   */
  #bindKeyboardEvents(): void {
    // 按键按下
    const keydownHandler = (evt: Event) => {
      const e = evt as KeyboardEvent // 断言解决监听回调参数定义问题（MDN定义参数必须为Event，无法直接定义为Event子类）
      const key = e.key as Key;
      if (!this.keyStates.get(key)) {
        this.keyDownOnceStates.set(key, true); // 标记单次触发
      }
      this.keyStates.set(key, true);
    };
    this.#addEventListener(window, 'keydown', keydownHandler);

    // 按键松开
    const keyupHandler = (evt: Event) => {
      const e = evt as KeyboardEvent // 断言解决监听回调参数定义问题（MDN定义参数必须为Event，无法直接定义为Event子类）
      const key = e.key as Key;
      this.keyStates.set(key, false);
      this.keyDownOnceStates.set(key, false);
    };
    this.#addEventListener(window, 'keyup', keyupHandler);
  }

  /**
   * 绑定鼠标事件
   */
  #bindMouseEvents(): void {
    const target = this.canvas || window;

    // 鼠标移动
    const mousemoveHandler = (evt: Event) => {
      const e = evt as MouseEvent
      const pos = this.#getRelativePosition(e.clientX, e.clientY);
      this.mouseState.x = pos.x;
      this.mouseState.y = pos.y;
    };
    this.#addEventListener(target, 'mousemove', mousemoveHandler);

    // 鼠标按下
    const mousedownHandler = (evt: Event) => {
      const e = evt as MouseEvent;
      const buttonMap: Record<number, MouseButton> = {
        0: 'left',
        1: 'middle',
        2: 'right',
      };
      const button = buttonMap[e.button] || e.button;
      this.mouseState.buttons.set(button, true);
    };
    this.#addEventListener(target, 'mousedown', mousedownHandler);

    // 鼠标松开
    const mouseupHandler = (evt: Event) => {
      const e = evt as MouseEvent;
      const buttonMap: Record<number, MouseButton> = {
        0: 'left',
        1: 'middle',
        2: 'right',
      };
      const button = buttonMap[e.button] || e.button;
      this.mouseState.buttons.set(button, false);
    };
    this.#addEventListener(target, 'mouseup', mouseupHandler);

    // 鼠标滚轮
    const wheelHandler = (evt: Event) => {
      const e = evt as WheelEvent;
      this.mouseState.wheelDelta = e.deltaY * -1; // 反转：正数向上，负数向下
    };
    this.#addEventListener(target, 'wheel', wheelHandler);

    // 鼠标离开目标
    const mouseleaveHandler = () => {
      this.resetMouseState();
    };
    this.#addEventListener(target, 'mouseleave', mouseleaveHandler);
  }

  /**
   * 绑定触摸事件（移动端）
   */
  #bindTouchEvents(): void {
    const target = this.canvas || window;

    // 触摸开始
    const touchstartHandler = (evt: Event) => {
      const e = evt as TouchEvent;
      e.preventDefault(); // 阻止默认滚动
      this.touchState.isTouching = true;
      Array.from(e.touches).forEach(touch => {
        const pos = this.#getRelativePosition(touch.clientX, touch.clientY);
        this.touchState.touches.set(touch.identifier, pos);
      });
    };
    this.#addEventListener(target, 'touchstart', touchstartHandler);

    // 触摸移动
    const touchmoveHandler = (evt: Event) => {
      const e = evt as TouchEvent;
      e.preventDefault();
      Array.from(e.touches).forEach(touch => {
        const pos = this.#getRelativePosition(touch.clientX, touch.clientY);
        this.touchState.touches.set(touch.identifier, pos);
      });
    };
    this.#addEventListener(target, 'touchmove', touchmoveHandler);

    // 触摸结束/取消
    const touchendHandler = (evt: Event) => {
      const e = evt as TouchEvent;
      Array.from(e.changedTouches).forEach(touch => {
        this.touchState.touches.delete(touch.identifier);
      });
      this.touchState.isTouching = this.touchState.touches.size > 0;
    };
    this.#addEventListener(target, 'touchend', touchendHandler);
    this.#addEventListener(target, 'touchcancel', touchendHandler);
  }

  /**
   * 绑定窗口焦点事件（防止失焦时状态残留）
   */
  #bindFocusEvents(): void {
    // 窗口失焦
    const blurHandler = () => {
      this.resetAllStates();
    };
    this.#addEventListener(window, 'blur', blurHandler);

    // 窗口聚焦
    const focusHandler = () => {
      this.resetAllStates();
    };
    this.#addEventListener(window, 'focus', focusHandler);
  }

  // ========== 私有工具方法 ==========
  /**
   * 封装事件监听：缓存监听器引用，方便后续销毁
   * @param target 事件目标
   * @param type 事件类型
   * @param handler 事件处理函数
   */
  #addEventListener(
    target: EventTarget,
    type: string,
    handler: EventListener
  ): void {
    target.addEventListener(type, handler);
    this.eventListeners.push({ target, type, handler });
  }

  /**
   * 计算相对坐标（窗口 -> Canvas）
   * @param clientX 客户端X坐标
   * @param clientY 客户端Y坐标
   * @returns 相对目标元素的坐标
   */
  #getRelativePosition(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.canvas) {
      return { x: clientX, y: clientY };
    }
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }
}

export { Input };