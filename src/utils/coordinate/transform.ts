/**
 * Coordinate Transform - 坐标转换工具
 * 功能：地理坐标、笛卡尔坐标、屏幕坐标转换
 * 设计：纯函数，无外部依赖
 */

export interface LngLatAlt {
  lng: number
  lat: number
  alt: number
}

export interface Cartesian3 {
  x: number
  y: number
  z: number
}

export interface ScreenCoord {
  x: number
  y: number
}

// WGS84椭球体参数
const WGS84_A = 6378137.0 // 长半轴
const WGS84_B = 6356752.314245 // 短半轴
const WGS84_E2 = 0.00669437999014 // 第一偏心率平方

/**
 * 经纬度转笛卡尔坐标
 */
export function lngLatAltToCartesian(coord: LngLatAlt): Cartesian3 {
  const lng = (coord.lng * Math.PI) / 180
  const lat = (coord.lat * Math.PI) / 180
  const alt = coord.alt || 0

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(lat) * Math.sin(lat))

  const x = (N + alt) * Math.cos(lat) * Math.cos(lng)
  const y = (N + alt) * Math.cos(lat) * Math.sin(lng)
  const z = (N * (1 - WGS84_E2) + alt) * Math.sin(lat)

  return { x, y, z }
}

/**
 * 笛卡尔坐标转经纬度
 */
export function cartesianToLngLatAlt(coord: Cartesian3): LngLatAlt {
  const { x, y, z } = coord

  const lng = Math.atan2(y, x)
  const p = Math.sqrt(x * x + y * y)
  let lat = Math.atan2(z, p * (1 - WGS84_E2))

  // 迭代计算纬度
  for (let i = 0; i < 5; i++) {
    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(lat) * Math.sin(lat))
    const newLat = Math.atan2(z + WGS84_E2 * N * Math.sin(lat), p)
    if (Math.abs(newLat - lat) < 1e-10) break
    lat = newLat
  }

  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.sin(lat) * Math.sin(lat))
  const alt = p / Math.cos(lat) - N

  return {
    lng: (lng * 180) / Math.PI,
    lat: (lat * 180) / Math.PI,
    alt
  }
}

/**
 * 计算两点间距离（Haversine公式）
 */
export function calculateDistance(point1: LngLatAlt, point2: LngLatAlt): number {
  const R = 6371000 // 地球半径（米）

  const lat1 = (point1.lat * Math.PI) / 180
  const lat2 = (point2.lat * Math.PI) / 180
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * 计算方位角
 */
export function calculateBearing(point1: LngLatAlt, point2: LngLatAlt): number {
  const lat1 = (point1.lat * Math.PI) / 180
  const lat2 = (point2.lat * Math.PI) / 180
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  return (bearing + 360) % 360
}

/**
 * 根据距离和方位角计算目标点
 */
export function calculateDestination(
  origin: LngLatAlt,
  distance: number,
  bearing: number
): LngLatAlt {
  const R = 6371000 // 地球半径（米）

  const lat1 = (origin.lat * Math.PI) / 180
  const lng1 = (origin.lng * Math.PI) / 180
  const brng = (bearing * Math.PI) / 180

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
  )

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    )

  return {
    lng: (lng2 * 180) / Math.PI,
    lat: (lat2 * 180) / Math.PI,
    alt: origin.alt || 0
  }
}

/**
 * 度转弧度
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * 弧度转度
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI
}
