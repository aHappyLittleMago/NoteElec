# 引擎配置模块

全局配置单例，提供 canvas 与 player 默认参数。不包含 server 配置（后端已废弃）。

## 用法

```typescript
import { Config } from './config';

const config = Config.getInstance();
const canvas = config.get('canvas');   // { width: 800, height: 600 }
const player = config.get('player');   // { defaultSpeed: 200, defaultSize: [50, 50] }
```

## 配置项

| Key | 字段 | 默认值 |
|-----|------|--------|
| `canvas` | `width`, `height` | 800 × 600 |
| `player` | `defaultSpeed`, `defaultSize` | 200, [50, 50] |

## 类型

见 `config.type.ts` 中的 `GameConfig`。
