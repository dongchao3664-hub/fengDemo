/**
 * 事件总线工具
 * 用于组件间通信，实现 GIS 点击事件与面板、弹窗等联动
 * 简单实现，不依赖外部库
 */

// 定义事件类型
export type BusEvents = {
  // 打开业务弹窗
  openPoupBill: {
    type: 'windmill' | 'cable' | string
    data: any
  }
  // 飞行定位
  flytoChang: {
    graphic?: any
    position?: [number, number, number]
    options?: {
      radius?: number
      pitch?: number
      heading?: number
    }
  }
  // 选中风机
  selectWindmill: {
    id: string
    data: any
  }
  // 选中海缆
  selectCable: {
    id: string
    data: any
  }
  // 清除选中
  clearSelection: void
  // 高亮变化
  highlightChange: {
    type: 'windmill' | 'cable'
    ids: string[]
  }
  // 聚焦图标
  createfocusIcon: {
    points: [number, number, number]
    data: any
  }
}

type EventKey = keyof BusEvents
type EventHandler<T> = (payload: T) => void

// 事件处理器存储
const handlers: Map<EventKey, Set<EventHandler<any>>> = new Map()

/**
 * 事件总线
 */
export const bus = {
  /**
   * 触发事件
   */
  emit<K extends EventKey>(event: K, payload?: BusEvents[K]): void {
    const eventHandlers = handlers.get(event)
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`[bus] Error in handler for "${event}":`, error)
        }
      })
    }
  },

  /**
   * 监听事件
   */
  on<K extends EventKey>(event: K, handler: EventHandler<BusEvents[K]>): void {
    if (!handlers.has(event)) {
      handlers.set(event, new Set())
    }
    handlers.get(event)!.add(handler)
  },

  /**
   * 移除监听
   */
  off<K extends EventKey>(event: K, handler?: EventHandler<BusEvents[K]>): void {
    if (!handler) {
      // 移除该事件的所有监听
      handlers.delete(event)
    } else {
      const eventHandlers = handlers.get(event)
      if (eventHandlers) {
        eventHandlers.delete(handler)
      }
    }
  },

  /**
   * 清除所有监听
   */
  clear(): void {
    handlers.clear()
  },
}

export default bus
