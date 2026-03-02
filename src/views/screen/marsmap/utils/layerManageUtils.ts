/**
 * 图层管理工具函数
 * 提供统一的图层显隐、数据加载等操作
 */

import * as mars3d from 'mars3d'
import type { LayerManageData, LayerGroup } from '../data/layerManage.data'

/**
 * 根据选中的图层标签切换显隐
 * @param map 地图实例
 * @param layerConfig 图层配置
 * @param selectedLabels 选中的图层标签列表
 */
export function toggleLayersBySelection(
  map: mars3d.Map,
  layerConfig: LayerManageData,
  selectedLabels: string[]
): void {
  // 验证 map 实例是否有效
  if (!map) {
    console.warn('[toggleLayersBySelection] Map instance is invalid')
    return
  }

  // 检查 map 是否已经完全初始化（通过 getLayerById 是否可用）
  if (!map.getLayerById) {
    console.warn('[toggleLayersBySelection] Map layers not initialized yet')
    return
  }

  const layerList = layerConfig.layerList

  layerList.forEach((group: LayerGroup) => {
    const isSelected = selectedLabels.includes(group.label)
    group.show = isSelected

    // 更新对应的图层显隐
    group.layers.forEach((layerItem) => {
      try {
        const layer = map.getLayerById(layerItem.id)
        if (layer) {
          layer.show = isSelected
          console.log(
            `[toggleLayersBySelection] Layer "${layerItem.id}" (${group.label}) visibility set to ${isSelected}`
          )
        } else {
          console.debug(
            `[toggleLayersBySelection] Layer "${layerItem.id}" not found in map, skipping`
          )
        }
      } catch (error) {
        console.warn(
          `[toggleLayersBySelection] Error toggling layer "${layerItem.id}":`,
          error
        )
      }
    })
  })
}

/**
 * 清空指定图层的所有图形
 * @param map 地图实例
 * @param layerId 图层ID
 */
export function clearLayerGraphics(map: mars3d.Map, layerId: string): void {
  if (!map) {
    console.warn('[clearLayerGraphics] Map instance is invalid')
    return
  }

  const layer = map.getLayerById(layerId) as mars3d.layer.GraphicLayer
  if (layer && layer instanceof mars3d.layer.GraphicLayer) {
    layer.clear()
    console.log(`[clearLayerGraphics] Layer "${layerId}" cleared`)
  }
}

/**
 * 获取指定标签对应的所有图层ID
 * @param layerConfig 图层配置
 * @param label 图层标签
 */
export function getLayerIdsByLabel(layerConfig: LayerManageData, label: string): string[] {
  const group = layerConfig.layerList.find((g) => g.label === label)
  return group ? group.layers.map((l) => l.id) : []
}

/**
 * 获取特定图层实例
 * @param map 地图实例
 * @param layerId 图层ID
 */
export function getLayer(map: mars3d.Map, layerId: string): any | null {
  if (!map) {
    console.warn('[getLayer] Map instance is invalid')
    return null
  }
  return map.getLayerById(layerId) || null
}

/**
 * 批量向图层添加图形
 * @param map 地图实例
 * @param layerId 图层ID
 * @param graphics 图形数组
 */
export function addGraphicsToLayer(
  map: mars3d.Map,
  layerId: string,
  graphics: mars3d.graphic.BaseGraphic[]
): void {
  const layer = getLayer(map, layerId) as mars3d.layer.GraphicLayer
  if (!layer) {
    console.warn(`[addGraphicsToLayer] Layer "${layerId}" not found`)
    return
  }

  graphics.forEach((graphic) => {
    layer.addGraphic(graphic)
  })

  console.log(
    `[addGraphicsToLayer] Added ${graphics.length} graphics to layer "${layerId}"`
  )
}

/**
 * 设置图层显隐状态
 * @param map 地图实例
 * @param layerId 图层ID
 * @param show 是否显示
 */
export function setLayerVisible(
  map: mars3d.Map,
  layerId: string,
  show: boolean
): void {
  const layer = getLayer(map, layerId)
  if (layer) {
    layer.show = show
    console.log(`[setLayerVisible] Layer "${layerId}" visibility set to ${show}`)
  }
}

/**
 * 获取指定图层的所有图形
 * @param map 地图实例
 * @param layerId 图层ID
 */
export function getLayerGraphics(
  map: mars3d.Map,
  layerId: string
): mars3d.graphic.BaseGraphic[] {
  const layer = getLayer(map, layerId) as mars3d.layer.GraphicLayer
  if (!layer) {
    console.warn(`[getLayerGraphics] Layer "${layerId}" not found`)
    return []
  }
  return layer.getGraphics() || []
}

/**
 * 根据ID查找图层中的图形
 * @param map 地图实例
 * @param layerId 图层ID
 * @param graphicId 图形ID
 */
export function getGraphicById(
  map: mars3d.Map,
  layerId: string,
  graphicId: string
): mars3d.graphic.BaseGraphic | null {
  const graphics = getLayerGraphics(map, layerId)
  return graphics.find((g) => g.id === graphicId) || null
}
