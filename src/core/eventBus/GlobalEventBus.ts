/**
 * 全局事件总线
 * 用于跨模块通信（Mars3D <-> Babylon.js <-> 业务模块）
 */

import { EventEmitter } from '@/utils/eventEmitter'

/**
 * 事件类型枚举
 */
export enum GlobalEventType {
  // Mars3D 地图事件
  MAP_READY = 'map:ready',
  MAP_CLICK = 'map:click',
  MAP_DOUBLE_CLICK = 'map:dblclick',
  MAP_CAMERA_CHANGED = 'map:camera:changed',
  MAP_LAYER_ADDED = 'map:layer:added',
  MAP_LAYER_REMOVED = 'map:layer:removed',
  MAP_LAYER_VISIBILITY_CHANGED = 'map:layer:visibility:changed',
  
  // Babylon.js 场景事件
  BABYLON_READY = 'babylon:ready',
  BABYLON_MODEL_LOADED = 'babylon:model:loaded',
  BABYLON_MODEL_CLICKED = 'babylon:model:clicked',
  BABYLON_CAMERA_CHANGED = 'babylon:camera:changed',
  
  // 风机业务事件
  WINDMILL_CLICKED = 'windmill:clicked',
  WINDMILL_SELECTED = 'windmill:selected',
  WINDMILL_DESELECTED = 'windmill:deselected',
  WINDMILL_DETAIL_LOADED = 'windmill:detail:loaded',
  WINDMILL_LIST_LOADED = 'windmill:list:loaded',
  
  // 电缆业务事件
  CABLE_CLICKED = 'cable:clicked',
  CABLE_SELECTED = 'cable:selected',
  CABLE_DESELECTED = 'cable:deselected',
  CABLE_SEGMENT_LOADED = 'cable:segment:loaded',
  
  // 测量事件
  MEASUREMENT_STARTED = 'measurement:started',
  MEASUREMENT_COMPLETED = 'measurement:completed',
  MEASUREMENT_CANCELLED = 'measurement:cancelled',
  MEASUREMENT_RESULT_UPDATED = 'measurement:result:updated',
  
  // 面板事件
  PANEL_OPENED = 'panel:opened',
  PANEL_CLOSED = 'panel:closed',
  PANEL_MINIMIZED = 'panel:minimized',
  PANEL_MAXIMIZED = 'panel:maximized',
  
  // 加载状态事件
  LOADING_START = 'loading:start',
  LOADING_PROGRESS = 'loading:progress',
  LOADING_COMPLETE = 'loading:complete',
  LOADING_ERROR = 'loading:error',
  
  // 用户交互事件
  USER_ACTION = 'user:action',
  
  // 数据更新事件
  DATA_REFRESH = 'data:refresh',
  DATA_UPDATE = 'data:update',
  
  // 错误事件
  ERROR = 'error',
  WARNING = 'warning'
}

/**
 * 事件数据接口
 */
export interface GlobalEvent<T = any> {
  type: GlobalEventType | string
  payload?: T
  timestamp: number
  source?: string // 事件来源模块
  metadata?: Record<string, any>
}

/**
 * 全局事件总线类
 */
class GlobalEventBus extends EventEmitter {
  private eventHistory: GlobalEvent[] = []
  private maxHistorySize = 100
  
  /**
   * 发布事件
   */
  publish<T = any>(
    type: GlobalEventType | string,
    payload?: T,
    source?: string
  ): void {
    const event: GlobalEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source
    }
    
    // 记录历史
    this.recordHistory(event)
    
    // 触发事件
    this.emit(type, event)
    this.emit('*', event) // 通配符监听所有事件
    
    // 日志
    console.debug(`[EventBus] ${type}`, payload)
  }
  
  /**
   * 订阅事件
   */
  subscribe<T = any>(
    type: GlobalEventType | string,
    callback: (event: GlobalEvent<T>) => void
  ): () => void {
    return this.on(type, callback)
  }
  
  /**
   * 订阅一次性事件
   */
  subscribeOnce<T = any>(
    type: GlobalEventType | string,
    callback: (event: GlobalEvent<T>) => void
  ): () => void {
    return this.once(type, callback)
  }
  
  /**
   * 取消订阅
   */
  unsubscribe(type: GlobalEventType | string, callback?: any): void {
    this.off(type, callback)
  }
  
  /**
   * 记录历史
   */
  private recordHistory(event: GlobalEvent): void {
    this.eventHistory.push(event)
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }
  
  /**
   * 获取事件历史
   */
  getHistory(limit?: number): GlobalEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit)
    }
    return [...this.eventHistory]
  }
  
  /**
   * 清空历史
   */
  clearHistory(): void {
    this.eventHistory = []
  }
  
  /**
   * 等待特定事件
   */
  waitFor<T = any>(
    type: GlobalEventType | string,
    timeout = 5000
  ): Promise<GlobalEvent<T>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe()
        reject(new Error(`Timeout waiting for event: ${type}`))
      }, timeout)
      
      const unsubscribe = this.subscribeOnce<T>(type, (event) => {
        clearTimeout(timer)
        resolve(event)
      })
    })
  }
}

// 导出单例
export const eventBus = new GlobalEventBus()

// 便捷函数
export const publish = eventBus.publish.bind(eventBus)
export const subscribe = eventBus.subscribe.bind(eventBus)
export const unsubscribe = eventBus.unsubscribe.bind(eventBus)
export const waitFor = eventBus.waitFor.bind(eventBus)
