// network/NetworkServer.ts
import { Server, Socket } from "socket.io";
import type { PlayerStateType } from "../../core/entities/Player/player";
import { Player } from "../../core/entities/Player/player";


class NetworkServer {
  // 私有成员声明
  private io: Server; // 服务实例
  private players = new Map<string, PlayerStateType>(); // 存储所有玩家状态（key: playerState）
  private port: number; // 端口
  private initParams: { [key: string]: any }; // player状态初始化参数
  private syncFrequency: number;

  /**
   * 
   * @param port 端口号
   * @param initM 用户状态初始化参数
   * @param syncFrequency 服务同步频率
   */
  constructor(port: number = 3000, initM: { [key: string]: any } = {}, syncFrequency = 100) {
    this.port = port;
    this.io = new Server(); // 创建服务实例
    this.io = new Server({
      cors: { origin: "*" } // 允许跨域
    });
    this.setupHandlers(); // 执行连接处理，注册事件
    this.initParams = initM; // 初始化参数
    this.syncFrequency = syncFrequency;
  }
  // 设置连接处理逻辑
  private setupHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`new client connected ${socket.id}`);

      const currPlayer = new Player(this.initParams); // Player类创建用户实例
      this.players.set(socket.id, currPlayer); // 存储用户实例到服务实例

      // 注册事件
      // 向新连接的客户端分配id
      socket.emit("assignId", socket.id);

      // 向所有客户端广播“新玩家加入”
      this.io.emit("playerJoined", currPlayer);

      // 接收客户端发送的状态更新
      socket.on("updateState", (state: PlayerStateType) => {
        if (!this.players.has(socket.id)) return;
        // 更新服务器存储的状态
        this.players.set(socket.id, state);
      });

      // 客户端断开连接
      socket.on("disconnect", () => {
        console.log(`client disconneted: ${socket.id}`);
        this.players.delete(socket.id);
        // 广播玩家离开
        this.io.emit("playerLeft", socket.id);
      });
    });

    // 定时广播全局状态（每100ms一次，控制同步频率）
    setInterval(() => {
      const allStates = Array.from(this.players.values());
      this.io.emit("stateUpdate", allStates);
    }, this.syncFrequency);
  }
  // 启动服务器
  start(): void {
    this.io.listen(this.port);
    console.log(`server on,  port listening...  ${this.port}`);
  }



  // 停止服务器
  stop(): void {
    this.io.close();
    console.log("server off");
  }

  getPlayersList() {
    return this.players;
  }

  getPort() {
    return this.port;
  }

  getSocketInstance() {
    return this.io;
  }
}

export { NetworkServer };