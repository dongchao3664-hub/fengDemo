/**
 * useBabylonMeasure - Babylon.js 测量功能钩子
 * 功能：Vue3 Composition API 封装测量工具
 * 设计：提供方量、面积等测量能力
 */

import { ref, type Ref } from 'vue'
import type { SceneEngine } from '../core/SceneEngine'
import { VolumeMeasure, type VolumeResult, type VolumeMeasureOptions } from '../measurement/VolumeMeasure'
import { AreaMeasure, type AreaResult, type AreaMeasureOptions } from '../measurement/AreaMeasure'
import type * as BABYLON from 'babylonjs'

export interface UseBabylonMeasureReturn {
  volumeResult: Ref<VolumeResult | null>
  areaResult: Ref<AreaResult | null>
  isCalculating: Ref<boolean>
  error: Ref<string | null>
  measureVolume: (mesh: BABYLON.Mesh, referenceHeight?: number) => Promise<VolumeResult>
  measureSurfaceArea: (mesh: BABYLON.Mesh) => Promise<AreaResult>
  measureCrossSectionArea: (
    mesh: BABYLON.Mesh,
    position: BABYLON.Vector3,
    normal: BABYLON.Vector3
  ) => Promise<AreaResult>
  clearMeasurements: () => void
}

/**
 * 使用Babylon.js测量工具
 * @param sceneEngine - 场景引擎实例
 * @param volumeOptions - 方量测算选项
 * @param areaOptions - 面积测算选项
 */
export function useBabylonMeasure(
  sceneEngine: SceneEngine,
  volumeOptions?: VolumeMeasureOptions,
  areaOptions?: AreaMeasureOptions
): UseBabylonMeasureReturn {
  const volumeResult = ref<VolumeResult | null>(null)
  const areaResult = ref<AreaResult | null>(null)
  const isCalculating = ref(false)
  const error = ref<string | null>(null)

  // 创建测量工具实例
  const volumeMeasure = new VolumeMeasure(sceneEngine, volumeOptions)
  const areaMeasure = new AreaMeasure(sceneEngine, areaOptions)

  /**
   * 测量方量
   */
  const measureVolume = async (
    mesh: BABYLON.Mesh,
    referenceHeight?: number
  ): Promise<VolumeResult> => {
    isCalculating.value = true
    error.value = null

    try {
      const result = await volumeMeasure.measure(mesh, referenceHeight)
      volumeResult.value = result
      console.log('[useBabylonMeasure] Volume result:', result)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useBabylonMeasure] Volume measure failed:', err)
      throw err
    } finally {
      isCalculating.value = false
    }
  }

  /**
   * 测量表面积
   */
  const measureSurfaceArea = async (mesh: BABYLON.Mesh): Promise<AreaResult> => {
    isCalculating.value = true
    error.value = null

    try {
      const result = await areaMeasure.measureSurfaceArea(mesh)
      areaResult.value = result
      console.log('[useBabylonMeasure] Surface area result:', result)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useBabylonMeasure] Surface area measure failed:', err)
      throw err
    } finally {
      isCalculating.value = false
    }
  }

  /**
   * 测量横截面积
   */
  const measureCrossSectionArea = async (
    mesh: BABYLON.Mesh,
    position: BABYLON.Vector3,
    normal: BABYLON.Vector3
  ): Promise<AreaResult> => {
    isCalculating.value = true
    error.value = null

    try {
      const result = await areaMeasure.measureCrossSectionArea(mesh, position, normal)
      areaResult.value = result
      console.log('[useBabylonMeasure] Cross-section area result:', result)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useBabylonMeasure] Cross-section measure failed:', err)
      throw err
    } finally {
      isCalculating.value = false
    }
  }

  /**
   * 清除所有测量结果
   */
  const clearMeasurements = (): void => {
    volumeMeasure.clear()
    areaMeasure.clear()
    volumeResult.value = null
    areaResult.value = null
    error.value = null
    console.log('[useBabylonMeasure] Measurements cleared')
  }

  return {
    volumeResult,
    areaResult,
    isCalculating,
    error,
    measureVolume,
    measureSurfaceArea,
    measureCrossSectionArea,
    clearMeasurements
  }
}
