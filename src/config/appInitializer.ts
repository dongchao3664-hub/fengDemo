/**
 * 应用初始化 - 集成所有核心系统
 * 在 main.ts 中调用此初始化函数
 */

import type { App } from 'vue'
import { registerAllPanels } from './panelRegistry'
import { eventBus, GlobalEventType } from '@/core/eventBus'
import { useAppStore } from '@/stores/modules/app'

/**
 * 初始化核心系统
 */
export function initializeCoreSystems(app: App) {
  console.log('[App] 初始化核心系统...')

  // 1. 注册所有面板
  registerAllPanels()
  console.log('[App] ✓ 面板系统初始化完成')

  // 2. 设置全局事件监听（用于调试）
  if (import.meta.env.DEV) {
    setupGlobalEventListeners()
    console.log('[App] ✓ 全局事件监听器已设置（开发模式）')
  }

  // 3. 设置全局错误处理
  setupGlobalErrorHandler(app)
  console.log('[App] ✓ 全局错误处理器已设置')

  // 4. 初始化性能监控（可选）
  if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITOR === 'true') {
    setupPerformanceMonitor()
    console.log('[App] ✓ 性能监控已启用')
  }

  console.log('[App] 核心系统初始化完成')
}

/**
 * 设置全局事件监听（调试用）
 */
function setupGlobalEventListeners() {
  // 监听所有事件
  eventBus.subscribe('*', (event) => {
    console.debug(
      `[EventBus] ${event.type}`,
      event.payload,
      `来源: ${event.source || '未知'}`
    )
  })

  // 监听关键事件
  eventBus.subscribe(GlobalEventType.MAP_READY, (event) => {
    console.log('[App] 地图已就绪', event.payload)
  })

  eventBus.subscribe(GlobalEventType.BABYLON_READY, (event) => {
    console.log('[App] Babylon.js 场景已就绪', event.payload)
  })

  eventBus.subscribe(GlobalEventType.ERROR, (event) => {
    console.error('[App] 应用错误:', event.payload)
  })
}

/**
 * 设置全局错误处理
 */
function setupGlobalErrorHandler(app: App) {
  const appStore = useAppStore()

  // Vue 错误处理
  app.config.errorHandler = (err, instance, info) => {
    console.error('[App] Vue Error:', err, info)
    
    appStore.addError(
      err instanceof Error ? err.message : String(err),
      'error',
      { info, instance }
    )
    
    // 发布错误事件
    eventBus.publish(GlobalEventType.ERROR, {
      error: err,
      info,
      type: 'vue'
    })
  }

  // 全局未捕获错误
  window.addEventListener('error', (event) => {
    console.error('[App] Global Error:', event.error)
    
    appStore.addError(
      event.message,
      'error',
      { filename: event.filename, lineno: event.lineno, colno: event.colno }
    )
    
    eventBus.publish(GlobalEventType.ERROR, {
      error: event.error,
      message: event.message,
      type: 'global'
    })
  })

  // 全局未捕获 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[App] Unhandled Promise Rejection:', event.reason)
    
    appStore.addError(
      event.reason instanceof Error ? event.reason.message : String(event.reason),
      'error',
      { reason: event.reason }
    )
    
    eventBus.publish(GlobalEventType.ERROR, {
      error: event.reason,
      type: 'promise'
    })
  })
}

/**
 * 设置性能监控
 */
function setupPerformanceMonitor() {
  const appStore = useAppStore()

  // 每秒更新一次性能指标
  setInterval(() => {
    // @ts-ignore
    const memory = performance.memory

    appStore.updatePerformanceMetrics({
      memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
      // FPS 需要在渲染循环中计算
      // drawCalls 和 triangles 需要从引擎中获取
    })
  }, 1000)
}

/**
 * 清理核心系统
 */
export function cleanupCoreSystems() {
  console.log('[App] 清理核心系统...')
  
  // 清理事件监听器
  eventBus.removeAllListeners()
  
  console.log('[App] 核心系统清理完成')
}
