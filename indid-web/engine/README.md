# NoteElec 引擎模块索引

`indid-web/engine/` 是自研 2D Canvas 游戏引擎的 Web 实现，纯浏览器客户端，无后端依赖。

公共导出入口：[`engine/index.ts`](./index.ts)  
React 嵌入容器：[`src/components/GameCanvas.tsx`](../src/components/GameCanvas.tsx)  
**模块交互文档**（默认）：[`src/components/ModuleShowcase.tsx`](../src/components/ModuleShowcase.tsx)

---

## 模块一览

| 模块 | 路径 | 说明 | README |
|------|------|------|--------|
| GameLoop | `core/loop/` | 游戏循环、帧率控制、暂停/恢复 | [readme.md](./core/loop/readme.md) |
| Renderer | `core/render/` | Canvas 2D 绘制、离屏缓存、`drawText` | [README.md](./core/render/README.md) |
| Input | `core/io/` | 键盘、鼠标、触摸输入 | [readme.md](./core/io/readme.md) |
| Scene | `core/scene/` | 场景生命周期、实体托管、碰撞调度 | [README.md](./core/scene/README.md) |
| Entity | `core/entities/Entity/` | 实体基类（update / render / AABB） | [readme.md](./core/entities/Entity/readme.md) |
| Player | `core/entities/Player/` | 可渲染玩家实体，属性校验 | [README.md](./core/entities/Player/README.md) |
| EntityPool | `core/entities/pool/` | 实体托管、批量操作、对象复用 | [readme.md](./core/entities/pool/readme.md) |
| Collision | `core/collision/` | AABB 碰撞检测与分离 | [readme.md](./core/collision/readme.md) |
| Config | `core/config/` | 全局配置单例（canvas / player 默认值） | [readme.md](./core/config/readme.md) |
| AssetLoader | `core/assets/` | 图片预加载与缓存 | [readme.md](./core/assets/readme.md) |
| Sprite / Animation | `core/sprite/` | 精灵图裁切、帧动画、`SpriteEntity` | [readme.md](./core/sprite/readme.md) |
| SaveManager | `core/save/` | localStorage JSON 存档 | [readme.md](./core/save/readme.md) |
| AudioManager | `core/audio/` | SFX / BGM（**可选**，嵌入游戏可不使用） | [readme.md](./core/audio/readme.md) |

---

## 能力概览

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Input     │────▶│  GameLoop   │────▶│   Scene     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │ EntityPool  │           │  Collision  │           │  Renderer   │
             └──────┬──────┘           └─────────────┘           └─────────────┘
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
     Player   SpriteEntity   自定义 Entity
                    │
              AssetLoader + Sprite/Animation

持久化: SaveManager    音频（可选）: AudioManager    默认值: Config
```

**核心流程：** `GameLoop` 驱动 → `Scene` 更新实体 → 碰撞响应 → 实体 `render` → `Renderer` 绘制 HUD。

---

## 快速开始：最小游戏

### 1. 安装与运行

```bash
cd indid-web
npm install
npm run dev    # 启动后默认打开模块交互文档
npm run build  # 生产构建
```

### 2. 导入引擎

```typescript
import {
  GameLoop,
  Renderer,
  Input,
  Scene,
  Player,
  Config,
} from './engine';
```

### 3. 挂载 Canvas（React）

```tsx
import { GameCanvas } from './components/GameCanvas';

<GameCanvas id="gameCanvas" onReady={() => initGame()} />
```

### 4. 初始化场景

```typescript
const config = Config.getInstance();
const loop = new GameLoop();
const renderer = new Renderer('gameCanvas');
const input = new Input('gameCanvas');

const scene = new Scene(
  { id: 'main', gameLoop: loop, renderer, background: '#1E293B' },
  {
    onActivate: (s) => {
      s.addEntity(
        new Player({
          id: 'player',
          location: [400, 300],
          size: config.get('player').defaultSize,
          speed: config.get('player').defaultSpeed,
          background: '#3B82F6',
          update(deltaTime) {
            if (input.isKeyPressed('ArrowRight')) {
              this.setX(this.getX() + (this.speed ?? 0) * deltaTime);
            }
          },
        })
      );
    },
    onRender: (s) => {
      s.getRendererInstance().drawText('Hello Engine', 16, 16, {
        color: '#fff',
        font: 'bold 18px sans-serif',
      });
    },
  }
);

scene.activate();
loop.start();
```

### 5. 预加载资源（使用精灵图时）

```typescript
import { AssetLoader, SpriteEntity } from './engine';

await AssetLoader.getInstance().loadImage('/sprites/player.png', 'player-sheet');
// 然后创建 SpriteEntity 并 addEntity
```

### 6. 清理

```typescript
loop.stop();
scene.destroy();
input.destroy?.(); // Input 需在卸载时 destroy
```

---

## 可选能力说明

| 能力 | 是否必需 | 说明 |
|------|----------|------|
| AssetLoader | 使用图片/精灵时必需 | 否则显示灰色占位 |
| SaveManager | 可选 | 高分、进度持久化 |
| AudioManager | 可选 | 浏览器可能拦截自动播放 |
| SpriteEntity | 可选 | 可用 `Player` 色块代替 |

---

## 模块交互文档（ModuleShowcase）

`npm run dev` 启动后默认进入 [`ModuleShowcase`](../src/components/ModuleShowcase.tsx)：

- **左侧导航**：按引擎模块切换（GameLoop、Renderer、Input … Audio）
- **文档区**：中文简介、API 代码示例、交互开关
- **Canvas 区**：共享单画布，随所选模块切换迷你演示（Audio 仅文档，无 live demo）

演示实现见 [`src/components/moduleShowcase/`](../src/components/moduleShowcase/)。

---

## 本地验证

```bash
npm run build
npm run lint
npx tsc --noEmit
```

---

## 相关文档

- 项目 Agent 指南：[`../AGENTS.md`](../AGENTS.md)
- Web 客户端说明：[`../README.md`](../README.md)
