/**
 * Volume Calculation - 体积计算工具
 * 功能：提供各种体积计算算法
 * 设计：纯函数，无外部依赖
 */

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Triangle {
  v0: Point3D
  v1: Point3D
  v2: Point3D
}

/**
 * 计算四面体体积
 * 公式：V = |1/6 * (v1 × v2) · v3|
 */
export function calculateTetrahedronVolume(
  v0: Point3D,
  v1: Point3D,
  v2: Point3D,
  v3: Point3D
): number {
  const a = subtract(v1, v0)
  const b = subtract(v2, v0)
  const c = subtract(v3, v0)

  const cross = crossProduct(a, b)
  const volume = Math.abs(dotProduct(cross, c)) / 6

  return volume
}

/**
 * 计算三角形面积
 * 公式：A = ||(v1-v0) × (v2-v0)|| / 2
 */
export function calculateTriangleArea(v0: Point3D, v1: Point3D, v2: Point3D): number {
  const edge1 = subtract(v1, v0)
  const edge2 = subtract(v2, v0)
  const cross = crossProduct(edge1, edge2)
  const area = magnitude(cross) / 2

  return area
}

/**
 * 计算网格体积（基于三角形）
 */
export function calculateMeshVolume(
  vertices: number[],
  indices: number[],
  referenceHeight = 0
): { cutVolume: number; fillVolume: number; totalVolume: number } {
  let cutVolume = 0
  let fillVolume = 0

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3
    const i1 = indices[i + 1] * 3
    const i2 = indices[i + 2] * 3

    const v0 = { x: vertices[i0], y: vertices[i0 + 1], z: vertices[i0 + 2] }
    const v1 = { x: vertices[i1], y: vertices[i1 + 1], z: vertices[i1 + 2] }
    const v2 = { x: vertices[i2], y: vertices[i2 + 1], z: vertices[i2 + 2] }

    // 参考平面上的投影点
    const v0Proj = { x: v0.x, y: referenceHeight, z: v0.z }
    const v1Proj = { x: v1.x, y: referenceHeight, z: v1.z }
    const v2Proj = { x: v2.x, y: referenceHeight, z: v2.z }

    // 计算三角形与参考面形成的体积
    const volume = calculateTrianglePrismVolume(v0, v1, v2, referenceHeight)

    // 判断是挖方还是填方
    const avgHeight = (v0.y + v1.y + v2.y) / 3
    if (avgHeight > referenceHeight) {
      cutVolume += Math.abs(volume)
    } else {
      fillVolume += Math.abs(volume)
    }
  }

  return {
    cutVolume,
    fillVolume,
    totalVolume: cutVolume + fillVolume
  }
}

/**
 * 计算三角形棱柱体积
 */
export function calculateTrianglePrismVolume(
  v0: Point3D,
  v1: Point3D,
  v2: Point3D,
  baseHeight: number
): number {
  const area = calculateTriangleArea(v0, v1, v2)
  const avgHeight = (v0.y + v1.y + v2.y) / 3 - baseHeight
  return area * avgHeight
}

// ========== 辅助函数 ==========

function subtract(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  }
}

function crossProduct(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  }
}

function dotProduct(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function magnitude(v: Point3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}
