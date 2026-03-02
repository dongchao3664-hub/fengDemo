/**
 * SceneEngine - Babylon.js 场景引擎核心类
 * 功能：场景初始化、渲染循环、销毁
 * 设计：完全独立，不依赖Mars3D或业务逻辑
 */

import * as BABYLON from 'babylonjs'

export interface SceneEngineOptions {
  canvas: HTMLCanvasElement
  antialias?: boolean
  adaptToDeviceRatio?: boolean
  clearColor?: BABYLON.Color4
  enablePhysics?: boolean
  enableCollisions?: boolean
}

export class SceneEngine {
  private engine: BABYLON.Engine | null = null
  private scene: BABYLON.Scene | null = null
  private canvas: HTMLCanvasElement | null = null
  private isInitialized = false
  private renderLoopRegistered = false

  /**
   * 初始化场景引擎
   */
  init(options: SceneEngineOptions): BABYLON.Scene {
    if (this.isInitialized && this.scene) {
      console.warn('[SceneEngine] Already initialized')
      return this.scene
    }

    this.canvas = options.canvas

    // 创建引擎
    this.engine = new BABYLON.Engine(
      this.canvas,
      options.antialias !== false,
      {
        adaptToDeviceRatio: options.adaptToDeviceRatio !== false,
        preserveDrawingBuffer: true,
        stencil: true
      }
    )

    // 创建场景
    this.scene = new BABYLON.Scene(this.engine)

    // 配置场景
    this.configureScene(options)

    // 启动渲染循环
    this.startRenderLoop()

    // 窗口大小调整
    this.setupResizeHandler()

    this.isInitialized = true
    console.log('[SceneEngine] Initialized successfully')

    return this.scene
  }

  /**
   * 获取场景实例
   */
  getScene(): BABYLON.Scene | null {
    return this.scene
  }

  /**
   * 获取引擎实例
   */
  getEngine(): BABYLON.Engine | null {
    return this.engine
  }

  /**
   * 销毁场景
   */
  destroy(): void {
    if (this.renderLoopRegistered && this.engine) {
      this.engine.stopRenderLoop()
      this.renderLoopRegistered = false
    }

    if (this.scene) {
      this.scene.dispose()
      this.scene = null
    }

    if (this.engine) {
      this.engine.dispose()
      this.engine = null
    }

    this.canvas = null
    this.isInitialized = false
    console.log('[SceneEngine] Destroyed')
  }

  /**
   * 暂停渲染
   */
  pauseRender(): void {
    if (this.engine && this.renderLoopRegistered) {
      this.engine.stopRenderLoop()
      this.renderLoopRegistered = false
    }
  }

  /**
   * 恢复渲染
   */
  resumeRender(): void {
    if (this.engine && !this.renderLoopRegistered) {
      this.startRenderLoop()
    }
  }

  /**
   * 截图
   */
  takeScreenshot(
    callback: (data: string) => void,
    width = 1920,
    height = 1080
  ): void {
    if (!this.engine) return

    BABYLON.Tools.CreateScreenshot(
      this.engine,
      this.scene!.activeCamera!,
      { width, height },
      callback
    )
  }

  /**
   * 是否已初始化
   */
  get initialized(): boolean {
    return this.isInitialized
  }

  // ========== 私有方法 ==========

  private configureScene(options: SceneEngineOptions): void {
    if (!this.scene) return

    // 设置背景颜色 - 使用更亮的浅蓝灰色
    this.scene.clearColor =
      options.clearColor || new BABYLON.Color4(0.165, 0.294, 0.494, 1.0)

    // 启用碰撞检测
    if (options.enableCollisions) {
      this.scene.collisionsEnabled = true
    }

    // 启用雾效
    this.scene.fogEnabled = true
    this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR
    this.scene.fogStart = 10
    this.scene.fogEnd = 1000
    this.scene.fogColor = new BABYLON.Color3(0.2, 0.2, 0.2)
  }

  private startRenderLoop(): void {
    if (!this.engine || !this.scene) return

    this.engine.runRenderLoop(() => {
      this.scene?.render()
    })

    this.renderLoopRegistered = true
  }

  private setupResizeHandler(): void {
    if (!this.engine) return

    window.addEventListener('resize', () => {
      this.engine?.resize()
    })
  }
}

// 单例导出（可选）
export const sceneEngine = new SceneEngine()
