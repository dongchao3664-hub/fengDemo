/**
 * GLBLoader - Babylon.js GLB模型加载器
 * 功能：加载GLB/GLTF模型、缓存管理
 * 设计：支持异步加载、进度跟踪、错误处理
 */

import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'
import type { SceneEngine } from '../core/SceneEngine'

export interface LoadOptions {
  position?: BABYLON.Vector3
  rotation?: BABYLON.Vector3
  scaling?: BABYLON.Vector3
  castShadow?: boolean
  receiveShadow?: boolean
  onProgress?: (event: BABYLON.ISceneLoaderProgressEvent) => void
}

export interface LoadResult {
  meshes: BABYLON.AbstractMesh[]
  rootMesh: BABYLON.AbstractMesh
  animationGroups: BABYLON.AnimationGroup[]
  skeletons: BABYLON.Skeleton[]
}

export class GLBLoader {
  private sceneEngine: SceneEngine
  private loadedModels: Map<string, LoadResult> = new Map()

  constructor(sceneEngine: SceneEngine) {
    this.sceneEngine = sceneEngine
  }

  /**
   * 加载GLB模型
   * @param url - 模型URL
   * @param options - 加载选项
   * @returns 加载结果
   */
  async load(url: string, options: LoadOptions = {}): Promise<LoadResult> {
    const scene = this.sceneEngine.getScene()
    if (!scene) {
      throw new Error('[GLBLoader] Scene not initialized')
    }

    console.log(`[GLBLoader] Loading model: ${url}`)

    try {
      // 使用BABYLON的SceneLoader加载模型
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        '',
        url,
        scene,
        options.onProgress
      )

      const loadResult: LoadResult = {
        meshes: result.meshes,
        rootMesh: result.meshes[0],
        animationGroups: result.animationGroups,
        skeletons: result.skeletons
      }

      // 应用变换
      this.applyTransforms(loadResult.rootMesh, options)

      // 配置阴影
      this.configureShadows(loadResult.meshes, options)

      // 缓存加载结果
      this.loadedModels.set(url, loadResult)

      console.log(`[GLBLoader] Model loaded: ${url}`)
      return loadResult
    } catch (error) {
      console.error(`[GLBLoader] Failed to load model: ${url}`, error)
      throw error
    }
  }

  /**
   * 从缓存获取模型
   */
  getFromCache(url: string): LoadResult | null {
    return this.loadedModels.get(url) || null
  }

  /**
   * 克隆已加载的模型
   */
  clone(url: string, newName: string): BABYLON.AbstractMesh | null {
    const cached = this.loadedModels.get(url)
    if (!cached) {
      console.warn(`[GLBLoader] Model not found in cache: ${url}`)
      return null
    }

    const cloned = cached.rootMesh.clone(newName, null, true)
    return cloned
  }

  /**
   * 卸载模型
   */
  unload(url: string): boolean {
    const cached = this.loadedModels.get(url)
    if (!cached) return false

    // 销毁所有网格
    cached.meshes.forEach((mesh) => {
      mesh.dispose()
    })

    // 停止所有动画
    cached.animationGroups.forEach((group) => {
      group.stop()
      group.dispose()
    })

    this.loadedModels.delete(url)
    console.log(`[GLBLoader] Model unloaded: ${url}`)
    return true
  }

  /**
   * 批量加载模型
   */
  async loadBatch(
    urls: string[],
    options: LoadOptions = {}
  ): Promise<Map<string, LoadResult>> {
    const results = new Map<string, LoadResult>()

    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const result = await this.load(url, options)
          results.set(url, result)
        } catch (error) {
          console.error(`[GLBLoader] Failed to load: ${url}`, error)
        }
      })
    )

    return results
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.loadedModels.forEach((_, url) => {
      this.unload(url)
    })
    console.log('[GLBLoader] Cache cleared')
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.loadedModels.size
  }

  // ========== 私有方法 ==========

  private applyTransforms(mesh: BABYLON.AbstractMesh, options: LoadOptions): void {
    if (options.position) {
      mesh.position = options.position
    }

    if (options.rotation) {
      mesh.rotation = options.rotation
    }

    if (options.scaling) {
      mesh.scaling = options.scaling
    }
  }

  private configureShadows(
    meshes: BABYLON.AbstractMesh[],
    options: LoadOptions
  ): void {
    const scene = this.sceneEngine.getScene()
    if (!scene) return

    meshes.forEach((mesh) => {
      if (options.castShadow) {
        mesh.receiveShadows = false
        // 需要配合ShadowGenerator使用
      }

      if (options.receiveShadow) {
        mesh.receiveShadows = true
      }
    })
  }
}
