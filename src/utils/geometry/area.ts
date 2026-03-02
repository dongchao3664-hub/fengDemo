/**
 * Area Calculation - 面积计算工具
 * 功能：提供各种面积计算算法
 * 设计：纯函数，无外部依赖
 */

import type { Point3D, Triangle } from './volume'

/**
 * 计算三角形面积（海伦公式）
 */
export function triangleAreaHeron(a: number, b: number, c: number): number {
  const s = (a + b + c) / 2
  return Math.sqrt(s * (s - a) * (s - b) * (s - c))
}

/**
 * 计算三角形面积（向量叉乘）
 */
export function triangleAreaCross(v0: Point3D, v1: Point3D, v2: Point3D): number {
  const edge1 = {
    x: v1.x - v0.x,
    y: v1.y - v0.y,
    z: v1.z - v0.z
  }
  const edge2 = {
    x: v2.x - v0.x,
    y: v2.y - v0.y,
    z: v2.z - v0.z
  }

  const cross = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  }

  const length = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z)
  return length / 2
}

/**
 * 计算网格表面积
 */
export function calculateSurfaceArea(vertices: number[], indices: number[]): number {
  let totalArea = 0

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3
    const i1 = indices[i + 1] * 3
    const i2 = indices[i + 2] * 3

    const v0 = { x: vertices[i0], y: vertices[i0 + 1], z: vertices[i0 + 2] }
    const v1 = { x: vertices[i1], y: vertices[i1 + 1], z: vertices[i1 + 2] }
    const v2 = { x: vertices[i2], y: vertices[i2 + 1], z: vertices[i2 + 2] }

    totalArea += triangleAreaCross(v0, v1, v2)
  }

  return totalArea
}

/**
 * 计算多边形面积（2D）
 */
export function calculatePolygonArea2D(points: { x: number; z: number }[]): number {
  if (points.length < 3) return 0

  let area = 0
  const n = points.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].z - points[j].x * points[i].z
  }

  return Math.abs(area) / 2
}

/**
 * 计算矩形面积
 */
export function calculateRectangleArea(width: number, height: number): number {
  return width * height
}

/**
 * 计算圆形面积
 */
export function calculateCircleArea(radius: number): number {
  return Math.PI * radius * radius
}

/**
 * 计算椭圆面积
 */
export function calculateEllipseArea(a: number, b: number): number {
  return Math.PI * a * b
}
