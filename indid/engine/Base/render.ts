/**
 * 渲染模块
 */
class Renderer {
    // 私有成员声明
    private canvas: HTMLCanvasElement | null; // canvas元素
    private ctx: CanvasRenderingContext2D | null; // canvas实例
    private width: number; // 画布宽度
    private height: number;// 画布高度

    // 构造函数
    // 接收指定canvas元素ID
    constructor(canvasId: string) {
        // 获取Canvas元素并初始化
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!this.canvas) {
            throw new Error(`未找到ID为${canvasId}的Canvas元素`);
        }
        // 获取canvas实例
        this.ctx = this.canvas.getContext('2d'); 
        if(!this.ctx){
            throw new Error("当前环境不支持canvas 2d绘制，无法获取到canvas实例");
        }
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    // 清屏（填充背景色）
    clear(backgroundColor: string = '#ffffff') {
        if(!this.ctx){
            return;
        }
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 绘制实体（支持矩形，参数：{x, y, width, height, color}）
    drawEntity(entity: any) {
        if(!this.ctx){
            return;
        }
        this.ctx.fillStyle = entity.color || '#ff0000'; // 设置实例背景
        this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height); // 绘制实例
    }

    // 获取Canvas尺寸
    getSize() {
        return { width: this.width, height: this.height };
    }
}

export {Renderer};