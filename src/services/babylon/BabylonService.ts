/**
 * BabylonService - Babylon.js 场景服务
 * 功能：场景初始化、相机控制、光照配置、交互管理
 * 设计：基于 SceneEngine 的业务层封装，参考 tunnel-admin-ui 的 BasicSence
 */

import * as BABYLON from 'babylonjs'
import { SceneEngine } from '@/babylonjs/core/SceneEngine'
import { CameraManager } from '@/babylonjs/core/CameraManager'
import { LightManager } from '@/babylonjs/core/LightManager'

import { createSkyBox,CreatePhotoDome ,CreateShdrTexture} from '@/babylonjs/core/skybox'

import 'babylonjs-loaders'  // 注册 glTF 加载器（必须导入才能加载 .glb/.gltf 文件）


import * as GUI from 'babylonjs-gui'
import { Inspector } from 'babylonjs-inspector';
import { Vector3 } from 'babylonjs'


export interface BabylonServiceOptions {
  canvas: HTMLCanvasElement
  antialias?: boolean
  enableInspector?: boolean
  enableHighlight?: boolean
  clearColor?: BABYLON.Color4
}

export interface CameraAnimationConfig {
  position?: BABYLON.Vector3
  target?: BABYLON.Vector3
  radius?: number
  alpha?: number
  beta?: number
  duration?: number
  easing?: BABYLON.EasingFunction
}

export class BabylonService {
  private sceneEngine: SceneEngine
  private cameraManager: CameraManager
  private lightManager: LightManager
  private highlightLayer?: BABYLON.HighlightLayer
  private shadowGenerator?: BABYLON.ShadowGenerator
  private defaultPipeline?: BABYLON.DefaultRenderingPipeline

  private initialized = false

  constructor() {
    this.sceneEngine = new SceneEngine()
    this.cameraManager = new CameraManager(this.sceneEngine)
    this.lightManager = new LightManager(this.sceneEngine)
  }

  /**
   * 初始化场景
   */
  async init(options: BabylonServiceOptions): Promise<void> {
    if (this.initialized) {
      console.warn('[BabylonService] Already initialized')
      return
    }

    try {
      // 初始化场景引擎
      const scene = this.sceneEngine.init({
        canvas: options.canvas,
        antialias: options.antialias !== false,
        clearColor: options.clearColor ,
        enableCollisions: false
      })

      // 创建相机
      this.cameraManager.createCamera({
        type: 'arcRotate',
        alpha: -Math.PI / 2,
        beta: Math.PI / 2.5,
        radius: 50,
        target: BABYLON.Vector3.Zero()
      })

      // 创建光照系统
      await this.setupLighting(scene)

      // 创建高亮层
      if (options.enableHighlight !== false) {
        this.highlightLayer = new BABYLON.HighlightLayer('highlight', scene)
      }

      // 创建发光层以增强视觉效果
      const glowLayer = new BABYLON.GlowLayer('glow', scene)
      glowLayer.intensity = 0.5
      glowLayer.blurKernelSize = 64

      // 创建后期处理管线
      this.setupPostProcessing(scene)

      // 设置交互
      this.setupInteractions(scene)

      // this.CreateShdrTexture(scene)

      // 360穹顶和天空盒只能选择一个，否则会相互遮挡
      // CreatePhotoDome(scene) // 注释掉穹顶，使用天空盒

      // 天空盒 - 使用 skybox 资源创建明亮的天空
      // createSkyBox(scene)

      // 开启调试器
      if (options.enableInspector) {
        await this.showInspector()
      }

      this.initialized = true
      console.log('[BabylonService] Initialized successfully')
    } catch (error) {
      console.error('[BabylonService] Initialization failed:', error)
      throw error
    }
  }

 CreateShdrTexture(scene: BABYLON.Scene){
    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("/textures/environment.env", scene); //加载环境反射贴图
    
    scene.environmentTexture = hdrTexture;
            scene.environmentIntensity=0.1;
            //   0.165, 0.294, 0.494
            scene.clearColor = new BABYLON.Color4(0.035, 0.043, 0.059)
}

  /**
   * 获取场景实例
   */
  getScene(): BABYLON.Scene | null {
    return this.sceneEngine.getScene()
  }

  /**
   * 获取引擎实例
   */
  getEngine(): BABYLON.Engine | null {
    return this.sceneEngine.getEngine()
  }

