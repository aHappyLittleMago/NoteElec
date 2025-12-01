import { useState, useEffect } from 'react';
import { Popover, PopoverButton } from '@headlessui/react';
// import type { PlayerStateType } from '../../engine/core/entities/Player/player';
import { useServerClient } from '../hooks/useNetworkClient'; // 导入自定义Hook
import { Demo } from './demoEntity';

// 声明window上的electronAPI类型
declare global {
  interface Window {
    electronAPI: {
      toggleServer: (enable: boolean) => void;
      onServerStatus: (callback: (status: { running: boolean; error?: string }) => void) => void;
      onServerInfo: (callback: (status: { playerList: Map<any, any>; port: string; error?: string }) => void) => void;
    };
  }
}

interface ServerInfo {
  playerList?: Map<any, any>;
  port?: string;
  error?: string;
}

const ServerModule = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<ServerInfo>({});

  // ===== 使用Hook管理客户端 =====
  // 传入服务状态、端口和自定义事件（可选）
  const clientRef = useServerClient(
    isRunning,
    info.port,
    {
      // 可自定义事件回调（覆盖Hook默认值）
      // connected: (id) => console.log('自定义连接成功：', id),
    }
  );

  // 监听服务状态和信息
  useEffect(() => {
    if (!window.electronAPI?.onServerStatus) return;

    const handleStatus = (status: { running: boolean; error?: string }) => {
      setIsRunning(status.running);
      setError(status.error || '');
    };

    const handleInfo = (status: { playerList: Map<any, any>; port: string; error?: string }) => {
      setInfo(status);
    };

    window.electronAPI.onServerStatus(handleStatus);
    window.electronAPI.onServerInfo(handleInfo);

    return () => {
      // 若electron提供移除监听的方法，需在此调用
    };
  }, [window.electronAPI]);

  // 处理服务启动/关闭按钮
  const handleClick = () => {
    const newState = !isRunning;
    window.electronAPI?.toggleServer(newState);
  };

  return (
    <div>
      <Popover className="relative">
        <PopoverButton onClick={handleClick}>
          {isRunning ? '关闭服务' : '启动服务'}
        </PopoverButton>
      </Popover>

      <div>服务实例状态：{isRunning ? '运行中' : '已停止'}</div>

      {info.port && <div>服务实例端口：{info.port}</div>}
      {info.playerList && info.playerList.size > 0 && (
        <div>
          服务实例用户列表：
          {Array.from(info.playerList.entries()).map(([id, player]) => (
            <div key={id}>{JSON.stringify(player)}</div>
          ))}
        </div>
      )}

      {error && <p style={{ color: 'red' }}>错误：{error}</p>}
      <Demo client={clientRef}/>
    </div>
  );
};

export { ServerModule };