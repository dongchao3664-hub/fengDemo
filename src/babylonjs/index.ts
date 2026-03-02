/**
 * Babylon.js Module - 统一导出
 * 完全独立的3D引擎模块，不依赖Mars3D或业务逻辑
 */

// 核心类
export { SceneEngine, type SceneEngineOptions } from './core/SceneEngine'
export { CameraManager, type CameraConfig, type CameraType } from './core/CameraManager'
export { LightManager, type LightConfig, type LightType } from './core/LightManager'

// 加载器
export { GLBLoader, type LoadOptions, type LoadResult } from './loaders/GLBLoader'

// 测量工具
export {
  MeasurementEngine,
  type MeasurementResult as MeasurementEngineResult,
  type MeasurementOptions
} from './measurement/MeasurementEngine'
export {
  VolumeMeasure,
  type VolumeResult,
  type VolumeMeasureOptions
} from './measurement/VolumeMeasure'
export {
  AreaMeasure,
  type AreaResult,
  type AreaMeasureOptions
} from './measurement/AreaMeasure'

// Composables
export {
  useBabylonScene,
  type UseBabylonSceneReturn
} from './composables/useBabylonScene'
export {
  useBabylonMeasure,
  type UseBabylonMeasureReturn
} from './composables/useBabylonMeasure'
export {
  useBabylonModel,
  type UseBabylonModelReturn,
  type UseBabylonModelOptions
} from './composables/useBabylonModel'

// 单例导出（可选）
export { sceneEngine } from './core/SceneEngine'
