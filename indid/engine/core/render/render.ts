import { PlayerStateType } from "../entities/Player/player.type";

/**
 * 通用实体渲染接口（支持多种实体类型，不局限于Player）
 * 任何需要被渲染的实体都应遵循此接口
 */
interface RenderableEntity {
  id: string; // 实体唯一标识
  location: [x: number, y: number]; // 位置坐标 [x, y]
  size: [w: number, h: number]; // 尺寸 [宽, 高]
  background?: string; // 背景色（支持CSS颜色格式）
  color?: string; // 兼容旧版属性（优先级低于background）
  opacity?: number; // 透明度（0-1，默认1）
  rotation?: number; // 旋转角度（弧度，默认0）
  border?: {
    width: number; // 边框宽度
    color: string; // 边框颜色
  }; // 边框样式（可选）
  shape?: 'rect' | 'circle'; // 形状（默认矩形）
  imageSrc?: string; // 图片资源路径（优先于背景色绘制）
}

/**
 * 渲染模块
 * 负责游戏画面的绘制与Canvas管理，支持多种实体类型和绘制样式
 */
class Renderer {
  // 核心属性
  private canvas: HTMLCanvasElement; // Canvas元素（非空，构造函数确保初始化）
  private ctx: CanvasRenderingContext2D; // 2D渲染上下文（非空）
  private width: number; // 画布实际宽度（与canvas像素宽一致）
  private height: number; // 画布实际高度（与canvas像素高一致）
  private offscreenCanvas?: HTMLCanvasElement; // 离屏Canvas（用于缓存静态资源）
  private offscreenCtx?: CanvasRenderingContext2D | null; // 离屏渲染上下文

  /**
   * 初始化渲染器
   * @param canvasId Canvas元素ID
   * @throws {Error} 当Canvas元素不存在或不支持2D渲染时抛出错误
   */
  constructor(canvasId: string) {
    // 获取Canvas元素并校验
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error(`Renderer初始化失败：未找到ID为"${canvasId}"的Canvas元素`);
    }
    this.canvas = canvas;