  /**
   * 获取相机
   */
  getCamera(): BABYLON.ArcRotateCamera | null {
    return this.cameraManager.getActiveArcRotateCamera()
  }

  /**
   * 获取阴影生成器
   */
  getShadowGenerator(): BABYLON.ShadowGenerator | undefined {
    return this.shadowGenerator
  }

  /**
   * 获取高亮层
   */
  getHighlightLayer(): BABYLON.HighlightLayer | undefined {
    return this.highlightLayer
  }

  /**
   * 相机飞行到目标
   */
  async flyToMesh(
    mesh: BABYLON.AbstractMesh,
    config?: Partial<CameraAnimationConfig>
  ): Promise<void> {
    const camera = this.getCamera()
    const scene = this.getScene()
    if (!camera || !scene) return

    const boundingInfo = mesh.getBoundingInfo()
    const center = boundingInfo.boundingBox.centerWorld
    const size = boundingInfo.boundingBox.extendSizeWorld
    const maxSize = Math.max(size.x, size.y, size.z)

    const targetRadius = config?.radius || maxSize * 3
    const duration = config?.duration || 60

    // 创建动画组
    const animationGroup = new BABYLON.AnimationGroup('cameraFly', scene)

    // 目标位置动画
    const targetAnimation = new BABYLON.Animation(
      'targetAnimation',
      'target',
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    targetAnimation.setKeys([
      { frame: 0, value: camera.target.clone() },
      { frame: duration, value: config?.target || center }
    ])

    // 半径动画
    const radiusAnimation = new BABYLON.Animation(
      'radiusAnimation',
      'radius',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    )
    radiusAnimation.setKeys([
      { frame: 0, value: camera.radius },
      { frame: duration, value: targetRadius }
    ])

    // 添加缓动函数
    const easingFunction = config?.easing || new BABYLON.CubicEase()
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT)
    targetAnimation.setEasingFunction(easingFunction)
    radiusAnimation.setEasingFunction(easingFunction)

    animationGroup.addTargetedAnimation(targetAnimation, camera)
    animationGroup.addTargetedAnimation(radiusAnimation, camera)

    // 播放动画
    return new Promise((resolve) => {
      animationGroup.onAnimationGroupEndObservable.addOnce(() => {
        resolve()
      })
      animationGroup.play()
    })
  }

  /**
   * 高亮显示网格
   */
  highlightMesh(mesh: BABYLON.AbstractMesh, color?: BABYLON.Color3): void {
    if (!this.highlightLayer) return
    if (mesh instanceof BABYLON.Mesh) {
      this.highlightLayer.addMesh(mesh, color || BABYLON.Color3.Yellow())
    }
  }

  /**
   * 取消高亮
   */
  removeHighlight(mesh: BABYLON.AbstractMesh): void {
    if (!this.highlightLayer) return
    if (mesh instanceof BABYLON.Mesh) {
      this.highlightLayer.removeMesh(mesh)
    }
  }

  /**
   * 清除所有高亮
   */
  clearAllHighlights(): void {
    if (!this.highlightLayer) return
    this.highlightLayer.removeAllMeshes()
  }

  /**
   * 启用/禁用调试模式
   */
  async showInspector(embedded = false): Promise<void> {
    const scene = this.getScene()
    if (!scene) return

    if (scene.debugLayer.isVisible()) {
      scene.debugLayer.hide()
    } else {
      // 检查是否已存在本地 inspector 资源
        try {
          await scene.debugLayer.show({
            embedMode: embedded,
            overlay: true
          })
          // Inspector.Show(scene,{})
          //     scene.debugLayer.show({
          //         embedMode: true,
          //         overlay: true,
          //     });
        } catch (error) {
          console.warn('[BabylonService] Failed to load inspector from CDN:', error)
          console.log('[BabylonService] Please make sure BabylonJS inspector is properly installed or check network connection')
        }
    }
  }

  /**
   * 重置相机
   */
  resetCamera(): void {
    const camera = this.getCamera()
    if (!camera) return

    camera.alpha = -Math.PI / 2
    camera.beta = Math.PI / 2.5
    camera.radius = 50
    camera.target = BABYLON.Vector3.Zero()
  }

