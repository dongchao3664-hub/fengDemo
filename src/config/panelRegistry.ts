/**
 * 应用初始化 - 面板注册示例
 * 在应用启动时统一注册所有面板配置
 */

import { createPanelRegistry } from '@/core/panel/usePanelManager'
import { PanelMode, PanelPosition, PanelSize } from '@/core/panel/types'

// 延迟加载面板组件
const WindmillDetailPanel = () => import('@/views/screen/marsmap/panels/WindmillDetailPanel.vue')
const BabylonModelViewer = () => import('@/views/screen/babylonjs/ModelViewer.vue')
const MeasurementPanel = () => import('@/components/babylon/MeasurementPanel.vue')
const CableInfoPanel = () => import('@/views/screen/marsmap/panels/CableInfoPanel.vue')
const SettingsPanel = () => import('@/components/panels/SettingsPanel.vue')
const LayerControlPanel = () => import('@/views/screen/marsmap/panels/LayerControlPanel.vue')

/**
 * 注册所有面板配置
 */
export function registerAllPanels() {
  const registry = createPanelRegistry()

  // ========== Mars3D 相关面板 ==========
  
  // 风机详情面板
  registry.add('windmill-detail', {
    name: '风机详情',
    component: WindmillDetailPanel,
    mode: PanelMode.FLOATING,
    position: PanelPosition.RIGHT_CENTER,
    size: PanelSize.LARGE,
    draggable: true,
    resizable: true,
    closable: true,
    title: '风机详细信息',
    icon: 'icon-windmill',
    group: 'mars3d',
    keepAlive: true,
    destroyOnClose: false,
    onOpen: () => {
      console.log('[Panel] 风机详情面板打开')
    },
    onClose: () => {
      console.log('[Panel] 风机详情面板关闭')
    }
  })

  // 电缆信息面板
  registry.add('cable-info', {
    name: '电缆信息',
    component: CableInfoPanel,
    mode: PanelMode.FLOATING,
    position: PanelPosition.LEFT_CENTER,
    size: PanelSize.MEDIUM,
    draggable: true,
    resizable: true,
    title: '电缆线路信息',
    icon: 'icon-cable',
    group: 'mars3d',
    destroyOnClose: true
  })

  // 图层控制面板
  registry.add('layer-control', {
    name: '图层控制',
    component: LayerControlPanel,
    mode: PanelMode.DRAWER,
    position: PanelPosition.LEFT_TOP,
    size: PanelSize.MEDIUM,
    draggable: false,
    resizable: false,
    title: '图层管理',
    icon: 'icon-layers',
    group: 'mars3d',
    keepAlive: true
  })

  // ========== Babylon.js 相关面板 ==========
  
  // Babylon 模型查看器（浮动窗口模式）
  registry.add('babylon-viewer-floating', {
    name: 'Babylon 模型查看器',
    component: BabylonModelViewer,
    mode: PanelMode.FLOATING,
    position: PanelPosition.CENTER,
    size: PanelSize.XLARGE,
    draggable: true,
    resizable: true,
    maximizable: true,
    title: '3D 模型查看器',
    icon: 'icon-3d',
    group: 'babylon',
    keepAlive: false,
    destroyOnClose: true,
    // 互斥：打开时关闭其他 Babylon 相关面板
    exclusive: ['babylon-viewer-tab'],
    onOpen: () => {
      console.log('[Panel] Babylon 查看器打开（浮动窗口）')
    }
  })

  // Babylon 模型查看器（新标签页模式）
  registry.add('babylon-viewer-tab', {
    name: 'Babylon 模型查看器（新标签页）',
    component: BabylonModelViewer,
    mode: PanelMode.NEW_TAB,
    group: 'babylon',
    onOpen: () => {
      // 新标签页打开逻辑在组件内部处理
      console.log('[Panel] Babylon 查看器打开（新标签页）')
    }
  })

  // 测量工具面板
  registry.add('measurement-panel', {
    name: '测量工具',
    component: MeasurementPanel,
    mode: PanelMode.DRAWER,
    position: PanelPosition.LEFT_CENTER,
    size: PanelSize.MEDIUM,
    draggable: false,
    resizable: false,
    title: '测量工具',
    icon: 'icon-measure',
    group: 'babylon',
    keepAlive: true,
    onOpen: () => {
      console.log('[Panel] 测量工具面板打开')
    }
  })

  // ========== 系统面板 ==========
  
  // 设置面板
  registry.add('settings', {
    name: '系统设置',
    component: SettingsPanel,
    mode: PanelMode.MODAL,
    position: PanelPosition.CENTER,
    size: PanelSize.LARGE,
    draggable: false,
    resizable: false,
    title: '系统设置',
    icon: 'icon-settings',
    group: 'system',
    maskClosable: true,
    escToClose: true
  })

  // 一次性注册所有面板
  registry.registerAll()
  
  console.log(`[App] 已注册 ${registry.getAll().length} 个面板`)
  
  return registry
}
