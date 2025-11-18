/**
 * Player实体类
 * 维护玩家实体的基础属性（ID、名称、位置、尺寸、背景等）及相关操作方法
 */
class Player {
    public id: string = "-1"; // 唯一实体id（字符串类型）
    public name: string = "undefined"; // 实体命名（字符串类型）
    public location: [x: number, y: number] = [0, 0]; // 实体位置坐标（[x,y]数字数组）
    public size: [h: number, w: number] = [1, 1]; // 实体大小（[高,宽]数字数组）
    public background: string = 'gray'; // 实体背景（字符串类型，通常为颜色值）

    // 允许动态添加任意字符串键的属性
    [key: string]: any;

    /**
     * 构造函数 - 初始化实体属性，对关键属性进行类型校验
     * @param params 自定义实体属性（可选）
     * @throws {TypeError} 当参数类型不符合要求时抛出错误
     */
    constructor(params: { [key: string]: any } = {}) {
        // 处理已知关键属性（带类型校验）
        const validators = {
            id: (v: any) => typeof v === 'string',
            name: (v: any) => typeof v === 'string',
            location: (v: any) => Array.isArray(v) && v.length === 2 && 
                typeof v[0] === 'number' && typeof v[1] === 'number',
            size: (v: any) => Array.isArray(v) && v.length === 2 && 
                typeof v[0] === 'number' && typeof v[1] === 'number',
            background: (v: any) => typeof v === 'string'
        };

        // 校验并初始化关键属性
        (Object.keys(validators) as (keyof typeof validators)[]).forEach(key => {
            if (params[key] !== undefined) {
                if (!validators[key](params[key])) {
                    throw new TypeError(`Invalid type for ${key}: expected ${key === 'location' ? 'number[] [x,y]' : 
                                      key === 'size' ? 'number[] [h,w]' : 'string'}`);
                }
                this[key] = params[key];
            }
        });

        // 处理动态扩展属性（排除已处理的关键属性）
        const processedKeys = new Set(Object.keys(validators));
        for (const key in params) {
            if (params.hasOwnProperty(key) && !processedKeys.has(key)) {
                this[key] = params[key];
            }
        }
    }

    /**
     * 获取实体x坐标
     * @returns x坐标（数字）
     */
    getX(): number {
        return this.location[0];
    }

    /**
     * 获取实体y坐标
     * @returns y坐标（数字）
     */
    getY(): number {
        return this.location[1];
    }

    /**
     * 获取实体高度
     * @returns 高度（数字）
     */
    getH(): number {
        return this.size[0];
    }

    /**
     * 获取实体宽度
     * @returns 宽度（数字）
     */
    getW(): number {
        return this.size[1];
    }

    /**
     * 获取实体坐标（返回拷贝防止外部直接修改内部状态）
     * @returns 坐标数组 [x, y]
     */
    getLocation(): [x: number, y: number] {
        return [...this.location] as [number, number];
    }

    /**
     * 获取实体尺寸（返回拷贝防止外部直接修改内部状态）
     * @returns 尺寸数组 [h, w]
     */
    getSize(): [h: number, w: number] {
        return [...this.size] as [number, number];
    }

    /**
     * 设置实体x坐标
     * @param x 目标x坐标（必须为数字）
     * @throws {TypeError} 当x不是数字时抛出错误
     */
    setX(x: number): void {
        if (typeof x !== 'number') {
            throw new TypeError('x must be a number');
        }
        this.location[0] = x;
    }

    /**
     * 设置实体y坐标
     * @param y 目标y坐标（必须为数字）
     * @throws {TypeError} 当y不是数字时抛出错误
     */
    setY(y: number): void {
        if (typeof y !== 'number') {
            throw new TypeError('y must be a number');
        }
        this.location[1] = y;
    }

    /**
     * 设置实体高度
     * @param h 目标高度（必须为数字）
     * @throws {TypeError} 当h不是数字时抛出错误
     */
    setH(h: number): void {
        if (typeof h !== 'number') {
            throw new TypeError('h must be a number');
        }
        this.size[0] = h;
    }

    /**
     * 设置实体宽度
     * @param w 目标宽度（必须为数字）
     * @throws {TypeError} 当w不是数字时抛出错误
     */
    setW(w: number): void {
        if (typeof w !== 'number') {
            throw new TypeError('w must be a number');
        }
        this.size[1] = w;
    }

    /**
     * 设置实体坐标（支持两种参数形式）
     * @param x 目标x坐标 或 坐标数组[x,y]
     * @param y 目标y坐标（当第一个参数为x时必填）
     * @throws {TypeError} 当参数不符合要求时抛出错误
     */
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

    /**
     * 设置实体尺寸（支持两种参数形式）
     * @param h 目标高度 或 尺寸数组[h,w]
     * @param w 目标宽度（当第一个参数为h时必填）
     * @throws {TypeError} 当参数不符合要求时抛出错误
     */
    setSize(h: number, w: number): void;
    setSize(size: [h: number, w: number]): void;
    setSize(hOrSize: number | [number, number], w?: number): void {
        if (typeof hOrSize === 'number' && typeof w === 'number') {
            this.size = [hOrSize, w];
        } else if (Array.isArray(hOrSize) && hOrSize.length === 2) {
            const [h, w] = hOrSize;
            if (typeof h === 'number' && typeof w === 'number') {
                this.size = [h, w];
            } else {
                throw new TypeError('size array must contain numbers [h, w]');
            }
        } else {
            throw new TypeError('setSize requires (h: number, w: number) or ([h: number, w: number])');
        }
    }
}

export { Player };