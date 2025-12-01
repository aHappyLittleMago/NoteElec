import type { PlayerStateType } from "../../core/entities/Player/player";
/**
 * 客户端事件定义
 * 待拓展
 */
type NetworkClientEvents = {
    connected: (playerId: string) => void; // 连接成功并获取玩家id
    playerJoined: (player: PlayerStateType) => void; // 新玩家加入
    playerLeft: (playerId: string) => void; // 玩家离开
    stateUpdate: (states: PlayerStateType[]) => void; // 收到全局状态更新
    error: (message: string) => void; // 错误事件
};

export type {NetworkClientEvents };