import { useRef, useEffect } from 'react';
import { NetworkClient } from '../../engine/expends/server/client';
import type { PlayerStateType } from '../../engine/core/entities/Player/player';

// 定义客户端事件回调类型（与NetworkClient构造参数一致）
type ClientEvents = {
  connected?: (playerId: string) => void;
  playerJoined?: (player: PlayerStateType) => void;
  playerLeft?: (playerId: string) => void;
  stateUpdate?: (states: PlayerStateType[]) => void;
  error?: (message: string) => void;
};

/**
 * 管理服务客户端实例的Hook
 * @param isServerRunning 服务是否运行中
 * @param serverPort 服务端口（用于连接）
 * @param events 客户端事件回调
 * @returns 客户端实例引用
 */
const useServerClient = (
  isServerRunning: boolean,
  serverPort?: string,
  events?: ClientEvents
) => {
  // 客户端实例容器
  const clientRef = useRef<NetworkClient | null>(null);

  // 初始化客户端配置（事件回调默认值）
  const defaultEvents: ClientEvents = {
    connected: (playerId) => console.log('客户端连接成功，玩家ID：', playerId),
    playerJoined: (player) => console.log('新玩家加入：', player),
    playerLeft: (playerId) => console.log('玩家离开：', playerId),
    stateUpdate: (states) => console.log('全局状态更新：', states),
    error: (message) => console.log('客户端错误：', message),
    ...events // 合并用户传入的事件（覆盖默认）
  };

  // 根据服务状态创建/销毁客户端
  useEffect(() => {
    // 服务启动且端口有效时，创建并连接客户端
    if (isServerRunning && serverPort) {
      // 若已有实例，先清理（避免重复创建）
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      // 创建新实例
      clientRef.current = new NetworkClient(defaultEvents);
      // 连接到指定端口（假设NetworkClient支持动态设置地址）
      if (clientRef.current.setServerUrl) {
        clientRef.current.setServerUrl(`http://localhost:${serverPort}`);
      }
      clientRef.current.connect();
    } 
    // 服务停止时，断开并清理客户端
    else if (!isServerRunning && clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null; // 清除实例引用
    }

    // 组件卸载时强制清理客户端
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [isServerRunning, serverPort, defaultEvents]); // 依赖服务状态、端口和事件配置

  return clientRef; // 返回实例引用（供组件按需使用）
};

export { useServerClient };