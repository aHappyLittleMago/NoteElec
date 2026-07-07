/**
 * Player状态TS声明
 * 实体状态定义
 */
interface PlayerStateType {
  id: string;
  location: [x: number, y: number];
  size: [w: number, h: number];
  background?: string;
  opacity?: number;
  rotation?: number;
  border?: PlayerBorder;
  shape?: 'rect' | 'circle';
  imageSrc?: string;
}

type PlayerBorder = {
  width: number;
  color: string;
};

/** Player 构造函数已知属性 */
type PlayerKnownParams = {
  id?: string;
  name?: string;
  location?: [number, number];
  size?: [number, number];
  update?: (deltaTime: number) => void;
  background?: string;
  opacity?: number;
  rotation?: number;
  border?: PlayerBorder;
  shape?: 'rect' | 'circle';
  imageSrc?: string;
  speed?: number;
};

/** 构造函数参数：已知属性 + 动态扩展 */
type PlayerParams = PlayerKnownParams & Record<string, unknown>;

export type { PlayerStateType, PlayerBorder, PlayerKnownParams, PlayerParams };
