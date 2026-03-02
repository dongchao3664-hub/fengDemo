/**
 * 集成使用示例
 * 展示如何在实际场景中使用面板管理、事件总线、状态管理和性能优化系统
 */

import { usePanelManager, usePanel } from '@/core/panel'
import { eventBus, GlobalEventType } from '@/core/eventBus'
import { useAppStore } from '@/stores/modules/app'
import { useWindmillStore } from '@/stores/modules/windmill'
import { WindmillBatchLoader } from '@/services/windmill/WindmillBatchLoader'
import { InteractionMode } from '@/stores/modules/app'

/**
 * ===== 示例 1: 风机点击 → 打开详情面板 =====
 */
export function example1_WindmillClickToPanel() {
  const { open } = usePanelManager()
  
  // 订阅风机点击事件
  eventBus.subscribe(GlobalEventType.WINDMILL_CLICKED, (event) => {
    const { windmillId, data } = event.payload
    
    // 打开风机详情面板，传递数据
    open('windmill-detail', {
      windmillId,
      windmillData: data
    })
  })
  
  // 在 Mars3D 地图中触发事件
  // map.on('click', (event) => {
  //   if (event.graphic?.attr?.type === 'windmill') {
  //     eventBus.publish(GlobalEventType.WINDMILL_CLICKED, {
  //       windmillId: event.graphic.attr.id,
  //       data: event.graphic.attr
  //     }, 'Mars3D')
  //   }
  // })
}

/**
 * ===== 示例 2: 风机点击 → 新标签页打开 Babylon.js 模型 =====
 */
export function example2_WindmillClickToNewTab() {
  const { open } = usePanelManager()
  
  eventBus.subscribe(GlobalEventType.WINDMILL_CLICKED, (event) => {
    const { windmillId } = event.payload
    
    // 新标签页打开 Babylon 查看器
    const url = `/babylon-viewer?windmillId=${windmillId}`
    window.open(url, '_blank')
    
    // 或者使用面板管理器
    // open('babylon-viewer-tab', { windmillId })
  })
}

/**
 * ===== 示例 3: 风机点击 → 浮动窗口打开 Babylon.js 模型 =====
 */
export function example3_WindmillClickToFloatingBabylon() {
  const { open } = usePanelManager()
  
  eventBus.subscribe(GlobalEventType.WINDMILL_CLICKED, async (event) => {
    const { windmillId, data } = event.payload
    
    // 获取模型 URL
    const modelUrl = `http://47.104.109.74:10555/linejson/feng/keng${windmillId}.glb`
    
    // 打开浮动窗口形式的 Babylon 查看器
    await open('babylon-viewer-floating', {
      windmillId,
      modelUrl,
      enableMeasurement: true,
      windmillData: data
    })
    
    console.log(`[Example] 已打开 Babylon 查看器: ${modelUrl}`)
  })
}

/**
 * ===== 示例 4: 批量加载数百个风机模型 =====
 */
export async function example4_BatchLoadWindmills(map: any) {
  const appStore = useAppStore()
  const windmillStore = useWindmillStore()
  
  // 设置加载状态
  appStore.setLoading('windmills', true, '正在加载风机数据...', 0, 'data')
  
  try {
    // 1. 获取风机列表
    await windmillStore.fetchWindmills()
    const windmills = windmillStore.windmills
    
    console.log(`[Example] 准备加载 ${windmills.length} 个风机模型`)
    
    // 2. 创建批量加载器
    const batchLoader = new WindmillBatchLoader({
      concurrency: 6,          // 同时加载 6 个
      enableLOD: true,         // 启用 LOD
      lodUpdateInterval: 500,  // 500ms 更新一次 LOD
      retryCount: 3,
      timeout: 30000
    })
    
    batchLoader.setMap(map)
    
    // 3. 监听加载进度
    batchLoader.loadQueue.on('task:completed', () => {
      const stats = batchLoader.getStats()
      const progress = (stats.queue.completed / stats.queue.total) * 100
      
      appStore.setLoading(
        'windmills',
        true,
        `正在加载风机模型... ${stats.queue.completed}/${stats.queue.total}`,
        progress,
        'model'
      )
    })
    
    // 4. 开始加载
    await batchLoader.loadWindmills(windmills)
    
    // 5. 完成
    appStore.setLoading('windmills', false)
    appStore.notify(`成功加载 ${windmills.length} 个风机模型`, 'success')
    
    // 6. 发布事件
    eventBus.publish(GlobalEventType.WINDMILL_LIST_LOADED, {
      count: windmills.length,
      stats: batchLoader.getStats()
    }, 'WindmillLoader')
    
    return batchLoader
    
  } catch (error) {
    appStore.setLoading('windmills', false)
    appStore.addError('风机模型加载失败', 'error', error)
    appStore.notify('风机模型加载失败', 'error')
    
    throw error
  }
}

