/** 精灵图裁切区域（源矩形） */
export type SourceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Animation 构造参数 */
export type AnimationOptions = {
  frames: SourceRect[];
  fps?: number;
  loop?: boolean;
};

/** SpriteEntity 构造参数 */
export type SpriteEntityParams = {
  id: string;
  location?: [number, number];
  size?: [number, number];
  imageKey: string;
  frames?: SourceRect[];
  fps?: number;
  loop?: boolean;
  autoplay?: boolean;
  update?: (deltaTime: number) => void;
};
