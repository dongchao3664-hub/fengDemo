/**
 * ModelLoadService - 模型加载管理服务
 * 功能：模型加载、切换、预加载、缓存管理、动态配置
 */

import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'
import type { BabylonService } from './BabylonService'

export interface ModelLoadOptions {
  position?: BABYLON.Vector3
  rotation?: BABYLON.Vector3
  scaling?: BABYLON.Vector3
  visible?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  onProgress?: (event: BABYLON.ISceneLoaderProgressEvent) => void
  onComplete?: (meshes: BABYLON.AbstractMesh[]) => void
  customize?: ModelCustomizationFunction
}

export interface ModelInfo {
  id: string
  url: string
  name: string
  type?: string
  metadata?: Record<string, any>
}

export interface LoadedModel {
  id: string
  container: BABYLON.AssetContainer
  meshes: BABYLON.AbstractMesh[]
  rootMesh: BABYLON.AbstractMesh
  animationGroups: BABYLON.AnimationGroup[]
  visible: boolean
  metadata?: Record<string, any>
}

export type ModelCustomizationFunction = (
  meshes: BABYLON.AbstractMesh[],
  scene: BABYLON.Scene,
  id: string
) => void

export class ModelLoadService {
  private babylonService: BabylonService
  private modelCache: Map<string, LoadedModel> = new Map()
  private currentModelId: string | null = null
  private preloadQueue: Map<string, Promise<void>> = new Map()

  constructor(babylonService: BabylonService) {
    this.babylonService = babylonService
  }

