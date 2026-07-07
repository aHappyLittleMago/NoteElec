# 碰撞模块

AABB（轴对齐包围盒）矩形碰撞检测与简单分离响应。

## API

| 函数 | 说明 |
|------|------|
| `checkAABB(a, b)` | 检测两个 AABB 是否重叠 |
| `resolveAABB(a, b)` | 计算最小分离向量 `{ x, y }` |

## 类型

```typescript
type AABB = { x: number; y: number; width: number; height: number };
```

## 集成

`Scene.update` 在实体更新后遍历 `entityPool`，对重叠实体调用 `checkAABB` / `resolveAABB` 做简单碰撞响应。可移动实体（`Player` 且 `speed > 0`）会被推开，静态障碍物不参与位移。
