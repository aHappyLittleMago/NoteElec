// 导入Electron的IPC渲染器模块和上下文桥接模块
// ipcRenderer：用于渲染进程与主进程之间的通信
// contextBridge：用于安全地向渲染进程暴露API（避免直接暴露Node.js模块带来的安全风险）
import { ipcRenderer, contextBridge } from 'electron'

// --------- 向渲染进程暴露部分API ---------
// 通过contextBridge将指定API暴露到渲染进程的window对象中（主世界）
// 这样渲染进程可以通过window.ipcRenderer访问这些方法，而无需直接操作ipcRenderer
contextBridge.exposeInMainWorld('ipcRenderer', {
  // 监听主进程发送的消息（对应ipcRenderer.on）
  // Parameters<typeof ipcRenderer.on>：通过TypeScript获取ipcRenderer.on的参数类型，确保类型一致
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args; // 解构出消息通道和监听函数
    // 调用ipcRenderer的on方法，转发参数
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },

  // 移除对主进程消息的监听（对应ipcRenderer.off）
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args; // 解构出消息通道和其他参数
    return ipcRenderer.off(channel, ...omit);
  },

  // 向主进程发送消息（对应ipcRenderer.send）
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args; // 解构出消息通道和消息内容
    return ipcRenderer.send(channel, ...omit);
  },

  // 向主进程发送消息并等待响应（异步，对应ipcRenderer.invoke）
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args; // 解构出消息通道和消息内容
    return ipcRenderer.invoke(channel, ...omit);
  },

  // 你可以根据需要在这里暴露其他必要的API
  // ...
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
