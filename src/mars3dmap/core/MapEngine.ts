/**
 * MapEngine - Mars3D 地图引擎核心类
 * 功能：地图初始化、销毁、配置管理
 * 设计：完全独立，不依赖业务逻辑
 */

import * as mars3d from 'mars3d'

export interface MapEngineOptions {
  container: string | HTMLElement
  scene?: mars3d.SceneOptions
  control?: {
    baseLayerPicker?: boolean
    sceneModePicker?: boolean
    navigationHelpButton?: boolean
    homeButton?: boolean
    fullscreenButton?: boolean
  }
  terrain?: {
    url?: string
    show?: boolean
  }
  basemaps?: Array<{
    name: string
    type: string
    layer: string
    show?: boolean
  }>
}

export class MapEngine {
  private map: mars3d.Map | null = null
  private container: HTMLElement | null = null
  private isInitialized = false

  /**
   * 初始化地图引擎
   */
  async init(options: MapEngineOptions): Promise<mars3d.Map> {
    if (this.isInitialized && this.map) {
      console.warn('[MapEngine] Already initialized')
      return this.map
    }

    // 解析容器
    this.container = this.resolveContainer(options.container)
    if (!this.container) {
      throw new Error('[MapEngine] Invalid container element')
    }

    // 构建地图配置
    const mapOptions = this.buildMapOptions(options)

    // 创建地图实例
    try {
      this.map = new mars3d.Map(this.container, mapOptions)
      this.isInitialized = true
      console.log('[MapEngine] Initialized successfully')
      return this.map
    } catch (error) {
      console.error('[MapEngine] Init failed:', error)
      throw error
    }
  }

  /**
   * 获取地图实例
   */
  getInstance(): mars3d.Map | null {
    return this.map
  }

  /**
   * 销毁地图
   */
  destroy(): void {
    if (this.map) {
      this.map.destroy()
      this.map = null
      this.isInitialized = false
      console.log('[MapEngine] Destroyed')
    }
  }

  /**
   * 飞行到指定位置
   */
  flyTo(position: {
    lng: number
    lat: number
    alt?: number
    heading?: number
    pitch?: number
  }): void {
    if (!this.map) {
      console.warn('[MapEngine] Map not initialized')
      return
    }

    this.map.flyToPoint(position, {
      duration: 2
    })
  }

  /**
   * 设置地图中心
   */
  setCenter(position: { lng: number; lat: number; alt?: number }): void {
    if (!this.map) return
    this.map.setCameraView(position)
  }

  /**
   * 获取当前相机视角
   */
  getCameraView() {
    if (!this.map) return null
    return this.map.getCameraView()
  }

  /**
   * 是否已初始化
   */
  get initialized(): boolean {
    return this.isInitialized
  }

  // ========== 私有方法 ==========

  private resolveContainer(container: string | HTMLElement): HTMLElement | null {
    if (typeof container === 'string') {
      return document.getElementById(container)
    }
    return container
  }

  private buildMapOptions(options: MapEngineOptions): mars3d.MapOptions {
    const defaultOptions: mars3d.MapOptions = {
      scene: {
        center: { lng: 120.0, lat: 30.0, alt: 100000, heading: 0, pitch: -90 },
        ...options.scene
      },
      control: {
        baseLayerPicker: false,
        sceneModePicker: false,
        ...options.control
      },
      basemaps: options.basemaps || [
        {
          name: '高德影像',
          type: 'gaode',
          layer: 'img_d',
          show: true
        }
      ]
    }

    if (options.terrain) {
      defaultOptions.terrain = options.terrain
    }

    return defaultOptions
  }
}

// 单例导出（可选）
export const mapEngine = new MapEngine()
