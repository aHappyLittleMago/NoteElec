import { NetworkServer } from "../../engine/Network/server";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@headlessui/react";

const ServerModule = () => {
  const [isRunning, setIsRunning] = useState(false);

  // 明确指定 ref 类型为 NetworkServer | null，初始值为 null
  const ServerEntity = useRef<NetworkServer | null>(null);

  const handleClick = useCallback(() => {
    setIsRunning(pre => !pre);
  }, []);

  useEffect(() => {
    // 修正条件：判断 isRunning 为 true 且 current 未初始化时才创建实例
    if (!isRunning || ServerEntity.current) {
      return;
    }
    // 初始化服务实例
    const server = new NetworkServer();
    ServerEntity.current = server;

    // 组件卸载或 isRunning 为 false 时关闭服务
    return () => {
      if (ServerEntity.current) {
        ServerEntity.current = null;
      }
    };
  }, [isRunning]);

  return (
    <Button onClick={handleClick}>
      {isRunning ? '关闭服务' : '启用服务'}
    </Button>
  );
};

export { ServerModule };