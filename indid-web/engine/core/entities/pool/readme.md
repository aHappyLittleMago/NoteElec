# EntityPool 实体池模块说明

`EntityPool` 是游戏引擎中用于**托管 `Entity` 实例**的核心模块，提供增删改查、批量操作、对象复用与筛选能力。场景（`Scene`）为每个场景创建专属实体池，实现实体隔离与生命周期管理。

## 模块简介

实体池解决以下常见问题：

- 实体散落数组/对象中，难以统一管理与销毁；
- 高频创建/销毁实体导致 GC 压力；
- 需要按形状、坐标、透明度等条件快速筛选实体。

本模块采用**纯托管**设计：不修改实体内部属性，属性变更由实体自身方法负责。

## 核心 API

| 方法 | 签名 | 说明 |
|------|------|------|
| `add` | `(entity: Entity) => void` | 托管实体（ID 不可重复） |
| `batchAdd` | `(entities: Entity[], errorStrategy?) => number` | 批量添加 |
| `get` | `(id: string) => Entity \| undefined` | 按 ID 查询 |
| `batchGet` | `(ids: string[]) => (Entity \| undefined)[]` | 批量查询 |
| `getAll` | `() => Entity[]` | 获取所有托管实体 |
| `has` | `(id: string) => boolean` | 是否已托管 |
| `getSize` | `() => number` | 托管数量 |
| `remove` | `(id: string) => boolean` | 取消托管 |
| `batchRemove` | `(ids: string[], errorStrategy?) => number` | 批量移除 |
| `clear` | `() => void` | 清空托管池 |
| `recycle` | `(id: string) => boolean` | 回收至空闲池 |
| `getOrCreate` | `(createFn, resetFn) => Entity` | 优先复用空闲实例 |
| `clearFreePool` | `(destroyFn?) => void` | 清空空闲池 |
| `filter` | `(predicate) => Entity[]` | 自定义筛选 |
| `filterByShape` | `(shape: 'rect' \| 'circle') => Entity[]` | 按 Player 形状筛选 |
| `filterByLocationRange` | `(xRange, yRange) => Entity[]` | 按坐标范围筛选 |
| `filterByOpacity` | `(opacityRange?) => Entity[]` | 按透明度筛选 |
| `forEach` | `(callback) => void` | 遍历实体 |
| `destroy` | `(destroyFn?) => void` | 销毁池并释放资源 |

### 生命周期钩子（`EntityPoolHooks`）

| 钩子 | 触发时机 |
|------|----------|
| `onAdd` | 实体被托管 |
| `onRemove` | 实体被取消托管 |
| `onClear` | 池被清空 |
| `onRecycle` | 实体被回收至空闲池 |
| `onReuse` | 从空闲池复用实体 |

### 批量错误策略（`BatchErrorStrategy`）

- `ABORT`（默认）：遇错立即中断
- `IGNORE`：跳过失败项继续处理

## 基础使用示例

```typescript
import { EntityPool } from '../pool/entitiesPool';
import { Player } from '../Player/player';

const pool = new EntityPool({
  onAdd: (entity) => console.log(`添加 ${entity.id}`),
  onRemove: (entity) => console.log(`移除 ${entity.id}`),
});

const hero = new Player({
  id: 'player_001',
  location: [100, 200],
  size: [50, 50],
  background: '#3B82F6',
});

pool.add(hero);
console.log(pool.get('player_001')?.getLocation()); // [100, 200]

pool.remove('player_001');
pool.clear();
```

## 对象复用示例

适用于子弹、粒子等高频创建销毁场景：

```typescript
let nextId = 0;

function spawnBullet(pool: EntityPool, x: number, y: number): void {
  const bullet = pool.getOrCreate(
    () =>
      new Player({
        id: `bullet_${nextId++}`,
        location: [x, y],
        size: [8, 8],
        background: '#FBBF24',
        shape: 'circle',
      }),
    (entity) => {
      entity.setLocation(x, y);
    }
  );

  if (!pool.has(bullet.id)) {
    pool.add(bullet);
  }
}

// 子弹失效后回收而非销毁
pool.recycle('bullet_0');
```

## 筛选示例

```typescript
const circles = pool.filterByShape('circle');
const inView = pool.filterByLocationRange([0, 400], [0, 300]);
const semiTransparent = pool.filterByOpacity([0.3, 0.8]);
const highHp = pool.filter((e) => e instanceof Player && (e.hp as number) > 50);
```

## 与 Scene 的关系

`Scene` 构造时自动创建专属 `EntityPool`，通过 `addEntity` / `removeEntity` / `getEntity` 代理操作。场景销毁时调用 `entityPool.destroy()` 释放所有实体。

## 注意事项

1. **实体必须是 `Entity` 子类实例**，且 `id` 为非空字符串。
2. **`add` 不允许重复 ID**；更新实体属性应直接调用实体方法，而非重复 `add`。
3. **`recycle` 会先 `remove` 再入空闲池**；复用后需再次 `add` 才会参与场景更新与渲染。
4. **`destroy` 会清空托管池与空闲池**，场景切换时必须调用，避免内存泄漏。
5. 筛选方法 `filterByShape` / `filterByOpacity` 仅对 `Player` 实例生效。
