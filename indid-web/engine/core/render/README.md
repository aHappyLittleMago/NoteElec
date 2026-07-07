# Renderer 模块说明
`Renderer` 是游戏引擎的核心渲染模块，基于 HTML5 Canvas 2D 上下文实现，负责游戏画面的绘制管理、实体渲染与 Canvas 基础操作。模块提供了灵活的绘制能力（支持多形状、多样式、图片渲染）、性能优化机制（离屏缓存）和健壮的错误处理，适配从简单 2D 游戏到复杂实体渲染的需求。

## 模块简介
该模块封装了 Canvas 2D 的底层绘制 API，对外提供简洁的渲染接口，同时解决了原生 Canvas 绘制的常见问题：
- 绘制状态混乱（通过 `save/restore` 管理上下文）
- 多实体绘制性能低下（批量绘制、离屏缓存）
- 实体属性不规范导致的绘制异常（内置实体校验）
- 响应式场景下的尺寸适配（动态 resize 方法）

模块同时兼容旧版 `PlayerStateType` 实体类型，并通过 `RenderableEntity` 接口定义通用渲染实体规范，保证扩展性。

## 核心功能
1. **Canvas 基础管理**
   - 自动初始化 Canvas 元素与 2D 渲染上下文，严格校验元素存在性与环境兼容性。
   - 提供 `getSize`/`getCanvas` 方法获取画布尺寸与 Canvas 元素引用，方便外部交互。
   - 支持自定义背景色的清屏操作，可选清理离屏 Canvas 缓存。

2. **多实体渲染能力**
   - **单实体绘制**：`drawEntity` 方法支持绘制符合 `RenderableEntity` 接口的任意实体。
   - **批量绘制**：`drawEntities` 方法优化多实体绘制性能，减少上下文状态切换开销。
   - **实体校验**：内置 `validateEntity` 方法，自动校验实体必要属性（位置、尺寸），避免绘制异常。

3. **丰富的绘制样式与形状**
   - **基础形状**：默认支持矩形（`rect`）、圆形（`circle`）绘制，可通过 `shape` 属性指定。
   - **样式扩展**：支持背景色/图片、透明度（`opacity`）、旋转角度（`rotation`）、边框（`border`）等样式。
   - **图片渲染**：通过 `imageSrc` 属性支持图片渲染，加载失败时自动回退为灰色矩形。

4. **性能优化机制**
   - **离屏渲染缓存**：初始化离屏 Canvas，可将静态实体绘制到缓存中，通过 `drawOffscreenCache` 复用，减少重复绘制开销。
   - **状态管理**：使用 Canvas 上下文的 `save`/`restore` 方法，避免绘制样式/旋转相互影响。

5. **响应式与尺寸调整**
   - 提供 `resize` 方法，支持动态调整 Canvas 像素尺寸。
   - 可选跟随窗口大小自动调整（`scaleWithWindow` 参数），适配不同屏幕尺寸。

6. **错误处理与健壮性**
   - 构造函数抛出明确的初始化错误（Canvas 不存在、不支持 2D 上下文）。
   - 图片加载失败、实体属性无效时打印警告日志，并提供回退方案。

## 核心实现概述
1. **离屏 Canvas 缓存**
   - 初始化时创建离屏 Canvas（`offscreenCanvas`），与主 Canvas 尺寸一致。
   - 静态实体可通过 `drawEntity` 的 `useOffscreen` 参数绘制到离屏缓存，通过 `drawOffscreenCache` 将缓存内容绘制到主 Canvas，减少重复绘制的性能消耗。

2. **绘制状态管理**
   - 每次绘制实体前调用 `ctx.save()` 保存当前上下文状态，绘制完成后调用 `ctx.restore()` 恢复。
   - 旋转、透明度等样式仅作用于当前实体，不会影响其他绘制内容。

3. **通用实体接口规范**
   - 定义 `RenderableEntity` 接口，约定实体的位置、尺寸、样式等必要属性。
   - 兼容旧版 `PlayerStateType`，通过属性优先级（如 `background` 优先于 `color`）实现无缝衔接。

4. **实体校验逻辑**
   - `validateEntity` 方法校验实体的 `location` 和 `size` 是否为有效数组（长度为 2、数值为正数），无效实体直接跳过绘制并打印警告。

5. **图片渲染与回退**
   - 通过 `new Image()` 加载图片资源，`onload` 回调中执行绘制，`onerror` 回调中回退为灰色矩形绘制，并打印加载失败警告。

## 基础使用示例
### 1. 模块导入
```typescript
import { Renderer, RenderableEntity } from "./path/to/renderer";
```

### 2. 初始化渲染器
```typescript
// 初始化Renderer，关联页面中id为"gameCanvas"的Canvas元素
const renderer = new Renderer("gameCanvas");
```

