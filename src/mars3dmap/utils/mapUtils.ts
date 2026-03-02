/**
 * mapUtils.ts - 地图通用工具方法
 * 提供飞行定位、图形查找等通用功能
 */

import * as mars3d from 'mars3d'

/**
 * 通过 ID 获取图形对象
 * @param map 地图实例
 * @param graphicId 图形 ID
 * @param layerId 图层 ID
 */
export function getGraphicById(map: mars3d.Map, graphicId: string, layerId: string): any | null {
  if (!map) {
    console.warn('[mapUtils] getGraphicById: map is null')
    return null
  }

  const layer = map.getLayerById(layerId)
  console.log(`[mapUtils] getGraphicById: layer "${layerId}" =`, layer)
  
  if (layer && layer.getGraphicById) {
    const graphic = layer.getGraphicById(graphicId)
    console.log(`[mapUtils] getGraphicById: graphic "${graphicId}" =`, graphic)
    
    // 如果没找到，列出图层中的所有图形
    if (!graphic && layer.getGraphics) {
      const allGraphics = layer.getGraphics()
      console.log(`[mapUtils] Layer "${layerId}" has ${allGraphics?.length || 0} graphics:`, 
        allGraphics?.map((g: any) => g.id || g.attr?.id))
    }
    
    return graphic
  }

  return null
}

/**
 * 飞行定位到指定图形
 * @param map 地图实例
 * @param graphicId 图形 ID
 * @param layerId 图层 ID
 * @param options 飞行选项
 */
export function flyToGraphicById(
  map: mars3d.Map,
  graphicId: string,
  layerId: string,
  options?: {
    isPoint?: boolean
    alt?: number
    heading?: number
    pitch?: number
    offset?: { lat?: number; lng?: number }
  }
): boolean {
  if (!map) return false

  const graphic = getGraphicById(map, graphicId, layerId)
  if (!graphic) {
    console.warn(`[mapUtils] Graphic "${graphicId}" not found in layer "${layerId}"`)
    return false
  }

  if(options?.isPoint){
    const center = graphic.center || graphic.position
    graphic.flyTo({
          radius: 2550,
          heading: 35,
          pitch: -20,
          complete: () => {
            
          },
        });
        return true
  }

  // 获取图形位置
  let position: any = null

  if (graphic.position) {
    position = graphic.position
  } else if (graphic.center) {
    position = graphic.center
  } else if (graphic.positions && graphic.positions.length > 0) {
    position = graphic.positions[0]
  }

  if (!position) {
    console.warn(`[mapUtils] Cannot get position for graphic "${graphicId}"`)
    return false
  }

  // 转换为经纬度
  let lng: number, lat: number

  if (Array.isArray(position)) {
    lng = position[0]
    lat = position[1]
  } else if (position.lng !== undefined) {
    lng = position.lng
    lat = position.lat
  } else {
    const lonlat = mars3d.LngLatPoint.fromCartesian(position)
    if (lonlat) {
      lng = lonlat.lng
      lat = lonlat.lat
    } else {
      return false
    }
  }

  // 应用偏移
  const offset = options?.offset || {}
  lng += offset.lng || 0
  lat -= offset.lat || 0.02

  // 飞行定位
  map.setCameraView({
    lng,
    lat,
    alt: options?.alt || 2500,
    heading: options?.heading || 10,
    pitch: options?.pitch || -20,
  })
  console.log(`[mapUtils] Flying to: ${lng}, ${lat}`, options?.heading || 360, options?.pitch || -20)

  return true
}

/**
 * 高亮指定图形
 */
export function highlightGraphic(
  map: mars3d.Map,
  graphicId: string,
  layerId: string,
  highlightStyle?: Record<string, any>
): boolean {
  const graphic = getGraphicById(map, graphicId, layerId)
  if (!graphic) return false

  graphic.setStyle(highlightStyle || { scale: 1.5, opacity: 1 })
  return true
}
