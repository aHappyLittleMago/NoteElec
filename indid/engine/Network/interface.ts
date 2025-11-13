import type { PalyerStateType } from "../Player/player";
/**
 * 客户端事件定义
 * 待拓展
 */
type NetworkClientEvents = {
    connected: (playerId: string) => void; // 连接成功并获取玩家id
    playerJoined: (player: PalyerStateType) => void; // 新玩家加入
    playerLeft: (playerId: string) => void; // 玩家离开
    stateUpdate: (states: PalyerStateType[]) => void; // 收到全局状态更新
    error: (message: string) => void; // 错误事件
};

export type {NetworkClientEvents };