# Entity 实体基类

所有游戏实体的抽象基类，定义统一的更新、渲染与几何查询接口。

## 公共接口

| 方法 | 说明 |
|------|------|
| `update(deltaTime)` | 帧更新逻辑 |
| `render(ctx)` | Canvas 2D 绘制 |
| `getLocation()` | 返回 `[x, y]` |
| `getSize()` | 返回 `[w, h]` |
| `getAABB()` | 返回轴对齐包围盒，供碰撞模块使用 |

## 继承示例

`Player` 继承 `Entity`，扩展渲染样式与属性校验。新增实体类型应同样继承本基类。
