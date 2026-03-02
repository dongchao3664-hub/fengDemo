/**
 * 首屏加载优化方案
 * 解决路由切换到地图/Babylon.js 页面时的空白页问题
 */

import { ref, onMounted, type Ref } from 'vue'
import { useAppStore } from '@/stores/modules/app'

/**
 * 加载状态接口
 */
export interface LoadingProgress {
  stage: string          // 加载阶段
  progress: number       // 进度 0-100
  message: string        // 提示信息
  isComplete: boolean    // 是否完成
}

/**
 * 首屏加载管理器
 */
export class FirstScreenLoader {
  private stages: Map<string, LoadingProgress> = new Map()
  private startTime = 0
  private onProgressCallbacks: Array<(progress: LoadingProgress) => void> = []

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * 开始某个加载阶段
   */
  startStage(stage: string, message: string): void {
    this.stages.set(stage, {
      stage,
      progress: 0,
      message,
      isComplete: false
    })
    this.notifyProgress()
  }

  /**
   * 更新阶段进度
   */
  updateStage(stage: string, progress: number, message?: string): void {
    const stageData = this.stages.get(stage)
    if (stageData) {
      stageData.progress = progress
      if (message) stageData.message = message
      this.notifyProgress()
    }
  }

  /**
   * 完成某个阶段
   */
  completeStage(stage: string): void {
    const stageData = this.stages.get(stage)
    if (stageData) {
      stageData.progress = 100
      stageData.isComplete = true
      this.notifyProgress()
    }
  }

  /**
   * 获取总体进度
   */
  getTotalProgress(): number {
    if (this.stages.size === 0) return 0

    const total = Array.from(this.stages.values()).reduce(
      (sum, stage) => sum + stage.progress,
      0
    )
    return Math.round(total / this.stages.size)
  }

  /**
   * 获取当前阶段信息
   */
  getCurrentStage(): LoadingProgress | null {
    // 返回第一个未完成的阶段
    for (const stage of this.stages.values()) {
      if (!stage.isComplete) {
        return stage
      }
    }
    return null
  }

  /**
   * 获取加载耗时
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime
  }

  /**
   * 监听进度更新
   */
  onProgress(callback: (progress: LoadingProgress) => void): () => void {
    this.onProgressCallbacks.push(callback)
    return () => {
      const index = this.onProgressCallbacks.indexOf(callback)
      if (index > -1) {
        this.onProgressCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 通知进度更新
   */
  private notifyProgress(): void {
    const currentStage = this.getCurrentStage()
    if (currentStage) {
      this.onProgressCallbacks.forEach(callback => callback(currentStage))
    }
  }

  /**
   * 是否全部完成
   */
  isAllComplete(): boolean {
    return Array.from(this.stages.values()).every(stage => stage.isComplete)
  }

  /**
   * 重置
   */
  reset(): void {
    this.stages.clear()
    this.startTime = Date.now()
  }
}

/**
 * Vue Hook: 使用首屏加载器
 */
export function useFirstScreenLoader() {
  const loader = ref(new FirstScreenLoader())
  const totalProgress = ref(0)
  const currentStage = ref<LoadingProgress | null>(null)
  const isComplete = ref(false)

  // 监听进度更新
  const unsubscribe = loader.value.onProgress((stage) => {
    totalProgress.value = loader.value.getTotalProgress()
    currentStage.value = stage
    isComplete.value = loader.value.isAllComplete()
  })

  onMounted(() => {
    return unsubscribe
  })

  return {
    loader: loader.value,
    totalProgress,
    currentStage,
    isComplete,
    startStage: (stage: string, message: string) => loader.value.startStage(stage, message),
    updateStage: (stage: string, progress: number, message?: string) =>
      loader.value.updateStage(stage, progress, message),
    completeStage: (stage: string) => loader.value.completeStage(stage),
    reset: () => loader.value.reset()
  }
}

/**
 * 预加载关键资源
 */
export async function preloadCriticalResources(): Promise<void> {
  const resources = [
    // 预加载关键的 CSS
    { type: 'style', href: '/assets/critical.css' },
    
    // 预加载关键的字体
    { type: 'font', href: '/fonts/main.woff2' },
    
    // 预加载关键的图片
    { type: 'image', href: '/img/basemaps/preview.jpg' }
  ]

  const promises = resources.map(resource => {
    return new Promise((resolve, reject) => {
      if (resource.type === 'style') {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = resource.href
        link.onload = resolve
        link.onerror = reject
        document.head.appendChild(link)
      } else if (resource.type === 'font') {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'font'
        link.type = 'font/woff2'
        link.href = resource.href
        link.crossOrigin = 'anonymous'
        link.onload = resolve
        link.onerror = reject
        document.head.appendChild(link)
      } else if (resource.type === 'image') {
        const img = new Image()
        img.onload = resolve
        img.onerror = reject
        img.src = resource.href
      }
    })
  })

  await Promise.allSettled(promises)
}

/**
 * 预加载地图资源
 */
export async function preloadMapResources(): Promise<void> {
  // 预加载 Mars3D 相关资源
  const resources = [
    '/config/config.json',
    '/img/basemaps/preview.jpg'
  ]

  const promises = resources.map(url => {
    return fetch(url).catch(() => {
      console.warn(`预加载失败: ${url}`)
    })
  })

  await Promise.allSettled(promises)
}

/**
 * 预加载 Babylon.js 资源
 */
export async function preloadBabylonResources(): Promise<void> {
  // 预加载 Babylon.js 相关资源
  const resources = [
    '/img/textures/ground.jpg'
  ]

  const promises = resources.map(url => {
    return fetch(url).catch(() => {
      console.warn(`预加载失败: ${url}`)
    })
  })

  await Promise.allSettled(promises)
}
