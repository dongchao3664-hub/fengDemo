/**
 * Vue Composition API - 面板管理 Hook
 * 在 Vue 组件中使用面板管理器
 */

import { ref, computed, onMounted, onUnmounted, type Component } from 'vue'
import { PanelManager } from './PanelManager'
import type { PanelConfig, PanelInstance, PanelMode, PanelEvent } from './types'

// 全局单例面板管理器
let globalPanelManager: PanelManager | null = null

/**
 * 获取全局面板管理器
 */
export function getPanelManager(): PanelManager {
  if (!globalPanelManager) {
    globalPanelManager = new PanelManager({
      defaultZIndex: 1000,
      maxPanels: 20,
      enableHistory: true,
      enableAnimation: true
    })
  }
  return globalPanelManager
}

/**
 * 使用面板管理器
 */
export function usePanelManager() {
  const manager = getPanelManager()
  
  const openPanels = ref<PanelInstance[]>([])
  
  // 更新打开的面板列表
  const updateOpenPanels = () => {
    openPanels.value = manager.getAllPanels().filter(p => p.visible)
  }
  
  // 监听面板事件
  const handlePanelEvent = (event: PanelEvent) => {
    updateOpenPanels()
  }
  
  onMounted(() => {
    manager.on('*', handlePanelEvent)
    updateOpenPanels()
  })
  
  onUnmounted(() => {
    manager.off('*', handlePanelEvent)
  })
  
  return {
    manager,
    openPanels: computed(() => openPanels.value),
    
    // 便捷方法
    register: (config: PanelConfig) => manager.register(config),
    registerBatch: (configs: PanelConfig[]) => manager.registerBatch(configs),
    open: (panelId: string, props?: Record<string, any>) => manager.open(panelId, props),
    close: (panelId: string) => manager.close(panelId),
    toggle: (panelId: string, props?: Record<string, any>) => manager.toggle(panelId, props),
    closeAll: () => manager.closeAll(),
    isOpen: (panelId: string) => manager.isOpen(panelId),
    getPanel: (panelId: string) => manager.getPanel(panelId)
  }
}

/**
 * 快捷打开面板的 Hook
 * 用于特定面板的快速访问
 */
export function usePanel(panelId: string, config?: Partial<PanelConfig>) {
  const manager = getPanelManager()
  const isOpen = ref(false)
  const instance = ref<PanelInstance | null>(null)
  
  // 如果提供了配置，注册面板
  if (config && config.component) {
    manager.register({
      id: panelId,
      name: config.name || panelId,
      component: config.component,
      ...config
    } as PanelConfig)
  }
  
  const updateState = () => {
    isOpen.value = manager.isOpen(panelId)
    instance.value = manager.getPanel(panelId) || null
  }
  
  const handleEvent = (event: PanelEvent) => {
    if (event.panelId === panelId) {
      updateState()
    }
  }
  
  onMounted(() => {
    manager.on('*', handleEvent)
    updateState()
  })
  
  onUnmounted(() => {
    manager.off('*', handleEvent)
  })
  
  return {
    isOpen: computed(() => isOpen.value),
    instance: computed(() => instance.value),
    open: (props?: Record<string, any>) => manager.open(panelId, props),
    close: () => manager.close(panelId),
    toggle: (props?: Record<string, any>) => manager.toggle(panelId, props),
    minimize: () => manager.minimize(panelId),
    maximize: () => manager.maximize(panelId),
    focus: () => manager.focus(panelId)
  }
}

/**
 * 面板注册助手
 * 用于批量注册业务面板
 */
export function createPanelRegistry() {
  const manager = getPanelManager()
  const registry = new Map<string, PanelConfig>()
  
  return {
    /**
     * 添加面板配置到注册表
     */
    add(id: string, config: Omit<PanelConfig, 'id'>): void {
      registry.set(id, { id, ...config })
    },
    
    /**
     * 批量添加
     */
    addBatch(configs: Array<{ id: string } & Omit<PanelConfig, 'id'>>): void {
      configs.forEach(config => this.add(config.id, config))
    },
    
    /**
     * 注册所有面板
     */
    registerAll(): void {
      const configs = Array.from(registry.values())
      manager.registerBatch(configs)
      console.log(`[PanelRegistry] Registered ${configs.length} panels`)
    },
    
    /**
     * 获取配置
     */
    get(id: string): PanelConfig | undefined {
      return registry.get(id)
    },
    
    /**
     * 获取所有配置
     */
    getAll(): PanelConfig[] {
      return Array.from(registry.values())
    }
  }
}
