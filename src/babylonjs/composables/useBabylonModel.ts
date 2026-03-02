/**
 * useBabylonModel - 模型管理 Composable
 * 功能：集成 BabylonService + ModelLoadService + MeasurementService
 * 设计：完整的业务层封装，适用于 Vue 组件
 */

import { ref, onMounted, onBeforeUnmount, computed, type Ref } from 'vue'
import type * as BABYLON from 'babylonjs'
import { BabylonService } from '@/services/babylon/BabylonService'
import { ModelLoadService, type ModelInfo, type LoadedModel, type ModelLoadOptions } from '@/services/babylon/ModelLoadService'
import { MeasurementService, type MeasurementResult, type CutFillResult } from '@/services/babylon/MeasurementService'

export interface UseBabylonModelOptions {
  autoInit?: boolean
  enableInspector?: boolean
  enableHighlight?: boolean
  enableMeasurement?: boolean
}

export interface UseBabylonModelReturn {
  // 状态
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  currentModelId: Ref<string | null>
  loadedModels: Ref<LoadedModel[]>
  error: Ref<Error | null>
  
  // 核心服务实例
  babylonService: BabylonService
  modelLoadService: ModelLoadService
  measurementService: MeasurementService
  
  // 场景方法
  initScene: (canvas: HTMLCanvasElement) => Promise<void>
  getScene: () => BABYLON.Scene | null
  resetCamera: () => void
  takeScreenshot: () => Promise<string>
  
  // 模型方法
  loadModel: (modelInfo: ModelInfo, options?: ModelLoadOptions) => Promise<LoadedModel>
  preloadModels: (models: ModelInfo[]) => Promise<void>
  switchModel: (modelId: string) => boolean
  removeModel: (modelId: string) => boolean
  clearAllModels: () => void
  highlightModel: (modelId: string, color?: BABYLON.Color3) => boolean
  
  // 测量方法
  startMeasurement: (type: 'distance' | 'area' | 'volume' | 'cut-fill') => void
  finishMeasurement: () => MeasurementResult | null
  clearMeasurement: () => void
  computeCutFillVolume: (designElevation?: number) => CutFillResult
  
  // 工具方法
  flyToModel: (modelId: string) => Promise<void>
  showInspector: () => Promise<void>
}

export function useBabylonModel(
  options: UseBabylonModelOptions = {}
): UseBabylonModelReturn {
  // 响应式状态
  const isReady = ref(false)
  const isLoading = ref(false)
  const currentModelId = ref<string | null>(null)
  const loadedModels = ref<LoadedModel[]>([])
  const error = ref<Error | null>(null)

  // 服务实例
  const babylonService = new BabylonService()
  const modelLoadService = new ModelLoadService(babylonService)
  const measurementService = new MeasurementService(babylonService)

  /**
   * 初始化场景
   */
  const initScene = async (canvas: HTMLCanvasElement): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      await babylonService.init({
        canvas,
        antialias: true,
        enableInspector: options.enableInspector,
        enableHighlight: options.enableHighlight !== false
      })

      isReady.value = true
      console.log('[useBabylonModel] Scene initialized')
    } catch (err) {
      error.value = err as Error
      console.error('[useBabylonModel] Init failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取场景
   */
  const getScene = (): BABYLON.Scene | null => {
    return babylonService.getScene()
  }

  /**
   * 重置相机
   */
  const resetCamera = (): void => {
    babylonService.resetCamera()
  }

  /**
   * 截图
   */
  const takeScreenshot = async (): Promise<string> => {
    return await babylonService.takeScreenshot()
  }

  /**
   * 加载模型
   */
  const loadModel = async (
    modelInfo: ModelInfo,
    options?: ModelLoadOptions
  ): Promise<LoadedModel> => {
    try {
      isLoading.value = true
      error.value = null

      const model = await modelLoadService.loadModel(modelInfo, options)
      
      // 更新状态
      loadedModels.value = modelLoadService.getAllModels()
      currentModelId.value = model.id

      return model
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 批量预加载模型
   */
  const preloadModels = async (models: ModelInfo[]): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      await modelLoadService.preloadModels(models)
      loadedModels.value = modelLoadService.getAllModels()
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 切换模型
   */
  const switchModel = (modelId: string): boolean => {
    const success = modelLoadService.switchModel(modelId)
    if (success) {
      currentModelId.value = modelId
      loadedModels.value = modelLoadService.getAllModels()
    }
    return success
  }

  /**
   * 移除模型
   */
  const removeModel = (modelId: string): boolean => {
    const success = modelLoadService.removeModel(modelId)
    if (success) {
      loadedModels.value = modelLoadService.getAllModels()
      if (currentModelId.value === modelId) {
        currentModelId.value = null
      }
    }
    return success
  }

  /**
   * 清除所有模型
   */
  const clearAllModels = (): void => {
    modelLoadService.clearAllModels()
    loadedModels.value = []
    currentModelId.value = null
  }

  /**
   * 高亮模型
   */
  const highlightModel = (modelId: string, color?: BABYLON.Color3): boolean => {
    return modelLoadService.highlightModel(modelId, color)
  }

  /**
   * 飞行到模型
   */
  const flyToModel = async (modelId: string): Promise<void> => {
    const model = modelLoadService.getModel(modelId)
    if (model) {
      await babylonService.flyToMesh(model.rootMesh)
    }
  }

  /**
   * 显示调试器
   */
  const showInspector = async (): Promise<void> => {
    await babylonService.showInspector()
  }

  /**
   * 开始测量
   */
  const startMeasurement = (type: 'distance' | 'area' | 'volume' | 'cut-fill'): void => {
    if (!options.enableMeasurement) {
      console.warn('[useBabylonModel] Measurement is disabled')
      return
    }
    measurementService.startMeasurement(type)
  }

  /**
   * 完成测量
   */
  const finishMeasurement = (): MeasurementResult | null => {
    return measurementService.finishMeasurement()
  }

  /**
   * 清除测量
   */
  const clearMeasurement = (): void => {
    measurementService.clearMeasurement()
  }

  /**
   * 计算挖填方
   */
  const computeCutFillVolume = (designElevation = 0): CutFillResult => {
    return measurementService.computeCutFillVolume(designElevation)
  }

  // 自动初始化（可选）
  onMounted(() => {
    if (options.autoInit) {
      console.log('[useBabylonModel] Auto-init is enabled but requires canvas element')
    }
  })

  // 清理资源
  onBeforeUnmount(() => {
    clearAllModels()
    measurementService.dispose()
    babylonService.dispose()
    console.log('[useBabylonModel] Cleaned up')
  })

  return {
    // 状态
    isReady,
    isLoading,
    currentModelId,
    loadedModels,
    error,
    
    // 服务实例
    babylonService,
    modelLoadService,
    measurementService,
    
    // 场景方法
    initScene,
    getScene,
    resetCamera,
    takeScreenshot,
    
    // 模型方法
    loadModel,
    preloadModels,
    switchModel,
    removeModel,
    clearAllModels,
    highlightModel,
    
    // 测量方法
    startMeasurement,
    finishMeasurement,
    clearMeasurement,
    computeCutFillVolume,
    
    // 工具方法
    flyToModel,
    showInspector
  }
}