  /**
   * 截图
   */
  async takeScreenshot(
    width = 1920,
    height = 1080
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const engine = this.getEngine()
      const scene = this.getScene()
      
      if (!engine || !scene?.activeCamera) {
        reject(new Error('Engine or camera not available'))
        return
      }

      BABYLON.Tools.CreateScreenshot(
        engine,
        scene.activeCamera,
        { width, height },
        (data) => resolve(data)
      )
    })
  }

  // ========== 兼容性方法（为组件提供简化接口） ==========

  private currentModel: BABYLON.AbstractMesh | null = null

  /**
   * 初始化场景（兼容接口）
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.init({
      canvas,
      antialias: true,
      enableHighlight: true,
      enableInspector: false
    })
  }

  /**
   * 加载模型
   */
  async loadModel(
    url: string,
    onProgress?: (event: any) => void
  ): Promise<BABYLON.AbstractMesh | null> {
    const scene = this.getScene()
    if (!scene) {
      console.error('[BabylonService] Scene not initialized')
      return null
    }

    try {
      console.log(`[BabylonService] Loading model: ${url}`)

      // 使用 SceneLoader 加载模型
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        '',
        url,
        scene,
        onProgress as any
      )

      console.log(`[BabylonService] Loaded ${result.meshes.length} meshes`)

      if (result.meshes.length > 0) {
        // 找到根网格（通常是第一个）
        const rootMesh = result.meshes[0]
        this.currentModel = rootMesh

        // 自动调整相机
        const boundingInfo = rootMesh.getHierarchyBoundingVectors()
        const size = boundingInfo.max.subtract(boundingInfo.min)
        const maxSize = Math.max(size.x, size.y, size.z)
        
        console.log('[BabylonService] Model size:', {
          min: boundingInfo.min,
          max: boundingInfo.max,
          size: size,
          maxSize: maxSize
        })
        
        const camera = this.getCamera()
        if (camera) {
          // 计算相机参数
          const targetRadius = maxSize * 1.5
          const center = BABYLON.Vector3.Center(boundingInfo.min, boundingInfo.max)
          const targetY = center.y + size.y * 0.3 // 目标点抬高30%
          const targetPosition = new BABYLON.Vector3(center.x, targetY, center.z)
          
          console.log('[BabylonService] Camera settings:', {
            radius: targetRadius,
            target: targetPosition,
            beta: Math.PI / 3
          })
          
          // 设置相机参数
          camera.target = targetPosition
          camera.radius = targetRadius
          camera.beta = Math.PI / 3 // 60度仰角
          camera.alpha = -Math.PI / 2 // 从正前方观察
          
          // 确保相机的半径限制不会阻止设置
          if (camera.upperRadiusLimit && camera.upperRadiusLimit < targetRadius) {
            camera.upperRadiusLimit = targetRadius * 1.5
            console.log('[BabylonService] Adjusted upperRadiusLimit to:', camera.upperRadiusLimit)
          }
          
          console.log('[BabylonService] Camera radius after setting:', camera.radius)
        }

        // 异步加载风机模型（不阻塞主模型返回）
        this.loadWindmillModel(rootMesh, boundingInfo).catch(err => {
          console.warn('[BabylonService] Windmill model loading failed (non-blocking):', err)
        })

        console.log('[BabylonService] Model loaded successfully')
        return rootMesh
      }

      return null
    } catch (error) {
      console.error('[BabylonService] Failed to load model:', error)
      throw error
    }
  }

  /**
   * 加载风机模型并放置在水下模型中心
   * @param underwaterModel 水下模型（坑）
   * @param boundingInfo 水下模型的边界信息
   */
  private async loadWindmillModel(
    underwaterModel: BABYLON.AbstractMesh,
    boundingInfo: { min: BABYLON.Vector3; max: BABYLON.Vector3 }
  ): Promise<void> {
    const scene = this.getScene()
    if (!scene) return

    try {
      const windmillUrl = 'http://47.104.109.74:10555/linejson/feng/gan.gltf'
      console.log(`[BabylonService] Loading windmill model: ${windmillUrl}`)

      // 加载风机模型
      const windmillResult = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        '',
        windmillUrl,
        scene
      )

      if (windmillResult.meshes.length > 0) {
        const windmillRoot = windmillResult.meshes[0]
        windmillRoot.name = 'windmill'

        // 计算水下模型的中心点（x, z平面的中心）
        const centerX = (boundingInfo.min.x + boundingInfo.max.x) / 2
        const centerZ = (boundingInfo.min.z + boundingInfo.max.z) / 2
        // 高度使用水下模型的最小值（坑底）
        const minY = boundingInfo.min.y

        // 设置风机位置
        windmillRoot.position = new BABYLON.Vector3(centerX, minY, centerZ)
        windmillRoot.scaling = new BABYLON.Vector3(20, 2, 20) // 根据需要调整缩放比例

        console.log(`[BabylonService] Windmill positioned at (${centerX.toFixed(2)}, ${minY.toFixed(2)}, ${centerZ.toFixed(2)})`)
        console.log('[BabylonService] Windmill model loaded successfully')
      }
    } catch (error) {
      console.error('[BabylonService] Failed to load windmill model:', error)
      // 不抛出错误，因为风机模型加载失败不应影响主模型的显示
    }
  }

  /**
   * 清空场景（移除当前模型）
   */
  clearScene(): void {
    const scene = this.getScene()
    
    // 清理水下模型
    if (this.currentModel) {
      this.currentModel.dispose()
      this.currentModel = null
    }
    
    // 清理风机模型
    if (scene) {
      const windmill = scene.getMeshByName('windmill')
      if (windmill) {
        windmill.dispose()
        console.log('[BabylonService] Windmill model disposed')
      }
    }
  }

  /**
   * 获取当前加载的模型
   */
  getCurrentModel(): BABYLON.AbstractMesh | null {
    return this.currentModel
  }

  /**
   * 销毁服务
   */
  dispose(): void {
    if (this.highlightLayer) {
      this.highlightLayer.dispose()
      this.highlightLayer = undefined
    }

    if (this.defaultPipeline) {
      this.defaultPipeline.dispose()
      this.defaultPipeline = undefined
    }

    this.lightManager.clearAll()
    this.cameraManager.dispose()
    this.sceneEngine.destroy()

    this.initialized = false
    console.log('[BabylonService] Disposed')
  }

  // ========== 私有方法 ==========

  /**
   * 设置光照系统
   */
  private async setupLighting(scene: BABYLON.Scene): Promise<void> {

    // 环境光 - 提高强度以避免场景过暗
    const hemisphericLight = new BABYLON.HemisphericLight(
      'hemisphericLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    )
    hemisphericLight.intensity = 1.2
    hemisphericLight.diffuse = new BABYLON.Color3(1, 1, 1)
    hemisphericLight.specular = new BABYLON.Color3(1, 1, 1)
    hemisphericLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.6)

    // 主方向光 - 增加光照强度
    const directionalLight = new BABYLON.DirectionalLight(
      'directionalLight',
      new BABYLON.Vector3(-1, -2, -1),
      scene
    )
    directionalLight.position = new BABYLON.Vector3(192.273, 384.546, -192.273)
    directionalLight.intensity = 8.0
    directionalLight.diffuse = new BABYLON.Color3(1, 1, 1)
    directionalLight.specular = new BABYLON.Color3(1, 1, 1)

    // 创建阴影生成器
    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.blurKernel = 32

  }

  /**
   * 设置后期处理
   */
  private setupPostProcessing(scene: BABYLON.Scene): void {
    const camera = this.getCamera()
    if (!camera) return

    this.defaultPipeline = new BABYLON.DefaultRenderingPipeline(
      'default',
      true,
      scene,
      [camera]
    )

    // 抗锯齿
    this.defaultPipeline.fxaaEnabled = true

    // 泛光效果
    this.defaultPipeline.bloomEnabled = false

    // 色调映射
    this.defaultPipeline.imageProcessingEnabled = true
    this.defaultPipeline.imageProcessing.toneMappingEnabled = true
    this.defaultPipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES
    this.defaultPipeline.imageProcessing.exposure = 1.0
  }

  /**
   * 设置交互
   */
  private setupInteractions(scene: BABYLON.Scene): void {
    // 创建自定义 Observable
    if (!(scene as any).onMeshPickedObservable) {
      ;(scene as any).onMeshPickedObservable = new BABYLON.Observable<BABYLON.AbstractMesh>()
    }

    // 点击拾取
    scene.onPointerDown = (evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        const pickedMesh = pickResult.pickedMesh
        // console 输出
        if (typeof console !== 'undefined' && console.log) {
          console.log('[BabylonService] Picked mesh:', pickedMesh.name)
        }
        // 触发自定义事件
        ;(scene as any).onMeshPickedObservable?.notifyObservers(pickedMesh)
      }
    }
  }
}

// 单例导出
export const babylonService = new BabylonService()
