/**
 * Pinia Store - 测量相关状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MeasurementPoint, 
  MeasurementResult, 
  MeasurementType,
  MeasurementState
} from '@/models/measurement'

export const useMeasurementStore = defineStore('measurement', () => {
  // State
  const isActive = ref(false)
  const mode = ref<MeasurementType | null>(null)
  const points = ref<MeasurementPoint[]>([])
  const results = ref<MeasurementResult[]>([])
  const currentId = ref<string | null>(null)

  // Computed
  const pointCount = computed(() => points.value.length)
  const resultCount = computed(() => results.value.length)
  const canFinish = computed(() => points.value.length >= 2)
  const state = computed<MeasurementState>(() => ({
    isActive: isActive.value,
    mode: mode.value,
    points: points.value,
    currentId: currentId.value,
    results: results.value
  }))

  // Actions
  /**
   * 开始测量
   */
  const startMeasurement = (measurementMode: MeasurementType) => {
    isActive.value = true
    mode.value = measurementMode
    points.value = []
    currentId.value = `measurement_${Date.now()}`
  }

  /**
   * 添加测量点
   */
  const addPoint = (point: MeasurementPoint) => {
    points.value.push(point)
  }

  /**
   * 移除最后一个点
   */
  const removeLastPoint = () => {
    points.value.pop()
  }

  /**
   * 完成测量
   */
  const finishMeasurement = (result: MeasurementResult) => {
    results.value.push(result)
    isActive.value = false
    mode.value = null
    points.value = []
    currentId.value = null
  }

  /**
   * 取消测量
   */
  const cancelMeasurement = () => {
    isActive.value = false
    mode.value = null
    points.value = []
    currentId.value = null
  }

  /**
   * 清空所有测量结果
   */
  const clearAll = () => {
    results.value = []
    isActive.value = false
    mode.value = null
    points.value = []
    currentId.value = null
  }

  /**
   * 删除测量结果
   */
  const deleteResult = (resultId: string) => {
    results.value = results.value.filter(r => r.id !== resultId)
  }

  /**
   * 获取最后一个结果
   */
  const getLastResult = () => {
    return results.value[results.value.length - 1] || null
  }

  return {
    // State
    isActive,
    mode,
    points,
    results,
    currentId,

    // Computed
    pointCount,
    resultCount,
    canFinish,
    state,

    // Actions
    startMeasurement,
    addPoint,
    removeLastPoint,
    finishMeasurement,
    cancelMeasurement,
    clearAll,
    deleteResult,
    getLastResult
  }
})
