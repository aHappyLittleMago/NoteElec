import type { AABB } from './collision.type';

/**
 * 检测两个 AABB 是否重叠
 * @param a 碰撞体 A
 * @param b 碰撞体 B
 * @returns 是否发生碰撞
 */
function checkAABB(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * 计算 A 相对于 B 的最小分离向量（用于简单碰撞响应）
 * @param a 移动中的碰撞体
 * @param b 静止或参考碰撞体
 * @returns 应施加到 A 上的位移修正量
 */
function resolveAABB(a: AABB, b: AABB): { x: number; y: number } {
  const overlapLeft = a.x + a.width - b.x;
  const overlapRight = b.x + b.width - a.x;
  const overlapTop = a.y + a.height - b.y;
  const overlapBottom = b.y + b.height - a.y;

  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  if (minOverlapX < minOverlapY) {
    const dir = overlapLeft < overlapRight ? -minOverlapX : minOverlapX;
    return { x: dir, y: 0 };
  }

  const dir = overlapTop < overlapBottom ? -minOverlapY : minOverlapY;
  return { x: 0, y: dir };
}

export { checkAABB, resolveAABB };
