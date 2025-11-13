// network/NetworkServer.ts
import { Server, Socket } from "socket.io";
import type { PalyerStateType } from "../Player/player";
import { Player } from "../Player/player";


class NetworkServer {
  // 私有成员声明
  private io: Server; // 服务实例
  private players = new Map<string, PalyerStateType>(); // 存储所有玩家状态（key: socket.id）
  private port: number; // 端口
  private initParams: {[key: string]: any}; // 状态初始化方法

  // 初始化实例依赖端口号，默认3000
  // 初始化依赖状态初始化函数，必须
  constructor(port: number = 3000, initM: {[key: string]: any} = {}) {
    this.port = port;
    this.io = new Server(); // 创建服务实例
    //this.io = new Server({
    //  cors: { origin: "*" } // 开发环境允许跨域，生产环境需限制
    //});
    this.setupHandlers(); // 执行连接处理
    this.initParams = initM;
  }

  // 启动服务器
  start(): void {
    this.io.listen(this.port);
    console.log(`服务器启动，监听端口 ${this.port}`);
  }

  // 设置连接处理逻辑
  private setupHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`新客户端连接: ${socket.id}`);

      const currPlayer = new Player(this.initParams);
      this.players.set(socket.id, currPlayer); // 存储用户状态

      // 注册事件
      // 向新连接的客户端分配id
      socket.emit("assignId", socket.id);

      // 向所有客户端广播“新玩家加入”
      this.io.emit("playerJoined", currPlayer);

      // 接收客户端发送的状态更新
      socket.on("updateState", (state: Omit<PalyerStateType, "id">) => {
        if (!this.players.has(socket.id)) return;
        // 更新服务器存储的状态
        const updated = { ...this.players.get(socket.id)!, ...state };
        this.players.set(socket.id, updated);
      });

      // 客户端断开连接
      socket.on("disconnect", () => {
        console.log(`客户端断开: ${socket.id}`);
        this.players.delete(socket.id);
        // 广播玩家离开
        this.io.emit("playerLeft", socket.id);
      });
    });

    // 定时广播全局状态（每100ms一次，控制同步频率）
    setInterval(() => {
      const allStates = Array.from(this.players.values());
      this.io.emit("stateUpdate", allStates);
    }, 100);
  }

  // 停止服务器
  stop(): void {
    this.io.close();
    console.log("服务器已停止");
  }
}

export { NetworkServer };