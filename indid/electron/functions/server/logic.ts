import { BrowserWindow } from "electron";
import { NetworkServer } from "../../../engine/expends/server/server";

// 服务实例状态切换
const handleServerToggle = (serverInstance: NetworkServer | null, win: BrowserWindow | null) =>{
    return function(enable:boolean){
        try {
            if (enable) {
              // 启动服务：仅当实例不存在时创建
              if (!serverInstance) {
                serverInstance = new NetworkServer(); // 初始化服务实例
                serverInstance.start(); // 启动服务
                win?.webContents.send('server:status', { running: true }); // 通知前端

                // 获取实例上的用户列表
              const palyerList = serverInstance.getPlayersList()
              const port = serverInstance.getPort()
              win?.webContents.send('server:info', { palyerList, port }); // 通知前端
              }
            } else {
              // 关闭服务：仅当实例存在时销毁
              if (serverInstance) {
                serverInstance.stop(); // 停止服务
                serverInstance = null; // 清空实例
                win?.webContents.send('server:status', { running: false }); // 通知前端
                win?.webContents.send('server:info', { palyerList: undefined, port:undefined }); // 通知前端
              }
            }
          } catch (err) {
            // 捕获启动/关闭过程中的错误，反馈给前端
            const errorMsg = err instanceof Error ? err.message : '服务操作失败';
            win?.webContents.send('server:status', { running: false, error: errorMsg });
          }
          return serverInstance;
    }
}

// 向渲染进程转发服务实例信息
const handleServerInfoReq = (serverInstance: NetworkServer | null, win: BrowserWindow | null) =>{
    return function(){
        try {
              if (!serverInstance) {
                throw new Error('无法找到服务实例')
              }
              // 获取实例上的用户列表
              const palyerList = serverInstance.getPlayersList()
              const port = serverInstance.getPort()
              win?.webContents.send('server:info', { palyerList, port }); // 通知前端

          } catch (err) {
            // 捕获启动/关闭过程中的错误，反馈给前端
            const errorMsg = err instanceof Error ? err.message : '服务操作失败';
            win?.webContents.send('server:info', { error: errorMsg });
          }
    }
}

export {handleServerToggle, handleServerInfoReq};