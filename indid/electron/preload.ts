import { ipcRenderer, contextBridge } from 'electron'

// --------- 向渲染进程暴露部分API ---------
// 通过contextBridge将指定API暴露到渲染进程的window对象中（主世界）
// 渲染进程（内置浏览器环境）通过window.ipcRenderer访问方法，避免直接操作ipcRender实例
contextBridge.exposeInMainWorld('ipcRenderer', {

  // 监听主进程（Node端）消息
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args; // 解构出消息通道和监听函数
    // 调用ipcRenderer的on方法，转发参数
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },

  // 移除对主进程消息的监听
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args; // 解构出消息通道和其他参数
    return ipcRenderer.off(channel, ...omit);
  },

  // 向主进程发送消息
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args; // 解构出消息通道和消息内容
    return ipcRenderer.send(channel, ...omit);
  },

  // 向主进程发送消息并等待响应
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args; // 解构出消息通道和消息内容
    return ipcRenderer.invoke(channel, ...omit);
  },
})

contextBridge.exposeInMainWorld('electronAPI', {
    // 自定义API暴露
  // ...
  // 切换服务程序状态（开启/关闭）
  toggleServer: (enable: boolean) => ipcRenderer.send('server:toggle', enable),

  // 监听服务器状态（待传：事件回调）
  onServerStatus: (callback: (status: { running: boolean; error?: string }) => void) => {
    // 定义监听回调（接收事件名，参数）
    const listener = (_: Electron.IpcRendererEvent, status: { running: boolean; error?: string }) => {
      callback(status);
    };
    // 注册监听
    ipcRenderer.on('server:status', listener);
    // 返卸载监听
    return () => {
      ipcRenderer.off('server:status', listener);
    };
  }
})

/*import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})
*/
