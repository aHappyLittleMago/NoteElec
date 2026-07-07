# AGENTS.md — AI Agent 工作指南

> 本文件面向接手 NoteElec 项目的 AI Agent，说明项目背景、目录约定与开发约束。

---

## 项目概述

NoteElec 是一个 **自研 2D Canvas 游戏引擎** 项目。Electron → 纯 Web 迁移 **已完成**；活跃代码库为 `indid-web/`。

- **引擎能力：** 游戏循环、Canvas 2D 渲染、输入处理、场景管理、实体池、碰撞、配置、Player / Entity 基类
- **应用形态：** React 18 + TypeScript + Vite，**纯浏览器客户端**
- **网络：** Legacy `indid/` 中的 Socket.io、服务端与多人同步 **已废弃**，Web 版本不实现后端或联机

---

## 目录结构

```
NoteElec/
├── indid/              ← Legacy Electron 原型（只读参考，禁止修改）
├── indid-web/          ← 当前 Web 客户端（在此编写所有新代码）
├── LowcodeEditor/      ← 独立的 Electron 编辑器项目（与引擎 Web 版无关）
├── AGENTS.md           ← 本文件
└── .cursor/rules/      ← Cursor AI 规则
```

### indid/（Legacy，只读）

Electron 桌面应用原型，仅作历史与对照参考。

| 路径 | 状态 |
|------|------|
| `engine/core/*` | 已实现（Web 版见 `indid-web/engine/`） |
| `engine/expends/server/` | Legacy，**不迁移、不实现** |
| `electron/` | Electron 专用 |
| `src/` | React 渲染进程 UI |

### indid-web/（活跃代码库）

纯 Web 客户端，目录与说明见 [`indid-web/README.md`](./indid-web/README.md)。

**不含** `server/`、Socket.io 或任何网络同步层。

---

## 开发约束

### 必须遵守

1. **不要修改 `indid/` 中的任何文件**，除非用户明确要求
2. **所有新代码写入 `indid-web/`**
3. 从 `indid/` 对照实现时，仅在 `indid-web/` 副本上修改

### 不要做

- 不要在 `indid-web/` 中引入 Electron 相关依赖
- 不要使用 `window.ipcRenderer` / `window.electronAPI`
- **不要实现** `engine/expends/server/`、`NetworkServer`、Socket.io、多人同步、`indid-web/server/`
- 不要修改 `LowcodeEditor/`（独立项目）
- 不要创建不必要的抽象层或过度工程化

### 修改 indid/ 的唯一例外

用户明确说「修改 indid/ 中的 xxx」时方可操作。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 语言 | TypeScript 5.x（strict mode） |
| 前端框架 | React 18 |
| 构建工具 | Vite 5 |
| 渲染 | Canvas 2D API（自研 Renderer 类） |
| UI 组件 | @headlessui/react |
| 部署 | 静态站点（无 Node 服务端） |

---

## 代码风格约定

遵循 `indid-web/` 与 Legacy 既有风格：

- **类：** 使用 `class` 定义引擎模块（GameLoop、Renderer、Scene、Player 等）
- **导出：** 命名导出 `export { ClassName }`，类型用 `export type`
- **注释：** 中文 JSDoc 注释说明模块职责与公共方法
- **命名：** camelCase 变量/方法，PascalCase 类/类型，UPPER_SNAKE 常量
- **文件组织：** 每个模块一个目录，含实现文件 + readme
- **React：** 函数组件 + hooks，不使用 class component
- **Import：** 相对路径，暂不使用 path alias
- **类型：** 严格 TypeScript，不使用 `any`

---

## Agent 工作流程

接手任务时的推荐步骤：

```
1. 阅读本文件（AGENTS.md）了解全局约束
2. 阅读 indid-web/README.md 了解目录与本地运行方式
3. 在 indid-web/ 中实现或修改功能
4. 验收：npm run build（必要时 npm run dev 手动验证）
```

### 常见任务示例

| 用户请求 | Agent 应做 |
|----------|-----------|
| "改引擎 xxx" | 在 `indid-web/engine/` 对应模块修改 |
| "改 Demo / UI" | 在 `indid-web/src/` 修改 |
| "对照 legacy 行为" | 只读查看 `indid/`，改动写入 `indid-web/` |
| "修改 indid 的 xxx" | 仅在用户明确要求时修改 `indid/` |

---

## 参考链接

- Web 客户端：[`indid-web/README.md`](./indid-web/README.md)
- Cursor 规则：[`.cursor/rules/`](./.cursor/rules/)