import type { ModuleDef } from './types';

/** 各引擎模块的简介、代码示例与开关定义 */
const MODULE_DEFINITIONS: ModuleDef[] = [
  {
    id: 'loop',
    title: 'GameLoop',
    path: 'engine/core/loop/',
    intro:
      '游戏循环负责驱动帧更新与渲染，支持暂停/恢复、FPS 统计与多回调注册。是所有实时演示的基础。',
    code: `const loop = new GameLoop();
loop.addUpdateCallback((deltaTime) => { /* 逻辑 */ });
loop.addRenderCallback(() => { /* 绘制 */ });
loop.start();
loop.pause();   // 暂停
loop.resume();  // 恢复
// loop.currentFps — 当前帧率`,
    toggles: [
      { id: 'showFps', label: '显示 FPS', defaultValue: true },
      { id: 'paused', label: '暂停循环', defaultValue: false },
    ],
    hasCanvasDemo: true,
  },
  {
    id: 'render',
    title: 'Renderer',
    path: 'engine/core/render/',
    intro:
      'Canvas 2D 渲染器，提供实体绘制、文字 HUD（drawText）与离屏缓存（静态背景）。',
    code: `const renderer = new Renderer('gameCanvas');
renderer.clear('#1E293B');
renderer.drawEntity(player);
renderer.drawText('Hello', 16, 16, {
  color: '#fff',
  font: 'bold 18px sans-serif',
});
renderer.drawOffscreenCache(); // 绘制离屏缓存`,
    toggles: [
      { id: 'showDrawText', label: '显示 drawText', defaultValue: true },
      { id: 'showOffscreen', label: '离屏网格背景', defaultValue: true },
    ],
    hasCanvasDemo: true,
  },
  {
    id: 'io',
    title: 'Input',
    path: 'engine/core/io/',
    intro:
      '输入模块监听键盘、鼠标与触摸事件，提供持续按下、单次触发与组合键检测。',
    code: `const input = new Input('gameCanvas');
if (input.isKeyPressed('ArrowUp')) {
  player.setY(player.getY() - speed * deltaTime);
}
input.isKeyPressedOnce('Enter'); // 单次触发
input.destroy(); // 卸载时销毁`,
    toggles: [{ id: 'enableKeyboard', label: '启用键盘输入', defaultValue: true }],
    hasCanvasDemo: true,
  },
  {
    id: 'scene',
    title: 'Scene / SceneManager',
    path: 'engine/core/scene/',
    intro:
      '场景管理实体生命周期、帧调度与碰撞；SceneManager 负责注册与切换多个场景。',
    code: `const manager = SceneManager.getInstance();
manager.registerScene(sceneA);
manager.registerScene(sceneB);
manager.switchScene('scene-a');
// scene.getEntity('player')
// scene.entityPool.getAll().length`,
    toggles: [{ id: 'useSceneB', label: '切换到场景 B', defaultValue: false }],
    hasCanvasDemo: true,
  },
  {
    id: 'entity',
    title: 'Entity / Player',
    path: 'engine/core/entities/',
    intro:
      'Entity 是实体基类（update / render / AABB）；Player 扩展了颜色、形状、速度与图片等渲染属性。',
    code: `class Coin extends Entity {
  update(dt: number) { /* ... */ }
  render(ctx) { /* 自定义绘制 */ }
}
const player = new Player({
  id: 'player',
  location: [100, 200],
  size: [40, 40],
  background: '#3B82F6',
  speed: 200,
});`,
    toggles: [
      { id: 'showPlayer', label: '显示 Player', defaultValue: true },
      { id: 'showCustom', label: '显示自定义 Entity', defaultValue: true },
    ],
    hasCanvasDemo: true,
  },
  {
    id: 'pool',
    title: 'EntityPool',
    path: 'engine/core/entities/pool/',
    intro:
      '实体池托管增删查与对象复用（recycle / getOrCreate），减少频繁创建带来的 GC 压力。',
    code: `const particle = pool.getOrCreate(
  () => new Particle(id, x, y),
  (entity) => { entity.reset(x, y); }
);
pool.recycle(particle.id);`,
    toggles: [{ id: 'spawnParticles', label: '生成粒子', defaultValue: true }],
    hasCanvasDemo: true,
  },
  {
    id: 'collision',
    title: 'Collision',
    path: 'engine/core/collision/',
    intro:
      'AABB 碰撞检测与分离；Scene 在帧更新中自动对 collidable 实体执行 resolveAABB。',
    code: `import { checkAABB, resolveAABB } from './engine';
if (checkAABB(a.getAABB(), b.getAABB())) {
  const fix = resolveAABB(a.getAABB(), b.getAABB());
  player.setLocation(x + fix.x, y + fix.y);
}`,
    toggles: [{ id: 'enableCollision', label: '启用碰撞', defaultValue: true }],
    hasCanvasDemo: true,
  },
  {
    id: 'config',
    title: 'Config',
    path: 'engine/core/config/',
    intro:
      '全局配置单例，提供 canvas 尺寸与 player 默认速度/尺寸等引擎级参数。',
    code: `const config = Config.getInstance();
const { width, height } = config.get('canvas');
const { defaultSpeed, defaultSize } = config.get('player');`,
    toggles: [{ id: 'fastMode', label: '加速模式（2× 速度）', defaultValue: false }],
    hasCanvasDemo: true,
  },
  {
    id: 'assets',
    title: 'AssetLoader',
    path: 'engine/core/assets/',
    intro:
      '图片预加载与缓存；Sprite / Player 依赖已加载的资源，未命中时显示灰色占位。',
    code: `await AssetLoader.getInstance().loadImage(url, 'player-sheet');
const img = AssetLoader.getInstance().get('player-sheet');`,
    toggles: [{ id: 'usePreloaded', label: '使用预加载图片', defaultValue: true }],
    hasCanvasDemo: true,
  },
  {
    id: 'sprite',
    title: 'Sprite / Animation',
    path: 'engine/core/sprite/',
    intro:
      '精灵裁切与帧动画；SpriteEntity 集成 Entity + Sprite + Animation，适合可动角色。',
    code: `const hero = new SpriteEntity({
  id: 'hero',
  imageKey: 'sheet',
  frames: [{ x: 0, y: 0, width: 32, height: 32 }, /* ... */],
  fps: 8,
  loop: true,
});
hero.getAnimation()?.play();`,
    toggles: [{ id: 'animateSprite', label: '播放帧动画', defaultValue: true }],
    hasCanvasDemo: true,
  },
  {
    id: 'save',
    title: 'SaveManager',
    path: 'engine/core/save/',
    intro:
      '通过 localStorage 持久化 JSON 存档，适合分数、进度等轻量数据。',
    code: `const save = SaveManager.getInstance();
save.save('high-score', { score: 100 });
const data = save.load<{ score: number }>('high-score');`,
    toggles: [{ id: 'persistCounter', label: '持久化计数器', defaultValue: false }],
    hasCanvasDemo: true,
  },
  {
    id: 'audio',
    title: 'AudioManager',
    path: 'engine/core/audio/',
    intro:
      '可选音频模块，封装 SFX / BGM 播放与音量控制。浏览器可能拦截自动播放，嵌入游戏时可按需引入。',
    code: `const audio = AudioManager.getInstance();
audio.setVolume({ sfx: 0.8, bgm: 0.4 });
await audio.playSFX('/sfx/jump.mp3');
await audio.playBGM('/bgm/theme.mp3', true);`,
    toggles: [],
    hasCanvasDemo: false,
  },
];

const getModuleById = (id: string): ModuleDef | undefined =>
  MODULE_DEFINITIONS.find((m) => m.id === id);

const getDefaultToggles = (module: ModuleDef): Record<string, boolean> =>
  Object.fromEntries(module.toggles.map((t) => [t.id, t.defaultValue]));

export { MODULE_DEFINITIONS, getModuleById, getDefaultToggles };