/**
 * ===== 示例 5: Babylon.js 中进行方量测算 =====
 */
export function example5_BabylonMeasurement() {
  const appStore = useAppStore()
  const measurementPanel = usePanel('measurement-panel')
  
  // 开始测量
  const startMeasurement = (type: 'volume' | 'area') => {
    // 切换到测量模式
    appStore.setInteractionMode(InteractionMode.MEASURING)
    
    // 打开测量面板
    measurementPanel.open({ measurementType: type })
    
    // 发布事件
    eventBus.publish(GlobalEventType.MEASUREMENT_STARTED, { type }, 'MeasurementTool')
    
    console.log(`[Example] 开始 ${type} 测量`)
  }
  
  // 测量完成
  const onMeasurementComplete = (result: any) => {
    // 恢复正常模式
    appStore.setInteractionMode(InteractionMode.NORMAL)
    
    // 发布事件
    eventBus.publish(GlobalEventType.MEASUREMENT_COMPLETED, {
      type: result.type,
      result: result.data
    }, 'MeasurementTool')
    
    // 显示结果通知
    const message = result.type === 'volume' 
      ? `挖方: ${result.data.cutVolume.toFixed(2)} m³, 填方: ${result.data.fillVolume.toFixed(2)} m³`
      : `面积: ${result.data.area.toFixed(2)} m²`
    
    appStore.notify(message, 'success', 5000)
    
    console.log('[Example] 测量完成:', result)
  }
  
  return {
    startMeasurement,
    onMeasurementComplete
  }
}

/**
 * ===== 示例 6: 跨引擎通信（Mars3D → Babylon.js） =====
 */
export function example6_CrossEngineComm() {
  // Mars3D 中发布事件
  const publishFromMars3D = (windmillId: string, position: any) => {
    eventBus.publish(
      GlobalEventType.WINDMILL_SELECTED,
      { windmillId, position },
      'Mars3D'
    )
  }
  
  // Babylon.js 中监听事件
  const subscribeInBabylon = () => {
    eventBus.subscribe(GlobalEventType.WINDMILL_SELECTED, (event) => {
      const { windmillId, position } = event.payload
      
      console.log('[Babylon] 接收到 Mars3D 选中事件:', windmillId)
      
      // 在 Babylon 中加载对应模型
      // loadBabylonModel(windmillId)
      
      // 飞行到对应位置
      // flyToPosition(position)
    })
  }
  
  return {
    publishFromMars3D,
    subscribeInBabylon
  }
}

/**
 * ===== 示例 7: 面板依赖和互斥 =====
 */
export function example7_PanelDependencyAndExclusive() {
  const { register, open } = usePanelManager()
  
  // 注册主面板
  register({
    id: 'main-panel',
    name: '主面板',
    component: () => import('@/components/MainPanel.vue'),
    // ...其他配置
  })
  
  // 注册依赖主面板的子面板
  register({
    id: 'sub-panel',
    name: '子面板',
    component: () => import('@/components/SubPanel.vue'),
    dependencies: ['main-panel'], // 依赖主面板
    // ...其他配置
  })
  
  // 注册与主面板互斥的面板
  register({
    id: 'exclusive-panel',
    name: '互斥面板',
    component: () => import('@/components/ExclusivePanel.vue'),
    exclusive: ['main-panel'], // 与主面板互斥
    // ...其他配置
  })
  
  // 打开子面板时，会检查主面板是否打开
  open('sub-panel')
  
  // 打开互斥面板时，会自动关闭主面板
  open('exclusive-panel')
}

/**
 * ===== 示例 8: 使用 LOD 优化性能 =====
 */
