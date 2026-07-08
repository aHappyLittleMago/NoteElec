# 碰撞模块说明

AABB（轴对齐包围盒）矩形碰撞检测与最小分离向量计算，供 `Scene` 内置碰撞响应使用。

## 模块简介

本模块提供纯函数式碰撞工具，不依赖实体类：

- `checkAABB` 判断两个矩形是否重叠；
- `resolveAABB` 计算将移动体 A 推离参考体 B 的最小位移修正量。

`Scene.update` 在实体更新后自动遍历实体对，对重叠实体施加分离位移。

## 核心 API

| 函数 | 签名 | 说明 |
|------|------|------|
| `checkAABB` | `(a: AABB, b: AABB) => boolean` | 检测是否重叠 |
| `resolveAABB` | `(a: AABB, b: AABB) => { x: number; y: number }` | 计算 A 应施加的分离位移 |

### 类型 `AABB`

```typescript
type AABB = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

实体通过 `Entity.getAABB()` 生成碰撞体，约定 `x/y` 为左上角，`width/height` 为宽高。

## 基础使用示例

```typescript
import { checkAABB, resolveAABB } from '../collision/collision';

const playerBox = { x: 100, y: 100, width: 32, height: 32 };
const wallBox = { x: 120, y: 90, width: 40, height: 80 };

if (checkAABB(playerBox, wallBox)) {
  const correction = resolveAABB(playerBox, wallBox);
  player.setLocation(
    player.getX() + correction.x,
    player.getY() + correction.y
  );
}
```

## Scene 内置集成

`Scene` 私有方法 `detectCollisions` 逻辑：

1. 遍历实体池中所有实体对；
2. `checkAABB` 检测重叠；
3. 根据可移动性分离：
   - 仅 A 可移动 → A 承受全部修正；
   - 仅 B 可移动 → B 承受反向修正；
   - 双方可移动 → 修正量各分担一半。

可移动判定：

- `entity instanceof Player && (entity.speed ?? 0) > 0`；
- 或 `movable === true`（如 `SpriteEntity`）。

静态障碍物（`Player` 且 `speed` 未设或为 0）不参与位移。

## 注意事项

1. 仅支持**轴对齐矩形**，不支持旋转碰撞体或圆形精确检测。
2. `resolveAABB` 沿重叠最小轴分离，适合简单 2D 游戏，非物理引擎级模拟。
3. 复杂碰撞逻辑可在 `SceneHooks.onUpdate` 中自行调用本模块 API 扩展。
4. 实体 `location` / `size` 变更后应使用最新 `getAABB()` 再检测。
