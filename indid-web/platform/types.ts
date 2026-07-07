/**
 * 平台抽象接口
 * 用于隔离 Web / Electron / Tauri 等平台差异
 */
export interface PlatformAPI {
  getStorageItem(key: string): string | null;
  setStorageItem(key: string, value: string): void;
}
