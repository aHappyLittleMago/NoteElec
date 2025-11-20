/**
 * Player实体类
 * 维护玩家实体的基础属性及渲染相关扩展属性，适配渲染模块的实体规范
 * 包含严格的类型校验、属性操作方法，支持动态扩展属性
 */
class Player {
    // --- 基础核心属性（必选，带默认值）---
    public id: string = "-1"; // 实体唯一标识
    public location: [x: number, y: number] = [0, 0]; // 位置坐标 [x, y]
    public size: [w: number, h: number] = [1, 1]; // 尺寸 [宽, 高]（修正原[h,w]顺序）

    // --- 渲染扩展属性（可选，带默认值）---
    public background?: string = 'gray'; // 背景色（CSS格式，默认灰色）
    public opacity?: number = 1; // 透明度（0-1，默认完全不透明）
    public rotation?: number = 0; // 旋转角度（弧度，默认无旋转）
    public border?: { width: number; color: string }; // 边框样式（默认无）
    public shape?: 'rect' | 'circle' = 'rect'; // 渲染形状（默认矩形）
    public imageSrc?: string; // 图片资源路径（优先于背景色，默认无）

    // --- 业务扩展属性 ---
    public name: string = "undefined"; // 实体命名

    // --- 动态扩展能力：允许添加任意字符串键的属性 ---
    [key: string]: any;

    /**
     * 构造函数 - 初始化实体属性，对所有属性进行严格类型校验
     * @param params 自定义实体属性（可选）
     * @throws {TypeError} 当参数类型不符合要求时抛出错误
     */
    constructor(params: { [key: string]: any } = {}) {
        // 定义所有属性的校验规则（基础属性 + 渲染扩展属性）
        const validators = {
            id: (v: any) => typeof v === 'string',
            name: (v: any) => typeof v === 'string',
            location: (v: any) => Array.isArray(v) && v.length === 2 && 
                typeof v[0] === 'number' && typeof v[1] === 'number',
            size: (v: any) => Array.isArray(v) && v.length === 2 && 
                typeof v[0] === 'number' && typeof v[1] === 'number',
            background: (v: any) => typeof v === 'string' || v === undefined,
            opacity: (v: any) => (typeof v === 'number' && v >= 0 && v <= 1) || v === undefined, // 限制0-1
            rotation: (v: any) => typeof v === 'number' || v === undefined,
            border: (v: any) => (v === undefined) || (typeof v === 'object' && v !== null && 
                typeof v.width === 'number' && typeof v.color === 'string'),
            shape: (v: any) => v === 'rect' || v === 'circle' || v === undefined,
            imageSrc: (v: any) => typeof v === 'string' || v === undefined
        };

        // 校验并初始化所有关键属性
        (Object.keys(validators) as (keyof typeof validators)[]).forEach(key => {
            if (params[key] !== undefined) {
                if (!validators[key](params[key])) {
                    throw new TypeError(this.getValidationErrorMsg(key));
                }
                // @ts-expect-error
                // 忽略此错误
                
                this[key] = params[key];
            }
        });

        // 处理动态扩展属性（排除已校验的关键属性）
        const processedKeys = new Set(Object.keys(validators));
        for (const key in params) {
            if (params.hasOwnProperty(key) && !processedKeys.has(key)) {
                this[key] = params[key];
            }
        }
    }

    /**
     * 私有工具方法：生成属性校验的错误提示信息
     * @param key 校验失败的属性名
     * @returns 格式化的错误信息
     */
    private getValidationErrorMsg(key: string): string {
        const errorMap: Record<string, string> = {
            id: 'expected string',
            name: 'expected string',
            location: 'expected number[] [x, y]',
            size: 'expected number[] [w, h] (width, height)',
            background: 'expected string (CSS color) or undefined',
            opacity: 'expected number between 0 and 1 or undefined',
            rotation: 'expected number (radian) or undefined',
            border: 'expected { width: number; color: string } or undefined',
            shape: 'expected "rect" | "circle" or undefined',
            imageSrc: 'expected string (image path) or undefined'
        };
        return `Invalid type for ${key}: ${errorMap[key] || 'unknown error'}`;
    }

