/**
 * 实体位置与尺寸元组类型
 */
export type EntityLocation = [x: number, y: number];
export type EntitySize = [w: number, h: number];

/** Entity 构造函数基础参数 */
export type EntityBaseParams = {
  id: string;
  location?: EntityLocation;
  size?: EntitySize;
  /** 是否参与 Scene 碰撞检测，默认 true */
  collidable?: boolean;
};
