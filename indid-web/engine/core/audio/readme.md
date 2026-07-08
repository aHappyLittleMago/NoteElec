# AudioManager 模块说明

`AudioManager` 是轻量 Web 音频封装，基于 `HTMLAudioElement`，提供 SFX / BGM 分离播放与音量控制。适合嵌入网页的小游戏；**可选模块**，嵌入游戏可不引入。

## 模块简介

- SFX 通过 `cloneNode` 叠加播放；
- BGM 单实例循环；
- 音量独立配置（0–1）；
- 自动播放被浏览器拦截时静默忽略。

音频 URL 可直接传入，也可与 `AssetLoader` 缓存键共用（通过 img.src 解析）。

## 核心 API

| 方法 | 签名 | 说明 |
|------|------|------|
| `getInstance` | `() => AudioManager` | 获取单例 |
| `setVolume` | `({ sfx?, bgm? }: AudioVolumeConfig) => void` | 设置音量 0–1 |
| `playSFX` | `(urlOrKey: string) => Promise<void>` | 播放音效（可叠加） |
| `playBGM` | `(urlOrKey: string, loop?: boolean) => Promise<void>` | 播放背景音乐 |
| `stopBGM` | `() => void` | 停止 BGM |

### 类型

```typescript
type AudioVolumeConfig = {
  sfx?: number;
  bgm?: number;
};
```

## 基础使用示例

```typescript
import { AudioManager } from '../../engine/core/audio/audio';

const audio = AudioManager.getInstance();

audio.setVolume({ sfx: 0.8, bgm: 0.4 });

// 建议用户交互后再播放 BGM
document.addEventListener(
  'click',
  () => {
    void audio.playBGM('/audio/bgm.mp3', true);
  },
  { once: true }
);

// 音效
await audio.playSFX('/audio/coin.wav');
```

## 注意事项

1. **浏览器自动播放策略**：未与用户交互前 `play()` 可能失败，模块会静默忽略。
2. 嵌入 iframe 时建议由宿主或首次点击后再 `playBGM`。
3. 音频缓存在 `AudioManager` 内部，与 `AssetLoader` 图片缓存分离。
4. 引擎 Feature Demo 默认不启用音频；需要时在宿主页面按需调用。
5. 不支持 Audio Graph、3D 音效等高级能力。
