/**
 * 测量数据模型
 * 定义 BabylonJS 场景中的测量相关数据结构
 */

import * as BABYLON from 'babylonjs'

/** 测量点 */
export interface MeasurementPoint {
  id: string
  position: {
    x: number
    y: number
    z: number
  }
  label?: string
  timestamp: number
  mesh?: BABYLON.Mesh      // BabylonJS 网格引用
}

/** 测量类型 */
export type MeasurementType = 'distance' | 'area' | 'volume' | 'perimeter' | 'height'

/** 测量结果 */
export interface MeasurementResult {
  id: string
  type: MeasurementType
  value: number
  unit: string                 // 'm', 'm²', 'm³' 等
  points: MeasurementPoint[]
  description?: string
  timestamp: number
  metadata?: {
    precision?: number         // 精度
    method?: string            // 计算方法
    notes?: string             // 备注
  }
}

/** 测量状态 */
export interface MeasurementState {
  isActive: boolean            // 是否正在测量
  mode: MeasurementType | null // 当前测量模式
  points: MeasurementPoint[]   // 当前测量点列表
  currentId?: string           // 当前活跃测量ID
  results: MeasurementResult[] // 历史测量结果
}

/** 距离测量结果 */
export interface DistanceMeasurement extends MeasurementResult {
  type: 'distance'
  value: number                // 距离值 (m)
  unit: 'm'
}

/** 面积测量结果 */
export interface AreaMeasurement extends MeasurementResult {
  type: 'area'
  value: number                // 面积值 (m²)
  unit: 'm²'
  perimeter?: number           // 周长
}

/** 体积（方量）测量结果 */
export interface VolumeMeasurement extends MeasurementResult {
  type: 'volume'
  value: number                // 体积值 (m³)
  unit: 'm³'
  baseArea?: number            // 底面积
  height?: number              // 高度
}

/** 高度测量结果 */
export interface HeightMeasurement extends MeasurementResult {
  type: 'height'
  value: number                // 高度值 (m)
  unit: 'm'
}

/** 测量配置 */
export interface MeasurementConfig {
  pointSize: number            // 点大小
  pointColor: string           // 点颜色
  lineColor: string            // 线颜色
  lineWidth: number            // 线宽
  labelColor: string           // 标签颜色
  showLabels: boolean          // 是否显示标签
  showPoints: boolean          // 是否显示点
  precision: number            // 精度小数位数
}

/** 测量工具配置 */
export interface MeasurementToolConfig {
  enableSnap: boolean          // 是否启用吸附
  snapDistance: number         // 吸附距离
  enableGrid: boolean          // 是否显示网格
  gridSize: number             // 网格大小
}
