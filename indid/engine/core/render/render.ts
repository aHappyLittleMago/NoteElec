import { PlayerStateType } from "../entities/Player/player.type";

/**
 * 渲染模块
 * 负责画面渲染
 */
class Renderer {
    // 私有成员声明
    private canvas: HTMLCanvasElement | null; // canvas元素
    private ctx: CanvasRenderingContext2D | null; // canvas实例
    private width: number; // 画布宽度
    private height: number;// 画布高度

    /**
     * 
     * @param canvasId canvas元素id
     */
    constructor(canvasId: string) {
        // 获取Canvas元素并初始化
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!this.canvas) {
            throw new Error(`未找到ID为${canvasId}的Canvas元素`);
        }
        // 创建canvas 2d绘制实例
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error("当前环境不支持canvas 2d绘制，无法获取到canvas实例");
        }
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    /**
     * 
     * @param backgroundColor 清屏默认背景
     * @returns void
     */
    clear(backgroundColor: string = '#ffffff'): void {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * 
     * @param entity : PlayerStateType 实体
     * @returns 
     */
    drawEntity(entity : PlayerStateType) {
        if (!this.ctx) {
            return;
        }
        this.ctx.fillStyle = entity.color || '#ff0000'; // 设置实例背景
        this.ctx.fillRect(entity.location[0], entity.location[1], entity.size[0], entity.size[1]); // 绘制实例
    }

    /**
     * 获取canvas尺寸
     */
    getSize() {
        return { width: this.width, height: this.height };
    }
}

export { Renderer };