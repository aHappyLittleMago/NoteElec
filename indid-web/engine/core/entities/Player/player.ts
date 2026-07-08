/**
 * Player实体类
 * 维护玩家实体的基础属性及渲染相关扩展属性，适配渲染模块的实体规范
 * 包含严格的类型校验、属性操作方法，支持动态扩展属性
 */
import { Entity } from '../Entity/entity';
import type { PlayerBorder, PlayerKnownParams, PlayerParams } from './player.type';
import { AssetLoader } from '../../assets/assetLoader';
type ValidatorKey = keyof PlayerKnownParams;

class Player extends Entity {
    public background?: string = 'gray';
    public opacity?: number = 1;
    public rotation?: number = 0;
    public border?: { width: number; color: string };
    public shape?: 'rect' | 'circle' = 'rect';
    public imageSrc?: string;

    public name: string = "undefined";
    public speed?: number;

    private updateFn: (deltaTime: number) => void = () => { };

    [key: string]: unknown;

    constructor(params: PlayerParams = {}) {
        super({
            id: params.id ?? '-1',
            location: params.location,
            size: params.size,
        });

        const validators: Record<ValidatorKey, (v: unknown) => boolean> = {
            id: (v) => typeof v === 'string',
            name: (v) => typeof v === 'string',
            location: (v) => Array.isArray(v) && v.length === 2 &&
                typeof v[0] === 'number' && typeof v[1] === 'number',
            size: (v) => Array.isArray(v) && v.length === 2 &&
                typeof v[0] === 'number' && typeof v[1] === 'number',
            update: (v) => typeof v === 'function',
            background: (v) => typeof v === 'string' || v === undefined,
            opacity: (v) => (typeof v === 'number' && v >= 0 && v <= 1) || v === undefined,
            rotation: (v) => typeof v === 'number' || v === undefined,
            border: (v) => (v === undefined) || (typeof v === 'object' && v !== null &&
                typeof (v as PlayerBorder).width === 'number' && typeof (v as PlayerBorder).color === 'string'),
            shape: (v) => v === 'rect' || v === 'circle' || v === undefined,
            imageSrc: (v) => typeof v === 'string' || v === undefined,
            speed: (v) => typeof v === 'number' || v === undefined,
        };

        (Object.keys(validators) as ValidatorKey[]).forEach(key => {
            if (params[key] !== undefined) {
                if (!validators[key](params[key])) {
                    throw new TypeError(this.getValidationErrorMsg(key));
                }
                if (key === 'update') {
                    this.updateFn = (params.update as (deltaTime: number) => void).bind(this);
                } else if (key !== 'id' && key !== 'location' && key !== 'size') {
                    (this as Record<string, unknown>)[key] = params[key];
                }
            }
        });

        const processedKeys = new Set(Object.keys(validators));
        for (const key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key) && !processedKeys.has(key as ValidatorKey)) {
                this[key] = params[key];
            }
        }
    }

    update(deltaTime: number): void {
        this.updateFn(deltaTime);
    }

    render(ctx: CanvasRenderingContext2D): void {
        const [x, y] = this.getLocation();
        const [w, h] = this.getSize();
        const opacity = this.opacity ?? 1;
        const rotation = this.rotation ?? 0;

        ctx.save();
        ctx.globalAlpha = opacity;

        if (rotation !== 0) {
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate(rotation);
            ctx.translate(-(x + w / 2), -(y + h / 2));
        }

        if (this.imageSrc) {
            const img = AssetLoader.getInstance().get(this.imageSrc);
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, x, y, w, h);
            } else if (this.background) {
                ctx.fillStyle = this.background;
                ctx.fillRect(x, y, w, h);
            }
        } else if (this.background) {
            ctx.fillStyle = this.background;
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, w, h);
            }
        }

        if (this.border) {
            ctx.strokeStyle = this.border.color;
            ctx.lineWidth = this.border.width;
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeRect(x, y, w, h);
            }
        }

        ctx.restore();
    }

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
            imageSrc: 'expected string (image path) or undefined',
            speed: 'expected number or undefined',
        };
        return `Invalid type for ${key}: ${errorMap[key] || 'unknown error'}`;
    }

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

    getW(): number {
        return this.size[0];
    }

    getH(): number {
        return this.size[1];
    }

    setW(w: number): void {
        if (typeof w !== 'number') {
            throw new TypeError('w must be a number');
        }
        this.size[0] = w;
    }

    setH(h: number): void {
        if (typeof h !== 'number') {
            throw new TypeError('h must be a number');
        }
        this.size[1] = h;
    }

    getSize(): [w: number, h: number] {
        return [...this.size] as [number, number];
    }

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

    setOpacity(opacity: number): void {
        if (typeof opacity !== 'number' || opacity < 0 || opacity > 1) {
            throw new TypeError('opacity must be a number between 0 and 1');
        }
        this.opacity = opacity;
    }

    setRotation(rotation: number): void {
        if (typeof rotation !== 'number') {
            throw new TypeError('rotation must be a number (radian)');
        }
        this.rotation = rotation;
    }

    setBorder(width: number, color: string): void {
        if (typeof width !== 'number' || typeof color !== 'string') {
            throw new TypeError('border requires width (number) and color (string)');
        }
        this.border = { width, color };
    }

    setShape(shape: 'rect' | 'circle'): void {
        this.shape = shape;
    }

    setImageSrc(imageSrc: string): void {
        if (typeof imageSrc !== 'string') {
            throw new TypeError('imageSrc must be a string (image path)');
        }
        this.imageSrc = imageSrc;
    }
}

export { Player };
