import type { LayerConfig } from './LayerManager'
import type { LayerManager } from './LayerManager'

export type LayerKey = 'windmill' | 'cable' | 'sea' | 'area' | 'weather' | 'tide'

export interface LayerMeta extends LayerConfig {
  key: LayerKey
  description?: string
  group?: string
  order?: number
}

export const layerRegistry: Record<LayerKey, LayerMeta> = {
  windmill: {
    key: 'windmill',
    id: 'windmill-layer',
    name: '风机图层',
    type: 'graphic',
    show: true,
    description: '风机模型、状态点位'
  },
  cable: {
    key: 'cable',
    id: 'cable-layer',
    name: '海缆图层',
    type: 'graphic',
    show: true,
    description: '集电/送出海缆线'
  },
  sea: {
    key: 'sea',
    id: 'sea-surface-layer',
    name: '海面底图',
    type: 'tile',
    show: true,
    zIndex: 20,
    options: {
      url: '/img/textures/hai.png',
      rectangle: { xmin: 118.89, xmax: 119.42, ymin: 37.28, ymax: 37.7 },
      name: '海面底图'
    },
    description: '海面底纹/贴图'
  },
  area: {
    key: 'area',
    id: 'area-decor-layer',
    name: '范围装饰',
    type: 'graphic',
    show: true,
    description: '区域范围、多边形/标注'
  },
  weather: {
    key: 'weather',
    id: 'weather-layer',
    name: '海况图层',
    type: 'graphic',
    show: false,
    description: '海况弹窗、拾取点'
  },
  tide: {
    key: 'tide',
    id: 'tide-layer',
    name: '潮汐图层',
    type: 'graphic',
    show: false,
    description: '潮汐/水面信息'
  }
}

export function ensureLayers(layerManager: LayerManager, keys: LayerKey[]) {
  keys.forEach((key) => {
    const meta = layerRegistry[key]
    if (!layerManager.hasLayer(meta.id)) {
      layerManager.addLayer(meta)
    }
  })
}

export function getPanelLayers(keys?: LayerKey[]): LayerMeta[] {
  const pickKeys = keys ?? (Object.keys(layerRegistry) as LayerKey[])
  return pickKeys.map((k) => layerRegistry[k]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
