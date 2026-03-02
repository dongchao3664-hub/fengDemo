/**
 * Mars3D Map Module - 统一导出
 * 完全独立的地图引擎模块，不依赖业务逻辑
 */

// 核心类
export { MapEngine, type MapEngineOptions } from './core/MapEngine'
export { LayerManager, type LayerConfig } from './core/LayerManager'
export {
  CameraController,
  type FlyToOptions,
  type CameraView
} from './core/CameraController'

// Composables
export { useMapInstance, type UseMapInstanceReturn } from './composables/useMapInstance'

// 单例导出（可选）
export { mapEngine } from './core/MapEngine'
