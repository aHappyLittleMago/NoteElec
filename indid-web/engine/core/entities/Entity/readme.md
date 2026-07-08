# Entity 实体基类说明

`Entity` 是所有游戏实体的抽象基类，定义统一的更新、渲染、位置/尺寸查询与碰撞体接口。`Player`、`SpriteEntity` 等均继承此类。

## 模块简介

实体基类将「游戏对象」的最小契约标准化：

- 每帧 `update(deltaTime)` 推进逻辑；
- 每帧 `render(ctx)` 在 Canvas 上绘制；
- `getAABB()` 供碰撞模块与 `Scene.detectCollisions` 使用。

场景通过实体池托管实体，按帧遍历调用 `update` 与 `render`，不再由 `Renderer.drawEntity` 直接批量绘制。

## 核心 API

| 成员 | 签名 | 说明 |
|------|------|------|
| `id` | `string` | 实体唯一标识 |
| `location` | `[number, number]` | 世界坐标 `[x, y]` |
| `size` | `[number, number]` | 尺寸 `[宽, 高]` |
| `update` | `(deltaTime: number) => void` | 抽象，子类实现帧逻辑 |
| `render` | `(ctx: CanvasRenderingContext2D) => void` | 抽象，子类实现绘制 |
| `getLocation` | `() => [number, number]` | 返回位置副本 |
| `setLocation` | `(x, y) \| (location)` | 设置位置 |
| `getSize` | `() => [number, number]` | 返回尺寸副本 |
| `getAABB` | `() => AABB` | 返回 `{ x, y, width, height }` |

### 构造参数（`EntityBaseParams`）

```typescript
{
  id: string;
  location?: [number, number];  // 默认 [0, 0]
  size?: [number, number];      // 默认 [1, 1]
}
```

## 继承示例

```typescript
import { Entity } from './entity';

class Coin extends Entity {
  private spin = 0;

  constructor(id: string, x: number, y: number) {
    super({ id, location: [x, y], size: [16, 16] });
  }

  update(deltaTime: number): void {
    this.spin += deltaTime * 4;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const [x, y] = this.getLocation();
    const [w, h] = this.getSize();
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(this.spin);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
}
```

## 与 Scene / 碰撞模块的关系

- `Scene.update` 遍历实体池，依次调用 `entity.update(deltaTime)`；
- 更新后 `Scene` 对实体对执行 AABB 碰撞检测，可移动实体会被推开；
- `Scene.render` 调用 `entity.render(renderer.getContext())` 完成绘制。

可移动判定：`Player.speed > 0`，或实体上 `movable === true`（如 `SpriteEntity`）。

## 注意事项

1. **`id` 在场景内必须唯一**，由 `EntityPool` 校验。
2. **`getLocation` / `getSize` 返回副本**，修改返回值不影响实体内部状态。
3. 新增实体类型应继承 `Entity` 并实现 `update` 与 `render`，而非仅实现 `RenderableEntity` 接口。
4. 碰撞体默认与 `location` + `size` 对齐，复杂形状可在子类中扩展 `getAABB`（当前基类未覆盖）。
