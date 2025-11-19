// network/NetworkClient.ts
import io, { Socket } from "socket.io-client";
import type {NetworkClientEvents} from "./interface.ts";
import type { PlayerStateType } from "../../core/entities/Player/player.type.ts";

class NetworkClient {
  // 私有成员
  private socket: Socket | null;
  private events: Partial<NetworkClientEvents>; // 事件回调存储
  private serverUrl: string = "http://localhost:3000"; // 默认

  // 初始化
  constructor(events: Partial<NetworkClientEvents> | {}) {
    this.socket = null;
    this.events = events; // 初始化客户端事件回调；
  }

  // 连接
  connect(): void {
    // 如果已有socket实例，停止重复创建
    if (this.socket) return;

    this.socket = io(this.serverUrl); // 连接服务器

    // 注册服务器事件
    // 连接事件
    this.socket.on("connect", () => {
      console.log("连接服务器成功");
    });

    // 接收id：接收服务器分配的玩家id
    this.socket.on("assignId", (playerId: string) => {
      this.events.connected?.call(this, playerId);
    });

    // 新玩家加入：
    this.socket.on("playerJoined", (player: PlayerStateType) => {
      this.events.playerJoined?.call(this, player);
    });

    // 玩家离开
    this.socket.on("playerLeft", (playerId: string) => {
      this.events.playerLeft?.call(this, playerId);
    });

    // 全局状态更新（服务器广播）
    this.socket.on("stateUpdate", (states: PlayerStateType[]) => {
      this.events.stateUpdate?.call(this, states);
    });

    // 错误处理
    this.socket.on("connect_error", (err: Error) => {
      this.events.error?.call(this, `连接失败: ${err.message}`);
    });

    this.socket.on("disconnect", (reason) => {
      this.events.error?.call(this, `已断开连接: ${reason}`);
      if (reason === "io server disconnect") {
        // 服务器主动断开，尝试重连
        this.socket?.connect();
      }
    });
  }

  // 发送本地玩家状态到服务器
  sendPlayerState(state: PlayerStateType): void {
    if (!this.socket || !this.socket.connected) {
      this.events.error?.call(this, "未连接到服务器");
      return;
    }
    //console.log("客户端主动更新", state)
    this.socket.emit("updateState", state); // 注册更新状态事件
  }

  // 注册事件回调
  on<K extends keyof NetworkClientEvents>(event: K, callback: NetworkClientEvents[K]): void {
    this.events[event] = callback;
  }

  // 断开连接
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null; // 清除socket实例
  }


  setServerUrl(newUrl: string){
    this.serverUrl = newUrl;
  }
}

export {NetworkClient};