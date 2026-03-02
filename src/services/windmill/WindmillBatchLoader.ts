/**
 * 批量风机加载服务
 * 集成 LoadQueue 和 LOD，优化大量风机模型加载
 */

import { LoadQueue, type LoadTask } from '@/core/loaders/LoadQueue'
import { LODManager, LODPresets } from '@/core/loaders/LODManager'
import type { Windmill } from '@/models/windmill'
import * as mars3d from 'mars3d'

/**
 * 风机加载配置
 */
export interface WindmillLoadConfig {
  concurrency?: number          // 并发加载数，默认 6
  enableLOD?: boolean           // 是否启用 LOD，默认 true
  lodUpdateInterval?: number    // LOD 更新间隔，默认 500ms
  priority?: number             // 默认优先级，默认 1
  retryCount?: number           // 重试次数，默认 3
  timeout?: number              // 超时时间，默认 30000ms
}

/**
 * 批量风机加载服务
 */
export class WindmillBatchLoader {
  private loadQueue: LoadQueue
  private lodManager: LODManager
  private map: mars3d.Map | null = null
  private config: Required<WindmillLoadConfig>
  private loadedModels: Map<string, any> = new Map()

  constructor(config: WindmillLoadConfig = {}) {
    this.config = {
      concurrency: config.concurrency ?? 6,
      enableLOD: config.enableLOD ?? true,
      lodUpdateInterval: config.lodUpdateInterval ?? 500,
      priority: config.priority ?? 1,
      retryCount: config.retryCount ?? 3,
      timeout: config.timeout ?? 30000
    }

    // 初始化加载队列
    this.loadQueue = new LoadQueue({
      concurrency: this.config.concurrency,
      maxRetries: this.config.retryCount,
      timeout: this.config.timeout,
      autoStart: true,
      enableStats: true
    })

    // 初始化 LOD 管理器
    this.lodManager = new LODManager()

    // 监听队列事件
    this.setupQueueListeners()
  }

  /**
   * 设置地图实例
   */
  setMap(map: mars3d.Map): void {
    this.map = map

    // 如果启用 LOD，开始监听相机变化
    if (this.config.enableLOD) {
      this.setupCameraListener()
    }
  }

  /**
   * 批量加载风机
   */
  async loadWindmills(windmills: Windmill[]): Promise<void> {
    console.log(`[WindmillBatchLoader] Loading ${windmills.length} windmills`)

    // 按距离排序，优先加载近处的风机
    const sortedWindmills = this.sortByDistance(windmills)

    // 创建加载任务
    const tasks: LoadTask[] = sortedWindmills.map((windmill, index) => ({
      id: windmill.id,
      priority: this.calculatePriority(windmill, index, sortedWindmills.length),
      loader: () => this.loadWindmill(windmill),
      onComplete: (result) => {
        this.onWindmillLoaded(windmill, result)
      },
      onError: (error) => {
        console.error(`[WindmillBatchLoader] Failed to load windmill ${windmill.id}:`, error)
      },
      metadata: {
        windmill
      }
    }))

    // 添加到队列
    this.loadQueue.addBatch(tasks)

    // 如果启用 LOD，注册实例
    if (this.config.enableLOD) {
      this.registerLODInstances(windmills)
    }

    // 等待队列完成
    return new Promise((resolve) => {
      this.loadQueue.once('queue:completed', () => {
        console.log('[WindmillBatchLoader] All windmills loaded')
        resolve()
      })
    })
  }

  /**
   * 加载单个风机
   */
  private async loadWindmill(windmill: Windmill): Promise<any> {
    if (!this.map) {
      throw new Error('Map instance not set')
    }

    // 这里实现具体的风机模型加载逻辑
    // 例如使用 Mars3D 的 graphic 或 layer
    const graphic = new mars3d.graphic.ModelPrimitive({
      position: [windmill.longitude, windmill.latitude, windmill.altitude || 0],
      style: {
        url: windmill.modelUrl,
        scale: windmill.scale || 1,
        heading: windmill.heading || 0
      },
      attr: {
        id: windmill.id,
        name: windmill.name,
        ...windmill
      }
    })

    return graphic
  }

