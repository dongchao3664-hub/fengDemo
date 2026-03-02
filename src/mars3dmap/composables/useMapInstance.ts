/**
 * useMapInstance - Mars3D 地图实例钩子
 * 功能：Vue3 Composition API 封装，管理地图生命周期
 * 设计：组件级的地图管理
 */

import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type * as mars3d from 'mars3d'
import { MapEngine, type MapEngineOptions } from '../core/MapEngine'
import { LayerManager } from '../core/LayerManager'
import { CameraController } from '../core/CameraController'

export interface UseMapInstanceReturn {
  map: Ref<mars3d.Map | null>
  mapEngine: MapEngine
  layerManager: LayerManager
  cameraController: CameraController
  isReady: Ref<boolean>
  initMap: (options: MapEngineOptions) => Promise<void>
  destroyMap: () => void
}

/**
 * 使用地图实例
 * @param autoInit - 是否自动初始化
 * @param options - 地图配置项
 */
export function useMapInstance(
  autoInit = false,
  options?: MapEngineOptions
): UseMapInstanceReturn {
  const map = ref<mars3d.Map | null>(null)
  const isReady = ref(false)

  // 创建引擎实例
  const mapEngine = new MapEngine()
  const layerManager = new LayerManager(mapEngine)
  const cameraController = new CameraController(mapEngine)

  /**
   * 初始化地图
   */
  const initMap = async (initOptions: MapEngineOptions): Promise<void> => {
    try {
      const mapInstance = await mapEngine.init(initOptions)
      map.value = mapInstance
      isReady.value = true
      console.log('[useMapInstance] Map initialized')
    } catch (error) {
      console.error('[useMapInstance] Init failed:', error)
      throw error
    }
  }

  /**
   * 销毁地图
   */
  const destroyMap = (): void => {
    layerManager.clearAll()
    mapEngine.destroy()
    map.value = null
    isReady.value = false
    console.log('[useMapInstance] Map destroyed')
  }

  // 自动初始化
  onMounted(async () => {
    if (autoInit && options) {
      await initMap(options)
    }
  })

  // 自动销毁
  onBeforeUnmount(() => {
    destroyMap()
  })

  return {
    map,
    mapEngine,
    layerManager,
    cameraController,
    isReady,
    initMap,
    destroyMap
  }
}
