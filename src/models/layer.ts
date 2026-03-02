/**
 * 图层配置模型
 */

export type LayerType = 'basemap' | 'tile' | 'feature' | 'model' | 'wind' | 'cable'

export interface LayerConfig {
  id: string
  name: string
  type: LayerType
  visible: boolean
  opacity: number
  zIndex?: number
  url?: string
  options?: Record<string, any>
  style?: LayerStyle
}

export interface LayerStyle {
  color?: string
  opacity?: number
  width?: number
  height?: number
  [key: string]: any
}

/** 底图配置 */
export interface BaseMapConfig extends LayerConfig {
  type: 'basemap'
  provider: 'osm' | 'google' | 'amap' | 'custom'
}

/** 瓦片图层配置 */
export interface TileLayerConfig extends LayerConfig {
  type: 'tile'
  urlTemplate: string
  attribution: string
  minZoom?: number
  maxZoom?: number
}

/** 要素图层配置 */
export interface FeatureLayerConfig extends LayerConfig {
  type: 'feature'
  dataSource: 'api' | 'geojson' | 'file'
  dataUrl?: string
  geoJsonData?: any
}

/** 模型图层配置 */
export interface ModelLayerConfig extends LayerConfig {
  type: 'model'
  modelType: 'gltf' | 'obj' | '3dtiles'
}

/** 风场图层配置 */
export interface WindLayerConfig extends LayerConfig {
  type: 'wind'
  renderMode: 'particles' | 'vectors' | 'heatmap'
  dataSource: 'api' | 'file'
}

/** 电缆图层配置 */
export interface CableLayerConfig extends LayerConfig {
  type: 'cable'
  cableType: 'power' | 'signal' | 'all'
  showSegments: boolean
}
