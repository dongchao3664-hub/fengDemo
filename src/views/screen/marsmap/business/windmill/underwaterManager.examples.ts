/**
 * Underwater Manager Integration Example
 * 水下模型管理器集成示例
 * 
 * 此文件展示如何在业务管理器中集成和使用 UnderwaterManager
 */

import { ref, computed } from 'vue'
import { UnderwaterManager, ModelType } from './underwaterManager'
import type { MapEngine } from '@/mars3dmap/core/MapEngine'
import type { LayerManager } from '@/mars3dmap/core/LayerManager'
import type { UnderwaterModelOptions, TilesetLayerOptions } from './underwaterManager'

/**
 * 示例1：基础集成
 * 在业务管理器中创建和初始化 UnderwaterManager
 */
export class BusinessManagerWithUnderwater {
  private mapEngine: MapEngine
  private layerManager: LayerManager
  public underwaterManager: UnderwaterManager

  constructor(mapEngine: MapEngine, layerManager: LayerManager) {
    this.mapEngine = mapEngine
    this.layerManager = layerManager
    
    // 创建水下模型管理器
    this.underwaterManager = new UnderwaterManager(mapEngine, layerManager)
  }

  /**
   * 初始化
   */
  async init() {
    // 初始化水下模型管理器
    this.underwaterManager.init()
    console.log('[BusinessManager] Underwater manager initialized')
  }

  /**
   * 销毁
   */
  destroy() {
    this.underwaterManager.destroy()
  }
}

/**
 * 示例2：Vue组件中的使用
 * 在Vue组件中管理水下模型的加载状态
 */
export function useUnderwaterModels(underwaterManager: UnderwaterManager) {
  // 加载状态
  const loadingModels = ref<Map<string, boolean>>(new Map())
  const loadedModels = ref<Set<string>>(new Set())

  /**
   * 加载水下模型
   */
  const loadModel = async (
    windmillId: string,
    options?: UnderwaterModelOptions
  ) => {
    try {
      loadingModels.value.set(windmillId, true)

      const result = await underwaterManager.loadUnderwaterModel(windmillId, {
        scale: 1,
        offsetAlt: -50,
        show: true,
        ...options
      })

      if (result.success) {
        loadedModels.value.add(windmillId)
        return { success: true, message: '模型加载成功' }
      } else {
        return { success: false, message: result.message || '加载失败' }
      }
    } catch (error) {
      console.error('[useUnderwaterModels] Load error:', error)
      return { success: false, message: `加载错误: ${error}` }
    } finally {
      loadingModels.value.set(windmillId, false)
    }
  }

  /**
   * 卸载水下模型
   */
  const unloadModel = (windmillId: string) => {
    const success = underwaterManager.unloadUnderwaterModel(windmillId)
    if (success) {
      loadedModels.value.delete(windmillId)
    }
    return success
  }

  /**
   * 切换模型显示
   */
  const toggleModel = async (windmillId: string, options?: UnderwaterModelOptions) => {
    const isLoaded = loadedModels.value.has(windmillId)
    
    if (isLoaded) {
      return unloadModel(windmillId)
    } else {
      const result = await loadModel(windmillId, options)
      return result.success
    }
  }

  /**
   * 检查模型是否正在加载
   */
  const isLoading = (windmillId: string) => {
    return loadingModels.value.get(windmillId) || false
  }

  /**
   * 检查模型是否已加载
   */
  const isLoaded = (windmillId: string) => {
    return loadedModels.value.has(windmillId)
  }

  /**
   * 获取所有已加载的模型ID
   */
  const getAllLoadedModelIds = computed(() => {
    return Array.from(loadedModels.value)
  })

  /**
   * 清理所有模型
   */
  const clearAllModels = () => {
    underwaterManager.unloadAllModels()
    loadedModels.value.clear()
    loadingModels.value.clear()
  }

  return {
    loadingModels,
    loadedModels,
    loadModel,
    unloadModel,
    toggleModel,
    isLoading,
    isLoaded,
    getAllLoadedModelIds,
    clearAllModels
  }
}

/**
 * 示例3：批量加载场景
 * 批量加载多个风机的水下模型
 */
