/**
 * 风场数据 API 接口
 */

import http from '@/utils/http'

export interface WindFieldData {
  timeStep: number
  timestamp: string
  data: {
    u: number[][]      // U 分量
    v: number[][]      // V 分量
    speed?: number[][] // 风速
    direction?: number[][] // 风向
  }
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface WindFieldQuery {
  timeStep?: number
  startTime?: string
  endTime?: string
  region?: string
}

/** 获取风场数据 */
export const getWindFieldData = (query: WindFieldQuery) => {
  return http.get<WindFieldData>('/api/windfield', { params: query })
}

/** 获取风场数据列表（支持多个时间步长） */
export const getWindFieldDataList = (query: {
  startTime: string
  endTime: string
  interval: number // 时间间隔（分钟）
}) => {
  return http.get<WindFieldData[]>('/api/windfield/list', { params: query })
}

/** 订阅实时风场数据 */
export const subscribeWindField = (callback: (data: WindFieldData) => void) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/api/windfield/subscribe`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WindFieldData
      callback(data)
    } catch (error) {
      console.error('Failed to parse wind field data:', error)
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  return ws
}

/** 获取风场统计信息 */
export const getWindFieldStatistics = (query?: WindFieldQuery) => {
  return http.get<{
    maxSpeed: number
    minSpeed: number
    avgSpeed: number
    direction: number
  }>('/api/windfield/statistics', { params: query })
}
