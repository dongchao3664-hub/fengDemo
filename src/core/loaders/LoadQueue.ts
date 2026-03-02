/**
 * 模型加载队列管理器
 * 用于控制大量 GLTF 模型的并发加载，避免浏览器卡顿
 */

import { EventEmitter } from '@/utils/eventEmitter'

/**
 * 加载任务接口
 */
export interface LoadTask<T = any> {
  id: string
  priority: number              // 优先级（越大越优先）
  loader: () => Promise<T>      // 加载函数
  onProgress?: (progress: number) => void
  onComplete?: (result: T) => void
  onError?: (error: Error) => void
  retryCount?: number           // 重试次数
  timeout?: number              // 超时时间（毫秒）
  metadata?: Record<string, any>
}

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 任务实例
 */
interface TaskInstance<T = any> extends LoadTask<T> {
  status: TaskStatus
  error?: Error
  result?: T
  startTime?: number
  endTime?: number
  attempts: number
}

/**
 * 加载队列选项
 */
export interface LoadQueueOptions {
  concurrency?: number          // 并发数，默认 6
  maxRetries?: number           // 最大重试次数，默认 3
  retryDelay?: number           // 重试延迟（毫秒），默认 1000
  timeout?: number              // 默认超时时间（毫秒），默认 30000
  enablePriority?: boolean      // 是否启用优先级，默认 true
  autoStart?: boolean           // 是否自动开始，默认 true
  enableStats?: boolean         // 是否启用统计，默认 true
}

/**
 * 加载统计
 */
export interface LoadStats {
  total: number
  pending: number
  loading: number
  completed: number
  failed: number
  cancelled: number
  averageLoadTime: number
  successRate: number
}

/**
 * 模型加载队列管理器
 */
export class LoadQueue extends EventEmitter {
  private tasks: Map<string, TaskInstance> = new Map()
  private loadingTasks: Set<string> = new Set()
  private options: Required<LoadQueueOptions>
  private isRunning = false
  private isPaused = false

  constructor(options: LoadQueueOptions = {}) {
    super()
    
    this.options = {
      concurrency: options.concurrency ?? 6,
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      timeout: options.timeout ?? 30000,
      enablePriority: options.enablePriority ?? true,
      autoStart: options.autoStart ?? true,
      enableStats: options.enableStats ?? true
    }
  }

  /**
   * 添加加载任务
   */
  add<T = any>(task: LoadTask<T>): string {
    const taskInstance: TaskInstance<T> = {
      ...task,
      status: TaskStatus.PENDING,
      attempts: 0,
      retryCount: task.retryCount ?? this.options.maxRetries,
      timeout: task.timeout ?? this.options.timeout
    }
    
    this.tasks.set(task.id, taskInstance)
    
    this.emit('task:added', { taskId: task.id })
    
    // 自动开始
    if (this.options.autoStart && !this.isRunning) {
      this.start()
    }
    
    return task.id
  }

  /**
   * 批量添加任务
   */
  addBatch<T = any>(tasks: LoadTask<T>[]): string[] {
    return tasks.map(task => this.add(task))
  }

  /**
   * 开始处理队列
   */
  start(): void {
    if (this.isRunning) {
      return
    }
    
    this.isRunning = true
    this.isPaused = false
    this.emit('queue:started')
    
    this.processQueue()
  }

  /**
   * 暂停队列
   */
  pause(): void {
    this.isPaused = true
    this.emit('queue:paused')
  }

  /**
   * 恢复队列
   */
  resume(): void {
    if (!this.isRunning) {
      this.start()
      return
    }
    
    this.isPaused = false
    this.emit('queue:resumed')
    this.processQueue()
  }

  /**
   * 停止队列
   */
  stop(): void {
    this.isRunning = false
    this.isPaused = false
    
    // 取消所有正在加载的任务
    this.loadingTasks.forEach(taskId => {
      const task = this.tasks.get(taskId)
      if (task) {
        task.status = TaskStatus.CANCELLED
      }
    })
    
    this.loadingTasks.clear()
    this.emit('queue:stopped')
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.stop()
    this.tasks.clear()
    this.emit('queue:cleared')
  }

