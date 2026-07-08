# AssetLoader 模块说明

`AssetLoader` 是轻量级图片预加载与缓存模块，面向嵌入网页的小游戏。统一通过 `Map` 缓存 `HTMLImageElement`，避免每帧 `new Image()`，供 `Renderer`、`Sprite`、`Player.render` 复用。

## 模块简介

该模块解决以下问题：

- 图片重复加载导致闪烁与性能浪费；
- 同一 URL 并发加载产生竞态；
- 渲染模块需要同步读取已解码图片。

采用单例模式，全局共享一份缓存。

## 核心 API

| 方法 | 签名 | 说明 |
|------|------|------|
| `getInstance` | `() => AssetLoader` | 获取单例 |
| `loadImage` | `(url: string, key?: string) => Promise<HTMLImageElement>` | 加载单张图片 |
| `loadImages` | `(input, onProgress?) => Promise<void>` | 批量加载 |
| `get` | `(key: string) => HTMLImageElement \| undefined` | 读取缓存 |
| `has` | `(key: string) => boolean` | 是否已缓存 |

### 类型

```typescript
type LoadImagesInput = string[] | Record<string, string>;
type LoadProgressCallback = (loaded: number, total: number) => void;
```

- `loadImage` 的 `key` 默认为 `url`；
- 同一 key 的并发请求复用同一 Promise；
- 加载失败抛出 `Error`。

## 基础使用示例

```typescript
import { AssetLoader } from '../../engine/core/assets/assetLoader';

const loader = AssetLoader.getInstance();

// 单张加载
await loader.loadImage('/sprites/player.png', 'player');

// 批量加载（带进度）
await loader.loadImages(
  {
    player: '/sprites/player.png',
    bg: '/sprites/bg.png',
  },
  (loaded, total) => console.log(`${loaded}/${total}`)
);

const img = loader.get('player');
if (img) {
  ctx.drawImage(img, 0, 0, 64, 64);
}
```

## 与 Renderer / Sprite / Player 的关系

| 模块 | 使用方式 |
|------|----------|
| `Renderer.drawEntity` | `imageSrc` 优先从缓存读取；未缓存时灰色占位并后台加载 |
| `Sprite.draw` | 按 `imageKey` 从缓存裁切绘制；未缓存时灰色占位 |
| `Player.render` | `imageSrc` 作为 AssetLoader 的 key 查询 |

嵌入小游戏建议在游戏开始前完成 `loadImages`，避免首帧占位。

## 注意事项

1. **必须先预加载再绘制精灵**，`Sprite` 不会自动发起加载。
2. 支持 data URL（Demo 中常用 canvas 生成精灵图）。
3. 缓存键与 URL 可以不同，便于语义化命名（如 `'player-sheet'`）。
4. 本模块仅缓存图片，音频由 `AudioManager` 单独管理。
