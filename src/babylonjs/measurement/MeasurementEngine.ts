/**
 * MeasurementEngine - 测量引擎基类
 * 功能：提供测量工具的抽象接口
 * 设计：可扩展架构，支持不同类型的测量
 */

import * as BABYLON from 'babylonjs'
import type { SceneEngine } from '../core/SceneEngine'

export interface MeasurementResult {
  type: string
  value: number
  unit: string
  metadata?: Record<string, any>
}

export interface MeasurementOptions {
  precision?: number
  unit?: string
  showGizmo?: boolean
  color?: BABYLON.Color3
}

export abstract class MeasurementEngine {
  protected sceneEngine: SceneEngine
  protected scene: BABYLON.Scene | null = null
  protected gizmos: BABYLON.Mesh[] = []
  protected options: MeasurementOptions

  constructor(sceneEngine: SceneEngine, options: MeasurementOptions = {}) {
    this.sceneEngine = sceneEngine
    this.scene = sceneEngine.getScene()
    this.options = {
      precision: 2,
      unit: 'm³',
      showGizmo: true,
      color: new BABYLON.Color3(0, 1, 0),
      ...options
    }
  }

  /**
   * 抽象方法：执行测量
   */
  abstract measure(...args: any[]): Promise<MeasurementResult>

  /**
   * 抽象方法：清除测量结果
   */
  abstract clear(): void

  /**
   * 格式化测量结果
   */
  protected formatResult(value: number): number {
    const precision = this.options.precision || 2
    return parseFloat(value.toFixed(precision))
  }

  /**
   * 创建辅助图形（可选）
   */
  protected createGizmo(position: BABYLON.Vector3, size = 0.5): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized')

    const gizmo = BABYLON.MeshBuilder.CreateSphere(
      'measureGizmo',
      { diameter: size },
      this.scene
    )

    gizmo.position = position

    const material = new BABYLON.StandardMaterial('gizmoMat', this.scene)
    material.diffuseColor = this.options.color || new BABYLON.Color3(0, 1, 0)
    material.emissiveColor = this.options.color || new BABYLON.Color3(0, 1, 0)
    gizmo.material = material

    this.gizmos.push(gizmo)
    return gizmo
  }

  /**
   * 清除所有辅助图形
   */
  protected clearGizmos(): void {
    this.gizmos.forEach((gizmo) => {
      gizmo.dispose()
    })
    this.gizmos = []
  }

  /**
   * 销毁测量引擎
   */
  dispose(): void {
    this.clear()
    this.clearGizmos()
  }
}