### 3. 基础清屏
```typescript
// 使用默认白色清屏
renderer.clear();

// 使用自定义背景色清屏（如游戏背景色）
renderer.clear("#24E063");

// 清理离屏Canvas缓存（配合离屏渲染使用）
renderer.clear("#24E063", true);
```

### 4. 定义渲染实体
```typescript
// 定义一个矩形玩家实体（符合RenderableEntity接口）
const playerEntity: RenderableEntity = {
  id: "player_1",
  location: [100, 100], // [x, y]
  size: [50, 50],       // [宽, 高]
  background: "#ff0000", // 红色背景
  opacity: 0.8,         // 80% 透明度
  border: { width: 2, color: "#ffffff" } // 白色边框
};

// 定义一个圆形敌人实体
const enemyEntity: RenderableEntity = {
  id: "enemy_1",
  location: [200, 200],
  size: [40, 40], // 圆形以宽为直径，高仅作兼容
  shape: "circle", // 指定绘制形状为圆形
  background: "#00ff00",
  rotation: Math.PI / 4 // 旋转45度
};

// 定义一个图片实体
const imageEntity: RenderableEntity = {
  id: "image_1",
  location: [300, 300],
  size: [100, 100],
  imageSrc: "./assets/player.png" // 图片路径
};
```

### 5. 绘制单个实体
```typescript
// 绘制玩家实体
renderer.drawEntity(playerEntity);

// 绘制圆形敌人实体
renderer.drawEntity(enemyEntity);

// 绘制图片实体
renderer.drawEntity(imageEntity);
```

### 6. 批量绘制实体
```typescript
// 批量绘制多个实体，优化性能
const entities = [playerEntity, enemyEntity, imageEntity];
renderer.drawEntities(entities);
```

### 7. 获取Canvas信息
```typescript
// 获取画布尺寸
const { width, height } = renderer.getSize();
console.log("Canvas尺寸：", width, height);

// 获取Canvas元素（如绑定点击事件）
const canvas = renderer.getCanvas();
canvas.addEventListener("click", (e) => {
  console.log("Canvas点击位置：", e.offsetX, e.offsetY);
});
```

## 高级用法示例
### 1. 离屏渲染缓存使用
适用于静态实体（如地图、道具），仅绘制一次到离屏缓存，后续复用：
```typescript
// 定义静态地图实体
const mapEntity: RenderableEntity = {
  id: "map_1",
  location: [0, 0],
  size: [800, 600],
  background: "#e0e0e0"
};

// 将静态实体绘制到离屏缓存
renderer.drawEntity(mapEntity, true);

// 游戏循环中，只需从离屏缓存绘制到主Canvas（无需重复绘制地图）
function gameRender() {
  renderer.clear("#24E063"); // 清屏
  renderer.drawOffscreenCache(); // 绘制离屏缓存的静态实体
  renderer.drawEntity(playerEntity); // 绘制动态玩家实体
  requestAnimationFrame(gameRender);
}
gameRender();
```

### 2. 响应式Canvas尺寸调整
```typescript
// 手动调整Canvas尺寸为1000x800
renderer.resize(1000, 800);

// 跟随窗口大小自动调整（窗口变化时自动更新）
renderer.resize(window.innerWidth, window.innerHeight, true);
```

### 3. 兼容旧版PlayerStateType
```typescript
import { PlayerStateType } from "./path/to/player.type";

// 旧版PlayerStateType实体
const oldPlayer: PlayerStateType = {
  id: "old_player_1",
  location: [150, 150],
  size: [60, 60],
  color: "#0000ff" // 旧版color属性，模块会自动兼容为background
};

// 直接绘制旧版实体，无需修改
renderer.drawEntity(oldPlayer);
```

## 注意事项
1. **Canvas 像素尺寸与显示尺寸**
   - Canvas 的像素尺寸（`canvas.width/height`）与 CSS 显示尺寸分离，建议保持像素尺寸与显示尺寸一致，避免绘制模糊。
   - 可通过 `renderer.resize()` 同步像素尺寸与显示尺寸。

2. **绘制状态管理**
   - 模块已通过 `save/restore` 管理上下文状态，外部无需手动调用，避免重复操作导致状态异常。

3. **图片渲染的异步性**
   - 图片实体的绘制依赖 `onload` 回调，首次加载可能存在延迟，可提前预加载图片资源。

4. **实体属性校验**
   - 实体的 `location` 和 `size` 必须为长度为 2 的数字数组，且数值为正数，否则会被跳过绘制。

5. **离屏缓存的使用场景**
   - 离屏缓存仅适用于静态实体，动态实体（如玩家、敌人）建议直接绘制到主 Canvas，避免缓存同步开销。