/**
 * Windmill Types - 风机业务类型定义
 */

export interface WindmillData {
  id: string
  name: string
  position: {
    lng: number
    lat: number
    alt: number
  }
  modelUrl: string
  underwaterModelUrl?: string  // 水下GLB模型URL
  underwaterTilesetUrl?: string  // 水下点云(3D Tiles)URL
  status: 'online' | 'offline' | 'maintenance'
  power?: number
  rotation?: number
  metadata?: Record<string, any>
}

export interface WindmillClickEvent {
  windmill: WindmillData
  position: { lng: number; lat: number; alt: number }
}

export interface WindmillLayerOptions {
  show?: boolean
  clusterDistance?: number
  enableCluster?: boolean
  modelScale?: number
  layerId?: string
}

/**
 * 水下模型数据类型
 */
export interface UnderwaterModelData {
  id: string
  windmillId: string
  name: string
  glbUrl?: string  // GLB模型URL
  tilesetUrl?: string  // 点云URL
  position: {
    lng: number
    lat: number
    alt: number
  }
  glbOptions?: {
    scale?: number
    offsetAlt?: number
    heading?: number
    pitch?: number
    roll?: number
    [key: string]: any
  }
  tilesetOptions?: {
    scale?: number
    offsetAlt?: number
    heading?: number
    pitch?: number
    roll?: number
    maximumScreenSpaceError?: number
    [key: string]: any
  }
}
