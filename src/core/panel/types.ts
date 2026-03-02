/**
 * 面板管理系统 - 类型定义
 * 支持动态注册、状态管理、层级控制
 */

import type { Component } from 'vue'

/**
 * 面板位置枚举
 */
export enum PanelPosition {
  LEFT_TOP = 'left-top',
  LEFT_CENTER = 'left-center',
  LEFT_BOTTOM = 'left-bottom',
  RIGHT_TOP = 'right-top',
  RIGHT_CENTER = 'right-center',
  RIGHT_BOTTOM = 'right-bottom',
  CENTER = 'center',
  FULL = 'full',
  CUSTOM = 'custom'
}

/**
 * 面板尺寸模式
 */
export enum PanelSize {
  SMALL = 'small',      // 300x200
  MEDIUM = 'medium',    // 500x400
  LARGE = 'large',      // 800x600
  XLARGE = 'xlarge',    // 1200x800
  CUSTOM = 'custom'     // 自定义尺寸
}

/**
 * 面板打开模式
 */
export enum PanelMode {
  MODAL = 'modal',          // 模态框
  DRAWER = 'drawer',        // 抽屉
  FLOATING = 'floating',    // 浮动窗口（可拖拽）
  INLINE = 'inline',        // 内嵌
  NEW_TAB = 'new-tab'       // 新标签页
}

/**
 * 面板配置接口
 */
export interface PanelConfig {
  // 基础配置
  id: string                          // 面板唯一标识
  name: string                        // 面板名称
  component: Component                // Vue 组件
  
  // 显示配置
  mode?: PanelMode                    // 打开模式，默认 FLOATING
  position?: PanelPosition            // 位置，默认 CENTER
  size?: PanelSize                    // 尺寸，默认 MEDIUM
  
  // 自定义尺寸（当 size 为 CUSTOM 时）
  width?: number | string             // 宽度
  height?: number | string            // 高度
  
  // 自定义位置（当 position 为 CUSTOM 时）
  left?: number | string
  top?: number | string
  right?: number | string
  bottom?: number | string
  
  // 层级和显示
  zIndex?: number                     // z-index，默认自动分配
  visible?: boolean                   // 是否可见，默认 true
  
  // 交互配置
  draggable?: boolean                 // 是否可拖拽，默认 true
  resizable?: boolean                 // 是否可调整大小，默认 true
  closable?: boolean                  // 是否可关闭，默认 true
  minimizable?: boolean               // 是否可最小化，默认 false
  maximizable?: boolean               // 是否可最大化，默认 false
  
  // 内容配置
  title?: string                      // 标题
  icon?: string                       // 图标
  props?: Record<string, any>         // 传递给组件的 props
  
  // 生命周期钩子
  onOpen?: () => void | Promise<void>
  onClose?: () => void | Promise<void>
  onMinimize?: () => void
  onMaximize?: () => void
  onResize?: (width: number, height: number) => void
  onMove?: (x: number, y: number) => void
  
  // 依赖关系
  dependencies?: string[]             // 依赖的其他面板 ID
  exclusive?: string[]                // 互斥的面板 ID（打开时自动关闭）
  
  // 权限
  permissions?: string[]              // 需要的权限列表
  
  // 其他
  keepAlive?: boolean                 // 是否保持活跃状态
  destroyOnClose?: boolean            // 关闭时是否销毁
  escToClose?: boolean                // ESC 键关闭，默认 true
  maskClosable?: boolean              // 点击遮罩关闭，默认 true（仅 modal 模式）
  
  // 分组
  group?: string                      // 面板分组（用于批量管理）
  
  // 元数据
  metadata?: Record<string, any>      // 自定义元数据
}

/**
 * 面板状态
 */
export enum PanelState {
  NORMAL = 'normal',
  MINIMIZED = 'minimized',
  MAXIMIZED = 'maximized',
  HIDDEN = 'hidden'
}

/**
 * 面板实例接口
 */
export interface PanelInstance {
  id: string
  config: PanelConfig
  state: PanelState
  visible: boolean
  zIndex: number
  
  // 位置信息（运行时）
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // 创建时间
  createdAt: number
  
  // 最后更新时间
  updatedAt: number
  
  // 组件实例引用（可选）
  componentRef?: any
}

/**
 * 面板事件
 */
export interface PanelEvent {
  type: 'open' | 'close' | 'minimize' | 'maximize' | 'resize' | 'move' | 'focus' | 'blur'
  panelId: string
  timestamp: number
  data?: any
}

/**
 * 面板管理器选项
 */
export interface PanelManagerOptions {
  defaultZIndex?: number              // 默认起始 z-index，默认 1000
  zIndexStep?: number                 // z-index 步进，默认 10
  maxPanels?: number                  // 最大同时打开面板数，默认 20
  enableHistory?: boolean             // 是否启用历史记录，默认 true
  historyLimit?: number               // 历史记录限制，默认 50
  enableAnimation?: boolean           // 是否启用动画，默认 true
  animationDuration?: number          // 动画持续时间（毫秒），默认 300
}

/**
 * 面板过滤器
 */
export interface PanelFilter {
  ids?: string[]
  group?: string
  state?: PanelState
  visible?: boolean
  mode?: PanelMode
}