  /**
   * 加载模型（使用 AssetContainer）
   */
  async loadModel(
    modelInfo: ModelInfo,
    options: ModelLoadOptions = {}
  ): Promise<LoadedModel> {
    const scene = this.babylonService.getScene()
    if (!scene) {
      throw new Error('[ModelLoadService] Scene not initialized')
    }

    // 检查缓存
    if (this.modelCache.has(modelInfo.id)) {
      console.log(`[ModelLoadService] Model ${modelInfo.id} already loaded`)
      return this.modelCache.get(modelInfo.id)!
    }

    console.log(`[ModelLoadService] Loading model: ${modelInfo.id}`)

    try {
      // 使用 AssetContainer 加载模型
      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        '',
        modelInfo.url,
        scene,
        options.onProgress
      )

      const meshes = container.meshes as BABYLON.AbstractMesh[]
      const rootMesh = meshes[0]

      // 设置根网格名称
      rootMesh.name = modelInfo.id

      // 应用变换
      if (options.position) rootMesh.position = options.position
      if (options.rotation) rootMesh.rotation = options.rotation
      if (options.scaling) rootMesh.scaling = options.scaling

      // 应用自定义处理
      if (options.customize) {
        options.customize(meshes, scene, modelInfo.id)
      }

      // 配置阴影
      if (options.castShadow || options.receiveShadow) {
        this.configureShadows(meshes, options)
      }

      // 默认不添加到场景
      const visible = options.visible !== false
      if (visible) {
        container.addAllToScene()
      }

      // 创建加载结果
      const loadedModel: LoadedModel = {
        id: modelInfo.id,
        container,
        meshes,
        rootMesh,
        animationGroups: container.animationGroups,
        visible,
        metadata: modelInfo.metadata
      }

      // 缓存模型
      this.modelCache.set(modelInfo.id, loadedModel)

      // 调用完成回调
      if (options.onComplete) {
        options.onComplete(meshes)
      }

      console.log(`[ModelLoadService] Model loaded: ${modelInfo.id}`)
      return loadedModel
    } catch (error) {
      console.error(`[ModelLoadService] Failed to load model: ${modelInfo.id}`, error)
      throw error
    }
  }

  /**
   * 预加载模型（不添加到场景）
   */
  async preloadModel(modelInfo: ModelInfo): Promise<void> {
    // 检查是否已在预加载队列
    if (this.preloadQueue.has(modelInfo.id)) {
      return this.preloadQueue.get(modelInfo.id)
    }

    // 检查是否已加载
    if (this.modelCache.has(modelInfo.id)) {
      return Promise.resolve()
    }

    const preloadPromise = this.loadModel(modelInfo, { visible: false })
      .then(() => {
        console.log(`[ModelLoadService] Preloaded: ${modelInfo.id}`)
        this.preloadQueue.delete(modelInfo.id)
      })
      .catch((error) => {
        console.error(`[ModelLoadService] Preload failed: ${modelInfo.id}`, error)
        this.preloadQueue.delete(modelInfo.id)
        throw error
      })

    this.preloadQueue.set(modelInfo.id, preloadPromise)
    return preloadPromise
  }

  /**
   * 批量预加载模型
   */
  async preloadModels(modelInfos: ModelInfo[]): Promise<void> {
    console.log(`[ModelLoadService] Preloading ${modelInfos.length} models...`)
    await Promise.all(modelInfos.map((info) => this.preloadModel(info)))
    console.log('[ModelLoadService] All models preloaded')
  }

  /**
   * 显示模型（从缓存添加到场景）
   */
  showModel(modelId: string): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) {
      console.warn(`[ModelLoadService] Model not found: ${modelId}`)
      return false
    }

    if (!model.visible) {
      model.container.addAllToScene()
      model.visible = true
      this.currentModelId = modelId
      console.log(`[ModelLoadService] Showing model: ${modelId}`)
    }

    return true
  }

  /**
   * 隐藏模型（从场景移除但保留缓存）
   */
  hideModel(modelId: string): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) {
      console.warn(`[ModelLoadService] Model not found: ${modelId}`)
      return false
    }

    if (model.visible) {
      model.container.removeAllFromScene()
      model.visible = false
      console.log(`[ModelLoadService] Hiding model: ${modelId}`)
    }

    return true
  }

  /**
   * 切换模型显示
   */
  switchModel(newModelId: string, hideOthers = true): boolean {
    // 隐藏其他模型
    if (hideOthers) {
      this.modelCache.forEach((model, id) => {
        if (id !== newModelId && model.visible) {
          this.hideModel(id)
        }
      })
    }

    // 显示目标模型
    const success = this.showModel(newModelId)
    if (success) {
      this.currentModelId = newModelId
      
      // 相机飞行到模型
      const model = this.modelCache.get(newModelId)
      if (model) {
        this.babylonService.flyToMesh(model.rootMesh)
      }
    }

    return success
  }

  /**
   * 获取当前显示的模型
   */
  getCurrentModel(): LoadedModel | null {
    if (!this.currentModelId) return null
    return this.modelCache.get(this.currentModelId) || null
  }

  /**
   * 获取已加载的模型
   */
  getModel(modelId: string): LoadedModel | null {
    return this.modelCache.get(modelId) || null
  }

  /**
   * 获取所有已加载的模型
   */
  getAllModels(): LoadedModel[] {
    return Array.from(this.modelCache.values())
  }

  /**
   * 移除模型
   */
  removeModel(modelId: string): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) {
      console.warn(`[ModelLoadService] Model not found: ${modelId}`)
      return false
    }

    // 从场景移除
    if (model.visible) {
      model.container.removeAllFromScene()
    }

    // 释放资源
    model.meshes.forEach((mesh) => mesh.dispose())
    model.container.dispose()

    // 从缓存移除
    this.modelCache.delete(modelId)

    if (this.currentModelId === modelId) {
      this.currentModelId = null
    }

    console.log(`[ModelLoadService] Removed model: ${modelId}`)
    return true
  }

  /**
   * 清除所有模型
   */
  clearAllModels(): void {
    console.log('[ModelLoadService] Clearing all models...')
    
    this.modelCache.forEach((model, id) => {
      this.removeModel(id)
    })

    this.modelCache.clear()
    this.currentModelId = null
  }

  /**
   * 设置模型可见性
   */
  setModelVisibility(modelId: string, visible: boolean): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) return false

    model.meshes.forEach((mesh) => {
      mesh.isVisible = visible
    })

    return true
  }

  /**
   * 更新模型变换
   */
  updateModelTransform(
    modelId: string,
    transform: {
      position?: BABYLON.Vector3
      rotation?: BABYLON.Vector3
      scaling?: BABYLON.Vector3
    }
  ): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) return false

    const rootMesh = model.rootMesh
    if (transform.position) rootMesh.position = transform.position
    if (transform.rotation) rootMesh.rotation = transform.rotation
    if (transform.scaling) rootMesh.scaling = transform.scaling

    return true
  }

  /**
   * 高亮显示模型
   */
  highlightModel(modelId: string, color?: BABYLON.Color3): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) return false

    model.meshes.forEach((mesh) => {
      this.babylonService.highlightMesh(mesh, color)
    })

    return true
  }

  /**
   * 取消模型高亮
   */
  removeModelHighlight(modelId: string): boolean {
    const model = this.modelCache.get(modelId)
    if (!model) return false

    model.meshes.forEach((mesh) => {
      this.babylonService.removeHighlight(mesh)
    })

    return true
  }

  /**
   * 播放模型动画
   */
  playAnimation(
    modelId: string,
    animationIndex = 0,
    loop = true,
    speedRatio = 1.0
  ): BABYLON.AnimationGroup | null {
    const model = this.modelCache.get(modelId)
    if (!model || model.animationGroups.length === 0) {
      return null
    }

    const animationGroup = model.animationGroups[animationIndex]
    animationGroup.loopAnimation = loop
    animationGroup.speedRatio = speedRatio
    animationGroup.start()

    return animationGroup
  }

  /**
   * 停止模型动画
   */
  stopAnimation(modelId: string, animationIndex?: number): void {
    const model = this.modelCache.get(modelId)
    if (!model) return

    if (animationIndex !== undefined) {
      const animationGroup = model.animationGroups[animationIndex]
      animationGroup?.stop()
    } else {
      model.animationGroups.forEach((group) => group.stop())
    }
  }

  /**
   * 获取模型边界信息
   */
  getModelBounds(modelId: string): BABYLON.BoundingInfo | null {
    const model = this.modelCache.get(modelId)
    if (!model) return null

    return model.rootMesh.getBoundingInfo()
  }

  // ========== 私有方法 ==========

  /**
   * 配置阴影
   */
  private configureShadows(
    meshes: BABYLON.AbstractMesh[],
    options: ModelLoadOptions
  ): void {
    const shadowGenerator = this.babylonService.getShadowGenerator()
    if (!shadowGenerator) return

    meshes.forEach((mesh) => {
      if (options.castShadow) {
        shadowGenerator.addShadowCaster(mesh)
      }
      if (options.receiveShadow) {
        mesh.receiveShadows = true
      }
    })
  }
}
