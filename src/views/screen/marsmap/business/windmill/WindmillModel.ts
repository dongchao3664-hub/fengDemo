/**
 * WindmillModel - 风机模型（3D端）
 * 功能：在Babylon.js场景中加载和管理风机水下模型
 * 设计：依赖babylonjs，不依赖mars3dmap
 */

import * as BABYLON from 'babylonjs'
import type { SceneEngine } from '@/babylonjs/core/SceneEngine'
import type { GLBLoader } from '@/babylonjs/loaders/GLBLoader'
import type { WindmillData } from './types'

export interface WindmillModelOptions {
  position?: BABYLON.Vector3
  rotation?: BABYLON.Vector3
  scale?: number
  enableAnimation?: boolean
}

export class WindmillModel {
  private sceneEngine: SceneEngine
  private glbLoader: GLBLoader
  private rootMesh: BABYLON.AbstractMesh | null = null
  private animationGroups: BABYLON.AnimationGroup[] = []
  private windmillData: WindmillData | null = null

  constructor(sceneEngine: SceneEngine, glbLoader: GLBLoader) {
    this.sceneEngine = sceneEngine
    this.glbLoader = glbLoader
  }

  /**
   * 加载风机模型
   */
  async load(
    data: WindmillData,
    options: WindmillModelOptions = {}
  ): Promise<BABYLON.AbstractMesh> {
    const modelUrl = data.underwaterModelUrl || data.modelUrl
    console.log('[WindmillModel] Loading model:', modelUrl)

    try {
      const result = await this.glbLoader.load(modelUrl, {
        position: options.position || BABYLON.Vector3.Zero(),
        rotation: options.rotation,
        scaling: options.scale
          ? new BABYLON.Vector3(options.scale, options.scale, options.scale)
          : undefined,
        onProgress: (event) => {
          const progress = (event.loaded / event.total) * 100
          console.log(`[WindmillModel] Loading progress: ${progress.toFixed(0)}%`)
        }
      })

      this.rootMesh = result.rootMesh
      this.animationGroups = result.animationGroups
      this.windmillData = data

      // 启动动画
      if (options.enableAnimation && this.animationGroups.length > 0) {
        this.playAnimation()
      }

      console.log('[WindmillModel] Model loaded successfully')
      return this.rootMesh
    } catch (error) {
      console.error('[WindmillModel] Failed to load model:', error)
      throw error
    }
  }

  /**
   * 播放动画
   */
  playAnimation(index = 0): void {
    if (this.animationGroups.length > index) {
      this.animationGroups[index].start(true)
      console.log('[WindmillModel] Animation started')
    }
  }

  /**
   * 停止动画
   */
  stopAnimation(): void {
    this.animationGroups.forEach((group) => {
      group.stop()
    })
    console.log('[WindmillModel] Animation stopped')
  }

  /**
   * 设置位置
   */
  setPosition(position: BABYLON.Vector3): void {
    if (this.rootMesh) {
      this.rootMesh.position = position
    }
  }

  /**
   * 设置旋转
   */
  setRotation(rotation: BABYLON.Vector3): void {
    if (this.rootMesh) {
      this.rootMesh.rotation = rotation
    }
  }

  /**
   * 设置缩放
   */
  setScale(scale: number): void {
    if (this.rootMesh) {
      this.rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale)
    }
  }

  /**
   * 获取根网格
   */
  getRootMesh(): BABYLON.AbstractMesh | null {
    return this.rootMesh
  }

  /**
   * 获取风机数据
   */
  getData(): WindmillData | null {
    return this.windmillData
  }

  /**
   * 显示/隐藏模型
   */
  setVisible(visible: boolean): void {
    if (this.rootMesh) {
      this.rootMesh.setEnabled(visible)
    }
  }

  /**
   * 销毁模型
   */
  dispose(): void {
    this.stopAnimation()

    if (this.rootMesh) {
      this.rootMesh.dispose()
      this.rootMesh = null
    }

    this.animationGroups = []
    this.windmillData = null
    console.log('[WindmillModel] Model disposed')
  }
}
