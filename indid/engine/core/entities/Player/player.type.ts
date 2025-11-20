/**
 * Player状态TS声明
 * 实体状态定义
 */
interface PlayerStateType {
    id: string; // 实体唯一标识
    location: [x: number, y: number]; // 位置坐标 [x, y]
    size: [w: number, h: number]; // 尺寸 [宽, 高]
    background?: string; // 背景色（支持CSS颜色格式）
    opacity?: number; // 透明度（0-1，默认1）
    rotation?: number; // 旋转角度（弧度，默认0）
    border?: {
      width: number; // 边框宽度
      color: string; // 边框颜色
    }; // 边框样式（可选）
    shape?: 'rect' | 'circle'; // 形状（默认矩形）
    imageSrc?: string; // 图片资源路径（优先于背景色绘制）
  }

export type {PlayerStateType};