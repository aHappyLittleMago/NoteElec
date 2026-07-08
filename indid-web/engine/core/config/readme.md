# Config 引擎配置模块说明

`Config` 是引擎级全局配置单例，提供 Canvas 尺寸与 Player 默认参数。不包含 server 相关配置（后端已废弃）。

## 模块简介

嵌入小游戏时，多处模块需要一致的默认值（画布大小、玩家速度等）。`Config` 集中管理这些常量，避免硬编码分散。

当前配置分组：

| Key | 字段 | 默认值 |
|-----|------|--------|
| `canvas` | `width`, `height` | 800 × 600 |
| `player` | `defaultSpeed`, `defaultSize` | 200, [50, 50] |

## 核心 API

| 方法 | 签名 | 说明 |
|------|------|------|
| `getInstance` | `() => Config` | 获取单例 |
| `get` | `<K extends keyof GameConfig>(key: K) => GameConfig[K]` | 按 key 读取配置分组 |

### 类型 `GameConfig`

见 `config.type.ts`：

```typescript
type GameConfig = {
  canvas: { width: number; height: number };
  player: { defaultSpeed: number; defaultSize: [number, number] };
};
```

## 基础使用示例

```typescript
import { Config } from '../config/config';

const config = Config.getInstance();
const { width, height } = config.get('canvas');
const { defaultSpeed, defaultSize } = config.get('player');

console.log(`画布 ${width}×${height}，默认速度 ${defaultSpeed}`);
```

### 与 React 组件配合

`GameCanvas` 组件默认从 Config 读取 canvas 尺寸：

```typescript
import { GameCanvas } from '../../src/components/GameCanvas';

<GameCanvas /> // 默认 800×600
<GameCanvas width={1024} height={768} /> // 覆盖默认值
```

## 注意事项

1. 当前为**只读配置**，构造时写死默认值，运行时无 `set` 方法。
2. 如需项目级自定义，可在初始化前扩展 Config 实现，或直接传 props 覆盖（如 `GameCanvas` 的 `width`/`height`）。
3. 不包含网络、服务端、多人同步相关配置项。
