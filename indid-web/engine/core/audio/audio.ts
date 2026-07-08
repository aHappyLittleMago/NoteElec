import { AssetLoader } from '../assets/assetLoader';
import type { AudioVolumeConfig } from './audio.type';

/**
 * 轻量音频管理器
 * 基于 HTMLAudioElement，SFX/BGM 分离，适合嵌入小游戏
 */
class AudioManager {
  private static instance: AudioManager;
  private assetLoader: AssetLoader;
  private sfxCache = new Map<string, HTMLAudioElement>();
  private bgm: HTMLAudioElement | null = null;
  private bgmKey: string | null = null;
  private sfxVolume = 1;
  private bgmVolume = 0.5;

  private constructor() {
    this.assetLoader = AssetLoader.getInstance();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** 设置 SFX / BGM 音量（0–1） */
  setVolume(config: AudioVolumeConfig): void {
    if (config.sfx !== undefined) {
      this.sfxVolume = clampVolume(config.sfx);
    }
    if (config.bgm !== undefined) {
      this.bgmVolume = clampVolume(config.bgm);
      if (this.bgm) {
        this.bgm.volume = this.bgmVolume;
      }
    }
  }

  /**
   * 播放音效（可叠加）
   * @param urlOrKey URL 或 AssetLoader 缓存键
   */
  async playSFX(urlOrKey: string): Promise<void> {
    const audio = await this.resolveAudio(urlOrKey, this.sfxCache);
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = this.sfxVolume;
    void clone.play().catch(() => {
      // 嵌入页可能因用户未交互而阻止自动播放，静默忽略
    });
  }

  /**
   * 播放背景音乐
   * @param urlOrKey URL 或缓存键
   * @param loop 是否循环
   */
  async playBGM(urlOrKey: string, loop = true): Promise<void> {
    if (this.bgm && this.bgmKey === urlOrKey) {
      if (this.bgm.paused) {
        void this.bgm.play().catch(() => {});
      }
      return;
    }

    this.stopBGM();
    const audio = await this.resolveAudio(urlOrKey, this.sfxCache);
    this.bgm = audio;
    this.bgmKey = urlOrKey;
    this.bgm.loop = loop;
    this.bgm.volume = this.bgmVolume;
    void this.bgm.play().catch(() => {});
  }

  /** 停止背景音乐 */
  stopBGM(): void {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
      this.bgmKey = null;
    }
  }

  private async resolveAudio(
    urlOrKey: string,
    cache: Map<string, HTMLAudioElement>
  ): Promise<HTMLAudioElement> {
    const cached = cache.get(urlOrKey);
    if (cached) {
      return cached;
    }

    let src = urlOrKey;
    const img = this.assetLoader.get(urlOrKey);
    if (img?.src) {
      src = img.src;
    }

    const audio = new Audio(src);
    cache.set(urlOrKey, audio);
    return audio;
  }
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export { AudioManager };
