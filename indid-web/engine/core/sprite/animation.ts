import type { AnimationOptions, SourceRect } from './sprite.type';

/**
 * 帧动画控制器
 * 按 fps 推进帧序列，支持循环与单次播放
 */
class Animation {
  private frames: SourceRect[];
  private fps: number;
  private loop: boolean;
  private currentIndex = 0;
  private elapsed = 0;
  private playing = false;
  private finished = false;

  constructor(options: AnimationOptions) {
    if (options.frames.length === 0) {
      throw new Error('Animation: frames 不能为空');
    }
    this.frames = options.frames;
    this.fps = options.fps ?? 8;
    this.loop = options.loop ?? true;
  }

  /** 帧更新，推进动画时间 */
  update(deltaTime: number): void {
    if (!this.playing || this.finished) {
      return;
    }

    this.elapsed += deltaTime;
    const frameDuration = 1 / this.fps;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      const nextIndex = this.currentIndex + 1;

      if (nextIndex >= this.frames.length) {
        if (this.loop) {
          this.currentIndex = 0;
        } else {
          this.currentIndex = this.frames.length - 1;
          this.finished = true;
          this.playing = false;
          break;
        }
      } else {
        this.currentIndex = nextIndex;
      }
    }
  }

  /** 获取当前帧源矩形 */
  getCurrentFrame(): SourceRect {
    return this.frames[this.currentIndex];
  }

  /** 开始播放 */
  play(): void {
    this.playing = true;
    this.finished = false;
  }

  /** 停止播放（保持当前帧） */
  stop(): void {
    this.playing = false;
  }

  /** 重置到第一帧 */
  reset(): void {
    this.currentIndex = 0;
    this.elapsed = 0;
    this.finished = false;
  }

  /** 是否正在播放 */
  isPlaying(): boolean {
    return this.playing;
  }
}

export { Animation };
