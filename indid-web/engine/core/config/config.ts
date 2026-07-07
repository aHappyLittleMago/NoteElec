import type { GameConfig } from './config.type';

/**
 * 全局配置单例
 * 提供 canvas / player 等引擎级默认参数
 */
class Config {
  private static instance: Config;
  private readonly config: GameConfig;

  private constructor() {
    this.config = {
      canvas: { width: 800, height: 600 },
      player: { defaultSpeed: 200, defaultSize: [50, 50] },
    };
  }

  /** 获取配置单例 */
  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * 按 key 读取配置项
   * @param key 配置分组名
   */
  get<K extends keyof GameConfig>(key: K): GameConfig[K] {
    return this.config[key];
  }
}

export { Config };
