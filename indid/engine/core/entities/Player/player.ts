/**
 * Player类
 * 用于声明玩家状态实例
 */
class Player {
    // 公开属性
    public id: string = "-1";
    public name: string = "undefined"; 
    public location: [x: number, y: number] = [0, 0];
    public size: [h: number, w: number] = [1, 1];
    public background: string = 'gray';

    // 允许动态添加任意字符串键的属性
    [key: string]: any;

    constructor(params: { [key: string]: any } = {}) {
        // 遍历参数中的所有自有属性
        for (const key in params) {
            if (params.hasOwnProperty(key)) { 
                this[key] = params[key]; 
            }
        }
    }

    getX(){
        return this.location[0];
    };
    getY(){
        return this.location[1];
    };
    getH(){
        return this.size[0];
    };
    getW(){
        return this.size[1];
    };
}

/**
 * Player状态TS声明
 */
type PlayerStateType = {
    // 必须属性
    id: string;
    name: string;
    location: [x: number, y: number];
    size: [h: number, w: number];
    background: string;

    // 允许自定义属性
    [key: string]: any;
}

export { Player };
export type {PlayerStateType};