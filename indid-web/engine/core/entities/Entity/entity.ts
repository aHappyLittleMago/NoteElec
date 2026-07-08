import type { AABB } from '../../collision/collision.type';
import type { EntityBaseParams, EntityLocation, EntitySize } from './entity.type';

/**
 * 实体基类
 * 定义所有游戏实体的公共接口：更新、渲染、位置与尺寸查询
 */
abstract class Entity {
  public id: string;
  public location: EntityLocation;
  public size: EntitySize;
  /** 是否参与 Scene 碰撞检测 */
  public collidable: boolean;

  constructor(params: EntityBaseParams) {
    this.id = params.id;
    this.location = params.location ?? [0, 0];
    this.size = params.size ?? [1, 1];
    this.collidable = params.collidable ?? true;
  }

  /** 帧更新逻辑 */
  abstract update(deltaTime: number): void;

  /** 在 Canvas 上绘制实体 */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /** 获取当前位置副本 */
  getLocation(): EntityLocation {
    return [...this.location] as EntityLocation;
  }

  /** 设置位置 */
  setLocation(x: number, y: number): void;
  setLocation(location: EntityLocation): void;
  setLocation(xOrLocation: number | EntityLocation, y?: number): void {
    if (typeof xOrLocation === 'number' && typeof y === 'number') {
      this.location = [xOrLocation, y];
    } else if (Array.isArray(xOrLocation) && xOrLocation.length === 2) {
      this.location = [...xOrLocation] as EntityLocation;
    }
  }

  /** 获取当前尺寸副本 */
  getSize(): EntitySize {
    return [...this.size] as EntitySize;
  }

  /** 获取 AABB 碰撞体（供碰撞模块使用） */
  getAABB(): AABB {
    const [x, y] = this.getLocation();
    const [w, h] = this.getSize();
    return { x, y, width: w, height: h };
  }
}

export { Entity };
