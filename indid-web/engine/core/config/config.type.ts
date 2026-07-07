/**
 * 游戏全局配置类型
 * 不包含 server 字段（后端已废弃）
 */
export type GameConfig = {
  canvas: { width: number; height: number };
  player: { defaultSpeed: number; defaultSize: [number, number] };
};
