/**
 * AreaMeasure - 面积测算工具
 * 功能：计算横截面积、表面积
 * 应用：截面分析、面积统计
 */

import * as BABYLON from 'babylonjs'
import { MeasurementEngine, type MeasurementResult, type MeasurementOptions } from './MeasurementEngine'
import type { SceneEngine } from '../core/SceneEngine'

export interface AreaResult extends MeasurementResult {
  surfaceArea?: number       // 表面积
  crossSectionArea?: number  // 横截面积
}

export interface AreaMeasureOptions extends MeasurementOptions {
  planeNormal?: BABYLON.Vector3  // 截面法向量
  planePosition?: BABYLON.Vector3 // 截面位置
  showPlane?: boolean
}

export class AreaMeasure extends MeasurementEngine {
  private sectionPlane: BABYLON.Mesh | null = null

  constructor(sceneEngine: SceneEngine, options: AreaMeasureOptions = {}) {
    super(sceneEngine, {
      unit: 'm²',
      ...options
    })
  }

  /**
   * 测量表面积
   */
  async measureSurfaceArea(mesh: BABYLON.Mesh): Promise<AreaResult> {
    if (!this.scene) {
      throw new Error('[AreaMeasure] Scene not initialized')
    }

    console.log('[AreaMeasure] Calculating surface area...')

    const surfaceArea = this.calculateSurfaceArea(mesh)

    return {
      type: 'area',
      value: surfaceArea,
      unit: this.options.unit || 'm²',
      surfaceArea: this.formatResult(surfaceArea)
    }
  }

  /**
   * 测量横截面积
   */
  async measureCrossSectionArea(
    mesh: BABYLON.Mesh,
    planePosition: BABYLON.Vector3,
    planeNormal: BABYLON.Vector3
  ): Promise<AreaResult> {
    if (!this.scene) {
      throw new Error('[AreaMeasure] Scene not initialized')
    }

    console.log('[AreaMeasure] Calculating cross-section area...')

    // 创建截面平面（可视化）
    if ((this.options as AreaMeasureOptions).showPlane) {
      this.createSectionPlane(planePosition, planeNormal)
    }

    const crossSectionArea = this.calculateCrossSectionArea(mesh, planePosition, planeNormal)

    return {
      type: 'area',
      value: crossSectionArea,
      unit: this.options.unit || 'm²',
      crossSectionArea: this.formatResult(crossSectionArea),
      metadata: {
        planePosition: planePosition.asArray(),
        planeNormal: planeNormal.asArray()
      }
    }
  }

  /**
   * 清除测量结果
   */
  clear(): void {
    if (this.sectionPlane) {
      this.sectionPlane.dispose()
      this.sectionPlane = null
    }
    this.clearGizmos()
  }

  // ========== 私有方法 ==========

  /**
   * 计算表面积
   */
  private calculateSurfaceArea(mesh: BABYLON.Mesh): number {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = mesh.getIndices()

    if (!positions || !indices) {
      throw new Error('[AreaMeasure] Invalid mesh data')
    }

    let totalArea = 0

    // 遍历三角形
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3
      const i1 = indices[i + 1] * 3
      const i2 = indices[i + 2] * 3

      const v0 = new BABYLON.Vector3(positions[i0], positions[i0 + 1], positions[i0 + 2])
      const v1 = new BABYLON.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2])
      const v2 = new BABYLON.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2])

      // 计算三角形面积：||(v1-v0) × (v2-v0)|| / 2
      const edge1 = v1.subtract(v0)
      const edge2 = v2.subtract(v0)
      const cross = BABYLON.Vector3.Cross(edge1, edge2)
      const area = cross.length() / 2

      totalArea += area
    }

    return totalArea
  }

  /**
   * 计算横截面积
   */
  private calculateCrossSectionArea(
    mesh: BABYLON.Mesh,
    planePosition: BABYLON.Vector3,
    planeNormal: BABYLON.Vector3
  ): number {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = mesh.getIndices()

    if (!positions || !indices) {
      throw new Error('[AreaMeasure] Invalid mesh data')
    }

    let crossSectionArea = 0
    const intersectionPoints: BABYLON.Vector3[] = []

    // 遍历三角形，找到与截面相交的边
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3
      const i1 = indices[i + 1] * 3
      const i2 = indices[i + 2] * 3

      const v0 = new BABYLON.Vector3(positions[i0], positions[i0 + 1], positions[i0 + 2])
      const v1 = new BABYLON.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2])
      const v2 = new BABYLON.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2])

      // 检查三角形的每条边是否与平面相交
      const edges = [
        [v0, v1],
        [v1, v2],
        [v2, v0]
      ]

      edges.forEach(([start, end]) => {
        const intersection = this.linePlaneIntersection(start, end, planePosition, planeNormal)
        if (intersection) {
          intersectionPoints.push(intersection)
        }
      })
    }

    // 如果有交点，计算截面多边形的面积（简化算法）
    if (intersectionPoints.length >= 3) {
      crossSectionArea = this.calculatePolygonArea(intersectionPoints)
    }

    return crossSectionArea
  }

  /**
   * 线段与平面求交
   */
  private linePlaneIntersection(
    lineStart: BABYLON.Vector3,
    lineEnd: BABYLON.Vector3,
    planePoint: BABYLON.Vector3,
    planeNormal: BABYLON.Vector3
  ): BABYLON.Vector3 | null {
    const lineDir = lineEnd.subtract(lineStart)
    const denom = BABYLON.Vector3.Dot(planeNormal, lineDir)

    // 平行于平面
    if (Math.abs(denom) < 1e-6) {
      return null
    }

    const t = BABYLON.Vector3.Dot(planeNormal, planePoint.subtract(lineStart)) / denom

    // 不在线段范围内
    if (t < 0 || t > 1) {
      return null
    }

    return lineStart.add(lineDir.scale(t))
  }

  /**
   * 计算多边形面积（简化算法）
   */
  private calculatePolygonArea(points: BABYLON.Vector3[]): number {
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
   * 创建截面平面（可视化）
   */
  private createSectionPlane(position: BABYLON.Vector3, normal: BABYLON.Vector3): void {
    if (!this.scene) return

    this.sectionPlane = BABYLON.MeshBuilder.CreatePlane(
      'sectionPlane',
      { width: 10, height: 10 },
      this.scene
    )

    this.sectionPlane.position = position

    // 设置平面朝向
    const targetDir = position.add(normal)
    this.sectionPlane.lookAt(targetDir)

    const material = new BABYLON.StandardMaterial('sectionMat', this.scene)
    material.diffuseColor = new BABYLON.Color3(1, 1, 0)
    material.alpha = 0.3
    this.sectionPlane.material = material
  }
}
