# Sprite / Animation / SpriteEntity 模块说明

面向精灵图（Sprite Sheet）的轻量绘制与帧动画，依赖 `AssetLoader` 缓存。包含三个类：`Sprite`（裁切绘制）、`Animation`（帧序列控制）、`SpriteEntity`（可放入场景的动画实体）。

## 模块组成

| 文件 | 类 | 职责 |
|------|-----|------|
| `sprite.ts` | `Sprite` | 从缓存图按源矩形绘制到 Canvas |
| `animation.ts` | `Animation` | fps、loop/once、play/stop/reset |
| `spriteEntity.ts` | `SpriteEntity` | 继承 `Entity`，集成 Sprite + Animation |

## 核心 API

### Sprite

```typescript
constructor(imageKey: string, assetLoader?: AssetLoader)
draw(ctx, frame: SourceRect, destX, destY, destW, destH): void
```

### Animation

```typescript
constructor(options: AnimationOptions)
update(deltaTime: number): void
getCurrentFrame(): SourceRect
play(): void
stop(): void
reset(): void
isPlaying(): boolean
```

`AnimationOptions`：`frames`（必填）、`fps`（默认 8）、`loop`（默认 true）。

### SpriteEntity

```typescript
constructor(params: SpriteEntityParams)
update(deltaTime: number): void
render(ctx: CanvasRenderingContext2D): void
getAnimation(): Animation | null
```

`SpriteEntityParams` 继承位置/尺寸，并含 `imageKey`、`frames`、`fps`、`loop`、`autoplay`、`update`。

`SpriteEntity.movable = true`，默认参与 Scene 碰撞响应。

### 类型 SourceRect

```typescript
type SourceRect = { x: number; y: number; width: number; height: number };
```

## 基础使用示例

```typescript
import { AssetLoader } from '../assets/assetLoader';
import { SpriteEntity } from './spriteEntity';

const FRAME_W = 32;
const frames = [0, 1, 2, 3].map((i) => ({
  x: i * FRAME_W,
  y: 0,
  width: FRAME_W,
  height: FRAME_W,
}));

await AssetLoader.getInstance().loadImage('/sprites/player.png', 'player-sheet');

const player = new SpriteEntity({
  id: 'player',
  location: [100, 100],
  size: [32, 32],
  imageKey: 'player-sheet',
  frames,
  fps: 10,
  loop: true,
  update(deltaTime) {
    // 自定义移动逻辑
  },
});

scene.addEntity(player);
```

### 手动控制动画

```typescript
const anim = player.getAnimation();
if (anim) {
  anim.play();  // 开始
  anim.stop();  // 暂停在当前帧
  anim.reset(); // 回到第一帧
}
```

## 注意事项

1. **使用前必须 `AssetLoader.loadImage` 预加载 `imageKey`**。
2. `frames` 为空时不会创建 `Animation`，仅绘制占位帧。
3. `autoplay` 默认为 `true`；设为 `false` 时需手动 `play()`。
4. 嵌入场景建议单张 sheet + 少量帧，避免大图集占用内存。
5. 无 `frames` 时可将 `Sprite` 单独用于静态裁切绘制。