    // --- 位置相关操作方法（保留原逻辑，无修改）---
    getX(): number {
        return this.location[0];
    }

    getY(): number {
        return this.location[1];
    }

    setX(x: number): void {
        if (typeof x !== 'number') {
            throw new TypeError('x must be a number');
        }
        this.location[0] = x;
    }

    setY(y: number): void {
        if (typeof y !== 'number') {
            throw new TypeError('y must be a number');
        }
        this.location[1] = y;
    }

    getLocation(): [x: number, y: number] {
        return [...this.location] as [number, number];
    }

    setLocation(x: number, y: number): void;
    setLocation(location: [x: number, y: number]): void;
    setLocation(xOrLocation: number | [number, number], y?: number): void {
        if (typeof xOrLocation === 'number' && typeof y === 'number') {
            this.location = [xOrLocation, y];
        } else if (Array.isArray(xOrLocation) && xOrLocation.length === 2) {
            const [x, y] = xOrLocation;
            if (typeof x === 'number' && typeof y === 'number') {
                this.location = [x, y];
            } else {
                throw new TypeError('location array must contain numbers [x, y]');
            }
        } else {
            throw new TypeError('setLocation requires (x: number, y: number) or ([x: number, y: number])');
        }
    }

    // --- 尺寸相关操作方法（核心修改：适配[w, h]顺序）---
    /** 获取实体宽度（对应size[0]） */
    getW(): number {
        return this.size[0];
    }

    /** 获取实体高度（对应size[1]） */
    getH(): number {
        return this.size[1];
    }

    /** 设置实体宽度 */
    setW(w: number): void {
        if (typeof w !== 'number') {
            throw new TypeError('w must be a number');
        }
        this.size[0] = w;
    }

    /** 设置实体高度 */
    setH(h: number): void {
        if (typeof h !== 'number') {
            throw new TypeError('h must be a number');
        }
        this.size[1] = h;
    }

    /** 获取实体尺寸（返回拷贝防止外部修改内部状态） */
    getSize(): [w: number, h: number] {
        return [...this.size] as [number, number];
    }

    /** 设置实体尺寸（支持两种参数形式，适配[w, h]顺序） */
    setSize(w: number, h: number): void;
    setSize(size: [w: number, h: number]): void;
    setSize(wOrSize: number | [number, number], h?: number): void {
        if (typeof wOrSize === 'number' && typeof h === 'number') {
            this.size = [wOrSize, h];
        } else if (Array.isArray(wOrSize) && wOrSize.length === 2) {
            const [w, h] = wOrSize;
            if (typeof w === 'number' && typeof h === 'number') {
                this.size = [w, h];
            } else {
                throw new TypeError('size array must contain numbers [w, h]');
            }
        } else {
            throw new TypeError('setSize requires (w: number, h: number) or ([w: number, h: number])');
        }
    }

    // --- 渲染扩展属性的快捷操作方法（新增，提升开发体验）---
    /** 设置透明度（强制0-1范围） */
    setOpacity(opacity: number): void {
        if (typeof opacity !== 'number' || opacity < 0 || opacity > 1) {
            throw new TypeError('opacity must be a number between 0 and 1');
        }
        this.opacity = opacity;
    }

    /** 设置旋转角度（弧度） */
    setRotation(rotation: number): void {
        if (typeof rotation !== 'number') {
            throw new TypeError('rotation must be a number (radian)');
        }
        this.rotation = rotation;
    }

    /** 设置边框样式 */
    setBorder(width: number, color: string): void {
        if (typeof width !== 'number' || typeof color !== 'string') {
            throw new TypeError('border requires width (number) and color (string)');
        }
        this.border = { width, color };
    }

    /** 设置渲染形状（仅允许rect/circle） */
    setShape(shape: 'rect' | 'circle'): void {
        this.shape = shape;
    }

    /** 设置图片资源路径 */
    setImageSrc(imageSrc: string): void {
        if (typeof imageSrc !== 'string') {
            throw new TypeError('imageSrc must be a string (image path)');
        }
        this.imageSrc = imageSrc;
    }
}

export { Player };