export async function loadMultipleUnderwaterModels(
  underwaterManager: UnderwaterManager,
  windmillIds: string[],
  options?: UnderwaterModelOptions
) {
  const results: { id: string; success: boolean; message?: string }[] = []

  for (const id of windmillIds) {
    const result = await underwaterManager.loadUnderwaterModel(id, options)
    results.push({
      id,
      success: result.success,
      message: result.message
    })
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount

  console.log(`[Batch Load] Total: ${results.length}, Success: ${successCount}, Failed: ${failCount}`)

  return {
    results,
    successCount,
    failCount,
    allSuccess: failCount === 0
  }
}

/**
 * 示例4：根据视野范围加载
 * 只加载视野范围内的水下模型，优化性能
 */
export class ViewportBasedLoader {
  private underwaterManager: UnderwaterManager
  private loadedInViewport: Set<string> = new Set()
  private allWindmills: Map<string, { lng: number; lat: number }> = new Map()

  constructor(underwaterManager: UnderwaterManager) {
    this.underwaterManager = underwaterManager
  }

  /**
   * 注册风机位置
   */
  registerWindmill(id: string, lng: number, lat: number) {
    this.allWindmills.set(id, { lng, lat })
  }

  /**
   * 根据视野范围更新模型加载
   */
  async updateByViewport(
    viewport: { west: number; east: number; south: number; north: number },
    options?: UnderwaterModelOptions
  ) {
    const inViewport: string[] = []

    // 查找视野内的风机
    this.allWindmills.forEach((pos, id) => {
      if (
        pos.lng >= viewport.west &&
        pos.lng <= viewport.east &&
        pos.lat >= viewport.south &&
        pos.lat <= viewport.north
      ) {
        inViewport.push(id)
      }
    })

    // 加载视野内的模型
    for (const id of inViewport) {
      if (!this.loadedInViewport.has(id)) {
        await this.underwaterManager.loadUnderwaterModel(id, options)
        this.loadedInViewport.add(id)
      }
    }

    // 卸载视野外的模型
    const toUnload: string[] = []
    this.loadedInViewport.forEach(id => {
      if (!inViewport.includes(id)) {
        toUnload.push(id)
      }
    })

    for (const id of toUnload) {
      this.underwaterManager.unloadUnderwaterModel(id)
      this.loadedInViewport.delete(id)
    }

    console.log(`[ViewportLoader] In viewport: ${inViewport.length}, Loaded: ${this.loadedInViewport.size}`)
  }

  /**
   * 清理所有
   */
  clear() {
    this.loadedInViewport.forEach(id => {
      this.underwaterManager.unloadUnderwaterModel(id)
    })
    this.loadedInViewport.clear()
  }
}

/**
 * 示例5：预加载策略
 * 预加载附近的水下模型
 */
export class PreloadStrategy {
  private underwaterManager: UnderwaterManager
  private preloadQueue: string[] = []
  private isPreloading = false

  constructor(underwaterManager: UnderwaterManager) {
    this.underwaterManager = underwaterManager
  }

  /**
   * 添加到预加载队列
   */
  addToQueue(windmillIds: string[]) {
    this.preloadQueue.push(...windmillIds)
    this.processQueue()
  }

  /**
   * 处理预加载队列
   */
  private async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const id = this.preloadQueue.shift()
      if (id && !this.underwaterManager.isModelLoaded(id)) {
        await this.underwaterManager.loadUnderwaterModel(id, {
          scale: 1,
          offsetAlt: -50,
          show: false // 预加载但不显示
        })
        
        // 添加延迟避免阻塞
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    this.isPreloading = false
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.preloadQueue = []
  }
}

/**
 * 示例6：不同模型类型的配置
 */
export const MODEL_CONFIGS = {
  // GLB模型配置（小型精细模型）
  glb_detailed: {
    scale: 1.5,
    offsetAlt: -50,
    minimumPixelSize: 50,
    maximumPixelSize: 500,
    maximumDistance: 5000
  } as UnderwaterModelOptions,

  // GLB模型配置（大型简化模型）
  glb_simplified: {
    scale: 1.0,
    offsetAlt: -50,
    minimumPixelSize: 30,
    maximumDistance: 10000
  } as UnderwaterModelOptions,

  // 3D Tiles配置（高精度点云）
  tiles_high_quality: {
    scale: 1.0,
    offsetAlt: -30,
    maximumScreenSpaceError: 8,
    dynamicScreenSpaceError: true,
    skipLevelOfDetail: true,
    skipScreenSpaceErrorFactor: 16,
    maximumDistance: 3000
  } as TilesetLayerOptions,

  // 3D Tiles配置（低精度点云，性能优先）
  tiles_performance: {
    scale: 1.0,
    offsetAlt: -30,
    maximumScreenSpaceError: 32,
    dynamicScreenSpaceError: false,
    skipLevelOfDetail: true,
    skipScreenSpaceErrorFactor: 8,
    maximumDistance: 8000
  } as TilesetLayerOptions
}

/**
 * 示例7：完整的业务场景
 */
export class UnderwaterModelService {
  private underwaterManager: UnderwaterManager
  private loadedModels: Set<string> = new Set()
  private modelConfigs: Map<string, UnderwaterModelOptions> = new Map()

  constructor(underwaterManager: UnderwaterManager) {
    this.underwaterManager = underwaterManager
  }

  /**
   * 加载并显示水下模型
   */
  async showUnderwaterModel(
    windmillId: string,
    configKey?: keyof typeof MODEL_CONFIGS
  ) {
    try {
      // 获取配置
      const config = configKey ? MODEL_CONFIGS[configKey] : MODEL_CONFIGS.glb_detailed

      // 加载模型
      const result = await this.underwaterManager.loadUnderwaterModel(windmillId, config)
      
      if (result.success) {
        this.loadedModels.add(windmillId)
        this.modelConfigs.set(windmillId, config)

        // 延迟后飞行到模型
        setTimeout(() => {
          this.underwaterManager.flyToModel(windmillId, {
            duration: 2,
            offset: { heading: 0, pitch: -45, range: 300 }
          })
        }, 500)

        return { success: true }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('[UnderwaterModelService] Show error:', error)
      return { success: false, message: `${error}` }
    }
  }

  /**
   * 隐藏并卸载水下模型
   */
  hideUnderwaterModel(windmillId: string) {
    const success = this.underwaterManager.unloadUnderwaterModel(windmillId)
    if (success) {
      this.loadedModels.delete(windmillId)
      this.modelConfigs.delete(windmillId)
    }
    return success
  }

  /**
   * 切换水下模型
   */
  async toggleUnderwaterModel(windmillId: string) {
    if (this.loadedModels.has(windmillId)) {
      return this.hideUnderwaterModel(windmillId)
    } else {
      const result = await this.showUnderwaterModel(windmillId)
      return result.success
    }
  }

  /**
   * 检查状态
   */
  isLoaded(windmillId: string) {
    return this.loadedModels.has(windmillId)
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return {
      totalLoaded: this.loadedModels.size,
      loadedIds: Array.from(this.loadedModels)
    }
  }

  /**
   * 清理所有
   */
  clearAll() {
    this.underwaterManager.unloadAllModels()
    this.loadedModels.clear()
    this.modelConfigs.clear()
  }
}
