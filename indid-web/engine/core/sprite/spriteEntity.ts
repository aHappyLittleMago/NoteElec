import { Entity } from '../entities/Entity/entity';
import { Animation } from './animation';
import { Sprite } from './sprite';
import type { SourceRect, SpriteEntityParams } from './sprite.type';

/**
 * 精灵实体
 * 继承 Entity，集成 Sprite 与 Animation，适用于嵌入小游戏的可动角色
 */
class SpriteEntity extends Entity {
  private sprite: Sprite;
  private animation: Animation | null;
  private staticFrame: SourceRect;
  private updateFn: (deltaTime: number) => void;

  public movable = true;

  constructor(params: SpriteEntityParams) {
    super({
      id: params.id,
      location: params.location,
      size: params.size,
    });

    this.sprite = new Sprite(params.imageKey);
    this.updateFn = params.update ?? (() => {});

    if (params.frames && params.frames.length > 0) {
      this.animation = new Animation({
        frames: params.frames,
        fps: params.fps,
        loop: params.loop,
      });
      this.staticFrame = params.frames[0];
      if (params.autoplay !== false) {
        this.animation.play();
      }
    } else {
      this.animation = null;
      this.staticFrame = { x: 0, y: 0, width: 1, height: 1 };
    }
  }

  update(deltaTime: number): void {
    this.animation?.update(deltaTime);
    this.updateFn(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const [x, y] = this.getLocation();
    const [w, h] = this.getSize();
    const frame = this.animation?.getCurrentFrame() ?? this.staticFrame;
    this.sprite.draw(ctx, frame, x, y, w, h);
  }

  /** 获取关联的 Animation 实例（用于 play/stop 控制） */
  getAnimation(): Animation | null {
    return this.animation;
  }

  getLocation(): [number, number] {
    return [...this.location] as [number, number];
  }

  setLocation(x: number, y: number): void;
  setLocation(location: [number, number]): void;
  setLocation(xOrLocation: number | [number, number], y?: number): void {
    if (typeof xOrLocation === 'number' && typeof y === 'number') {
      this.location = [xOrLocation, y];
    } else if (Array.isArray(xOrLocation)) {
      this.location = [...xOrLocation] as [number, number];
    }
  }

  getSize(): [number, number] {
    return [...this.size] as [number, number];
  }
}

export { SpriteEntity };
