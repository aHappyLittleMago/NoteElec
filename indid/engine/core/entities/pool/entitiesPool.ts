import { Player } from "../Player/player";

// 提取Player的核心类型，避免硬编码，提升类型安全
type PlayerShape = NonNullable<Player['shape']>;
type NumericRange = [number, number]; // 数值范围类型（[最小值, 最大值]）

/**
 * 实体池生命周期钩子类型定义
 * 仅关注实体的“托管状态”变化，不关注实体内部属性
 */
type EntityPoolHooks = {
  /** 实体被添加到池时触发 */
  onAdd?: (entity: Player) => void;
  /** 实体被从池中删除时触发 */
  onRemove?: (entity: Player) => void;
  /** 实体池被清空时触发 */
  onClear?: () => void;
  /** 实体被回收至空闲池时触发（对象复用） */
  onRecycle?: (entity: Player) => void;
  /** 实体从空闲池被复用时时触发（对象复用） */
  onReuse?: (entity: Player) => void;
};

/**
 * 批量操作的错误处理策略
 */
enum BatchErrorStrategy {
  /** 遇到错误立即中断（默认） */
  ABORT,
  /** 忽略错误，继续处理剩余实体 */
  IGNORE
}

/**
 * 实体池模块（纯托管+对象复用版）
 * 核心职责：
 * 1. 纯托管Player实例的增删改查与生命周期管理
 * 2. 实现Player实例的复用，减少GC开销
 * 3. 提供高效的实体筛选、遍历能力
 * 不介入实体内部属性修改，完全由Player自身方法负责
 */
class EntityPool {
  // 核心：托管实体的Map（id -> 实例），保证ID查询O(1)
  private readonly entities = new Map<string, Player>();
  // 性能优化：实体数组缓存，避免每次getAll都执行Array.from
  private readonly _entityCache: Player[] = [];
  // 对象复用：空闲实体池，存储已回收的Player实例
  private readonly freePool: Player[] = [];
  // 生命周期钩子
  private readonly hooks: EntityPoolHooks;

  constructor(hooks: EntityPoolHooks = {}) {
    this.hooks = Object.freeze({ ...hooks }); // 冻结钩子，防止外部篡改
  }

  // ============== 基础托管：增删改查 ==============
  /**
   * 添加实体（仅托管，不修改实体属性）
   * 若ID已存在，抛出错误（避免重复托管）
   * @param entity 要托管的Player实例
   */
  add(entity: Player): void {
    // 1. 基础类型校验（复用私有校验方法）
    this._validatePlayerEntity(entity);
    const entityId = entity.id;

    // 2. 重复托管校验
    if (this.entities.has(entityId)) {
      throw new Error(`[EntityPool] 实体ID "${entityId}" 已存在，无法重复添加`);
    }

    // 3. 托管实体并更新缓存
    this.entities.set(entityId, entity);
    this._entityCache.push(entity);

    // 4. 触发生命周期钩子
    this.hooks.onAdd?.(entity);
  }

  /**
   * 批量添加实体
   * @param entities Player实例数组
   * @param errorStrategy 错误处理策略（默认ABORT）
   * @returns 成功添加的实体数量
   */
  batchAdd(entities: Player[], errorStrategy: BatchErrorStrategy = BatchErrorStrategy.ABORT): number {
    // 1. 入参数组校验
    if (!Array.isArray(entities)) {
      throw new Error(`[EntityPool] 批量添加失败：入参必须是Player实例数组`);
    }

    let successCount = 0;
    for (const entity of entities) {
      try {
        this.add(entity);
        successCount++;
      } catch (error) {
        if (errorStrategy === BatchErrorStrategy.ABORT) {
          throw error; // 中断策略：直接抛出错误
        }
        // 忽略策略：打印警告并继续
        console.warn(`[EntityPool] 批量添加实体失败，跳过该实体：`, error);
      }
    }
    return successCount;
  }

  /**
   * 通过ID获取实体（返回原实例引用）
   * @param id 实体唯一标识
   * @returns Player实例 | undefined
   */
  get(id: string): Player | undefined {
    return this.entities.get(id);
  }

  /**
   * 批量按ID获取实体
   * @param ids 实体ID数组
   * @returns Player实例数组（按ID顺序，不存在则为undefined）
   */
  batchGet(ids: string[]): (Player | undefined)[] {
    if (!Array.isArray(ids)) {
      throw new Error(`[EntityPool] 批量获取失败：入参必须是字符串数组`);
    }
    return ids.map(id => this.get(id));
  }

