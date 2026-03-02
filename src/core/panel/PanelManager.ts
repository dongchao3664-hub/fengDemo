/**
 * 面板管理器核心类
 * 功能：面板注册、打开、关闭、状态管理、层级控制
 */

import { reactive, computed, type ComputedRef } from 'vue'
import type {
  PanelConfig,
  PanelInstance,
  PanelState,
  PanelEvent,
  PanelManagerOptions,
  PanelFilter,
  PanelMode,
  PanelPosition,
  PanelSize
} from './types'
import { EventEmitter } from '@/utils/eventEmitter'

export class PanelManager extends EventEmitter {
  private panels: Map<string, PanelInstance> = new Map()
  private panelConfigs: Map<string, PanelConfig> = new Map()
  private currentZIndex: number
  private options: Required<PanelManagerOptions>
  private history: PanelEvent[] = []

  constructor(options: PanelManagerOptions = {}) {
    super()
    
    this.options = {
      defaultZIndex: options.defaultZIndex ?? 1000,
      zIndexStep: options.zIndexStep ?? 10,
      maxPanels: options.maxPanels ?? 20,
      enableHistory: options.enableHistory ?? true,
      historyLimit: options.historyLimit ?? 50,
      enableAnimation: options.enableAnimation ?? true,
      animationDuration: options.animationDuration ?? 300
    }
    
    this.currentZIndex = this.options.defaultZIndex
  }

  /**
   * 注册面板配置
   */
  register(config: PanelConfig): void {
    if (this.panelConfigs.has(config.id)) {
      console.warn(`[PanelManager] Panel "${config.id}" already registered, will be overwritten`)
    }
    
    // 设置默认值
    const fullConfig: PanelConfig = {
      mode: PanelMode.FLOATING,
      position: PanelPosition.CENTER,
      size: PanelSize.MEDIUM,
      draggable: true,
      resizable: true,
      closable: true,
      visible: true,
      keepAlive: false,
      destroyOnClose: false,
      escToClose: true,
      maskClosable: true,
      ...config
    }
    
    this.panelConfigs.set(config.id, fullConfig)
    console.log(`[PanelManager] Registered panel: ${config.id}`)
  }

  /**
   * 批量注册面板
   */
  registerBatch(configs: PanelConfig[]): void {
    configs.forEach(config => this.register(config))
  }

  /**
   * 取消注册
   */
  unregister(panelId: string): void {
    // 如果面板正在显示，先关闭
    if (this.panels.has(panelId)) {
      this.close(panelId)
    }
    
    this.panelConfigs.delete(panelId)
    console.log(`[PanelManager] Unregistered panel: ${panelId}`)
  }

