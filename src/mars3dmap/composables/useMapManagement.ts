/**
 * useMapManagement - 地图管理 Composable Hook
 * 职责：
 * 1. 地图实例的初始化和生命周期管理
 * 2. 图层的创建、管理、显隐
 * 3. 业务逻辑的初始化（如加载风机、电缆线等）
 */

import { ref, reactive } from 'vue'
import * as mars3d from 'mars3d'

// 定义类型
export interface LayerItem {
  id: string
  name: string
  options?: Record<string, any>
}

export interface LayerGroup {
  label: string
  value: number
  img?: string
  layers: LayerItem[]
  show: boolean
  isDisplay: boolean
}

export interface LayerManageData {
  checkList: string[]
  layerList: LayerGroup[]
  colorSel?: string[]
  [key: string]: any
}

export interface MapManagementOptions {
  container: string | HTMLElement
  configUrl?: string
  layerConfig: LayerManageData
  mapInstance?: any // 外部传入的地图实例
}

export function useMapManagement(options: MapManagementOptions) {
  // 地图实例（可以从外部传入）
  const mapInstance = ref<any>(options.mapInstance || null)
  const isMapLoaded = ref(!!options.mapInstance)

  // 图层缓存
  const layers = reactive<Map<string, any>>(new Map())

  // 图层显隐状态
  const visibleLayers = ref<string[]>([...options.layerConfig.checkList])

  /**
   * 初始化地图
   */
  const initMap = async () => {
    try {
      let mapOptions: any

      // 从 URL 加载地图配置
      if (options.configUrl) {
        mapOptions = await mars3d.Util.fetchJson({ url: options.configUrl })
      } else {
        mapOptions = {
          basemaps: [
            {
              name: '标准地图',
              type: 'standard',
              show: true,
            },
          ],
          center: { lat: 30, lng: 120, alt: 10000 },
        }
      }

      // 创建地图实例
      let containerElement: any =
        typeof options.container === 'string'
          ? document.getElementById(options.container)
          : options.container

      if (!containerElement) {
        throw new Error('Map container element not found')
      }

      mapInstance.value = new mars3d.Map(containerElement, mapOptions)
      isMapLoaded.value = true

      console.log('[useMapManagement] Map initialized successfully')

      return mapInstance.value
    } catch (error) {
      console.error('[useMapManagement] Failed to initialize map:', error)
      throw error
    }
  }

  /**
   * 创建图层管理结构
   * 根据配置数据创建所有的 GraphicLayer
   */
  const createLayerManagement = (layerConfig: LayerManageData) => {
    console.log('[useMapManagement] createLayerManagement called')
    console.log('[useMapManagement] mapInstance.value:', mapInstance.value)
    
    if (!mapInstance.value) {
      console.warn('[useMapManagement] Map not initialized')
      return
    }

    // 检查 addLayer 方法是否存在，这是我们实际需要的
    if (typeof mapInstance.value.addLayer !== 'function') {
      console.warn('[useMapManagement] Map addLayer method not available')
      return
    }

    console.log('[useMapManagement] mapInstance.value.addLayer:', typeof mapInstance.value.addLayer)

    const layerList = layerConfig.layerList

    layerList.forEach((group: LayerGroup) => {
      group.layers.forEach((layerItem: LayerItem) => {
        try {
          const existingLayer = mapInstance.value?.getLayerById?.(layerItem.id)

          if (existingLayer) {
            console.debug(`[useMapManagement] Layer "${layerItem.id}" already exists`)
            layers.set(layerItem.id, existingLayer)
            return
          }

          // 创建 GraphicLayer
          const graphicLayer = new mars3d.layer.GraphicLayer(layerItem.options)
          graphicLayer.id = layerItem.id
          graphicLayer.name = layerItem.name

          // 根据初始配置设置显隐
          graphicLayer.show = group.show

          console.log(`[useMapManagement] Adding layer "${layerItem.id}" to map...`)
          mapInstance.value.addLayer(graphicLayer)
          
          // 验证是否添加成功
          const addedLayer = mapInstance.value?.getLayerById?.(layerItem.id)
          console.log(`[useMapManagement] Layer "${layerItem.id}" added, verify:`, !!addedLayer)
          
          layers.set(layerItem.id, graphicLayer)

          console.log(`[useMapManagement] Layer "${layerItem.id}(${layerItem.name})" created successfully`)
        } catch (error) {
          console.warn(`[useMapManagement] Error creating layer "${layerItem.id}":`, error)
        }
      })
    })
  }

  /**
   * 根据可选项切换图层显隐
   * @param selectedLabels 选中的图层分组标签
   */
  const toggleLayers = (selectedLabels: string[]) => {
    if (!mapInstance.value) {
      console.warn('[useMapManagement] Map not initialized')
      return
    }

    const layerList = options.layerConfig.layerList

    layerList.forEach((group: LayerGroup) => {
      const isSelected = selectedLabels.includes(group.label)
      group.show = isSelected

      // 更新对应的图层显隐
      group.layers.forEach((layerItem: LayerItem) => {
        const layer = layers.get(layerItem.id)
        if (layer) {
          layer.show = isSelected
          console.log(
            `[useMapManagement] Layer "${layerItem.id}" visibility set to ${isSelected}`
          )
        }
      })
    })

    // 更新本地状态
    visibleLayers.value = [...selectedLabels]
  }

  /**
   * 获取图层实例
   */
  const getLayer = (layerId: string): any | undefined => {
    return layers.get(layerId)
  }

  /**
   * 获取所有图层
   */
  const getAllLayers = (): Map<string, any> => {
    return layers
  }

  /**
   * 清空特定图层的所有图形
   */
  const clearLayerGraphics = (layerId: string) => {
    const layer = layers.get(layerId)
    if (layer && layer instanceof mars3d.layer.GraphicLayer) {
      layer.clear()
      console.log(`[useMapManagement] Layer "${layerId}" cleared`)
    }
  }

  /**
   * 销毁地图
   */
  const destroy = () => {
    if (mapInstance.value) {
      mapInstance.value.destroy()
      mapInstance.value = null
      isMapLoaded.value = false
      layers.clear()
      console.log('[useMapManagement] Map destroyed')
    }
  }

  return {
    // 地图实例
    mapInstance,
    isMapLoaded,

    // 图层管理
    visibleLayers,
    layers,

    // 方法
    initMap,
    createLayerManagement,
    toggleLayers,
    getLayer,
    getAllLayers,
    clearLayerGraphics,
    destroy,
  }
}
