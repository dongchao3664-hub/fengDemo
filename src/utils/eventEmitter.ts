/**
 * 事件发射器基类
 * 用于实现发布-订阅模式
 */

type EventCallback = (...args: any[]) => void

export class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map()

  /**
   * 监听事件
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    
    this.events.get(event)!.add(callback)
    
    // 返回取消监听函数
    return () => this.off(event, callback)
  }

  /**
   * 监听一次性事件
   */
  once(event: string, callback: EventCallback): () => void {
    const wrappedCallback = (...args: any[]) => {
      callback(...args)
      this.off(event, wrappedCallback)
    }
    
    return this.on(event, wrappedCallback)
  }

  /**
   * 取消监听
   */
  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      // 如果没有提供回调，删除该事件的所有监听器
      this.events.delete(event)
      return
    }
    
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      
      // 如果没有监听器了，删除事件
      if (callbacks.size === 0) {
        this.events.delete(event)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`[EventEmitter] Error in event "${event}":`, error)
        }
      })
    }
  }

  /**
   * 取消所有监听
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0
  }

  /**
   * 获取所有事件名
   */
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }
}
