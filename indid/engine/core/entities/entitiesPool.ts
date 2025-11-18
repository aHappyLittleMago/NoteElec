import { Player } from "./Player/player";

/**
 * 实体池模块
 * 用于管理所有Player及其子类实体的生命周期和状态
 */
class EntityPool<T extends Player> {
  // 维护实体Map
  private entities = new Map<string, T>();

  /**
   * 添加或更新实体
   * - 若实体id已存在：合并新属性到已有实体（保留未更新的属性）
   * - 若实体id不存在：新增实体到池中
   * @param entity 要添加/更新的实体（必须是Player或其子类实例）
   */
  update(entity: T): void {
    if (!(entity instanceof Player)) {
      throw new Error("实体池只能添加Player或其子类的实例");
    }

    // id查询实体
    const existingEntity = this.entities.get(entity.id);
    if (existingEntity) {
      // 若已存在，合并新属性（保留原有未被覆盖的属性）
      Object.assign(existingEntity, entity);
    } else {
      // 若不存在，直接添加到池
      this.entities.set(entity.id, entity);
    }
  }

  /**
   * 通过id获取实体
   * @param id 实体唯一标识
   * @returns 实体实例（不存在则返回undefined）
   */
  get(id: string): T | undefined {
    return this.entities.get(id);
  }

  /**
   * 获取池中所有实体
   * @returns 实体数组（按添加顺序排列）
   */
  getAll(): T[] {
    return Array.from(this.entities.values());
  }

  /**
   * 通过id删除实体
   * @param id 实体唯一标识
   * @returns 是否删除成功（true：存在并删除；false：不存在）
   */
  remove(id: string): boolean {
    return this.entities.delete(id);
  }

  /**
   * 清空实体池（删除所有实体）
   */
  clear(): void {
    this.entities.clear();
  }

  /**
   * 过滤实体
   * @param predicate 筛选条件（返回true保留实体）
   * @returns 符合条件的实体数组
   */
  filter(predicate: (entity: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }
}

export {EntityPool}