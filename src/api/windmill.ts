/**
 * 风机数据 API 接口
 */

import http from '@/utils/http'
import type { Windmill, WindmillDetail, WindmillStatistics } from '@/models/windmill'
import type { PaginationParams, PaginationResponse } from '@/models/common'

/** 获取风机列表 */
export const getWindmills = (params?: PaginationParams) => {
  return http.get<PaginationResponse<Windmill>>('/api/windmills', { params })
}

/** 获取风机详情 */
export const getWindmillDetail = (id: string) => {
  return http.get<WindmillDetail>(`/api/windmills/${id}`)
}

/** 获取单个风机 */
export const getWindmill = (id: string) => {
  return http.get<Windmill>(`/api/windmills/${id}`)
}

/** 创建风机 */
export const createWindmill = (data: Windmill) => {
  return http.post<Windmill>('/api/windmills', data)
}

/** 更新风机 */
export const updateWindmill = (id: string, data: Partial<Windmill>) => {
  return http.put<Windmill>(`/api/windmills/${id}`, data)
}

/** 删除风机 */
export const deleteWindmill = (id: string) => {
  return http.delete(`/api/windmills/${id}`)
}

/** 获取风机统计信息 */
export const getWindmillStatistics = () => {
  return http.get<WindmillStatistics>('/api/windmills/statistics')
}

/** 获取风机模型 URL */
export const getWindmillModelUrl = (id: string) => {
  return http.get<{ modelUrl: string; underwaterModelUrl: string }>(
    `/api/windmills/${id}/model-urls`
  )
}

/** 批量获取风机 */
export const getWindmillsByIds = (ids: string[]) => {
  return http.post<Windmill[]>('/api/windmills/batch', { ids })
}

/** 查询风机（支持过滤、排序） */
export const queryWindmills = (query: {
  status?: string
  region?: string
  power?: { min: number; max: number }
  sortBy?: string
  page?: number
  pageSize?: number
}) => {
  return http.get<PaginationResponse<Windmill>>('/api/windmills/query', { params: query })
}