  /**
   * 打开面板
   */
  async open(panelId: string, props?: Record<string, any>): Promise<PanelInstance | null> {
    const config = this.panelConfigs.get(panelId)
    
    if (!config) {
      console.error(`[PanelManager] Panel "${panelId}" not registered`)
      return null
    }
    
    // 检查权限
    if (config.permissions && config.permissions.length > 0) {
      // TODO: 实现权限检查
      // if (!this.checkPermissions(config.permissions)) {
      //   console.error(`[PanelManager] No permission to open panel: ${panelId}`)
      //   return null
      // }
    }
    
    // 检查最大面板数
    if (this.panels.size >= this.options.maxPanels) {
      console.warn(`[PanelManager] Max panels limit reached (${this.options.maxPanels})`)
      // 可以选择关闭最早打开的面板
      const oldestPanel = Array.from(this.panels.values())
        .sort((a, b) => a.createdAt - b.createdAt)[0]
      if (oldestPanel) {
        await this.close(oldestPanel.id)
      }
    }
    
    // 处理互斥面板
    if (config.exclusive && config.exclusive.length > 0) {
      for (const exclusiveId of config.exclusive) {
        if (this.panels.has(exclusiveId)) {
          await this.close(exclusiveId)
        }
      }
    }
    
    // 如果面板已经打开，直接聚焦
    if (this.panels.has(panelId)) {
      this.focus(panelId)
      return this.panels.get(panelId)!
    }
    
    // 分配 z-index
    const zIndex = config.zIndex ?? this.allocateZIndex()
    
    // 计算位置和尺寸
    const position = this.calculatePosition(config)
    
    // 创建面板实例
    const instance: PanelInstance = reactive({
      id: panelId,
      config: {
        ...config,
        props: { ...config.props, ...props } // 合并 props
      },
      state: PanelState.NORMAL,
      visible: config.visible !== false,
      zIndex,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    
    this.panels.set(panelId, instance)
    
    // 触发 onOpen 钩子
    if (config.onOpen) {
      await config.onOpen()
    }
    
    // 触发事件
    this.emitEvent({
      type: 'open',
      panelId,
      timestamp: Date.now()
    })
    
    console.log(`[PanelManager] Opened panel: ${panelId}`)
    
    return instance
  }

  /**
   * 关闭面板
   */
  async close(panelId: string): Promise<void> {
    const instance = this.panels.get(panelId)
    
    if (!instance) {
      return
    }
    
    // 触发 onClose 钩子
    if (instance.config.onClose) {
      await instance.config.onClose()
    }
    
    // 如果设置了 destroyOnClose，删除实例
    if (instance.config.destroyOnClose) {
      this.panels.delete(panelId)
    } else {
      // 否则只隐藏
      instance.visible = false
      instance.updatedAt = Date.now()
    }
    
    // 触发事件
    this.emitEvent({
      type: 'close',
      panelId,
      timestamp: Date.now()
    })
    
    console.log(`[PanelManager] Closed panel: ${panelId}`)
  }

  /**
   * 关闭所有面板
   */
  async closeAll(filter?: PanelFilter): Promise<void> {
    const panelsToClose = filter 
      ? this.filter(filter)
      : Array.from(this.panels.keys())
    
    for (const panelId of panelsToClose) {
      await this.close(panelId)
    }
  }

  /**
   * 切换面板显示/隐藏
   */
  toggle(panelId: string, props?: Record<string, any>): void {
    if (this.isOpen(panelId)) {
      this.close(panelId)
    } else {
      this.open(panelId, props)
    }
  }

  /**
   * 最小化面板
   */
  minimize(panelId: string): void {
    const instance = this.panels.get(panelId)
    
    if (!instance || instance.state === PanelState.MINIMIZED) {
      return
    }
    
    instance.state = PanelState.MINIMIZED
    instance.updatedAt = Date.now()
    
    if (instance.config.onMinimize) {
      instance.config.onMinimize()
    }
    
    this.emitEvent({
      type: 'minimize',
      panelId,
      timestamp: Date.now()
    })
  }

  /**
   * 最大化面板
   */
  maximize(panelId: string): void {
    const instance = this.panels.get(panelId)
    
    if (!instance || instance.state === PanelState.MAXIMIZED) {
      return
    }
    
    instance.state = PanelState.MAXIMIZED
    instance.updatedAt = Date.now()
    
    if (instance.config.onMaximize) {
      instance.config.onMaximize()
    }
    
    this.emitEvent({
      type: 'maximize',
      panelId,
      timestamp: Date.now()
    })
  }

  /**
   * 恢复面板正常状态
   */
  restore(panelId: string): void {
    const instance = this.panels.get(panelId)
    
    if (!instance || instance.state === PanelState.NORMAL) {
      return
    }
    
    instance.state = PanelState.NORMAL
    instance.updatedAt = Date.now()
  }

  /**
   * 聚焦面板（置于最前）
   */
  focus(panelId: string): void {
    const instance = this.panels.get(panelId)
    
    if (!instance) {
      return
    }
    
    // 重新分配最高的 z-index
    instance.zIndex = this.allocateZIndex()
    instance.updatedAt = Date.now()
    
    this.emitEvent({
      type: 'focus',
      panelId,
      timestamp: Date.now()
    })
  }

  /**
   * 判断面板是否打开
   */
  isOpen(panelId: string): boolean {
    const instance = this.panels.get(panelId)
    return instance?.visible ?? false
  }

  /**
   * 获取面板实例
   */
  getPanel(panelId: string): PanelInstance | undefined {
    return this.panels.get(panelId)
  }

  /**
   * 获取所有面板实例
   */
  getAllPanels(): PanelInstance[] {
    return Array.from(this.panels.values())
  }

  /**
   * 过滤面板
   */
  filter(filter: PanelFilter): string[] {
    return Array.from(this.panels.values())
      .filter(instance => {
        if (filter.ids && !filter.ids.includes(instance.id)) return false
        if (filter.group && instance.config.group !== filter.group) return false
        if (filter.state && instance.state !== filter.state) return false
        if (filter.visible !== undefined && instance.visible !== filter.visible) return false
        if (filter.mode && instance.config.mode !== filter.mode) return false
        return true
      })
      .map(instance => instance.id)
  }

  /**
   * 更新面板位置
   */
  updatePosition(panelId: string, x: number, y: number): void {
    const instance = this.panels.get(panelId)
    
    if (!instance) {
      return
    }
    
    instance.position.x = x
    instance.position.y = y
    instance.updatedAt = Date.now()
    
    if (instance.config.onMove) {
      instance.config.onMove(x, y)
    }
    
    this.emitEvent({
      type: 'move',
      panelId,
      timestamp: Date.now(),
      data: { x, y }
    })
  }

  /**
   * 更新面板尺寸
   */
  updateSize(panelId: string, width: number, height: number): void {
    const instance = this.panels.get(panelId)
    
    if (!instance) {
      return
    }
    
    instance.position.width = width
    instance.position.height = height
    instance.updatedAt = Date.now()
    
    if (instance.config.onResize) {
      instance.config.onResize(width, height)
    }
    
    this.emitEvent({
      type: 'resize',
      panelId,
      timestamp: Date.now(),
      data: { width, height }
    })
  }

  /**
   * 销毁面板管理器
   */
  destroy(): void {
    this.closeAll()
    this.panels.clear()
    this.panelConfigs.clear()
    this.history = []
    this.removeAllListeners()
  }

  // ========== 私有方法 ==========

  /**
   * 分配 z-index
   */
  private allocateZIndex(): number {
    this.currentZIndex += this.options.zIndexStep
    return this.currentZIndex
  }

  /**
   * 计算面板位置和尺寸
   */
  private calculatePosition(config: PanelConfig): {
    x: number
    y: number
    width: number
    height: number
  } {
    // 尺寸映射
    const sizeMap: Record<string, { width: number; height: number }> = {
      small: { width: 300, height: 200 },
      medium: { width: 500, height: 400 },
      large: { width: 800, height: 600 },
      xlarge: { width: 1200, height: 800 }
    }
    
    let width = 500
    let height = 400
    
    if (config.size === PanelSize.CUSTOM) {
      width = typeof config.width === 'number' ? config.width : 500
      height = typeof config.height === 'number' ? config.height : 400
    } else if (config.size && sizeMap[config.size]) {
      width = sizeMap[config.size].width
      height = sizeMap[config.size].height
    }
    
    // 位置计算
    let x = 0
    let y = 0
    
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    switch (config.position) {
      case PanelPosition.CENTER:
        x = (viewportWidth - width) / 2
        y = (viewportHeight - height) / 2
        break
      case PanelPosition.LEFT_TOP:
        x = 20
        y = 20
        break
      case PanelPosition.LEFT_CENTER:
        x = 20
        y = (viewportHeight - height) / 2
        break
      case PanelPosition.LEFT_BOTTOM:
        x = 20
        y = viewportHeight - height - 20
        break
      case PanelPosition.RIGHT_TOP:
        x = viewportWidth - width - 20
        y = 20
        break
      case PanelPosition.RIGHT_CENTER:
        x = viewportWidth - width - 20
        y = (viewportHeight - height) / 2
        break
      case PanelPosition.RIGHT_BOTTOM:
        x = viewportWidth - width - 20
        y = viewportHeight - height - 20
        break
      case PanelPosition.CUSTOM:
        x = typeof config.left === 'number' ? config.left : 0
        y = typeof config.top === 'number' ? config.top : 0
        break
    }
    
    return { x, y, width, height }
  }

  /**
   * 触发事件并记录历史
   */
  private emitEvent(event: PanelEvent): void {
    // 记录历史
    if (this.options.enableHistory) {
      this.history.push(event)
      
      // 限制历史记录数量
      if (this.history.length > this.options.historyLimit) {
        this.history.shift()
      }
    }
    
    // 触发事件
    this.emit(event.type, event)
    this.emit('*', event) // 通配符事件
  }

  /**
   * 获取历史记录
   */
  getHistory(limit?: number): PanelEvent[] {
    if (limit) {
      return this.history.slice(-limit)
    }
    return [...this.history]
  }
}
