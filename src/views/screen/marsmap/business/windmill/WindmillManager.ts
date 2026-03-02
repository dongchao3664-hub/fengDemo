/**
 * WindmillManager - 风机管理器（地图端）
 * 功能：在Mars3D地图上加载和管理风机
 * 设计：依赖mars3dmap，不依赖babylonjs
 */

import * as mars3d from 'mars3d'
import type { MapEngine } from '@/mars3dmap/core/MapEngine'
import type { LayerManager } from '@/mars3dmap/core/LayerManager'
import type { WindmillData, WindmillClickEvent, WindmillLayerOptions } from './types'

export class WindmillManager {
  private mapEngine: MapEngine
  private layerManager: LayerManager
  private windmillLayer: mars3d.layer.GraphicLayer | null = null
  private windmills: Map<string, mars3d.graphic.BaseGraphic> = new Map()
  private clickCallback?: (event: WindmillClickEvent) => void

  constructor(mapEngine: MapEngine, layerManager: LayerManager) {
    this.mapEngine = mapEngine
    this.layerManager = layerManager
  }

  /**
   * 初始化风机图层
   */
  initLayer(options: WindmillLayerOptions = {}): void {
    const layerId = options.layerId || 'windmill-layer'
    const existing = this.layerManager.getLayer(layerId)

    const layer = existing
      ? existing
      : this.layerManager.addLayer({
          id: layerId,
          name: '风机图层',
          type: 'graphic',
          show: options.show !== false,
          options: {
            clustering: options.enableCluster
              ? {
                  enabled: true,
                  pixelRange: options.clusterDistance || 50
                }
              : undefined
          }
        })

    if (layer) {
      this.windmillLayer = layer as mars3d.layer.GraphicLayer
      console.log('[WindmillManager] Layer initialized')
    }
  }

  /**
   * 批量添加风机
   */
  async addWindmills(windmills: WindmillData[]): Promise<void> {
    if (!this.windmillLayer) {
      console.warn('[WindmillManager] Layer not initialized')
      return
    }

    for (const windmill of windmills) {
      await this.addWindmill(windmill)
    }

    console.log(`[WindmillManager] ${windmills.length} windmills added`)
  }

  /**
   * 添加单个风机
   */
  async addWindmill(data: WindmillData): Promise<mars3d.graphic.BaseGraphic | null> {
    if (!this.windmillLayer) {
      console.warn('[WindmillManager] Layer not initialized')
      return null
    }

    // 创建风机图形（使用GLTF模型）
    const graphic = new mars3d.graphic.ModelEntity({
      id: data.id,
      name: data.name,
      position: [data.position.lng, data.position.lat, data.position.alt],
      style: {
        url: data.modelUrl,
        scale: 1,
        minimumPixelSize: 50
      },
      attr: {
        id: data.id,
        name: data.name,
        status: data.status,
        power: data.power,
        underwaterModelUrl: data.underwaterModelUrl,
        ...data.metadata
      }
    })

    // 绑定点击事件
    graphic.on(mars3d.EventType.click, (event: any) => {
      this.onWindmillClick(data, event)
    })

    this.windmillLayer.addGraphic(graphic)
    this.windmills.set(data.id, graphic)

    return graphic
  }

  /**
   * 移除风机
   */
  removeWindmill(id: string): boolean {
    const graphic = this.windmills.get(id)
    if (!graphic || !this.windmillLayer) {
      return false
    }

    this.windmillLayer.removeGraphic(graphic)
    this.windmills.delete(id)
    console.log(`[WindmillManager] Windmill ${id} removed`)
    return true
  }

  /**
   * 获取风机
   */
  getWindmill(id: string): mars3d.graphic.BaseGraphic | null {
    return this.windmills.get(id) || null
  }

  /**
   * 飞行到风机
   */
  flyToWindmill(id: string): void {
    const graphic = this.windmills.get(id)
    if (!graphic) {
      console.warn(`[WindmillManager] Windmill ${id} not found`)
      return
    }

    graphic.flyTo({ duration: 2, radius: 500 })
  }

  /**
   * 设置点击回调
   */
  onWindmillClickEvent(callback: (event: WindmillClickEvent) => void): void {
    this.clickCallback = callback
  }

  /**
   * 清空所有风机
   */
  clearAll(): void {
    if (this.windmillLayer) {
      this.windmillLayer.clear()
    }
    this.windmills.clear()
    console.log('[WindmillManager] All windmills cleared')
  }

  /**
   * 显示/隐藏风机图层
   */
  toggleLayer(show?: boolean): void {
    if (this.windmillLayer) {
      this.windmillLayer.show = show !== undefined ? show : !this.windmillLayer.show
    }
  }

  /**
   * 获取风机数量
   */
  getCount(): number {
    return this.windmills.size
  }

  // ========== 私有方法 ==========

  private onWindmillClick(data: WindmillData, event: any): void {
    console.log('[WindmillManager] Windmill clicked:', data.name)

    if (this.clickCallback) {
      this.clickCallback({
        windmill: data,
        position: data.position
      })
    }
  }
}