  /**
   * 风机加载完成回调
   */
  private onWindmillLoaded(windmill: Windmill, graphic: any): void {
    this.loadedModels.set(windmill.id, graphic)

    // 添加到地图
    if (this.map) {
      // 假设有一个图层来管理风机
      // this.windmillLayer?.addGraphic(graphic)
    }
  }

  /**
   * 按距离排序（可选，优先加载视野内的风机）
   */
  private sortByDistance(windmills: Windmill[]): Windmill[] {
    if (!this.map) {
      return windmills
    }

    // 获取相机位置
    const camera = this.map.camera
    const cameraPosition = camera.position

    // 计算每个风机到相机的距离
    const windmillsWithDistance = windmills.map(windmill => {
      const distance = this.calculateDistanceToCamera(
        windmill.longitude,
        windmill.latitude,
        windmill.altitude || 0,
        cameraPosition
      )
      return { windmill, distance }
    })

    // 按距离排序
    windmillsWithDistance.sort((a, b) => a.distance - b.distance)

    return windmillsWithDistance.map(item => item.windmill)
  }

  /**
   * 计算优先级
   */
  private calculatePriority(
    windmill: Windmill,
    index: number,
    total: number
  ): number {
    // 距离越近，优先级越高
    // 使用线性插值：最近的优先级为 100，最远的为 1
    return Math.max(1, Math.round(100 - (index / total) * 99))
  }

  /**
   * 计算到相机的距离
   */
  private calculateDistanceToCamera(
    lon: number,
    lat: number,
    alt: number,
    cameraPosition: any
  ): number {
    // 简化距离计算（实际应该使用 Cesium 的地理距离计算）
    const dx = lon - cameraPosition.longitude
    const dy = lat - cameraPosition.latitude
    const dz = alt - cameraPosition.height
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * 注册 LOD 实例
   */
  private registerLODInstances(windmills: Windmill[]): void {
    const lodItems = windmills.map(windmill => ({
      id: windmill.id,
      position: {
        x: windmill.longitude,
        y: windmill.latitude,
        z: windmill.altitude || 0
      },
      config: LODPresets.windmill
    }))

    this.lodManager.registerBatch(lodItems)
    this.lodManager.start(this.config.lodUpdateInterval)

    console.log(`[WindmillBatchLoader] Registered ${lodItems.length} LOD instances`)
  }

  /**
   * 设置相机监听器
   */
  private setupCameraListener(): void {
    if (!this.map) {
      return
    }

    // 监听相机变化
    this.map.on('cameraChanged', () => {
      const camera = this.map!.camera
      const position = camera.position

      // 更新 LOD 管理器的相机位置
      this.lodManager.updateCameraPosition(
        position.longitude,
        position.latitude,
        position.height
      )
    })
  }

  /**
   * 设置队列监听器
   */
  private setupQueueListeners(): void {
    this.loadQueue.on('queue:started', () => {
      console.log('[WindmillBatchLoader] Queue started')
    })

    this.loadQueue.on('task:completed', (data: any) => {
      const stats = this.loadQueue.getStats()
      console.log(
        `[WindmillBatchLoader] Progress: ${stats.completed}/${stats.total} (${stats.successRate.toFixed(1)}%)`
      )
    })

    this.loadQueue.on('task:failed', (data: any) => {
      console.error(`[WindmillBatchLoader] Task failed:`, data)
    })

    this.loadQueue.on('queue:completed', () => {
      const stats = this.loadQueue.getStats()
      console.log('[WindmillBatchLoader] Queue completed:', stats)
    })
  }

  /**
   * 获取加载统计
   */
  getStats() {
    return {
      queue: this.loadQueue.getStats(),
      lod: this.lodManager.getStats(),
      loadedCount: this.loadedModels.size
    }
  }

  /**
   * 暂停加载
   */
  pause(): void {
    this.loadQueue.pause()
  }

  /**
   * 恢复加载
   */
  resume(): void {
    this.loadQueue.resume()
  }

  /**
   * 停止加载
   */
  stop(): void {
    this.loadQueue.stop()
  }

  /**
   * 清空所有风机
   */
  clear(): void {
    this.loadedModels.clear()
    this.loadQueue.clear()
    // 从地图移除所有风机
  }

  /**
   * 销毁加载器
   */
  destroy(): void {
    this.loadQueue.destroy()
    this.lodManager.destroy()
    this.loadedModels.clear()
  }
}