export function example8_LODOptimization() {
  const appStore = useAppStore()
  
  // 在批量加载中自动启用 LOD
  const setupLOD = async (map: any, windmills: any[]) => {
    const batchLoader = new WindmillBatchLoader({
      concurrency: 6,
      enableLOD: true,          // 启用 LOD
      lodUpdateInterval: 500    // 更新间隔
    })
    
    batchLoader.setMap(map)
    
    // 加载风机（会自动设置 LOD）
    await batchLoader.loadWindmills(windmills)
    
    // 获取 LOD 统计
    const stats = batchLoader.getStats()
    console.log('[LOD] 统计:', stats.lod)
    
    // LOD 会根据相机距离自动切换模型细节级别
    // 近距离：高精度模型
    // 中距离：中精度模型
    // 远距离：低精度模型或不显示
    
    return batchLoader
  }
  
  return { setupLOD }
}

/**
 * ===== 示例 9: 完整的业务流程 =====
 */
export async function example9_CompleteWorkflow(map: any) {
  const appStore = useAppStore()
  const windmillStore = useWindmillStore()
  const { open } = usePanelManager()
  
  // 1. 初始化地图
  appStore.setLoading('map', true, '正在初始化地图...')
  // await initializeMap()
  appStore.setLoading('map', false)
  eventBus.publish(GlobalEventType.MAP_READY, { map }, 'MapView')
  
  // 2. 加载风机列表和模型
  const batchLoader = await example4_BatchLoadWindmills(map)
  
  // 3. 监听风机点击
  eventBus.subscribe(GlobalEventType.WINDMILL_CLICKED, async (event) => {
    const { windmillId, data } = event.payload
    
    // 选中风机
    windmillStore.selectWindmill(data)
    appStore.selectEntity('windmill', windmillId, data)
    
    // 打开详情面板
    open('windmill-detail', {
      windmillId,
      windmillData: data
    })
    
    // 获取详细信息
    await windmillStore.fetchWindmillDetail(windmillId)
  })
  
  // 4. 监听"查看模型"按钮点击（在详情面板中）
  eventBus.subscribe('windmill:view-model', (event) => {
    const { windmillId } = event.payload
    
    // 打开 Babylon 查看器
    open('babylon-viewer-floating', {
      windmillId,
      modelUrl: `http://47.104.109.74:10555/linejson/feng/keng${windmillId}.glb`,
      enableMeasurement: true
    })
  })
  
  // 5. 返回清理函数
  return () => {
    batchLoader.destroy()
  }
}

/**
 * ===== 示例 10: 在 Vue 组件中使用 =====
 */
export const example10_VueComponentUsage = `
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { usePanelManager, usePanel } from '@/core/panel'
import { eventBus, GlobalEventType } from '@/core/eventBus'
import { useAppStore } from '@/stores/modules/app'
import { example4_BatchLoadWindmills } from '@/examples/integrationExamples'

const appStore = useAppStore()
const { open, close } = usePanelManager()
const windmillPanel = usePanel('windmill-detail')

// 地图实例
let mapInstance: any = null
let batchLoader: any = null

onMounted(async () => {
  // 等待地图就绪
  const event = await eventBus.waitFor(GlobalEventType.MAP_READY, 10000)
  mapInstance = event.payload.map
  
  // 批量加载风机
  batchLoader = await example4_BatchLoadWindmills(mapInstance)
  
  // 监听风机点击
  setupWindmillClickListener()
})

onUnmounted(() => {
  // 清理资源
  batchLoader?.destroy()
})

const setupWindmillClickListener = () => {
  mapInstance.on('click', (event: any) => {
    if (event.graphic?.attr?.type === 'windmill') {
      // 打开风机详情面板
      windmillPanel.open({
        windmillId: event.graphic.attr.id,
        windmillData: event.graphic.attr
      })
    }
  })
}

const openSettings = () => {
  open('settings')
}
</script>

<template>
  <div class="map-container">
    <!-- 地图容器 -->
    <div id="map-viewer"></div>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="openSettings">设置</button>
      <button @click="windmillPanel.toggle()">风机详情</button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="appStore.isLoading" class="loading-overlay">
      <div class="loading-content">
        {{ appStore.currentLoadingMessage }}
        <div v-if="appStore.loadingProgress" class="progress">
          {{ appStore.loadingProgress }}%
        </div>
      </div>
    </div>
  </div>
</template>
`
