/**
 * LayerManager - Mars3D 图层管理器
 * 功能：图层的添加、移除、显示/隐藏、查询
 * 设计：依赖MapEngine，但不依赖业务逻辑
 */

import * as mars3d from 'mars3d'
import type { MapEngine } from './MapEngine'

export interface LayerConfig {
  id: string
  name: string
  type: 'graphic' | 'tile' | 'geojson' | 'wms' | 'xyz'
  show?: boolean
  zIndex?: number
  options?: Record<string, any>
}

export class LayerManager {
  private mapEngine: MapEngine
  private layers: Map<string, mars3d.layer.Layer> = new Map()

  constructor(mapEngine: MapEngine) {
    this.mapEngine = mapEngine
  }

  /**
   * 添加图层
   */
  addLayer(config: LayerConfig): mars3d.layer.Layer | null {
    const map = this.mapEngine.getInstance()
    if (!map) {
      console.warn('[LayerManager] Map not initialized')
      return null
    }

    // 检查是否已存在
    if (this.layers.has(config.id)) {
      console.warn(`[LayerManager] Layer "${config.id}" already exists`)
      return this.layers.get(config.id) || null
    }

    // 创建图层
    let layer: mars3d.layer.Layer | null = null

    switch (config.type) {
      case 'graphic':
        layer = new mars3d.layer.GraphicLayer(config.options)
        break
      case 'tile':
        layer = new mars3d.layer.XyzLayer(config.options)
        break
      case 'geojson':
        layer = new mars3d.layer.GeoJsonLayer(config.options)
        break
      default:
        console.warn(`[LayerManager] Unsupported layer type: ${config.type}`)
        return null
    }

    if (layer) {
      layer.id = config.id
      layer.name = config.name
      layer.show = config.show !== false

      if (config.zIndex !== undefined) {
        layer.zIndex = config.zIndex
      }

      map.addLayer(layer)
      this.layers.set(config.id, layer)
      console.log(`[LayerManager] Layer "${config.id}" added`)
    }

    return layer
  }

  /**
   * 移除图层
   */
  removeLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId)
    if (!layer) {
      console.warn(`[LayerManager] Layer "${layerId}" not found`)
      return false
    }

    const map = this.mapEngine.getInstance()
    if (map) {
      map.removeLayer(layer)
    }

    this.layers.delete(layerId)
    console.log(`[LayerManager] Layer "${layerId}" removed`)
    return true
  }

  /**
   * 获取图层
   */
  getLayer(layerId: string): mars3d.layer.Layer | null {
    return this.layers.get(layerId) || null
  }

  /**
   * 显示/隐藏图层
   */
  toggleLayer(layerId: string, show?: boolean): boolean {
    const layer = this.layers.get(layerId)
    if (!layer) {
      console.warn(`[LayerManager] Layer "${layerId}" not found`)
      return false
    }

    layer.show = show !== undefined ? show : !layer.show
    return true
  }

  /**
   * 清空所有图层
   */
  clearAll(): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    this.layers.forEach((layer) => {
      map.removeLayer(layer)
    })

    this.layers.clear()
    console.log('[LayerManager] All layers cleared')
  }

  /**
   * 获取所有图层ID
   */
  getAllLayerIds(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * 获取图层数量
   */
  getLayerCount(): number {
    return this.layers.size
  }

  /**
   * 判断图层是否存在
   */
  hasLayer(layerId: string): boolean {
    return this.layers.has(layerId)
  }
}
