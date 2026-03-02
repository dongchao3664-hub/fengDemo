/**
 * Cable Types - 电缆线业务类型定义
 */

export interface CableSegmentData {
  id: string
  name: string
  startPoint: {
    lng: number
    lat: number
    alt: number
  }
  endPoint: {
    lng: number
    lat: number
    alt: number
  }
  type: 'power' | 'communication' | 'control'
  status: 'normal' | 'warning' | 'fault'
  voltage?: number
  current?: number
  metadata?: Record<string, any>
}

export interface CableLayerOptions {
  show?: boolean
  lineWidth?: number
  enableAnimation?: boolean
  layerId?: string
}