    // 获取2D渲染上下文并校验
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Renderer初始化失败：当前环境不支持Canvas 2D渲染上下文');
    }
    this.ctx = ctx;

    // 初始化尺寸（以Canvas元素的实际像素宽高为准）
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 初始化离屏Canvas（用于缓存静态资源，提升性能）
    this.initOffscreenCanvas();
  }

  /**
   * 初始化离屏Canvas（用于缓存静态实体，减少重复绘制开销）
   */
  private initOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  /**
   * 清除画布（支持透明清屏）
   * @param backgroundColor 背景色（默认白色，传'transparent'可透明清屏）
   * @param useOffscreen 是否清理离屏Canvas（默认false）
   */
  clear(backgroundColor: string = '#ffffff', useOffscreen: boolean = false): void {
    const targetCtx = useOffscreen && this.offscreenCtx ? this.offscreenCtx : this.ctx;

    // 保存当前上下文状态（避免影响后续绘制）
    targetCtx.save();
    // 清屏（覆盖整个画布）
    targetCtx.fillStyle = backgroundColor;
    targetCtx.fillRect(0, 0, this.width, this.height);
    // 恢复上下文状态
    targetCtx.restore();
  }

  /**
   * 绘制单个实体（支持多种样式和形状）
   * @param entity 待绘制的实体（支持RenderableEntity或PlayerStateType）
   * @param useOffscreen 是否绘制到离屏Canvas（默认false，用于缓存）
   */
  drawEntity(
    entity: RenderableEntity | PlayerStateType,
    useOffscreen: boolean = false
  ): void {
    const ctx = useOffscreen && this.offscreenCtx ? this.offscreenCtx : this.ctx;

    // 校验实体必要属性（避免绘制错误）
    if (!this.validateEntity(entity)) {
      console.warn(`跳过无效实体绘制（ID: ${(entity as any).id || '未知'}）`);
      return;
    }

    // 解析实体属性（兼容旧版PlayerStateType）
    const {
      location: [x, y],
      size: [w, h],
      background = entity.color || '#ff0000', // 兼容旧版color属性
      opacity = 1,
      rotation = 0,
      border,
      shape = 'rect',
      imageSrc
    } = entity as RenderableEntity;

    // 保存当前上下文状态（避免旋转/透明度影响其他绘制）
    ctx.save();

    // 应用透明度
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity)); // 限制在0-1之间

    // 平移到实体中心点（用于旋转）
    ctx.translate(x + w / 2, y + h / 2);
    // 应用旋转
    ctx.rotate(rotation);
    // 平移回原位置（抵消中心点平移）
    ctx.translate(-(x + w / 2), -(y + h / 2));

    // 优先绘制图片（如果有图片资源）
    if (imageSrc) {
      this.drawImage(ctx, imageSrc, x, y, w, h);
    } else {
      // 根据形状绘制实体
      switch (shape) {
        case 'rect':
          this.drawRect(ctx, x, y, w, h, background, border);
          break;
        case 'circle':
          this.drawCircle(ctx, x + w / 2, y + h / 2, w / 2, background, border); // 以宽为直径
          break;
      }
    }

    // 恢复上下文状态
    ctx.restore();
  }

  /**
   * 批量绘制实体（优化性能，减少上下文切换）
   * @param entities 实体数组
   */
  drawEntities(entities: (RenderableEntity | PlayerStateType)[]): void {
    // 批量绘制前保存一次状态
    this.ctx.save();
    entities.forEach(entity => this.drawEntity(entity));
    // 批量绘制后恢复一次状态
    this.ctx.restore();
  }

  /**
   * 绘制矩形（内部工具方法）
   */
  private drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor: string,
    border?: { width: number; color: string }
  ): void {
    // 绘制填充
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);

    // 绘制边框（如果有）
    if (border && border?.width > 0 && border.color) {
      ctx.strokeStyle = border.color;
      ctx.lineWidth = border.width;
      ctx.strokeRect(x, y, w, h);
    }
  }

  /**
   * 绘制圆形（内部工具方法）
   */
  private drawCircle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    fillColor: string,
    border?: { width: number; color: string }
  ): void {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    // 绘制填充
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 绘制边框（如果有）
    if (border && border?.width > 0 && border.color) {
      ctx.strokeStyle = border.color;
      ctx.lineWidth = border.width;
      ctx.stroke();
    }
  }

  /**
   * 绘制图片（内部工具方法，支持自动加载图片）
   */
  private drawImage(
    ctx: CanvasRenderingContext2D,
    src: string,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const img = new Image();
    img.src = src;
    // 图片加载完成后绘制
    img.onload = () => ctx.drawImage(img, x, y, w, h);
    // 图片加载失败时 fallback 到矩形
    img.onerror = () => {
      console.warn(`图片加载失败：${src}，将使用默认矩形绘制`);
      this.drawRect(ctx, x, y, w, h, '#cccccc'); // 灰色占位
    };
  }

  /**
   * 从离屏Canvas绘制缓存内容到主Canvas（用于静态资源复用）
   */
  drawOffscreenCache(): void {
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  }

  /**
   * 调整Canvas尺寸（支持响应式）
   * @param width 新宽度（像素）
   * @param height 新高度（像素）
   * @param scaleWithWindow 是否跟随窗口大小调整（默认false）
   */
  resize(width: number, height: number, scaleWithWindow: boolean = false): void {
    // 更新Canvas像素尺寸
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    // 更新离屏Canvas尺寸
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
    }

    // 如果需要跟随窗口大小，监听resize事件
    if (scaleWithWindow) {
      window.addEventListener('resize', () => {
        this.resize(window.innerWidth, window.innerHeight);
      });
    }
  }

  /**
   * 获取当前Canvas尺寸
   * @returns 包含width和height的尺寸对象
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * 获取Canvas元素引用（谨慎使用，避免外部直接修改）
   * @returns Canvas元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * 校验实体是否符合绘制要求（内部工具方法）
   * @param entity 待校验实体
   * @returns 是否有效
   */
  private validateEntity(entity: any): entity is RenderableEntity | PlayerStateType {
    // 检查必要属性是否存在且合法
    return (
      typeof entity === 'object' &&
      Array.isArray(entity.location) &&
      entity.location.length === 2 &&
      typeof entity.location[0] === 'number' &&
      typeof entity.location[1] === 'number' &&
      Array.isArray(entity.size) &&
      entity.size.length === 2 &&
      typeof entity.size[0] === 'number' &&
      entity.size[0] > 0 && // 宽度必须为正数
      typeof entity.size[1] === 'number' &&
      entity.size[1] > 0 // 高度必须为正数
    );
  }
}

export { Renderer };
export type {RenderableEntity};