/**
 * useBusinessManagement - 业务管理 Composable Hook
 * 职责：
 * 1. 管理所有的业务层管理器（风机、海缆线等）
 * 2. 协调业务逻辑和地图显示
 * 3. 处理业务交互事件
 */

import { ref } from 'vue'
import * as mars3d from 'mars3d'
import { WindmillLayerManager } from '@/views/screen/marsmap/business/windmill/WindmillLayerManager'
import { CableLayerManager, CableType } from '@/views/screen/marsmap/business/cable/CableLayerManager'
import { UnderwaterManager } from '@/views/screen/marsmap/business/windmill/underwaterManager'
import type { WindmillMockData } from '@/views/screen/marsmap/business/windmill/WindmillLayerManager'
import type { CableMockData } from '@/views/screen/marsmap/business/cable/CableLayerManager'

export interface BusinessManagementOptions {
  mapInstance: any
  enableWindmill?: boolean
  enableCable?: boolean
  enableUnderwaterModel?: boolean
  enablePointCloud?: boolean
}

export function useBusinessManagement(options: BusinessManagementOptions) {
  const mapInstance = options.mapInstance

  // 各个业务管理器
  const windmillManager = ref<WindmillLayerManager | null>(null)
  const cableManager = ref<CableLayerManager | null>(null)
  const underwaterManager = ref<UnderwaterManager | null>(null)

  // 业务数据状态
  const selectedWindmill = ref<WindmillMockData | null>(null)
  const selectedCable = ref<CableMockData | null>(null)
  const highlightedWindmillIds = ref<string[]>([])

  /**
   * 初始化所有业务管理器
   */
  const initManagers = (): void => {
    if (!mapInstance) {
      console.warn('[useBusinessManagement] Map instance is invalid')
      return
    }

    // 初始化风机管理器
    if (options.enableWindmill !== false) {
      windmillManager.value = new WindmillLayerManager(mapInstance, 'windmillLayer')
      windmillManager.value.init()

      // 注册风机点击事件
      windmillManager.value.onClick((event) => {
        selectedWindmill.value = event.windmill
        console.log('[useBusinessManagement] Windmill clicked:', event.windmill.id)
      })

      console.log('[useBusinessManagement] Windmill manager initialized')
    }

    // 初始化电缆线管理器
    if (options.enableCable !== false) {
      cableManager.value = new CableLayerManager(mapInstance, 'cableLayer')
      cableManager.value.init()

      // 注册海缆点击事件
      cableManager.value.onClick((event) => {
        selectedCable.value = event.cable
        console.log('[useBusinessManagement] Cable clicked:', event.cable.id)
      })

      console.log('[useBusinessManagement] Cable manager initialized')
    }

    // 初始化水下模型管理器
    if (options.enableUnderwaterModel !== false) {
      // 需要获取 mapEngine 和 layerManager
      // 临时方案：直接传入 mapInstance
      const mockMapEngine = { map: mapInstance } as any
      const mockLayerManager = {
        getLayer: (id: string) => mapInstance.getLayerById(id),
        addLayer: (config: any) => {
          const layer = new mars3d.layer.GraphicLayer({
            id: config.id,
            name: config.name,
            show: config.show
          })
          mapInstance.addLayer(layer)
          return layer
        }
      } as any
      
      underwaterManager.value = new UnderwaterManager(mockMapEngine, mockLayerManager)
      underwaterManager.value.init()
      console.log('[useBusinessManagement] Underwater manager initialized')
    }

    // 其他业务管理器初始化可在此添加
  }

  /**
   * 加载风机数据
   */
  const loadWindmills = (windmills: WindmillMockData[]): void => {
    if (windmillManager.value) {
      windmillManager.value.loadWindmills(windmills)
    }
  }

  /**
   * 加载海缆线数据
   */
  const loadCables = (cables: CableMockData[]): void => {
    if (cableManager.value) {
      cableManager.value.loadCables(cables)
    }
  }

  /**
   * 按类型筛选海缆（掩埋/裸露）
   */
  const filterCablesByType = (type: CableType | null): void => {
    if (cableManager.value) {
      cableManager.value.filterByType(type)
    }
  }

  /**
   * 高亮风机
   */
  const highlightWindmills = (windmillIds: string[]): void => {
    highlightedWindmillIds.value = windmillIds
    if (windmillManager.value) {
      windmillManager.value.highlight(windmillIds)
    }
  }

  /**
   * 清空风机高亮
   */
  const clearWindmillHighlight = (): void => {
    highlightedWindmillIds.value = []
    if (windmillManager.value) {
      windmillManager.value.clearHighlight()
    }
  }

  /**
   * 高亮电缆线
   */
  const highlightCables = (cableIds: string[]): void => {
    if (cableManager.value) {
      cableManager.value.highlight(cableIds)
    }
  }

  /**
   * 清空电缆线高亮
   */
  const clearCableHighlight = (): void => {
    if (cableManager.value) {
      cableManager.value.clearHighlight()
    }
  }

  /**
   * 获取选中的风机
   */
  const getSelectedWindmill = (): WindmillMockData | null => {
    return selectedWindmill.value
  }

  /**
   * 飞行定位到风机
   */
  const flyToWindmill = (windmillId: string): void => {
    if (windmillManager.value) {
      windmillManager.value.flyTo(windmillId)
    }
  }

  /**
   * 飞行定位到海缆
   */
  const flyToCable = (cableId: string): void => {
    if (cableManager.value) {
      cableManager.value.flyTo(cableId)
    }
  }

  /**
   * 清空选中
   */
  const clearSelection = (): void => {
    selectedWindmill.value = null
    clearWindmillHighlight()
  }

  /**
   * 清空所有业务数据
   */
  const clearAll = (): void => {
    if (windmillManager.value) {
      windmillManager.value.clear()
    }
    if (cableManager.value) {
      cableManager.value.clear()
    }
    clearSelection()
  }

  /**
   * 销毁所有管理器
   */
  const destroy = (): void => {
    if (windmillManager.value) {
      // windmillManager.value.destroy()
      windmillManager.value = null
    }
    if (cableManager.value) {
      // cableManager.value.destroy()
      cableManager.value = null
    }
    if (underwaterManager.value) {
      underwaterManager.value.destroy()
      underwaterManager.value = null
    }
  }

  return {
    // 管理器实例
    windmillManager,
    cableManager,
    underwaterManager,

    // 业务数据状态
    selectedWindmill,
    selectedCable,
    highlightedWindmillIds,

    // 方法
    initManagers,
    loadWindmills,
    loadCables,
    filterCablesByType,
    highlightWindmills,
    clearWindmillHighlight,
    highlightCables,
    clearCableHighlight,
    flyToWindmill,
    flyToCable,
    getSelectedWindmill,
    clearSelection,
    clearAll,
    destroy,
  }
}
