# EntityPool 实体池模块说明
`EntityPool` 是自定义游戏引擎中用于**统一管理 Player 及其子类实体**的核心模块，解决了游戏场景中多实体零散管理导致的**生命周期混乱**、**属性校验失效**、**批量操作繁琐**等问题。该模块深度适配 `Player` 类的属性特性与方法体系，提供安全的实体增删改查、灵活的合并策略、专属的筛选能力和生命周期钩子，是游戏场景实体管理的基础支撑。

## 模块简介
在游戏开发中，一个场景通常包含大量玩家、怪物、道具等 `Player` 子类实体，直接通过数组/对象零散管理会面临以下痛点：
- 实体新增/更新时易绕过 `Player` 的属性校验，传入非法值导致渲染异常；
- 批量添加/删除实体需重复编写循环逻辑，代码冗余；
- 实体状态变更时无法统一注入业务逻辑（如资源释放、渲染更新）；
- 按渲染形状、坐标范围等 `Player` 专属属性筛选实体需手动遍历，效率低下。

`EntityPool` 针对这些痛点做了专门设计：
- 深度适配 `Player` 类的方法体系，提供**三种合并策略**，确保实体属性更新时始终经过类型校验；
- 封装批量操作方法，支持一键批量添加、查询、删除实体；
- 内置生命周期钩子，在实体新增/更新/删除/池清空时注入自定义业务逻辑；
- 提供 `Player` 专属筛选方法，快速按形状、坐标、透明度等属性筛选实体；
- 严格的类型校验与 ID 合法性检查，避免无效实体进入管理池。

## 核心功能
1. **实体基础管理**
    - **增/更**：`update` 方法支持实体的新增与更新，新增时存入实体池，更新时根据合并策略安全赋值；
    - **查**：`get` 按 ID 单查、`getAll` 获取所有实体、`batchGet` 批量按 ID 查询；
    - **删**：`remove` 按 ID 单删、`batchRemove` 批量删除、`clear` 清空整个实体池；
    - **辅助检查**：`has` 检查实体是否存在、`getSize` 获取实体池数量。

2. **灵活的实体合并策略**
    - **浅合并（SHALLOW）**：直接通过 `Object.assign` 覆盖属性，效率最高，适合基础类型属性；
    - **深度合并（DEEP）**：对 `border` 等对象、`location` 等数组做层级合并，避免直接覆盖复杂属性；
    - **方法式合并（METHOD_BASED）**：核心推荐策略，调用 `Player` 的 `setLocation`/`setOpacity` 等方法赋值，确保属性经过类的内置校验，彻底避免非法值。

3. **批量操作能力**
    - 提供 `batchUpdate`/`batchGet`/`batchRemove` 方法，适配游戏场景初始化、批量加载实体的业务需求，减少循环调用的冗余代码。

4. **Player 专属筛选**
    - `filterByShape`：按渲染形状（`rect`/`circle`）筛选实体，适用于区分不同渲染类型的实体；
    - `filterByLocationRange`：按坐标范围筛选实体，适用于视口裁剪、碰撞检测前置筛选；
    - `filterByOpacity`：按透明度范围筛选实体，适用于特效渲染、半透明实体处理；
    - 保留基础 `filter` 方法，支持自定义筛选条件。

5. **生命周期钩子**
    - 支持 `onAdd`（实体新增）、`onUpdate`（实体更新）、`onRemove`（实体删除）、`onClear`（池清空）四个钩子；
    - 可在钩子中注入资源注册、渲染更新、内存释放等业务逻辑，实现实体状态的统一管控。

6. **类型安全与校验**
    - 校验实体必须是 `Player` 或其子类实例，避免非目标实体进入管理池；
    - 检查实体 ID 为非空字符串，避免无效 ID 导致的 Map 管理混乱；
    - 对批量操作的入参（如数组）做类型检查，抛出明确的错误提示。

## 核心实现概述
1. **实体存储核心**
    - 使用 `Map<string, T>` 作为实体存储容器，以实体 `id` 为键、实体实例为值，保证实体查询与删除的时间复杂度为 O(1)；
    - 所有实体操作均基于该 Map 实现，确保管理的高效性。

2. **合并策略实现**
    - **浅合并**：直接调用 `Object.assign` 覆盖目标实体属性，适用于基础类型；
    - **深度合并**：遍历源实体属性，对对象做层级合并、数组做浅拷贝、基础类型直接赋值，适配 `Player` 的复杂属性；
    - **方法式合并**：先合并非核心属性，再调用 `Player` 的专属 `set` 方法赋值核心属性（如 `location`/`opacity`），强制触发属性校验。

3. **生命周期钩子管理**
    - 通过 `EntityPoolHooks` 类型定义钩子接口，构造函数接收钩子参数并存储；
    - 在实体操作的关键节点（新增/更新/删除/清空）调用对应的钩子函数，传递实体实例等参数，实现业务逻辑的注入。

4. **Player 专属适配**
    - 基于 `Player` 的渲染属性（`shape`/`opacity`）和位置属性（`location`）设计专属筛选方法，减少开发者的手动遍历成本；
    - 方法式合并中优先调用 `Player` 的实例方法，确保属性更新符合类的校验规则。

## 基础使用示例
### 1. 模块导入
```typescript
import { EntityPool, MergeStrategy, type EntityPoolHooks } from "./EntityPool";
import { Player } from "./Player/player";
```

