// 导入Electron核心模块：app（控制应用生命周期）、BrowserWindow（创建窗口）
import { app, BrowserWindow, ipcMain } from 'electron'
// 导入Node.js模块：处理模块加载和路径
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { NetworkServer } from '../engine/expends/server/server'
import { handleServerToggle, handleServerInfoReq} from './functions/server/logic'

// 在ES模块中模拟CommonJS的require功能（解决部分模块兼容问题）
// @ts-expect-error：忽略TypeScript对类型的检查（因为createRequire在TS中类型定义特殊）
const require = createRequire(import.meta.url)
// 获取当前文件的目录路径（类似CommonJS中的__dirname）
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 定义项目的目录结构常量（便于后续路径引用）
// 项目构建后的目录结构示意：
// ├─┬─┬ dist               # 渲染进程打包目录
// │ │ └── index.html       # 渲染进程入口HTML
// │ │
// │ ├─┬ dist-electron      # 主进程打包目录
// │ │ ├── main.js          # 主进程入口文件
// │ │ └── preload.mjs      # 预加载脚本（用于进程间通信安全桥接）
// │
process.env.APP_ROOT = path.join(__dirname, '..')  // 应用根目录路径

// 🚧 使用['ENV_NAME']形式避免Vite的define插件冲突（Vite@2.x版本兼容处理）
// 开发环境下Vite dev server的URL（如http://localhost:5173）
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
// 主进程打包后的目录路径
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
// 渲染进程打包后的目录路径
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

// 公共资源目录路径：开发环境用public文件夹，生产环境用渲染进程打包目录
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST


// 全局维护server实例（避免被垃圾回收）
let serverInstance: NetworkServer | null = null;

// 声明窗口实例变量（全局维护，避免被垃圾回收）
let win: BrowserWindow | null

/**
 * 创建Electron应用窗口的函数
 */
function createWindow() {
  // 创建窗口实例，配置窗口参数
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),  // 窗口图标路径
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),  // 预加载脚本路径（安全通信桥）
    },
  })

  // 测试：窗口加载完成后，向渲染进程发送一条消息（主进程→渲染进程通信示例）
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // 根据环境加载不同的页面：
  // 开发环境：加载Vite dev server（支持热更新）
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // 生产环境：加载本地打包后的HTML文件
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}


// 监听所有窗口关闭事件：
// 在非macOS系统（如Windows、Linux），所有窗口关闭后退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {  // darwin是macOS的标识
    app.quit()  // 退出应用
    win = null  // 清空窗口实例
  }
})

// 监听应用激活事件（如点击dock图标）：
// 在macOS中，当应用激活且无窗口时，重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {  // 检查是否有现存窗口
    createWindow()
  }
})

// 当应用准备就绪后，创建主窗口
app.whenReady().then(() => {
  // 监听前端发送的“切换server状态”指令
  ipcMain.on('server:toggle', (_, enable: boolean) => {

    // 维护服务实例
    serverInstance = handleServerToggle(serverInstance, win)(enable);
    // handleServerInfoReq(serverInstance, win)()
  });
  createWindow()
})