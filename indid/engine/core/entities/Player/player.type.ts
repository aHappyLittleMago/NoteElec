/**
 * Player状态TS声明
 * 实体状态定义
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

export type {PlayerStateType};