  /**
   * 获取池中所有实体（返回缓存数组的浅拷贝，防止外部篡改内部缓存）
   * @returns Player实例数组（按添加顺序）
   */
  getAll(): Player[] {
    return [...this._entityCache];
  }

  /**
   * 检查实体是否被托管
   * @param id 实体ID
   * @returns 是否存在
   */
  has(id: string): boolean {
    return this.entities.has(id);
  }

  /**
   * 获取托管的实体数量
   * @returns 实体总数
   */
  getSize(): number {
    return this._entityCache.length; // 复用缓存，比this.entities.size更高效
  }

  /**
   * 移除实体（取消托管）
   * @param id 实体ID
   * @returns 是否移除成功
   */
  remove(id: string): boolean {
    // 1. 检查实体是否存在
    const entity = this.entities.get(id);
    if (!entity) return false;

    // 2. 取消托管并更新缓存
    this.entities.delete(id);
    const index = this._entityCache.indexOf(entity);
    if (index > -1) {
      this._entityCache.splice(index, 1);
    }

    // 3. 触发生命周期钩子
    this.hooks.onRemove?.(entity);
    return true;
  }

  /**
   * 批量移除实体
   * @param ids 实体ID数组
   * @param errorStrategy 错误处理策略（默认ABORT）
   * @returns 成功移除的实体数量
   */
  batchRemove(ids: string[], errorStrategy: BatchErrorStrategy = BatchErrorStrategy.ABORT): number {
    if (!Array.isArray(ids)) {
      throw new Error(`[EntityPool] 批量移除失败：入参必须是字符串数组`);
    }

    let successCount = 0;
    for (const id of ids) {
      try {
        if (this.remove(id)) {
          successCount++;
        }
      } catch (error) {
        if (errorStrategy === BatchErrorStrategy.ABORT) {
          throw error;
        }
        console.warn(`[EntityPool] 批量移除实体失败，跳过该ID "${id}"：`, error);
      }
    }
    return successCount;
  }

  /**
   * 清空实体池（取消所有实体的托管）
   */
  clear(): void {
    if (this.getSize() === 0) return; // 空池直接返回，避免无意义操作

    // 1. 触发所有实体的移除钩子
    this._entityCache.forEach(entity => this.hooks.onRemove?.(entity));

    // 2. 清空托管Map和缓存数组
    this.entities.clear();
    this._entityCache.length = 0;

    // 3. 触发清空钩子
    this.hooks.onClear?.();
  }

  // ============== 对象复用：减少GC开销（游戏高频创建销毁实体必备） ==============
  /**
   * 回收实体至空闲池（取消托管，加入复用池）
   * @param id 实体ID
   * @returns 是否回收成功
   */
  recycle(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // 1. 先移除托管
    this.remove(id);

    // 2. 加入空闲池并触发钩子
    this.freePool.push(entity);
    this.hooks.onRecycle?.(entity);
    return true;
  }

  /**
   * 从空闲池复用实体，无可用则创建新实例
   * @param createFn 新实例创建函数（无复用实体时调用）
   * @param resetFn 实体复用时的重置函数（恢复初始状态）
   * @returns Player实例
   */
  getOrCreate(createFn: () => Player, resetFn: (entity: Player) => void): Player {
    // 1. 优先从空闲池取复用实体
    if (this.freePool.length > 0) {
      const entity = this.freePool.pop()!;
      resetFn(entity); // 重置实体状态（如ID、坐标、血量等）
      this.hooks.onReuse?.(entity);
      return entity;
    }

    // 2. 无复用实体则创建新实例
    return createFn();
  }

  /**
   * 清空空闲池
   * @param destroyFn 实体销毁函数（可选，用于释放实体关联的资源）
   */
  clearFreePool(destroyFn?: (entity: Player) => void): void {
    if (destroyFn) {
      this.freePool.forEach(entity => destroyFn(entity));
    }
    this.freePool.length = 0;
  }

  // ============== 高效筛选：Player专属筛选能力 ==============
  /**
   * 过滤实体（仅做查询，不修改）
   * @param predicate 筛选条件
   * @returns 符合条件的Player实例数组
   */
  filter(predicate: (entity: Player) => boolean): Player[] {
    return this._entityCache.filter(predicate); // 复用缓存，提升筛选效率
  }

