// ServerControl.tsx（前端UI组件）
import { useState, useEffect } from 'react';
//import { Button } from '@headlessui/react';
import { Popover, PopoverButton} from '@headlessui/react'

// 声明window上的electronAPI类型（TypeScript类型提示）
declare global {
  interface Window {
    electronAPI: {
      toggleServer: (enable: boolean) => void;
      onServerStatus: (callback: (status: { running: boolean; error?: string }) => void) => void;
    };
  }
}

const ServerModule = () => {
  const [isRunning, setIsRunning] = useState(false); // UI显示的服务状态
  const [error, setError] = useState(''); // 服务启动失败的错误信息

  // 监听主进程返回的服务状态（初始化时注册）
  useEffect(() => {
    if (window.electronAPI?.onServerStatus === undefined) {
      return;
    }
    const handleStatus = (status: { running: boolean; error?: string }) => {
      setIsRunning(status.running);
      setError(status.error || '');
    };
    window.electronAPI.onServerStatus(handleStatus);
  }, [window.electronAPI]);

  // 点击按钮：发送启动/关闭指令
  const handleClick = () => {
    const newState = !isRunning;
    window.electronAPI?.toggleServer(newState); // 发送指令给主进程
  };

  return (
    <div>
      <Popover className="relative">
        <PopoverButton onClick={handleClick}>
          {isRunning ? '关闭服务' : '启动服务'}
        </PopoverButton>
      </Popover>
      <></>
      <div>
      {`服务实例状态：${isRunning}`}
      </div>
      {error && <p style={{ color: 'red' }}>错误：{error}</p>}
    </div>
  );
};

export { ServerModule };