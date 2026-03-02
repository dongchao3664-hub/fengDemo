/**
 * 公共数据模型
 */

/** 3D 坐标 */
export interface Position3D {
  x: number
  y: number
  z: number
}

/** 地理坐标 */
export interface GeoPosition {
  lng: number
  lat: number
  height?: number
}

/** 颜色 RGBA */
export interface Color {
  r: number     // 0-255
  g: number     // 0-255
  b: number     // 0-255
  a?: number    // 0-1, 默认 1
}

/** 边界框 */
export interface BoundingBox {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

/** 范围 */
export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

/** 分页查询参数 */
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** 分页响应 */
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** API 响应包装 */
export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
  timestamp?: number
}

/** 操作结果 */
export interface OperationResult {
  success: boolean
  message: string
  code: number
  error?: string
}
