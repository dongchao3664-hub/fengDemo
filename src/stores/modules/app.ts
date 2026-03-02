/**
 * 全局应用状态管理
 * 统一管理应用级别的状态（加载状态、用户交互、系统配置等）
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 加载状态接口
 */
export interface LoadingState {
  isLoading: boolean
  message: string
  progress?: number // 0-100
  type?: 'map' | 'model' | 'data' | 'general'
}

/**
 * 用户交互模式
 */
export enum InteractionMode {
  NORMAL = 'normal',           // 正常浏览模式
  MEASURING = 'measuring',     // 测量模式
  EDITING = 'editing',         // 编辑模式
  SELECTING = 'selecting',     // 选择模式
  DRAWING = 'drawing'          // 绘制模式
}

/**
 * 应用视图模式
 */
export enum ViewMode {
  MAP_2D = 'map-2d',          // 2D 地图视图
  MAP_3D = 'map-3d',          // 3D 地图视图
  BABYLON_3D = 'babylon-3d',  // Babylon.js 3D 视图
  SPLIT = 'split'             // 分屏模式
}

export const useAppStore = defineStore('app', () => {
  // ========== 加载状态 ==========
  const loadingStates = ref<Map<string, LoadingState>>(new Map())
  
  const setLoading = (
    key: string,
    isLoading: boolean,
    message = '',
    progress?: number,
    type?: LoadingState['type']
  ) => {
    if (isLoading) {
      loadingStates.value.set(key, { isLoading, message, progress, type })
    } else {
      loadingStates.value.delete(key)
    }
  }
  
  const isLoading = computed(() => loadingStates.value.size > 0)
  
  const currentLoadingMessage = computed(() => {
    const states = Array.from(loadingStates.value.values())
    return states.length > 0 ? states[0].message : ''
  })
  
  const loadingProgress = computed(() => {
    const states = Array.from(loadingStates.value.values())
    if (states.length === 0) return 0
    
    // 计算平均进度
    const withProgress = states.filter(s => s.progress !== undefined)
    if (withProgress.length === 0) return undefined
    
    const total = withProgress.reduce((sum, s) => sum + (s.progress || 0), 0)
    return Math.round(total / withProgress.length)
  })
  
  // ========== 交互模式 ==========
  const interactionMode = ref<InteractionMode>(InteractionMode.NORMAL)
  
  const setInteractionMode = (mode: InteractionMode) => {
    interactionMode.value = mode
  }
  
  const isNormalMode = computed(() => interactionMode.value === InteractionMode.NORMAL)
  const isMeasuringMode = computed(() => interactionMode.value === InteractionMode.MEASURING)
  const isEditingMode = computed(() => interactionMode.value === InteractionMode.EDITING)
  
  // ========== 视图模式 ==========
  const viewMode = ref<ViewMode>(ViewMode.MAP_3D)
  
  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }
  
  const isMapView = computed(() => 
    viewMode.value === ViewMode.MAP_2D || viewMode.value === ViewMode.MAP_3D
  )
  const isBabylonView = computed(() => viewMode.value === ViewMode.BABYLON_3D)
  const isSplitView = computed(() => viewMode.value === ViewMode.SPLIT)
  
  // ========== 选中状态 ==========
  const selectedEntity = ref<{
    type: 'windmill' | 'cable' | 'model' | 'other'
    id: string
    data?: any
  } | null>(null)
  
  const selectEntity = (type: string, id: string, data?: any) => {
    selectedEntity.value = { type: type as any, id, data }
  }
  
  const clearSelection = () => {
    selectedEntity.value = null
  }
  
  const hasSelection = computed(() => selectedEntity.value !== null)
  
  // ========== 系统配置 ==========
  const systemConfig = ref({
    enablePerformanceMonitor: false,
    enableDebugMode: false,
    maxConcurrentLoads: 10,
    cacheEnabled: true,
    renderQuality: 'high' as 'low' | 'medium' | 'high'
  })
  
  const updateSystemConfig = (config: Partial<typeof systemConfig.value>) => {
    systemConfig.value = { ...systemConfig.value, ...config }
  }
  
  // ========== 错误处理 ==========
  const errors = ref<Array<{
    id: string
    message: string
    timestamp: number
    type: 'error' | 'warning'
    details?: any
  }>>([])
  
  const addError = (message: string, type: 'error' | 'warning' = 'error', details?: any) => {
    errors.value.push({
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: Date.now(),
      type,
      details
    })
    
    // 限制错误数量
    if (errors.value.length > 50) {
      errors.value.shift()
    }
  }
  
  const clearErrors = () => {
    errors.value = []
  }
  
  const removeError = (id: string) => {
    errors.value = errors.value.filter(e => e.id !== id)
  }
  
  // ========== 通知系统 ==========
  const notifications = ref<Array<{
    id: string
    message: string
    type: 'success' | 'info' | 'warning' | 'error'
    duration?: number
    timestamp: number
  }>>([])
  
  const notify = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
    duration = 3000
  ) => {
    const id = `${Date.now()}-${Math.random()}`
    notifications.value.push({
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    })
    
    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id)
      }, duration)
    }
  }
  
  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }
  
  const clearNotifications = () => {
    notifications.value = []
  }
  
  // ========== 性能监控 ==========
  const performanceMetrics = ref({
    fps: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    lastUpdate: 0
  })
  
  const updatePerformanceMetrics = (metrics: Partial<typeof performanceMetrics.value>) => {
    performanceMetrics.value = {
      ...performanceMetrics.value,
      ...metrics,
      lastUpdate: Date.now()
    }
  }
  
  return {
    // 加载状态
    loadingStates,
    setLoading,
    isLoading,
    currentLoadingMessage,
    loadingProgress,
    
    // 交互模式
    interactionMode,
    setInteractionMode,
    isNormalMode,
    isMeasuringMode,
    isEditingMode,
    
    // 视图模式
    viewMode,
    setViewMode,
    isMapView,
    isBabylonView,
    isSplitView,
    
    // 选中状态
    selectedEntity,
    selectEntity,
    clearSelection,
    hasSelection,
    
    // 系统配置
    systemConfig,
    updateSystemConfig,
    
    // 错误处理
    errors,
    addError,
    clearErrors,
    removeError,
    
    // 通知
    notifications,
    notify,
    removeNotification,
    clearNotifications,
    
    // 性能监控
    performanceMetrics,
    updatePerformanceMetrics
  }
})
