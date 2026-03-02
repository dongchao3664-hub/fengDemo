/**
 * CableLineManager - 电缆线管理器
 * 功能：在Mars3D地图上加载和管理电缆线
 * 设计：依赖mars3dmap
 */

import * as mars3d from 'mars3d'
import type { MapEngine } from '@/mars3dmap/core/MapEngine'
import type { LayerManager } from '@/mars3dmap/core/LayerManager'
import type { CableSegmentData, CableLayerOptions } from './types'

export class CableLineManager {
  private mapEngine: MapEngine
  private layerManager: LayerManager
  private cableLayer: mars3d.layer.GraphicLayer | null = null
  private cables: Map<string, mars3d.graphic.BaseGraphic> = new Map()

  constructor(mapEngine: MapEngine, layerManager: LayerManager) {
    this.mapEngine = mapEngine
    this.layerManager = layerManager
  }

  /**
   * 初始化电缆线图层
   */
  initLayer(options: CableLayerOptions = {}): void {
    const layerId = options.layerId || 'cable-layer'
    const existing = this.layerManager.getLayer(layerId)

    const layer = existing
      ? existing
      : this.layerManager.addLayer({
          id: layerId,
          name: '电缆线图层',
          type: 'graphic',
          show: options.show !== false
        })

    if (layer) {
      this.cableLayer = layer as mars3d.layer.GraphicLayer
      console.log('[CableLineManager] Layer initialized')
    }
  }

  /**
   * 批量添加电缆线
   */
  async addCables(cables: CableSegmentData[]): Promise<void> {
    if (!this.cableLayer) {
      console.warn('[CableLineManager] Layer not initialized')
      return
    }

    for (const cable of cables) {
      await this.addCable(cable)
    }

    console.log(`[CableLineManager] ${cables.length} cables added`)
  }

  /**
   * 添加单条电缆线
   */
  async addCable(data: CableSegmentData): Promise<mars3d.graphic.BaseGraphic | null> {
    if (!this.cableLayer) {
      console.warn('[CableLineManager] Layer not initialized')
      return null
    }

    // 根据状态选择颜色
    const color = this.getColorByStatus(data.status)

    // 创建线段
    const graphic = new mars3d.graphic.PolylineEntity({
      id: data.id,
      positions: [
        [data.startPoint.lng, data.startPoint.lat, data.startPoint.alt],
        [data.endPoint.lng, data.endPoint.lat, data.endPoint.alt]
      ],
      style: {
        width: 3,
        material: color,
        clampToGround: false
      },
      attr: {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        voltage: data.voltage,
        current: data.current,
        ...data.metadata
      }
    })

    this.cableLayer.addGraphic(graphic)
    this.cables.set(data.id, graphic)

    return graphic
  }

  /**
   * 移除电缆线
   */
  removeCable(id: string): boolean {
    const graphic = this.cables.get(id)
    if (!graphic || !this.cableLayer) {
      return false
    }

    this.cableLayer.removeGraphic(graphic)
    this.cables.delete(id)
    console.log(`[CableLineManager] Cable ${id} removed`)
    return true
  }

  /**
   * 更新电缆线状态
   */
  updateCableStatus(id: string, status: 'normal' | 'warning' | 'fault'): boolean {
    const graphic = this.cables.get(id)
    if (!graphic) {
      return false
    }

    const color = this.getColorByStatus(status)
    graphic.setStyle({ material: color })

    console.log(`[CableLineManager] Cable ${id} status updated to ${status}`)
    return true
  }

  /**
   * 飞行到电缆线
   */
  flyToCable(id: string): void {
    const graphic = this.cables.get(id)
    if (!graphic) {
      console.warn(`[CableLineManager] Cable ${id} not found`)
      return
    }

    graphic.flyTo({ duration: 2 })
  }

  /**
   * 清空所有电缆线
   */
  clearAll(): void {
    if (this.cableLayer) {
      this.cableLayer.clear()
    }
    this.cables.clear()
    console.log('[CableLineManager] All cables cleared')
  }

  /**
   * 显示/隐藏电缆线图层
   */
  toggleLayer(show?: boolean): void {
    if (this.cableLayer) {
      this.cableLayer.show = show !== undefined ? show : !this.cableLayer.show
    }
  }

  /**
   * 获取电缆线数量
   */
  getCount(): number {
    return this.cables.size
  }

  // ========== 私有方法 ==========

  private getColorByStatus(status: string): string {
    switch (status) {
      case 'normal':
        return '#00ff00'
      case 'warning':
        return '#ffff00'
      case 'fault':
        return '#ff0000'
      default:
        return '#ffffff'
    }
  }
}
