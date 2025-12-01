# Input 输入交互模块说明
`Input` 是游戏引擎的核心输入交互模块，基于 DOM 事件体系实现，全面支持**键盘、鼠标、触摸**三类输入方式，适配桌面端与移动端。模块提供了灵活的输入状态查询能力（持续按下、单次触发、组合键），并内置事件销毁、状态重置机制，从根本上避免内存泄漏，是游戏交互逻辑的基础支撑。

## 模块简介
该模块封装了原生 DOM 输入事件的底层操作，解决了原生输入处理的常见痛点：
- 键盘事件仅能获取基础按下状态，需手动实现单次触发、组合键逻辑；
- 鼠标/触摸坐标为窗口绝对坐标，需手动转换为 Canvas 相对坐标；
- 事件监听器未统一管理，易导致组件卸载后内存泄漏；
- 移动端触摸事件与原生滚动冲突，需手动阻止默认行为。

模块通过**状态中心化管理**、**事件封装**、**多端适配**，对外提供简洁的 API，开发者无需关注底层事件细节，只需调用方法即可实现输入交互逻辑。

## 核心功能
1. **键盘输入处理**
   - **持续按下检测**：`isKeyPressed` 方法查询按键是否持续按下（适用于角色移动）；
   - **单次触发检测**：`isKeyPressedOnce` 方法实现按键按下一次仅响应一次（适用于跳跃、射击）；
   - **组合键检测**：`isComboPressed` 方法支持多按键同时按下检测（适用于冲刺、快捷键）；
   - **状态重置**：提供单个/全部键盘状态的手动重置方法，支持自定义输入逻辑。

2. **鼠标输入处理**
   - **相对坐标获取**：`getMousePosition` 方法返回鼠标相对于 Canvas 的坐标（非窗口绝对坐标）；
   - **鼠标按键检测**：`isMousePressed` 方法支持左/中/右键的按下状态查询；
   - **滚轮检测**：`getMouseWheelDelta` 方法获取鼠标滚轮偏移量，读取后自动重置；
   - **状态重置**：鼠标离开目标/失焦时自动重置状态，避免坐标/按键异常。

3. **触摸输入处理（移动端）**
   - **触摸状态检测**：`isTouching` 方法判断是否处于触摸状态；
   - **多触点坐标**：`getTouchPositions`/`getSingleTouchPosition` 方法获取单个/所有触摸点的相对坐标；
   - **默认行为阻止**：自动阻止触摸的原生滚动行为，避免与游戏交互冲突；
   - **状态清理**：触摸结束/取消时自动清理触点状态，适配移动端异常场景（如来电、弹窗）。

4. **全局状态管理**
   - 支持键盘、鼠标、触摸状态的单独/全局重置（`resetAllStates`）；
   - 窗口失焦/聚焦时自动重置所有输入状态，防止按键/触摸状态残留。

5. **内存安全机制**
   - 封装事件监听方法，缓存所有监听器引用；
   - 提供 `destroy` 方法，统一移除所有事件监听器、清空状态，避免内存泄漏。

6. **Canvas 坐标转换**
   - 初始化时可选关联 Canvas 元素，自动将鼠标/触摸的窗口坐标转换为 Canvas 相对坐标；
   - 适配 Canvas 缩放/样式尺寸与像素尺寸不一致的场景，保证坐标准确性。

## 核心实现概述
1. **事件绑定与封装**
   - 私有方法 `#addEventListener` 封装原生 `addEventListener`，在绑定事件的同时，将**事件目标、类型、处理函数**缓存到 `eventListeners` 数组中；
   - 所有输入事件（键盘/鼠标/触摸/焦点）均通过该方法绑定，为后续统一销毁提供支撑；
   - 事件处理函数通过**类型断言**将通用 `Event` 转换为具体子类（`KeyboardEvent`/`MouseEvent`/`TouchEvent`），解决 TypeScript 类型校验问题。

2. **输入状态存储**
   - 键盘状态通过两个 `Map` 管理：`keyStates` 存储持续按下状态，`keyDownOnceStates` 存储单次触发状态；
   - 鼠标状态通过 `MouseState` 接口封装，包含坐标、按键状态、滚轮偏移量，按键状态使用 `Map` 存储；
   - 触摸状态通过 `TouchState` 接口封装，包含触摸状态、多触点坐标，触点信息使用 `Map` 按 ID 存储。

3. **相对坐标计算**
   - 私有方法 `#getRelativePosition` 基于 Canvas 的 `getBoundingClientRect` 计算元素的位置与尺寸；
   - 将鼠标/触摸的客户端坐标（`clientX/clientY`）转换为 Canvas 像素坐标，适配 Canvas 样式缩放场景。

4. **销毁与内存管理**
   - `destroy` 方法遍历 `eventListeners` 数组，调用原生 `removeEventListener` 移除所有监听器；
   - 清空所有状态 `Map`、Canvas 引用，确保组件卸载/游戏结束后无资源残留。

5. **异常场景处理**
   - 窗口失焦/聚焦、鼠标离开目标、触摸取消时自动重置输入状态；
   - 初始化 Canvas 失败时打印警告，降级使用窗口坐标，保证模块兼容性。

