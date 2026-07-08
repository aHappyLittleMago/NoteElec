/**
 * 各模块迷你演示的运行器
 * 每个 runXxxDemo 返回 cleanup 函数
 */
import {
  AssetLoader,
  Config,
  Entity,
  GameLoop,
  Input,
  Player,
  Renderer,
  SaveManager,
  Scene,
  SceneManager,
  SpriteEntity,
} from '../../../engine';
import type { SourceRect } from '../../../engine/core/sprite/sprite.type';
import type { DemoContext, DemoRunner } from './types';
import { centerX, centerY } from './demoLayout';

const SPRITE_KEY = 'showcase-sheet';
const SAVE_KEY = 'indid-web-module-showcase-counter';
const FRAME_SIZE = 32;

function createDemoSpriteSheet(): string {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_SIZE * 4;
  canvas.height = FRAME_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const colors = ['#1E293B', '#334155', '#475569', '#64748B'];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(index * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(index * FRAME_SIZE + 1, 1, FRAME_SIZE - 2, FRAME_SIZE - 2);
  });
  return canvas.toDataURL('image/png');
}

function buildWalkFrames(): SourceRect[] {
  return [0, 1, 2, 3].map((index) => ({
    x: index * FRAME_SIZE,
    y: 0,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  }));
}

function buildOffscreenGrid(renderer: Renderer): void {
  const { width, height } = renderer.getSize();
  renderer.drawEntity(
    new Player({
      id: '__grid_base',
      location: [0, 0],
      size: [width, height],
      background: '#166534',
      opacity: 0.35,
    }),
    true
  );
  for (let x = 0; x < width; x += 40) {
    renderer.drawEntity(
      new Player({
        id: `__grid_${x}`,
        location: [x, 0],
        size: [1, height],
        background: '#15803D',
        opacity: 0.5,
      }),
      true
    );
  }
}

class DemoCoinEntity extends Entity {
  private phase = 0;
  private baseX: number;
  private baseY: number;

  constructor(baseX: number, baseY: number) {
    super({ id: 'demo-coin', location: [baseX, baseY], size: [36, 36], collidable: false });
    this.baseX = baseX;
    this.baseY = baseY;
  }

  update(deltaTime: number): void {
    this.phase += deltaTime * 3;
    this.setLocation(this.baseX, this.baseY + Math.sin(this.phase) * 12);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const [x, y] = this.getLocation();
    const [w, h] = this.getSize();
    ctx.save();
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', x + w / 2, y + h / 2);
    ctx.restore();
  }
}

class PoolParticle extends Entity {
  life = 1.2;
  opacity = 0.85;

  constructor(id: string, x: number, y: number) {
    super({ id, location: [x, y], size: [10, 10], collidable: false });
  }

  update(): void {}

  render(ctx: CanvasRenderingContext2D): void {
    const [x, y] = this.getLocation();
    const radius = this.getSize()[0] / 2;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = '#A78BFA';
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function isPoolParticle(entity: Entity): entity is PoolParticle {
  return entity instanceof PoolParticle;
}

const runLoopDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  let angle = 0;
  let wasPaused = getToggle('paused');

  const removeUpdate = loop.addUpdateCallback((deltaTime) => {
    const paused = getToggle('paused');
    if (paused !== wasPaused) {
      wasPaused = paused;
      if (paused) loop.pause();
      else loop.resume();
    }
    if (paused) return;
    angle += deltaTime * 2;
  });

  const removeRender = loop.addRenderCallback(() => {
    const { width, height } = renderer.getSize();
    renderer.clear('#0F172A');
    const cx = width / 2;
    const cy = height / 2;
    const r = 60;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#24E063';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (getToggle('showFps')) {
      renderer.drawText(`FPS ${loop.currentFps}`, 12, 12, {
        font: '13px monospace',
        color: '#94A3B8',
      });
    }
    setStatus(getToggle('paused') ? '已暂停' : '运行中');
  });

  loop.start();
  return () => {
    loop.stop();
    removeUpdate();
    removeRender();
  };
};

const runRenderDemo: DemoRunner = ({ canvasId, getToggle }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  buildOffscreenGrid(renderer);

  const removeRender = loop.addRenderCallback(() => {
    renderer.clear('#1E293B');
    if (getToggle('showOffscreen')) renderer.drawOffscreenCache();
    const { width, height } = renderer.getSize();
    renderer.drawEntity(
      new Player({
        id: '__demo_box',
        location: [centerX(width, 80), centerY(height, 80)],
        size: [80, 80],
        background: '#3B82F6',
        border: { width: 2, color: '#1D4ED8' },
      })
    );
    if (getToggle('showDrawText')) {
      renderer.drawText('Renderer.drawText()', 12, 12, {
        font: 'bold 16px sans-serif',
        color: '#F8FAFC',
      });
      renderer.drawText('离屏缓存 = 静态网格', 12, 36, {
        font: '13px sans-serif',
        color: '#94A3B8',
      });
    }
  });

  loop.start();
  return () => {
    loop.stop();
    removeRender();
  };
};

const runIoDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  const input = new Input(canvasId);
  const speed = Config.getInstance().get('player').defaultSpeed;
  const { width: canvasW, height: canvasH } = renderer.getSize();
  let x = centerX(canvasW, 50);
  let y = centerY(canvasH, 50);

  const removeUpdate = loop.addUpdateCallback((deltaTime) => {
    if (!getToggle('enableKeyboard')) {
      setStatus('键盘已禁用');
      return;
    }
    setStatus('方向键移动方块');
    if (input.isKeyPressed('ArrowUp')) y -= speed * deltaTime;
    if (input.isKeyPressed('ArrowDown')) y += speed * deltaTime;
    if (input.isKeyPressed('ArrowLeft')) x -= speed * deltaTime;
    if (input.isKeyPressed('ArrowRight')) x += speed * deltaTime;
    const { width, height } = renderer.getSize();
    x = Math.max(0, Math.min(width - 50, x));
    y = Math.max(0, Math.min(height - 50, y));
  });

  const removeRender = loop.addRenderCallback(() => {
    renderer.clear('#0F172A');
    renderer.drawEntity(
      new Player({
        id: '__io_box',
        location: [x, y],
        size: [50, 50],
        background: getToggle('enableKeyboard') ? '#24E063' : '#64748B',
      })
    );
    renderer.drawText(
      getToggle('enableKeyboard') ? '键盘已启用 ↑↓←→' : '键盘已禁用',
      12,
      12,
      { font: '14px sans-serif', color: '#E2E8F0' }
    );
  });

  loop.start();
  return () => {
    loop.stop();
    removeUpdate();
    removeRender();
    input.destroy();
  };
};

const runSceneDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  const manager = SceneManager.getInstance();
  let lastSceneB = getToggle('useSceneB');

  const sceneA = new Scene(
    { id: 'demo-scene-a', gameLoop: loop, renderer, background: '#1E40AF' },
    {
      onActivate: (s) => {
        const { width, height } = renderer.getSize();
        s.addEntity(
          new Player({
            id: 'a-box',
            location: [width * 0.12, height * 0.32],
            size: [60, 60],
            background: '#93C5FD',
          })
        );
        s.addEntity(
          new Player({
            id: 'a-box2',
            location: [width * 0.55, height * 0.52],
            size: [40, 40],
            background: '#BFDBFE',
          })
        );
      },
      onRender: (s) => {
        s.getRendererInstance().drawText('场景 A · 蓝色', 12, 12, {
          font: 'bold 16px sans-serif',
          color: '#EFF6FF',
        });
      },
    }
  );

  const sceneB = new Scene(
    { id: 'demo-scene-b', gameLoop: loop, renderer, background: '#7C2D12' },
    {
      onActivate: (s) => {
        const { width, height } = renderer.getSize();
        s.addEntity(
          new Player({
            id: 'b-box',
            location: [centerX(width, 70), centerY(height, 70)],
            size: [70, 70],
            shape: 'circle',
            background: '#FDBA74',
          })
        );
      },
      onRender: (s) => {
        s.getRendererInstance().drawText('场景 B · 橙色', 12, 12, {
          font: 'bold 16px sans-serif',
          color: '#FFF7ED',
        });
      },
    }
  );

  manager.reset();
  manager.registerScene(sceneA);
  manager.registerScene(sceneB);
  manager.switchScene('demo-scene-a');

  const removeUpdate = loop.addUpdateCallback(() => {
    const wantB = getToggle('useSceneB');
    if (wantB !== lastSceneB) {
      lastSceneB = wantB;
      manager.switchScene(wantB ? 'demo-scene-b' : 'demo-scene-a');
    }
    const current = manager.getCurrentScene();
    if (current) {
      setStatus(`当前: ${current.id} · 实体 ${current.entityPool.getAll().length} 个`);
    }
  });

  loop.start();
  return () => {
    loop.stop();
    removeUpdate();
    manager.reset();
  };
};

