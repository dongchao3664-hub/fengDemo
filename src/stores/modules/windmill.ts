/**
 * Pinia Store - 风机数据和交互状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Windmill, WindmillDetail } from '@/models/windmill'
import * as windmillAPI from '@/api/windmill'

export const useWindmillStore = defineStore('windmill', () => {
  // State
  const windmills = ref<Windmill[]>([])
  const selectedWindmill = ref<Windmill | null>(null)
  const selectedWindmillDetail = ref<WindmillDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const highlightedIds = ref<string[]>([])

  // Computed
  const windmillCount = computed(() => windmills.value.length)
  const isDetailLoading = computed(() => isLoading.value && selectedWindmill.value)

  // Actions
  /**
   * 加载风机列表
   */
  const fetchWindmills = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await windmillAPI.getWindmills({ 
        page: 1, 
        pageSize: 1000 
      })
      windmills.value = response.data.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch windmills'
      console.error('Failed to fetch windmills:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 选中风机
   */
  const selectWindmill = (windmill: Windmill) => {
    selectedWindmill.value = windmill
    selectedWindmillDetail.value = null
  }

  /**
   * 取消选择
   */
  const deselectWindmill = () => {
    selectedWindmill.value = null
    selectedWindmillDetail.value = null
  }

  /**
   * 获取风机详情
   */
  const fetchWindmillDetail = async (windmillId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await windmillAPI.getWindmillDetail(windmillId)
      selectedWindmillDetail.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch windmill detail'
      console.error('Failed to fetch windmill detail:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 高亮风机列表
   */
  const setHighlightedIds = (ids: string[]) => {
    highlightedIds.value = ids
  }

  /**
   * 清空高亮
   */
  const clearHighlighted = () => {
    highlightedIds.value = []
  }

  /**
   * 按 ID 获取风机
   */
  const getWindmillById = (id: string) => {
    return windmills.value.find(w => w.id === id)
  }

  return {
    // State
    windmills,
    selectedWindmill,
    selectedWindmillDetail,
    isLoading,
    error,
    highlightedIds,

    // Computed
    windmillCount,
    isDetailLoading,

    // Actions
    fetchWindmills,
    selectWindmill,
    deselectWindmill,
    fetchWindmillDetail,
    setHighlightedIds,
    clearHighlighted,
    getWindmillById
  }
})