### 2. 创建实体池
可传入生命周期钩子和默认合并策略（推荐使用 `METHOD_BASED` 保证属性校验）：
```typescript
// 定义生命周期钩子
const hooks: EntityPoolHooks<Player> = {
  onAdd: (entity) => {
    console.log(`实体【${entity.id}】已添加，名称：${entity.name}`);
  },
  onRemove: (entity) => {
    console.log(`实体【${entity.id}】已删除`);
  }
};

// 创建实体池，指定钩子和默认合并策略
const playerPool = new EntityPool<Player>(hooks, MergeStrategy.METHOD_BASED);
```

### 3. 实体增删改查
#### 3.1 新增实体
```typescript
// 创建 Player 实体
const hero = new Player({
  id: "player_001",
  name: "勇者",
  location: [100, 200],
  size: [50, 80],
  shape: "circle",
  hp: 100 // 动态扩展属性
});

const monster = new Player({
  id: "monster_001",
  name: "史莱姆",
  location: [300, 400],
  size: [30, 30],
  shape: "rect",
  hp: 50
});

// 单个新增
playerPool.update(hero);

// 批量新增
playerPool.batchUpdate([monster]);

// 查看实体池数量
console.log("实体池数量：", playerPool.getSize()); // 输出：2
```

#### 3.2 查询实体
```typescript
// 按 ID 查询
const heroEntity = playerPool.get("player_001");
console.log("勇者坐标：", heroEntity?.getLocation()); // 输出：[100, 200]

// 批量按 ID 查询
const entities = playerPool.batchGet(["player_001", "monster_001"]);
console.log("批量查询结果：", entities);

// 获取所有实体
const allEntities = playerPool.getAll();
console.log("所有实体：", allEntities);

// 检查实体是否存在
console.log("是否存在史莱姆：", playerPool.has("monster_001")); // 输出：true
```

#### 3.3 更新实体
使用默认的方法式合并，自动触发 `Player` 的属性校验：
```typescript
// 创建更新后的实体（仅修改需要更新的属性）
const heroUpdated = new Player({
  id: "player_001",
  location: [150, 250], // 新坐标
  opacity: 0.8 // 新透明度
});

// 执行更新
playerPool.update(heroUpdated);

// 查看更新结果
console.log("勇者更新后坐标：", playerPool.get("player_001")?.getLocation()); // 输出：[150, 250]
```

#### 3.4 删除实体
```typescript
// 按 ID 删除
const isRemoved = playerPool.remove("monster_001");
console.log("史莱姆是否删除成功：", isRemoved); // 输出：true

// 批量删除
const removedCount = playerPool.batchRemove(["player_001", "non_exist_id"]);
console.log("成功删除数量：", removedCount); // 输出：1

// 清空实体池
playerPool.clear();
console.log("清空后实体池数量：", playerPool.getSize()); // 输出：0
```

## 高级用法示例
### 1. Player 专属筛选
适用于场景视口裁剪、渲染过滤等业务场景：
```typescript
// 重新添加实体
playerPool.batchUpdate([hero, monster]);

// 按渲染形状筛选（圆形）
const circleEntities = playerPool.filterByShape("circle");
console.log("圆形实体：", circleEntities); // 输出：[hero]

// 按坐标范围筛选（x: 0-200，y: 0-300）
const inViewEntities = playerPool.filterByLocationRange([0, 200], [0, 300]);
console.log("视口内实体：", inViewEntities); // 输出：[hero]

// 按透明度筛选（0.5-1）
const opacityEntities = playerPool.filterByOpacity(0.5, 1);
console.log("透明度符合的实体：", opacityEntities); // 输出：[hero, monster]

// 自定义筛选（血量大于50）
const highHpEntities = playerPool.filter(entity => entity.hp > 50);
console.log("高血量实体：", highHpEntities); // 输出：[hero]
```

### 2. 自定义合并策略
更新实体时可指定临时合并策略，覆盖默认策略：
```typescript
const heroShallowUpdate = new Player({
  id: "player_001",
  border: { width: 2, color: "#ffffff" }
});

// 使用浅合并更新实体
playerPool.update(heroShallowUpdate, MergeStrategy.SHALLOW);
```

### 3. 遍历实体
使用 `forEach` 方法遍历所有实体，执行自定义逻辑：
```typescript
// 遍历实体并打印信息
playerPool.forEach((entity, index) => {
  console.log(`第${index+1}个实体：ID=${entity.id}，名称=${entity.name}`);
});
```

## 注意事项
1. **实体 ID 的唯一性**
    - 实体池以 `id` 作为唯一标识，新增实体时需确保 `id` 不重复，否则会触发更新逻辑而非新增；
    - 禁止传入空字符串或无效 `id`，模块会抛出错误提示。

2. **合并策略的选择**
    - 推荐使用 `METHOD_BASED` 策略，确保 `Player` 核心属性的更新经过类型校验，避免非法值；
    - 仅对基础类型属性更新时，可使用 `SHALLOW` 策略提升效率；
    - 对 `border` 等复杂对象属性更新时，可使用 `DEEP` 策略实现层级合并。

3. **生命周期钩子的资源管理**
    - 在 `onRemove`/`onClear` 钩子中建议释放实体关联的渲染资源、事件监听器等，避免内存泄漏；
    - `onUpdate` 钩子会传递旧实体和新实体实例，可用于对比属性变更并执行同步逻辑。

4. **Player 子类的适配**
    - 实体池支持管理 `Player` 的子类实例，子类需继承 `Player` 的属性和方法，确保合并策略与筛选方法的兼容性；
    - 子类新增的核心属性，可在方法式合并中扩展赋值逻辑。

5. **批量操作的入参校验**
    - 批量操作方法（如 `batchUpdate`）要求入参为数组，传入非数组会抛出错误，需确保入参类型正确。