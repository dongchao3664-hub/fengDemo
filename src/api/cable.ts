/**
 * 电缆数据 API 接口
 */

import http from '@/utils/http'

export interface CableSegment {
  id: string
  name: string
  type: 'power' | 'signal'
  fromWindmillId: string
  toWindmillId?: string
  toStationId?: string
  // 路径点
  points: Array<{
    lng: number
    lat: number
    depth: number
  }>
  // 物理属性
  length: number
  diameter: number
  buryDepth: number
  material: string
  // 状态
  status: 'normal' | 'damaged' | 'missing'
  installDate: string
  lastInspectionDate: string
  // 其他
  metadata?: Record<string, any>
}

export interface CableQuery {
  type?: 'power' | 'signal' | 'all'
  windmillId?: string
  status?: string
  page?: number
  pageSize?: number
}

/** 获取电缆列表 */
export const getCables = (query?: CableQuery) => {
  return http.get<CableSegment[]>('/api/cables', { params: query })
}

/** 获取单个电缆 */
export const getCable = (id: string) => {
  return http.get<CableSegment>(`/api/cables/${id}`)
}

/** 获取连接到某个风机的电缆 */
export const getCablesByWindmill = (windmillId: string) => {
  return http.get<CableSegment[]>(`/api/cables/windmill/${windmillId}`)
}

/** 查询电缆 */
export const queryCables = (query: CableQuery) => {
  return http.get<{
    data: CableSegment[]
    total: number
    page: number
    pageSize: number
  }>('/api/cables/query', { params: query })
}

/** 创建电缆 */
export const createCable = (data: CableSegment) => {
  return http.post<CableSegment>('/api/cables', data)
}

/** 更新电缆 */
export const updateCable = (id: string, data: Partial<CableSegment>) => {
  return http.put<CableSegment>(`/api/cables/${id}`, data)
}

/** 删除电缆 */
export const deleteCable = (id: string) => {
  return http.delete(`/api/cables/${id}`)
}

/** 获取电缆统计信息 */
export const getCableStatistics = () => {
  return http.get<{
    totalLength: number
    totalCount: number
    damagedCount: number
    normalCount: number
    byType: {
      power: number
      signal: number
    }
  }>('/api/cables/statistics')
}