  /**
   * 取消特定任务
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    
    if (!task) {
      return false
    }
    
    if (task.status === TaskStatus.LOADING) {
      // 正在加载的任务，标记为取消
      task.status = TaskStatus.CANCELLED
      this.loadingTasks.delete(taskId)
    } else if (task.status === TaskStatus.PENDING) {
      // 待加载的任务，直接取消
      task.status = TaskStatus.CANCELLED
    }
    
    this.emit('task:cancelled', { taskId })
    
    return true
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | undefined {
    return this.tasks.get(taskId)?.status
  }

  /**
   * 获取任务结果
   */
  getTaskResult<T = any>(taskId: string): T | undefined {
    return this.tasks.get(taskId)?.result as T | undefined
  }

  /**
   * 获取统计信息
   */
  getStats(): LoadStats {
    const tasks = Array.from(this.tasks.values())
    
    const stats = {
      total: tasks.length,
      pending: 0,
      loading: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      averageLoadTime: 0,
      successRate: 0
    }
    
    let totalLoadTime = 0
    let completedCount = 0
    
    tasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.PENDING:
          stats.pending++
          break
        case TaskStatus.LOADING:
          stats.loading++
          break
        case TaskStatus.COMPLETED:
          stats.completed++
          completedCount++
          if (task.startTime && task.endTime) {
            totalLoadTime += task.endTime - task.startTime
          }
          break
        case TaskStatus.FAILED:
          stats.failed++
          break
        case TaskStatus.CANCELLED:
          stats.cancelled++
          break
      }
    })
    
    if (completedCount > 0) {
      stats.averageLoadTime = totalLoadTime / completedCount
    }
    
    if (stats.total > 0) {
      stats.successRate = (stats.completed / stats.total) * 100
    }
    
    return stats
  }

  /**
   * 处理队列（核心调度逻辑）
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      // 检查并发数
      if (this.loadingTasks.size >= this.options.concurrency) {
        await this.wait(100)
        continue
      }
      
      // 获取下一个待加载任务
      const nextTask = this.getNextTask()
      
      if (!nextTask) {
        // 没有待加载任务
        if (this.loadingTasks.size === 0) {
          // 所有任务都已完成
          this.isRunning = false
          this.emit('queue:completed', this.getStats())
        }
        await this.wait(100)
        continue
      }
      
      // 开始加载任务
      this.loadTask(nextTask)
    }
  }

  /**
   * 获取下一个待加载任务（考虑优先级）
   */
  private getNextTask(): TaskInstance | null {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PENDING)
    
    if (pendingTasks.length === 0) {
      return null
    }
    
    if (this.options.enablePriority) {
      // 按优先级排序
      pendingTasks.sort((a, b) => b.priority - a.priority)
    }
    
    return pendingTasks[0]
  }

  /**
   * 加载任务
   */
  private async loadTask(task: TaskInstance): Promise<void> {
    task.status = TaskStatus.LOADING
    task.startTime = Date.now()
    task.attempts++
    
    this.loadingTasks.add(task.id)
    this.emit('task:started', { taskId: task.id })
    
    try {
      // 设置超时
      const result = await this.withTimeout(
        task.loader(),
        task.timeout!
      )
      
      task.status = TaskStatus.COMPLETED
      task.result = result
      task.endTime = Date.now()
      
      this.loadingTasks.delete(task.id)
      
      if (task.onComplete) {
        task.onComplete(result)
      }
      
      this.emit('task:completed', {
        taskId: task.id,
        result,
        loadTime: task.endTime - task.startTime!
      })
      
    } catch (error) {
      task.error = error as Error
      
      // 重试逻辑
      if (task.attempts < (task.retryCount ?? 0) + 1) {
        console.warn(`[LoadQueue] Task ${task.id} failed, retrying (${task.attempts}/${task.retryCount})`)
        
        task.status = TaskStatus.PENDING
        this.loadingTasks.delete(task.id)
        
        // 延迟重试
        await this.wait(this.options.retryDelay)
        
      } else {
        // 失败
        task.status = TaskStatus.FAILED
        task.endTime = Date.now()
        
        this.loadingTasks.delete(task.id)
        
        if (task.onError) {
          task.onError(error as Error)
        }
        
        this.emit('task:failed', {
          taskId: task.id,
          error: error as Error
        })
      }
    }
  }

  /**
   * 超时包装器
   */
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      })
    ])
  }

  /**
   * 等待
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 销毁队列
   */
  destroy(): void {
    this.stop()
    this.clear()
    this.removeAllListeners()
  }
}
