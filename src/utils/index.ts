/**
 * Utils Module - 统一导出
 * 工具模块：提供纯函数工具，无外部依赖
 */

// 几何计算
export {
  calculateTetrahedronVolume,
  calculateTriangleArea,
  calculateMeshVolume,
  calculateTrianglePrismVolume,
  type Point3D,
  type Triangle
} from './geometry/volume'

export {
  triangleAreaHeron,
  triangleAreaCross,
  calculateSurfaceArea,
  calculatePolygonArea2D,
  calculateRectangleArea,
  calculateCircleArea,
  calculateEllipseArea
} from './geometry/area'

// 坐标转换
export {
  lngLatAltToCartesian,
  cartesianToLngLatAlt,
  calculateDistance,
  calculateBearing,
  calculateDestination,
  degToRad,
  radToDeg,
  type LngLatAlt,
  type Cartesian3,
  type ScreenCoord
} from './coordinate/transform'

/**
 * 工具函数集合（原有代码保留）
 */

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    const cloneArr: any[] = []
    obj.forEach((value) => {
      cloneArr.push(deepClone(value))
    })
    return cloneArr as any
  }

  if (obj instanceof Object) {
    const cloneObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneObj[key] = deepClone(obj[key])
      }
    }
    return cloneObj
  }

  return obj
}

/**
 * 本地存储操作
 */
export const storage = {
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  get: (key: string) => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  },
  remove: (key: string) => {
    localStorage.removeItem(key)
  },
  clear: () => {
    localStorage.clear()
  }
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}
