/**
 * Data Adapter - 数据适配器
 * 将现有数据格式转换为新架构所需的格式
 */

import type { Windmill, WindFarm } from './windmills'
import type { WindmillData } from '@/business'

/**
 * 将旧的 Windmill 格式转换为新架构的 WindmillData 格式
 */
export function convertWindmillToWindmillData(windmill: Windmill): WindmillData {
  return {
    id: windmill.id,
    name: windmill.name,
    position: {
      lng: windmill.position.lng,
      lat: windmill.position.lat,
      alt: windmill.position.height || 0
    },
    modelUrl: windmill.modelUrl,
    underwaterModelUrl: windmill.underwaterModelUrl,
    status: windmill.status,
    power: windmill.power,
    metadata: {
      code: windmill.code,
      lastMaintenanceDate: windmill.lastMaintenanceDate,
      nextMaintenanceDate: windmill.nextMaintenanceDate
    }
  }
}

/**
 * 将风场中的所有风机转换为 WindmillData 数组
 */
export function convertWindFarmToWindmillDataArray(farm: WindFarm): WindmillData[] {
  return farm.windmills.map(windmill => convertWindmillToWindmillData(windmill))
}

/**
 * 将多个风场的所有风机转换为 WindmillData 数组
 */
export function convertWindFarmsToWindmillDataArray(farms: WindFarm[]): WindmillData[] {
  return farms.flatMap(farm => convertWindFarmToWindmillDataArray(farm))
}

/**
 * 根据状态过滤风机
 */
export function filterWindmillsByStatus(
  windmills: WindmillData[],
  status: WindmillData['status']
): WindmillData[] {
  return windmills.filter(wm => wm.status === status)
}

/**
 * 根据ID获取单个风机数据
 */
export function getWindmillDataById(
  windmills: WindmillData[],
  id: string
): WindmillData | undefined {
  return windmills.find(wm => wm.id === id)
}

// 导出类型，方便其他模块使用
export type { Windmill, WindFarm } from './windmills'
export type { WindmillData } from '@/business'
