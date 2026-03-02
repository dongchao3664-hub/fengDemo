/**
 * useBabylonScene - Babylon.js 场景实例钩子
 * 功能：Vue3 Composition API 封装场景管理
 * 设计：组件级的场景生命周期管理
 */

import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type * as BABYLON from 'babylonjs'
import { SceneEngine, type SceneEngineOptions } from '../core/SceneEngine'
import { CameraManager, type CameraConfig } from '../core/CameraManager'
import { LightManager } from '../core/LightManager'
import { GLBLoader } from '../loaders/GLBLoader'

export interface UseBabylonSceneReturn {
  scene: Ref<BABYLON.Scene | null>
  sceneEngine: SceneEngine
  cameraManager: CameraManager
  lightManager: LightManager
  glbLoader: GLBLoader
  isReady: Ref<boolean>
  initScene: (canvas: HTMLCanvasElement, options?: Partial<SceneEngineOptions>) => void
  destroyScene: () => void
}

/**
 * 使用Babylon.js场景
 * @param autoInit - 是否自动初始化
 * @param canvasRef - Canvas元素引用
 * @param options - 场景配置项
 */
export function useBabylonScene(
  autoInit = false,
  canvasRef?: Ref<HTMLCanvasElement | null>,
  options?: Partial<SceneEngineOptions>
): UseBabylonSceneReturn {
  const scene = ref<BABYLON.Scene | null>(null)
  const isReady = ref(false)

  // 创建引擎实例
  const sceneEngine = new SceneEngine()
  const cameraManager = new CameraManager(sceneEngine)
  const lightManager = new LightManager(sceneEngine)
  const glbLoader = new GLBLoader(sceneEngine)

  /**
   * 初始化场景
   */
  const initScene = (
    canvas: HTMLCanvasElement,
    initOptions?: Partial<SceneEngineOptions>
  ): void => {
    try {
      const sceneInstance = sceneEngine.init({
        canvas,
        antialias: true,
        adaptToDeviceRatio: true,
        ...initOptions
      })

      scene.value = sceneInstance
      isReady.value = true

      // 创建默认相机
      cameraManager.createCamera({
        type: 'arcRotate',
        alpha: Math.PI / 2,
        beta: Math.PI / 2.5,
        radius: 10
      })

      // 创建默认光照
      lightManager.createDefaultLighting()

      console.log('[useBabylonScene] Scene initialized')
    } catch (error) {
      console.error('[useBabylonScene] Init failed:', error)
      throw error
    }
  }

  /**
   * 销毁场景
   */
  const destroyScene = (): void => {
    glbLoader.clearCache()
    lightManager.clearAll()
    cameraManager.dispose()
    sceneEngine.destroy()
    scene.value = null
    isReady.value = false
    console.log('[useBabylonScene] Scene destroyed')
  }

  // 自动初始化
  onMounted(() => {
    if (autoInit && canvasRef?.value) {
      initScene(canvasRef.value, options)
    }
  })

  // 自动销毁
  onBeforeUnmount(() => {
    destroyScene()
  })

  return {
    scene,
    sceneEngine,
    cameraManager,
    lightManager,
    glbLoader,
    isReady,
    initScene,
    destroyScene
  }
}
