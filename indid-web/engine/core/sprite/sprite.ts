import { AssetLoader } from '../assets/assetLoader';
import type { SourceRect } from './sprite.type';

/**
 * 精灵绘制器
 * 从 AssetLoader 缓存的图片中按源矩形裁切并绘制到 Canvas
 */
class Sprite {
  private imageKey: string;
  private assetLoader: AssetLoader;

  /**
   * @param imageKey AssetLoader 缓存键
   * @param assetLoader 可选，默认使用单例
   */
  constructor(imageKey: string, assetLoader?: AssetLoader) {
    this.imageKey = imageKey;
    this.assetLoader = assetLoader ?? AssetLoader.getInstance();
  }

  /**
   * 绘制精灵帧
   * @param ctx Canvas 2D 上下文
   * @param frame 源矩形
   * @param destX 目标 x
   * @param destY 目标 y
   * @param destW 目标宽
   * @param destH 目标高
   */
  draw(
    ctx: CanvasRenderingContext2D,
    frame: SourceRect,
    destX: number,
    destY: number,
    destW: number,
    destH: number
  ): void {
    const img = this.assetLoader.get(this.imageKey);
    if (!img) {
      console.warn(`Sprite: 未找到缓存图片 "${this.imageKey}"，请先预加载`);
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(destX, destY, destW, destH);
      return;
    }

    ctx.drawImage(
      img,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      destX,
      destY,
      destW,
      destH
    );
  }
}

export { Sprite };