const runEntityDemo: DemoRunner = ({ canvasId, getToggle }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  const { width, height } = renderer.getSize();
  const player = new Player({
    id: 'demo-player',
    location: [width * 0.12, centerY(height, 50)],
    size: [50, 50],
    background: '#3B82F6',
    border: { width: 2, color: '#1E40AF' },
  });
  const coin = new DemoCoinEntity(width * 0.65, height * 0.58);

  const scene = new Scene(
    { id: 'demo-entity', gameLoop: loop, renderer, background: '#0F172A' },
    {
      onActivate: (s) => {
        if (getToggle('showPlayer')) s.addEntity(player);
        if (getToggle('showCustom')) s.addEntity(coin);
      },
      onUpdate: (s) => {
        const pool = s.entityPool;
        if (getToggle('showPlayer') && !pool.has('demo-player')) pool.add(player);
        if (!getToggle('showPlayer') && pool.has('demo-player')) pool.remove('demo-player');
        if (getToggle('showCustom') && !pool.has('demo-coin')) pool.add(coin);
        if (!getToggle('showCustom') && pool.has('demo-coin')) pool.remove('demo-coin');
      },
      onRender: (s) => {
        s.getRendererInstance().drawText('Player（蓝）· 自定义 Entity（金币）', 12, 12, {
          font: '13px sans-serif',
          color: '#94A3B8',
        });
      },
    }
  );

  scene.activate();
  loop.start();
  return () => {
    loop.stop();
    scene.destroy();
  };
};

const runPoolDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  let seq = 0;
  let spawnTimer = 0;

  const scene = new Scene(
    { id: 'demo-pool', gameLoop: loop, renderer, background: '#1E1B4B' },
    {
      onUpdate: (s, deltaTime) => {
        const pool = s.entityPool;
        pool.forEach((entity) => {
          if (!isPoolParticle(entity)) return;
          entity.life -= deltaTime;
          entity.opacity = Math.max(0.1, entity.life / 1.2);
          if (entity.life <= 0) pool.recycle(entity.id);
        });

        if (!getToggle('spawnParticles')) {
          setStatus(`粒子 ${pool.filter(isPoolParticle).length} · 生成已关闭`);
          return;
        }

        spawnTimer += deltaTime;
        if (spawnTimer < 0.4) return;
        spawnTimer = 0;
        if (pool.filter(isPoolParticle).length >= 25) return;

        const { width, height } = renderer.getSize();
        const x = Math.random() * (width - 20) + 10;
        const y = Math.random() * (height - 20) + 10;
        const id = `p_${seq++}`;
        const particle = pool.getOrCreate(
          () => new PoolParticle(id, x, y),
          (entity) => {
            const p = entity as PoolParticle;
            p.id = id;
            p.setLocation(x, y);
            p.life = 1.2;
            p.opacity = 0.85;
          }
        );
        if (!pool.has(particle.id)) pool.add(particle);
        setStatus(`粒子 ${pool.filter(isPoolParticle).length} · 对象池复用中`);
      },
      onRender: (s) => {
        s.getRendererInstance().drawText('EntityPool.getOrCreate / recycle', 12, 12, {
          font: '13px sans-serif',
          color: '#C4B5FD',
        });
      },
    }
  );

  scene.activate();
  loop.start();
  return () => {
    loop.stop();
    scene.destroy();
  };
};

const runCollisionDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  const input = new Input(canvasId);
  const speed = Config.getInstance().get('player').defaultSpeed;
  const { width, height } = renderer.getSize();

  const obstacle = new Player({
    id: 'obstacle',
    location: [centerX(width, 100), centerY(height, 50) + 24],
    size: [100, 50],
    background: '#DC2626',
    border: { width: 2, color: '#991B1B' },
  });

  const moverRef = { player: null as Player | null };
  const mover = new Player({
    id: 'mover',
    location: [centerX(width, 40), centerY(height, 40) - 56],
    size: [40, 40],
    background: '#22C55E',
    speed,
    update(deltaTime: number) {
      const p = moverRef.player!;
      if (input.isKeyPressed('ArrowUp')) p.setY(p.getY() - (p.speed ?? 0) * deltaTime);
      if (input.isKeyPressed('ArrowDown')) p.setY(p.getY() + (p.speed ?? 0) * deltaTime);
      if (input.isKeyPressed('ArrowLeft')) p.setX(p.getX() - (p.speed ?? 0) * deltaTime);
      if (input.isKeyPressed('ArrowRight')) p.setX(p.getX() + (p.speed ?? 0) * deltaTime);
    },
  });
  moverRef.player = mover;

  const scene = new Scene(
    { id: 'demo-collision', gameLoop: loop, renderer, background: '#14532D' },
    {
      onActivate: (s) => {
        s.addEntity(obstacle);
        s.addEntity(mover);
      },
      onUpdate: () => {
        const enabled = getToggle('enableCollision');
        mover.collidable = enabled;
        obstacle.collidable = enabled;
        setStatus(enabled ? '碰撞已启用 — 无法穿过障碍' : '碰撞已禁用 — 可穿过障碍');
      },
      onRender: (s) => {
        s.getRendererInstance().drawText('方向键移动绿块', 12, 12, {
          font: '13px sans-serif',
          color: '#BBF7D0',
        });
      },
    }
  );

  scene.activate();
  loop.start();
  return () => {
    loop.stop();
    scene.destroy();
    input.destroy();
  };
};

const runConfigDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  const input = new Input(canvasId);
  const config = Config.getInstance();
  const { defaultSpeed, defaultSize } = config.get('player');
  const { width, height } = renderer.getSize();

  const runnerRef = { player: null as Player | null };
  const runner = new Player({
    id: 'config-player',
    location: [width / 2 - defaultSize[0] / 2, height / 2 - defaultSize[1] / 2],
    size: defaultSize,
    background: '#8B5CF6',
    speed: defaultSpeed,
    update(deltaTime: number) {
      const p = runnerRef.player!;
      const spd = (p.speed ?? 0) * (getToggle('fastMode') ? 2 : 1);
      if (input.isKeyPressed('ArrowUp')) p.setY(p.getY() - spd * deltaTime);
      if (input.isKeyPressed('ArrowDown')) p.setY(p.getY() + spd * deltaTime);
      if (input.isKeyPressed('ArrowLeft')) p.setX(p.getX() - spd * deltaTime);
      if (input.isKeyPressed('ArrowRight')) p.setX(p.getX() + spd * deltaTime);
    },
  });
  runnerRef.player = runner;

  const scene = new Scene(
    { id: 'demo-config', gameLoop: loop, renderer, background: '#312E81' },
    {
      onActivate: (s) => s.addEntity(runner),
      onRender: (s) => {
        const r = s.getRendererInstance();
        const spd = defaultSpeed * (getToggle('fastMode') ? 2 : 1);
        setStatus(`速度 ${spd} · 尺寸 ${defaultSize.join('×')}`);
        r.drawText(`Config: speed=${defaultSpeed} size=${defaultSize.join(',')}`, 12, 12, {
          font: '12px monospace',
          color: '#C4B5FD',
        });
        r.drawText(getToggle('fastMode') ? '加速模式 ON (2×)' : '默认速度', 12, 32, {
          font: '13px sans-serif',
          color: '#DDD6FE',
        });
      },
    }
  );

  scene.activate();
  loop.start();
  return () => {
    loop.stop();
    scene.destroy();
    input.destroy();
  };
};

const runAssetsDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  let cancelled = false;
  let cleanupInner: (() => void) | null = null;

  void AssetLoader.getInstance()
    .loadImage(createDemoSpriteSheet(), SPRITE_KEY)
    .then(() => {
      if (cancelled) return;

      const loop = new GameLoop();
      const renderer = new Renderer(canvasId);
      const { width, height } = renderer.getSize();
      const preloaded = new SpriteEntity({
        id: 'asset-preloaded',
        location: [centerX(width, FRAME_SIZE), centerY(height, FRAME_SIZE)],
        size: [FRAME_SIZE, FRAME_SIZE],
        imageKey: SPRITE_KEY,
        frames: buildWalkFrames(),
        fps: 4,
        loop: true,
      });
      const fallback = new SpriteEntity({
        id: 'asset-fallback',
        location: [centerX(width, FRAME_SIZE), centerY(height, FRAME_SIZE)],
        size: [FRAME_SIZE, FRAME_SIZE],
        imageKey: '__missing__',
        frames: buildWalkFrames(),
        fps: 4,
        loop: true,
      });
      let usingPreloaded = getToggle('usePreloaded');

      const scene = new Scene(
        { id: 'demo-assets', gameLoop: loop, renderer, background: '#18181B' },
        {
          onActivate: (s) => {
            s.addEntity(getToggle('usePreloaded') ? preloaded : fallback);
          },
          onUpdate: (s) => {
            const wantPreloaded = getToggle('usePreloaded');
            if (wantPreloaded === usingPreloaded) return;
            usingPreloaded = wantPreloaded;
            s.removeEntity('asset-preloaded');
            s.removeEntity('asset-fallback');
            s.addEntity(wantPreloaded ? preloaded : fallback);
            setStatus(wantPreloaded ? '已预加载 — 显示精灵图' : '未预加载 — 灰色占位');
          },
          onRender: (s) => {
            s.getRendererInstance().drawText('AssetLoader 缓存命中对比', 12, 12, {
              font: '13px sans-serif',
              color: '#A1A1AA',
            });
          },
        }
      );

      scene.activate();
      loop.start();
      setStatus(getToggle('usePreloaded') ? '已预加载 — 显示精灵图' : '未预加载 — 灰色占位');
      cleanupInner = () => {
        loop.stop();
        scene.destroy();
      };
    });

  return () => {
    cancelled = true;
    cleanupInner?.();
  };
};

const runSpriteDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  let cancelled = false;
  let cleanupInner: (() => void) | null = null;

  void AssetLoader.getInstance()
    .loadImage(createDemoSpriteSheet(), SPRITE_KEY)
    .then(() => {
      if (cancelled) return;

      const loop = new GameLoop();
      const renderer = new Renderer(canvasId);
      const { width, height } = renderer.getSize();
      const heroSize = FRAME_SIZE * 2;
      let hero: SpriteEntity | null = null;

      const scene = new Scene(
        { id: 'demo-sprite', gameLoop: loop, renderer, background: '#0C4A6E' },
        {
          onActivate: (s) => {
            hero = new SpriteEntity({
              id: 'sprite-hero',
              location: [centerX(width, heroSize), centerY(height, heroSize)],
              size: [FRAME_SIZE * 2, FRAME_SIZE * 2],
              imageKey: SPRITE_KEY,
              frames: buildWalkFrames(),
              fps: 6,
              loop: true,
              autoplay: true,
            });
            s.addEntity(hero);
          },
          onUpdate: () => {
            const anim = hero?.getAnimation();
            if (!anim) return;
            if (getToggle('animateSprite')) {
              if (!anim.isPlaying()) anim.play();
              setStatus('帧动画播放中');
            } else {
              if (anim.isPlaying()) anim.stop();
              setStatus('帧动画已停止');
            }
          },
          onRender: (s) => {
            s.getRendererInstance().drawText('SpriteEntity + Animation', 12, 12, {
              font: '13px sans-serif',
              color: '#BAE6FD',
            });
          },
        }
      );

      scene.activate();
      loop.start();
      cleanupInner = () => {
        loop.stop();
        scene.destroy();
      };
    });

  return () => {
    cancelled = true;
    cleanupInner?.();
  };
};

const runSaveDemo: DemoRunner = ({ canvasId, getToggle, setStatus }) => {
  const loop = new GameLoop();
  const renderer = new Renderer(canvasId);
  const input = new Input(canvasId);
  const save = SaveManager.getInstance();
  let counter = save.load<{ count: number }>(SAVE_KEY)?.count ?? 0;
  let tick = 0;

  const removeUpdate = loop.addUpdateCallback((deltaTime) => {
    tick += deltaTime;
    if (input.isKeyPressedOnce(' ') || input.isKeyPressedOnce('Enter')) {
      counter += 1;
      if (getToggle('persistCounter')) save.save(SAVE_KEY, { count: counter });
    }
    if (tick >= 1) {
      tick -= 1;
      counter += 1;
      if (getToggle('persistCounter')) save.save(SAVE_KEY, { count: counter });
    }
    setStatus(
      getToggle('persistCounter')
        ? `计数 ${counter} · 已写入 localStorage`
        : `计数 ${counter} · 未持久化`
    );
  });

  const removeRender = loop.addRenderCallback(() => {
    renderer.clear('#422006');
    renderer.drawText(`计数: ${counter}`, 12, 12, {
      font: 'bold 22px sans-serif',
      color: '#FEF3C7',
    });
    renderer.drawText('空格 / Enter 也可 +1', 12, 42, {
      font: '13px sans-serif',
      color: '#FDE68A',
    });
    renderer.drawText(getToggle('persistCounter') ? '持久化: ON' : '持久化: OFF', 12, 66, {
      font: '13px sans-serif',
      color: '#D97706',
    });
  });

  loop.start();
  return () => {
    loop.stop();
    removeUpdate();
    removeRender();
    input.destroy();
  };
};

const DEMO_RUNNERS: Record<string, DemoRunner> = {
  loop: runLoopDemo,
  render: runRenderDemo,
  io: runIoDemo,
  scene: runSceneDemo,
  entity: runEntityDemo,
  pool: runPoolDemo,
  collision: runCollisionDemo,
  config: runConfigDemo,
  assets: runAssetsDemo,
  sprite: runSpriteDemo,
  save: runSaveDemo,
};

const runModuleDemo = (moduleId: string, ctx: DemoContext): (() => void) | null => {
  const runner = DEMO_RUNNERS[moduleId];
  if (!runner) return null;
  return runner(ctx);
};

export { runModuleDemo };
