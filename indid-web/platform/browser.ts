import type { PlatformAPI } from './types';

/** Web 浏览器平台实现 */
export const browserPlatform: PlatformAPI = {
  getStorageItem: (key) => localStorage.getItem(key),
  setStorageItem: (key, value) => localStorage.setItem(key, value),
};
