# SaveManager 模块说明

`SaveManager` 是基于平台抽象层的 JSON 存档管理器，默认使用浏览器 `localStorage`，适合嵌入小游戏的高分、进度等轻量持久化。

## 模块简介

小游戏常需保存最高分、关卡进度等数据。本模块将对象序列化为 JSON 写入平台存储，并处理解析失败等边界情况。

实现依赖 `platform/browser.ts` 的 `getStorageItem` / `setStorageItem` / `removeStorageItem`，便于未来替换存储后端。

## 核心 API

| 方法 | 签名 | 说明 |
|------|------|------|
| `getInstance` | `(platform?: PlatformAPI) => SaveManager` | 获取单例 |
| `save` | `<T>(key: string, data: T) => void` | 序列化并写入 |
| `load` | `<T>(key: string) => T \| null` | 读取并反序列化 |
| `remove` | `(key: string) => void` | 删除存档 |

- `load` 在 key 不存在或 JSON 解析失败时返回 `null`；
- 首次 `getInstance` 可注入自定义 `PlatformAPI`（测试或宿主环境）。

## 基础使用示例

```typescript
import { SaveManager } from '../../engine/core/save/saveManager';

type HighScoreData = { score: number; updatedAt: number };

const save = SaveManager.getInstance();

// 写入
save.save<HighScoreData>('my-game-high-score', {
  score: 1200,
  updatedAt: Date.now(),
});

// 读取
const data = save.load<HighScoreData>('my-game-high-score');
if (data) {
  console.log('最高分', data.score);
}

// 清除
save.remove('my-game-high-score');
```

## 注意事项

1. **key 建议使用项目前缀**，避免与其他站点数据冲突（如 `indid-web-demo-high-score`）。
2. `localStorage` 容量有限（通常约 5MB），勿存大型对象或二进制。
3. 隐私模式下 storage 可能不可用或会被清除，读取失败应优雅降级。
4. 敏感数据不应明文存入 localStorage。
5. 与 `AudioManager` 独立，互不影响。
