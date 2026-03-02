/**
 * Business Module - 统一导出
 * 业务模块：桥接引擎层和数据层
 */

// 风机业务
export { WindmillManager } from './windmill/WindmillManager'
export { WindmillModel } from './windmill/WindmillModel'
export { UnderwaterManager, ModelType } from './windmill/underwaterManager'
export type {
  WindmillData,
  WindmillClickEvent,
  WindmillLayerOptions,
  UnderwaterModelData
} from './windmill/types'
export type {
  UnderwaterModelOptions,
  TilesetLayerOptions,
  ModelLoadResult
} from './windmill/underwaterManager'

// 电缆线业务
export { CableLineManager } from './cable/CableLineManager'
export type {
  CableSegmentData,
  CableLayerOptions
} from './cable/types'

