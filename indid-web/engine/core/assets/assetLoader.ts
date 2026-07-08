import type { LoadImagesInput, LoadProgressCallback } from './assetLoader.type';

/**
 * 图片资源加载器
 * 预加载并缓存 HTMLImageElement，供 Renderer / Sprite 等模块复用
 */
class AssetLoader {
  private static instance: AssetLoader;
  private cache = new Map<string, HTMLImageElement>();
  private pending = new Map<string, Promise<HTMLImageElement>>();

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * 加载单张图片
   * @param url 图片 URL
   * @param key 缓存键（默认使用 url）
   */
  async loadImage(url: string, key?: string): Promise<HTMLImageElement> {
    const cacheKey = key ?? url;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const inflight = this.pending.get(cacheKey);
    if (inflight) {
      return inflight;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(cacheKey, img);
        this.pending.delete(cacheKey);
        resolve(img);
      };
      img.onerror = () => {
        this.pending.delete(cacheKey);
        reject(new Error(`AssetLoader: 图片加载失败 "${url}"`));
      };
      img.src = url;
    });

    this.pending.set(cacheKey, promise);
    return promise;
  }

  /**
   * 批量加载图片
   * @param input URL 数组或 key → URL 映射
   * @param onProgress 加载进度回调
   */
  async loadImages(
    input: LoadImagesInput,
    onProgress?: LoadProgressCallback
  ): Promise<void> {
    const entries: [string, string][] = Array.isArray(input)
      ? input.map((url) => [url, url] as [string, string])
      : Object.entries(input);

    const total = entries.length;
    let loaded = 0;

    const report = (): void => {
      onProgress?.(loaded, total);
    };

    report();

    await Promise.all(
      entries.map(async ([key, url]) => {
        await this.loadImage(url, key);
        loaded += 1;
        report();
      })
    );
  }

  /** 获取已缓存图片 */
  get(key: string): HTMLImageElement | undefined {
    return this.cache.get(key);
  }

  /** 是否已缓存指定 key */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export { AssetLoader };
