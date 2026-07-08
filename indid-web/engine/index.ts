/**
 * 引擎公共导出入口
 * 供嵌入站点或 React 组件按需 import，无需深层路径
 */
export { AssetLoader } from './core/assets/assetLoader';
export type { LoadProgressCallback, LoadImagesInput } from './core/assets/assetLoader.type';

export { Sprite } from './core/sprite/sprite';
export { Animation } from './core/sprite/animation';
export { SpriteEntity } from './core/sprite/spriteEntity';
export type { SourceRect, AnimationOptions, SpriteEntityParams } from './core/sprite/sprite.type';

export { Renderer } from './core/render/render';
export type { RenderableEntity, DrawTextOptions } from './core/render/render';

export { AudioManager } from './core/audio/audio';
export type { AudioVolumeConfig } from './core/audio/audio.type';

export { SaveManager } from './core/save/saveManager';

export { GameLoop } from './core/loop/loop';
export { Input } from './core/io/io';
export { Scene, SceneManager } from './core/scene/scene';
export type { SceneConfig, SceneHooks } from './core/scene/scene';

export { Config } from './core/config/config';
export { Entity } from './core/entities/Entity/entity';
export { Player } from './core/entities/Player/player';
export { EntityPool } from './core/entities/pool/entitiesPool';

export { checkAABB, resolveAABB } from './core/collision/collision';
export type { AABB } from './core/collision/collision.type';

export { browserPlatform } from '../platform/browser';
export type { PlatformAPI } from '../platform/types';
