import { browserPlatform } from '../../../platform/browser';
import type { PlatformAPI } from '../../../platform/types';

/**
 * 存档管理器
 * 通过平台 API 将游戏状态 JSON 序列化到 localStorage
 */
class SaveManager {
  private static instance: SaveManager;
  private platform: PlatformAPI;

  private constructor(platform: PlatformAPI = browserPlatform) {
    this.platform = platform;
  }

  static getInstance(platform?: PlatformAPI): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager(platform);
    }
    return SaveManager.instance;
  }

  /** 保存数据 */
  save<T>(key: string, data: T): void {
    this.platform.setStorageItem(key, JSON.stringify(data));
  }

  /** 读取数据，不存在或解析失败时返回 null */
  load<T>(key: string): T | null {
    const raw = this.platform.getStorageItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(`SaveManager: 无法解析存档 "${key}"`);
      return null;
    }
  }

  /** 删除存档 */
  remove(key: string): void {
    this.platform.removeStorageItem(key);
  }
}

export { SaveManager };
