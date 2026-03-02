/**
 * VolumeMeasure - 方量测算工具
 * 功能：计算挖方量、填方量
 * 算法：基于三角网格的体积计算
 */

import * as BABYLON from 'babylonjs'
import { MeasurementEngine, type MeasurementResult, type MeasurementOptions } from './MeasurementEngine'
import type { SceneEngine } from '../core/SceneEngine'

export interface VolumeResult extends MeasurementResult {
  cutVolume: number      // 挖方量
  fillVolume: number     // 填方量
  totalVolume: number    // 总方量
}

export interface VolumeMeasureOptions extends MeasurementOptions {
  referenceHeight?: number  // 参考高度（基准面）
  showMesh?: boolean        // 是否显示网格
  meshColor?: BABYLON.Color3
}

export class VolumeMeasure extends MeasurementEngine {
  private referencePlane: BABYLON.Mesh | null = null
  private volumeMesh: BABYLON.Mesh | null = null

  constructor(sceneEngine: SceneEngine, options: VolumeMeasureOptions = {}) {
    super(sceneEngine, {
      unit: 'm³',
      ...options
    })
  }

  /**
   * 测量方量
   * @param mesh - 待测量的网格模型
   * @param referenceHeight - 参考高度（可选，默认为0）
   */
  async measure(
    mesh: BABYLON.Mesh,
    referenceHeight?: number
  ): Promise<VolumeResult> {
    if (!this.scene) {
      throw new Error('[VolumeMeasure] Scene not initialized')
    }

    console.log('[VolumeMeasure] Starting volume calculation...')

    // 获取或设置参考高度
    const refHeight = referenceHeight ?? (this.options as VolumeMeasureOptions).referenceHeight ?? 0

    // 创建参考平面
    this.createReferencePlane(mesh, refHeight)

    // 计算方量
    const result = this.calculateVolume(mesh, refHeight)

    console.log('[VolumeMeasure] Result:', result)
    return result
  }

  /**
   * 清除测量结果
   */
  clear(): void {
    if (this.referencePlane) {
      this.referencePlane.dispose()
      this.referencePlane = null
    }

    if (this.volumeMesh) {
      this.volumeMesh.dispose()
      this.volumeMesh = null
    }

    this.clearGizmos()
  }

  // ========== 私有方法 ==========

  /**
   * 创建参考平面（可视化）
   */
  private createReferencePlane(mesh: BABYLON.Mesh, height: number): void {
    if (!this.scene) return

    // 获取模型包围盒
    const bounds = mesh.getBoundingInfo()
    const min = bounds.minimum
    const max = bounds.maximum

    const width = max.x - min.x
    const depth = max.z - min.z

    // 创建参考平面
    this.referencePlane = BABYLON.MeshBuilder.CreatePlane(
      'referencePlane',
      { width: width * 1.2, height: depth * 1.2 },
      this.scene
    )

    this.referencePlane.position = new BABYLON.Vector3(
      (min.x + max.x) / 2,
      height,
      (min.z + max.z) / 2
    )
    this.referencePlane.rotation.x = Math.PI / 2

    // 设置材质
    const material = new BABYLON.StandardMaterial('planeMat', this.scene)
    material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1)
    material.alpha = 0.3
    material.wireframe = false
    this.referencePlane.material = material
  }

  /**
   * 计算体积
   */
  private calculateVolume(mesh: BABYLON.Mesh, referenceHeight: number): VolumeResult {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = mesh.getIndices()

    if (!positions || !indices) {
      throw new Error('[VolumeMeasure] Invalid mesh data')
    }

    let cutVolume = 0    // 挖方量（高于参考面）
    let fillVolume = 0   // 填方量（低于参考面）

    // 遍历三角形
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3
      const i1 = indices[i + 1] * 3
      const i2 = indices[i + 2] * 3

      // 获取三角形顶点
      const v0 = new BABYLON.Vector3(positions[i0], positions[i0 + 1], positions[i0 + 2])
      const v1 = new BABYLON.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2])
      const v2 = new BABYLON.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2])

      // 计算三角形与参考面形成的四面体体积
      const volume = this.calculateTetrahedronVolume(v0, v1, v2, referenceHeight)

      // 判断是挖方还是填方
      const avgHeight = (v0.y + v1.y + v2.y) / 3
      if (avgHeight > referenceHeight) {
        cutVolume += Math.abs(volume)
      } else {
        fillVolume += Math.abs(volume)
      }
    }

    const totalVolume = cutVolume + fillVolume

    return {
      type: 'volume',
      value: totalVolume,
      unit: this.options.unit || 'm³',
      cutVolume: this.formatResult(cutVolume),
      fillVolume: this.formatResult(fillVolume),
      totalVolume: this.formatResult(totalVolume),
      metadata: {
        referenceHeight,
        triangleCount: indices.length / 3
      }
    }
  }

  /**
   * 计算四面体体积
   * 公式：V = |1/6 * (v1 × v2) · v3|
   */
  private calculateTetrahedronVolume(
    v0: BABYLON.Vector3,
    v1: BABYLON.Vector3,
    v2: BABYLON.Vector3,
    refHeight: number
  ): number {
    // 将顶点投影到参考平面的高度
    const v0Proj = new BABYLON.Vector3(v0.x, refHeight, v0.z)
    const v1Proj = new BABYLON.Vector3(v1.x, refHeight, v1.z)
    const v2Proj = new BABYLON.Vector3(v2.x, refHeight, v2.z)

    // 计算向量
    const a = v1.subtract(v0)
    const b = v2.subtract(v0)
    const c = v0Proj.subtract(v0)

    // 叉乘和点乘
    const cross = BABYLON.Vector3.Cross(a, b)
    const volume = Math.abs(BABYLON.Vector3.Dot(cross, c)) / 6

    return volume
  }
}