  /**
   * Player专属筛选：按渲染形状
   * @param shape 渲染形状（rect/circle）
   * @returns 符合形状的Player实例数组
   */
  filterByShape(shape: PlayerShape): Player[] {
    return this.filter(entity => entity.shape === shape);
  }

  /**
   * Player专属筛选：按坐标范围
   * @param xRange x轴范围 [最小值, 最大值]
   * @param yRange y轴范围 [最小值, 最大值]
   * @returns 坐标在范围内的Player实例数组
   */
  filterByLocationRange(xRange: NumericRange, yRange: NumericRange): Player[] {
    // 1. 校验坐标范围的合法性
    this._validateNumericRange(xRange, 'x轴');
    this._validateNumericRange(yRange, 'y轴');

    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;

    // 2. 筛选坐标在范围内的实体
    return this.filter(entity => {
      const [x, y] = entity.location;
      return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
    });
  }

  /**
   * Player专属筛选：按透明度范围
   * @param opacityRange 透明度范围 [最小值, 最大值]（0-1）
   * @returns 透明度在范围内的Player实例数组
   */
  filterByOpacity(opacityRange: NumericRange = [0, 1]): Player[] {
    // 1. 校验透明度范围的合法性
    this._validateNumericRange(opacityRange, '透明度');
    this._validateOpacityRange(opacityRange);

    const [min, max] = opacityRange;

    // 2. 筛选透明度符合的实体（默认透明度为1）
    return this.filter(entity => {
      const opacity = entity.opacity ?? 1;
      return opacity >= min && opacity <= max;
    });
  }

  // ============== 高效遍历 ==============
  /**
   * 遍历实体（仅做查询，不修改）
   * @param callback 回调函数（参数：实体、索引、缓存数组）
   */
  forEach(callback: (entity: Player, index: number, array: Player[]) => void): void {
    this._entityCache.forEach(callback); // 复用缓存，提升遍历效率
  }

  // ============== 私有工具：校验方法（避免代码重复，提升严谨性） ==============
  /**
   * 校验是否为合法的Player实例
   * @param entity 待校验的实体
   */
  private _validatePlayerEntity(entity: unknown): asserts entity is Player {
    if (!(entity instanceof Player)) {
      throw new Error(`[EntityPool] 实体必须是Player类的实例`);
    }

    const entityId = entity.id;
    // 校验ID的合法性（非空字符串）
    if (typeof entityId !== 'string' || entityId.trim() === '') {
      throw new Error(`[EntityPool] 实体ID不合法：必须是非空字符串（当前值："${entityId}"）`);
    }
  }

  /**
   * 校验数值范围的合法性（最小值 <= 最大值）
   * @param range 数值范围
   * @param name 范围名称（用于错误提示）
   */
  private _validateNumericRange(range: unknown, name: string): asserts range is NumericRange {
    if (!Array.isArray(range) || range.length !== 2 || typeof range[0] !== 'number' || typeof range[1] !== 'number') {
      throw new Error(`[EntityPool] ${name}范围不合法：必须是包含两个数字的数组（如[0, 100]）`);
    }

    const [min, max] = range;
    if (min > max) {
      throw new Error(`[EntityPool] ${name}范围不合法：最小值（${min}）不能大于最大值（${max}）`);
    }
  }

  /**
   * 校验透明度范围的合法性（0-1）
   * @param opacityRange 透明度范围
   */
  private _validateOpacityRange(opacityRange: NumericRange): void {
    const [min, max] = opacityRange;
    if (min < 0 || max > 1) {
      throw new Error(`[EntityPool] 透明度范围不合法：必须在0-1之间（当前值：[${min}, ${max}]）`);
    }
  }

  // ============== 销毁清理：防止内存泄漏 ==============
  /**
   * 销毁实体池（清空所有托管和空闲池，解绑钩子）
   * @param destroyFn 实体销毁函数（可选，用于释放资源）
   */
  destroy(destroyFn?: (entity: Player) => void): void {
    // 1. 清空托管池
    this.clear();

    // 2. 清空空闲池并销毁实体
    this.clearFreePool(destroyFn);

    // 3. 解绑所有钩子（防止闭包内存泄漏）
    Object.keys(this.hooks).forEach(key => {
      (this.hooks as Record<string, unknown>)[key] = undefined;
    });
  }
}

export { EntityPool, type EntityPoolHooks, BatchErrorStrategy };