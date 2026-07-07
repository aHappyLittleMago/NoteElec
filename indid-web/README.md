# indid-web

`indid-web` 是 NoteElec **纯 Web 客户端**：自研 2D Canvas 引擎 + React 应用，在浏览器本地运行，**不含任何后端或网络服务**。

## 当前状态

迁移自 Legacy `indid/`（Electron）已完成。

| 模块 | 状态 |
|------|------|
| 引擎核心（loop / render / io / scene / entities） | 已就绪 |
| 碰撞 / 配置 / Entity 基类 | 已就绪 |
| React 应用层 + Vite 构建 | 已就绪 |
| 平台抽象（`platform/browser.ts`） | 已就绪 |

**不实现：** `engine/expends/server/`、Socket.io、多人同步、`server/` 目录。

## 与 legacy 的关系

```
NoteElec/
├── indid/          ← Legacy Electron 原型（只读参考，勿修改）
└── indid-web/      ← 本目录：活跃 Web 代码库
```

**开发原则：** 所有新代码写入 `indid-web/`；需要对照时只读 `indid/`。

## 目录结构

```
indid-web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
├── engine/core/        # 引擎（平台无关）
├── src/                # React UI
└── platform/           # 浏览器平台抽象
```

## 技术栈

- **前端：** React 18 + TypeScript + Vite 5
- **渲染：** Canvas 2D（自研 Renderer）
- **部署：** 静态站点

## 快速开始

```bash
npm install
npm run dev      # 开发
npm run build    # 生产构建
```