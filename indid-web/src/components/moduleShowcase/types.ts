/** 模块交互文档 — 类型定义 */

export type ToggleDef = {
  id: string;
  label: string;
  defaultValue: boolean;
};

export type ModuleDef = {
  id: string;
  title: string;
  path: string;
  intro: string;
  code: string;
  toggles: ToggleDef[];
  /** 是否有 Canvas 迷你演示（audio 为 false） */
  hasCanvasDemo: boolean;
};

export type DemoContext = {
  canvasId: string;
  getToggle: (id: string) => boolean;
  setStatus: (status: string) => void;
};

export type DemoRunner = (ctx: DemoContext) => () => void;