## 基础使用示例
### 1. 模块导入与初始化
```typescript
import { Input } from "./path/to/input";

// 初始化输入模块，关联游戏Canvas（id为gameCanvas，可选）
const input = new Input("gameCanvas");
```

### 2. 键盘输入交互
适用于桌面端角色移动、跳跃、冲刺等逻辑：
```typescript
// 游戏循环中的键盘检测
function gameUpdate(deltaTime: number) {
  // 1. 持续按下：方向键/WASD移动角色
  if (input.isKeyPressed('ArrowUp') || input.isKeyPressed('W')) {
    player.y -= player.speed * deltaTime;
  }
  if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('S')) {
    player.y += player.speed * deltaTime;
  }

  // 2. 单次触发：空格键跳跃（按下一次仅跳一次）
  if (input.isKeyPressedOnce(' ')) {
    player.jump();
  }

  // 3. 组合键：Shift+右方向键冲刺
  if (input.isComboPressed(['Shift', 'ArrowRight'])) {
    player.x += player.dashSpeed * deltaTime;
  }

  requestAnimationFrame(() => gameUpdate(deltaTime));
}

// 启动循环
gameUpdate(1/60);
```

### 3. 鼠标输入交互
适用于桌面端射击、视角控制、滚轮缩放等逻辑：
```typescript
// 游戏循环中的鼠标检测
function gameMouseUpdate() {
  // 1. 获取鼠标相对Canvas坐标
  const mousePos = input.getMousePosition();
  player.rotateTo(mousePos.x, mousePos.y); // 角色朝向鼠标位置

  // 2. 鼠标左键按下：射击
  if (input.isMousePressed('left')) {
    player.shoot();
  }

  // 3. 鼠标滚轮：缩放视角
  const wheelDelta = input.getMouseWheelDelta();
  if (wheelDelta > 0) {
    camera.zoomIn();
  } else if (wheelDelta < 0) {
    camera.zoomOut();
  }

  requestAnimationFrame(gameMouseUpdate);
}

gameMouseUpdate();
```

### 4. 触摸输入交互（移动端）
适用于移动端角色移动、点击操作等逻辑：
```typescript
// 游戏循环中的触摸检测
function gameTouchUpdate() {
  // 1. 检测是否处于触摸状态
  if (input.isTouching()) {
    // 2. 获取第一个触摸点的坐标
    const touchPos = input.getSingleTouchPosition();
    player.moveTo(touchPos.x, touchPos.y); // 角色移动到触摸位置
  }

  requestAnimationFrame(gameTouchUpdate);
}

gameTouchUpdate();
```

### 5. 模块销毁（关键）
组件卸载/游戏结束时，必须调用 `destroy` 方法释放资源：
```typescript
// React/Vue 组件卸载时
useEffect(() => {
  const input = new Input("gameCanvas");
  // 游戏逻辑...

  return () => {
    input.destroy(); // 销毁输入模块，避免内存泄漏
  };
}, []);

// 游戏结束时
gameOver() {
  input.destroy();
}
```

## 高级用法示例
### 1. 组合键快捷键（如 Ctrl+C 复制）
```typescript
if (input.isComboPressed(['Control', 'C'])) {
  console.log('执行复制操作');
  copyGameData();
}
```

### 2. 多触摸点操作（移动端双指缩放）
```typescript
function handleMultiTouch() {
  if (input.isTouching()) {
    const touches = input.getTouchPositions();
    if (touches.length === 2) {
      // 获取两个触摸点的坐标，计算距离实现缩放
      const [touch1, touch2] = touches;
      const distance = getDistance(touch1.x, touch1.y, touch2.x, touch2.y);
      camera.setScale(distance / 100);
    }
  }
}

// 计算两点距离的工具函数
function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
```

### 3. 手动重置输入状态
```typescript
// 游戏暂停时重置所有输入状态
pauseGame() {
  input.resetAllStates();
  isGamePaused = true;
}
```

## 注意事项
1. **Canvas 关联的必要性**
   - 初始化时传入 Canvas ID，模块会自动转换鼠标/触摸坐标为相对坐标，建议游戏开发中必传；
   - 若未传入 Canvas ID，模块将使用窗口绝对坐标，可能导致 Canvas 内的交互坐标偏移。

2. **移动端触摸的默认行为**
   - 模块已自动调用 `e.preventDefault()` 阻止触摸的原生滚动，但部分浏览器可能存在兼容性问题，需在触摸事件中额外处理。

3. **销毁方法的调用**
   - 组件卸载/游戏结束时，必须调用 `input.destroy()`，否则事件监听器会残留，导致内存泄漏和异常的输入响应。

4. **单次触发的重置逻辑**
   - `isKeyPressedOnce` 方法调用后会自动重置该按键的单次触发状态，无需手动调用 `resetKeyState`。

5. **滚轮偏移量的读取**
   - `getMouseWheelDelta` 方法读取后会立即将 `mouseState.wheelDelta` 置 0，避免同一滚轮事件被重复处理。