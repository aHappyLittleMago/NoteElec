/** ModuleShowcase 演示区画布布局常量与工具 */

export const DEMO_ASPECT_RATIO = 16 / 9;
export const DEMO_CANVAS_MIN_WIDTH = 320;
export const DEMO_CANVAS_DEFAULT = { width: 640, height: 360 };

/** 根据可用区域计算 16:9 画布像素尺寸 */
function computeDemoCanvasSize(
  availableWidth: number,
  availableHeight: number
): { width: number; height: number } {
  const padding = 12;
  const maxW = Math.max(0, availableWidth - padding);
  const maxH = Math.max(0, availableHeight - padding);

  if (maxW <= 0 || maxH <= 0) {
    return { ...DEMO_CANVAS_DEFAULT };
  }

  let width = maxW;
  let height = width / DEMO_ASPECT_RATIO;

  if (height > maxH) {
    height = maxH;
    width = height * DEMO_ASPECT_RATIO;
  }

  width = Math.floor(Math.max(DEMO_CANVAS_MIN_WIDTH, width));
  height = Math.floor(width / DEMO_ASPECT_RATIO);

  return { width, height };
}

/** 水平居中实体 X */
function centerX(canvasWidth: number, entityWidth: number): number {
  return (canvasWidth - entityWidth) / 2;
}

/** 垂直居中实体 Y */
function centerY(canvasHeight: number, entityHeight: number): number {
  return (canvasHeight - entityHeight) / 2;
}

export { computeDemoCanvasSize, centerX, centerY };
