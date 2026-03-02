# 🏗️ 架构优化方案 - 面板管理与性能优化

> **更新时间**: 2025-12-25  
> **目标**: 支持双 3D 引擎协同、面板扩展、大量模型加载优化

---

## 📋 目录

1. [架构概览](#架构概览)
2. [核心系统](#核心系统)
   - [面板管理系统](#面板管理系统)
   - [事件通信系统](#事件通信系统)
   - [状态管理系统](#状态管理系统)
   - [性能优化系统](#性能优化系统)
3. [使用指南](#使用指南)
4. [最佳实践](#最佳实践)

---

## 🎯 架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      应用层 (App Layer)                       │
│  - 页面组件 (MapContainer, BabylonCanvas)                    │
│  - 业务面板 (WindmillPanel, MeasurementPanel)                │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                   核心系统层 (Core Layer)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 面板管理系统  │  │ 事件通信系统  │  │ 状态管理系统  │      │
│  │ PanelManager │  │  EventBus   │  │  Pinia Store │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 加载队列管理  │  │  LOD 管理器  │                        │
│  │  LoadQueue  │  │  LODManager  │                        │
│  └──────────────┘  └──────────────┘                        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                   引擎层 (Engine Layer)                      │
│  ┌────────────────┐              ┌────────────────┐         │
│  │  Mars3D 引擎   │              │ Babylon.js 引擎 │         │
│  │   MapEngine    │              │  SceneEngine   │         │
│  └────────────────┘              └────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
src/
├── core/                           # 核心系统
│   ├── panel/                      # 面板管理系统
│   │   ├── types.ts               # 类型定义
│   │   ├── PanelManager.ts        # 面板管理器
│   │   └── usePanelManager.ts     # Vue Hook
│   ├── eventBus/                   # 事件总线
│   │   └── GlobalEventBus.ts      # 全局事件总线
│   └── loaders/                    # 加载器
│       ├── LoadQueue.ts           # 加载队列管理器
│       └── LODManager.ts          # LOD 管理器
│
├── stores/                         # 状态管理
│   ├── index.ts
│   └── modules/
│       ├── app.ts                 # 应用全局状态
│       ├── windmill.ts            # 风机业务状态
│       └── measurement.ts         # 测量状态
│
├── services/                       # 业务服务
│   └── windmill/
│       └── WindmillBatchLoader.ts # 批量风机加载服务
│
├── utils/                          # 工具函数
│   └── eventEmitter.ts            # 事件发射器基类
│
└── views/                          # 视图组件
    └── screen/
        ├── marsmap/               # Mars3D 视图
        └── babylonjs/             # Babylon.js 视图
```

---

## 🔧 核心系统

### 面板管理系统

#### 功能特性

- ✅ **动态注册**: 运行时注册/注销面板配置
- ✅ **多种模式**: 支持模态框、抽屉、浮动窗口、新标签页
- ✅ **灵活布局**: 9 种预设位置 + 自定义位置
- ✅ **状态管理**: 正常、最小化、最大化、隐藏
- ✅ **层级控制**: 自动 z-index 分配和聚焦
- ✅ **依赖关系**: 支持面板依赖和互斥
- ✅ **生命周期**: 完整的钩子函数支持
- ✅ **历史记录**: 操作历史追踪

#### 快速开始

**1. 注册面板配置**

```typescript
import { usePanelManager } from '@/core/panel/usePanelManager'
import { PanelMode, PanelPosition, PanelSize } from '@/core/panel/types'
import WindmillDetailPanel from '@/components/panels/WindmillDetailPanel.vue'

const { register } = usePanelManager()

// 注册风机详情面板
register({
  id: 'windmill-detail',
  name: '风机详情',
  component: WindmillDetailPanel,
  mode: PanelMode.FLOATING,
  position: PanelPosition.RIGHT_CENTER,
  size: PanelSize.MEDIUM,
  draggable: true,
  resizable: true,
  closable: true,
  onOpen: () => {
    console.log('风机详情面板打开')
  }
})
```

**2. 打开/关闭面板**

```typescript
const { open, close, toggle, isOpen } = usePanelManager()

// 打开面板，传递 props
open('windmill-detail', {
  windmillId: 'WM-001',
  data: windmillData
})

// 关闭面板
close('windmill-detail')

// 切换显示/隐藏
toggle('windmill-detail')

// 检查是否打开
if (isOpen('windmill-detail')) {
  console.log('面板已打开')
}
```

**3. 批量注册面板**

```typescript
import { createPanelRegistry } from '@/core/panel/usePanelManager'

const registry = createPanelRegistry()

// 添加多个面板
registry.addBatch([
  {
    id: 'windmill-detail',
    name: '风机详情',
    component: WindmillDetailPanel,
    mode: PanelMode.FLOATING
  },
  {
    id: 'measurement-panel',
    name: '测量工具',
    component: MeasurementPanel,
    mode: PanelMode.DRAWER,
    position: PanelPosition.LEFT_CENTER
  },
  {
    id: 'cable-info',
    name: '电缆信息',
    component: CableInfoPanel,
    mode: PanelMode.MODAL
  }
])

// 一次性注册所有面板
registry.registerAll()
```

**4. 在组件中使用特定面板**

```vue
<script setup lang="ts">
import { usePanel } from '@/core/panel/usePanelManager'
import WindmillDetailPanel from './WindmillDetailPanel.vue'

// 为特定面板创建快捷访问
const windmillPanel = usePanel('windmill-detail', {
  name: '风机详情',
  component: WindmillDetailPanel,
  mode: PanelMode.FLOATING,
  size: PanelSize.LARGE
})

const handleWindmillClick = (windmillId: string) => {
  // 打开面板并传递数据
  windmillPanel.open({ windmillId })
}
</script>

<template>
  <button @click="windmillPanel.open()">打开风机详情</button>
  <button @click="windmillPanel.close()">关闭</button>
  <button @click="windmillPanel.toggle()">切换</button>
  
  <div v-if="windmillPanel.isOpen.value">
    面板已打开
  </div>
</template>
```

#### 场景逻辑链集成

**点击风机 → 打开 Babylon.js 模型查看器**

```typescript
// 在 Mars3D 地图中监听风机点击
map.on('click', (event: any) => {
  const graphic = event.graphic
  
  if (graphic?.attr?.type === 'windmill') {
    const windmillId = graphic.attr.id
    
    // 方案1: 浮动窗口打开 Babylon.js 场景
    panelManager.open('babylon-viewer', {
      windmillId,
      modelUrl: `http://47.104.109.74:10555/linejson/feng/keng${windmillId}.glb`,
      enableMeasurement: true
    })
    
    // 方案2: 新标签页打开
    // window.open(`/babylon-viewer?windmillId=${windmillId}`, '_blank')
  }
})
```

---

### 事件通信系统

#### 功能特性

- ✅ **全局事件总线**: 跨模块通信
- ✅ **类型安全**: TypeScript 类型定义
- ✅ **事件历史**: 追踪事件流
- ✅ **Promise 支持**: 等待特定事件
- ✅ **通配符监听**: 监听所有事件

#### 快速开始

**1. 发布事件**

```typescript
import { eventBus, GlobalEventType } from '@/core/eventBus/GlobalEventBus'

// Mars3D 地图加载完成
eventBus.publish(GlobalEventType.MAP_READY, {
  mapInstance: map
}, 'MapView')

// 风机被点击
eventBus.publish(GlobalEventType.WINDMILL_CLICKED, {
  windmillId: 'WM-001',
  position: { lng: 120.5, lat: 30.2 }
}, 'WindmillLayer')

// 测量完成
eventBus.publish(GlobalEventType.MEASUREMENT_COMPLETED, {
  type: 'volume',
  result: {
    cutVolume: 1234.56,
    fillVolume: 789.12
  }
}, 'BabylonMeasurement')
```

**2. 订阅事件**

```typescript
import { eventBus, GlobalEventType } from '@/core/eventBus/GlobalEventBus'

// 订阅风机点击事件
const unsubscribe = eventBus.subscribe(
  GlobalEventType.WINDMILL_CLICKED,
  (event) => {
    console.log('风机被点击:', event.payload)
    
    // 打开详情面板
    panelManager.open('windmill-detail', {
      windmillId: event.payload.windmillId
    })
  }
)

// 取消订阅
// unsubscribe()
```

**3. 等待事件**

```typescript
// 等待地图加载完成
try {
  const event = await eventBus.waitFor(GlobalEventType.MAP_READY, 5000)
  console.log('地图已就绪:', event.payload)
  
  // 开始加载风机
  loadWindmills()
} catch (error) {
  console.error('地图加载超时')
}
```

**4. 监听所有事件（调试用）**

```typescript
eventBus.subscribe('*', (event) => {
  console.log('事件:', event.type, event.payload)
})
```

#### 跨引擎通信示例

**Mars3D → Babylon.js**

```typescript
// Mars3D 中点击风机
map.on('click', (event: any) => {
  if (event.graphic?.attr?.type === 'windmill') {
    // 发布事件
    eventBus.publish(GlobalEventType.WINDMILL_SELECTED, {
      windmillId: event.graphic.attr.id,
      modelUrl: event.graphic.attr.modelUrl
    })
  }
})

// Babylon.js 中监听
eventBus.subscribe(GlobalEventType.WINDMILL_SELECTED, (event) => {
  const { windmillId, modelUrl } = event.payload
  
  // 加载 Babylon.js 模型
  loadBabylonModel(modelUrl)
})
```

---

### 状态管理系统

#### 功能特性

- ✅ **统一状态**: 应用级别状态集中管理
- ✅ **加载状态**: 多任务加载进度追踪
- ✅ **交互模式**: 正常、测量、编辑等模式切换
- ✅ **视图模式**: 2D/3D 地图、Babylon、分屏
- ✅ **错误处理**: 统一错误收集和通知
- ✅ **性能监控**: FPS、内存、渲染统计

#### 快速开始

**1. 加载状态管理**

```typescript
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()

// 开始加载
appStore.setLoading('windmills', true, '正在加载风机模型...', 0, 'model')

// 更新进度
appStore.setLoading('windmills', true, '正在加载风机模型...', 50, 'model')

// 完成加载
appStore.setLoading('windmills', false)

// 检查是否有加载任务
if (appStore.isLoading) {
  console.log('当前加载:', appStore.currentLoadingMessage)
  console.log('进度:', appStore.loadingProgress)
}
```

**2. 交互模式管理**

```typescript
import { InteractionMode } from '@/stores/modules/app'

// 切换到测量模式
appStore.setInteractionMode(InteractionMode.MEASURING)

// 检查当前模式
if (appStore.isMeasuringMode) {
  console.log('当前处于测量模式')
}

// 恢复正常模式
appStore.setInteractionMode(InteractionMode.NORMAL)
```

**3. 实体选择管理**

```typescript
// 选中风机
appStore.selectEntity('windmill', 'WM-001', windmillData)

// 检查是否有选中
if (appStore.hasSelection) {
  console.log('选中的实体:', appStore.selectedEntity)
}

// 清除选择
appStore.clearSelection()
```

**4. 通知系统**

```typescript
// 成功通知
appStore.notify('风机加载成功', 'success')

// 警告通知
appStore.notify('部分模型加载失败', 'warning', 5000)

// 错误通知
appStore.notify('网络连接失败', 'error')

// 信息通知
appStore.notify('开始导出数据', 'info')
```

---

### 性能优化系统

#### 功能特性

- ✅ **加载队列**: 控制并发，避免浏览器卡顿
- ✅ **优先级调度**: 优先加载近处/重要的模型
- ✅ **自动重试**: 失败自动重试机制
- ✅ **超时控制**: 避免无限等待
- ✅ **LOD 管理**: 根据距离动态调整模型细节
- ✅ **统计追踪**: 实时监控加载性能

#### 快速开始

**1. 使用批量风机加载器**

```typescript
import { WindmillBatchLoader } from '@/services/windmill/WindmillBatchLoader'
import { useMapInstance } from '@/mars3dmap/composables/useMapInstance'

// 创建加载器
const batchLoader = new WindmillBatchLoader({
  concurrency: 6,          // 同时加载 6 个
  enableLOD: true,         // 启用 LOD
  lodUpdateInterval: 500,  // LOD 更新间隔
  retryCount: 3,           // 失败重试 3 次
  timeout: 30000           // 30 秒超时
})

// 设置地图实例
const { mapInstance } = useMapInstance()
batchLoader.setMap(mapInstance.value)

// 加载风机列表
const windmills = await getWindmills()
await batchLoader.loadWindmills(windmills)

// 获取统计信息
const stats = batchLoader.getStats()
console.log('加载统计:', stats)
```

**2. 直接使用加载队列**

```typescript
import { LoadQueue } from '@/core/loaders/LoadQueue'

const queue = new LoadQueue({
  concurrency: 8,
  maxRetries: 3,
  autoStart: true
})

// 添加任务
queue.add({
  id: 'model-001',
  priority: 10,
  loader: async () => {
    const response = await fetch('http://example.com/model.glb')
    return await response.arrayBuffer()
  },
  onComplete: (result) => {
    console.log('加载完成:', result)
  },
  onError: (error) => {
    console.error('加载失败:', error)
  }
})

// 监听事件
queue.on('task:completed', (event) => {
  const stats = queue.getStats()
  console.log(`进度: ${stats.completed}/${stats.total}`)
})

// 暂停/恢复
queue.pause()
queue.resume()
```

**3. LOD 管理**

```typescript
import { LODManager, LODPresets } from '@/core/loaders/LODManager'

const lodManager = new LODManager()

// 注册风机 LOD
windmills.forEach(windmill => {
  lodManager.register(
    windmill.id,
    { x: windmill.longitude, y: windmill.latitude, z: windmill.altitude },
    LODPresets.windmill
  )
})

// 开始 LOD 更新
lodManager.start(500)

// 监听相机变化
map.on('cameraChanged', () => {
  const camera = map.camera
  lodManager.updateCameraPosition(
    camera.position.longitude,
    camera.position.latitude,
    camera.position.height
  )
})

// 获取统计
const lodStats = lodManager.getStats()
console.log('LOD 统计:', lodStats)
```

---

## 📖 使用指南

### 场景1: 点击风机 → 打开详情面板

```typescript
// 1. 注册面板
const registry = createPanelRegistry()
registry.add('windmill-detail', {
  name: '风机详情',
  component: WindmillDetailPanel,
  mode: PanelMode.FLOATING,
  position: PanelPosition.RIGHT_CENTER,
  size: PanelSize.LARGE
})
registry.registerAll()

// 2. 监听风机点击（Mars3D）
map.on('click', (event: any) => {
  if (event.graphic?.attr?.type === 'windmill') {
    const windmillId = event.graphic.attr.id
    
    // 发布事件
    eventBus.publish(GlobalEventType.WINDMILL_CLICKED, {
      windmillId,
      data: event.graphic.attr
    })
  }
})

// 3. 订阅事件并打开面板
eventBus.subscribe(GlobalEventType.WINDMILL_CLICKED, (event) => {
  const { windmillId, data } = event.payload
  
  panelManager.open('windmill-detail', {
    windmillId,
    data
  })
})
```

### 场景2: 点击风机 → 新标签页打开 Babylon.js 3D 模型

```typescript
// 1. 注册 Babylon 面板（新标签页模式）
registry.add('babylon-viewer', {
  name: 'Babylon.js 模型查看器',
  component: BabylonModelViewer,
  mode: PanelMode.NEW_TAB,
  onOpen: () => {
    // 新标签页打开
    const windmillId = 'WM-001'
    window.open(`/babylon-viewer?windmillId=${windmillId}`, '_blank')
  }
})

// 2. 监听点击
map.on('click', (event: any) => {
  if (event.graphic?.attr?.type === 'windmill') {
    panelManager.open('babylon-viewer', {
      windmillId: event.graphic.attr.id
    })
  }
})
```

### 场景3: 批量加载数百个风机模型

```typescript
// 在 MapView 组件中
const setupWindmills = async () => {
  const appStore = useAppStore()
  
  // 设置加载状态
  appStore.setLoading('windmills', true, '正在加载风机...', 0, 'model')
  
  // 创建批量加载器
  const batchLoader = new WindmillBatchLoader({
    concurrency: 6,
    enableLOD: true
  })
  
  batchLoader.setMap(mapInstance.value)
  
  // 监听进度
  batchLoader.loadQueue.on('task:completed', () => {
    const stats = batchLoader.getStats()
    const progress = (stats.queue.completed / stats.queue.total) * 100
    
    appStore.setLoading(
      'windmills',
      true,
      `正在加载风机... ${stats.queue.completed}/${stats.queue.total}`,
      progress,
      'model'
    )
  })
  
  // 开始加载
  try {
    const windmills = await getWindmills()
    await batchLoader.loadWindmills(windmills)
    
    appStore.setLoading('windmills', false)
    appStore.notify('风机加载完成', 'success')
    
  } catch (error) {
    appStore.setLoading('windmills', false)
    appStore.notify('风机加载失败', 'error')
  }
}
```

### 场景4: Babylon.js 中进行方量测算

```typescript
// 在 Babylon 场景中
const measurementPanel = usePanel('measurement-panel', {
  name: '测量工具',
  component: MeasurementPanel,
  mode: PanelMode.DRAWER,
  position: PanelPosition.LEFT_CENTER
})

// 开始测量
const startMeasurement = (type: 'volume' | 'area') => {
  appStore.setInteractionMode(InteractionMode.MEASURING)
  measurementPanel.open({ type })
  
  eventBus.publish(GlobalEventType.MEASUREMENT_STARTED, { type })
}

// 测量完成
const onMeasurementComplete = (result: any) => {
  appStore.setInteractionMode(InteractionMode.NORMAL)
  
  eventBus.publish(GlobalEventType.MEASUREMENT_COMPLETED, {
    type: result.type,
    result
  })
  
  appStore.notify(`测量完成: ${result.value}`, 'success')
}
```

---

## ✅ 最佳实践

### 1. 面板管理

- ✅ **统一注册**: 在应用初始化时统一注册所有面板配置
- ✅ **按需加载**: 使用动态 `import()` 延迟加载面板组件
- ✅ **权限控制**: 利用 `permissions` 字段控制面板访问权限
- ✅ **合理分组**: 使用 `group` 字段对相关面板分组管理

### 2. 事件通信

- ✅ **使用枚举**: 使用 `GlobalEventType` 枚举，避免字符串拼写错误
- ✅ **携带来源**: `publish` 时传递 `source` 参数，便于追踪
- ✅ **及时取消**: 组件销毁时取消事件订阅，避免内存泄漏
- ✅ **错误处理**: 事件处理函数内部捕获异常

### 3. 状态管理

- ✅ **单一数据源**: 关键状态统一存储在 Pinia Store
- ✅ **细粒度控制**: 按模块划分 Store（app、windmill、measurement）
- ✅ **响应式优化**: 使用 `computed` 计算衍生状态

### 4. 性能优化

- ✅ **控制并发**: 根据设备性能调整 `concurrency` 参数
- ✅ **优先级调度**: 优先加载视野内/用户关注的模型
- ✅ **启用 LOD**: 对于大场景必须启用 LOD
- ✅ **资源释放**: 不用的模型及时销毁，释放内存

### 5. 错误处理

- ✅ **统一错误捕获**: 使用 `appStore.addError()` 统一记录错误
- ✅ **用户友好提示**: 使用 `appStore.notify()` 显示用户可理解的错误信息
- ✅ **日志记录**: 开发环境详细日志，生产环境简化日志

---

## 🚀 扩展指南

### 添加新面板

1. 创建面板组件（如 `NewPanel.vue`）
2. 在应用初始化时注册配置
3. 在合适的时机调用 `panelManager.open('new-panel')`

### 添加新事件类型

1. 在 `GlobalEventType` 枚举中添加新类型
2. 在相应模块中 `publish` 事件
3. 在监听模块中 `subscribe` 事件

### 添加新业务状态

1. 在 `stores/modules/` 下创建新 Store
2. 定义 state、getters、actions
3. 在组件中通过 `useXxxStore()` 访问

---

## 📝 总结

本次架构优化主要解决了：

1. ✅ **面板扩展性**: 动态面板管理系统，支持无限扩展
2. ✅ **跨模块通信**: 全局事件总线，解耦 Mars3D 和 Babylon.js
3. ✅ **状态一致性**: 统一状态管理，避免状态碎片化
4. ✅ **性能瓶颈**: 加载队列 + LOD，解决大量模型加载卡顿

所有新增系统都是**可选的、渐进式的**，不影响现有代码运行，可以逐步迁移和采用。
