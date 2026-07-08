/** 资源加载进度回调：loaded 已加载数量，total 总数量 */
export type LoadProgressCallback = (loaded: number, total: number) => void;

/** loadImages 入参：URL 数组或 key → URL 映射 */
export type LoadImagesInput = string[] | Record<string, string>;
