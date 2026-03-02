/**
 * mapInitializer.ts - 地图基础初始化模块
 * 职责：底图和装饰层初始化（风机、电缆等业务有独立的 Manager）
 */

import * as mars3d from 'mars3d'
import { addDemoWater,addImageLayer } from '@/views/screen/marsmap/business/seaplane/sea'

/**
 * 添加基础底图
 */
export const addBaseMaps = (map: mars3d.Map): void => {
  // OpenStreetMap 底图
  const osmLayer = new mars3d.layer.XyzLayer({
    name: '全球地图 OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    minimumLevel: 0,
    maximumLevel: 18,
    opacity: 1.0,
    zIndex: 98,
  })
  map.addLayer(osmLayer)

  // OpenSeaMap 海图层
  const seaChartLayer = new mars3d.layer.XyzLayer({
    name: 'OpenSeaMap 海图',
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    minimumLevel: 0,
    maximumLevel: 18,
    opacity: 1.0,
    zIndex: 99,
  })
  map.addLayer(seaChartLayer)
}

/**
 * 添加装饰图层（水面等）
 */
export const addDecorativeLayers = (map: mars3d.Map): void => {
  const decorativeLayer = new mars3d.layer.GraphicLayer({
    name: '装饰层',
  })
  map.addLayer(decorativeLayer)
  addDemoWater(decorativeLayer)

  //海面
  addImageLayer(map)
}

/**
 * 二次配置图层
 */
export const configureLayersSecondPass = (map: mars3d.Map): void => {
  try {
    const layers = map.getLayers() as any[]
    layers.forEach((layer: any) => {
      if (layer.name === '装饰层') {
        layer.zIndex = 10
      }
    })
  } catch (error) {
    console.warn('[mapInitializer] 图层配置失败:', error)
  }
}
