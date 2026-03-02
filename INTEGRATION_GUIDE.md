# 🚀 快速集成指南

本指南帮助你快速集成新的架构优化系统到现有项目中。

---

## 📋 前提条件

- ✅ Vue 3 + TypeScript
- ✅ Pinia（状态管理）
- ✅ Mars3D（已安装）
- ✅ Babylon.js（已安装）

---

## 🔧 步骤 1: 初始化核心系统

### 修改 `src/main.ts`

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeCoreSystems } from '@/config/appInitializer'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// ⭐ 初始化核心系统（面板、事件总线、错误处理等）
initializeCoreSystems(app)

app.mount('#app')
```

---

## 🎨 步骤 2: 创建面板组件

### 示例：创建风机详情面板

`src/views/screen/marsmap/panels/WindmillDetailPanel.vue`:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWindmillStore } from '@/stores/modules/windmill'
import { eventBus, GlobalEventType } from '@/core/eventBus'

interface Props {
  windmillId: string
  windmillData?: any
}

const props = defineProps<Props>()
const windmillStore = useWindmillStore()
const detail = ref<any>(null)
const loading = ref(false)

// 加载详情
const loadDetail = async () => {
  loading.value = true
  try {
    await windmillStore.fetchWindmillDetail(props.windmillId)
    detail.value = windmillStore.selectedWindmillDetail
  } catch (error) {
    console.error('加载风机详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看模型
const viewModel = () => {
  eventBus.publish('windmill:view-model', {
    windmillId: props.windmillId
  })
}

// 监听 windmillId 变化
watch(() => props.windmillId, () => {
  if (props.windmillId) {
    loadDetail()
  }
}, { immediate: true })
</script>

<template>
  <div class="windmill-detail-panel">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="detail" class="content">
      <h3>{{ detail.name }}</h3>
      <div class="info">
        <div class="info-item">
          <label>编号:</label>
          <span>{{ detail.id }}</span>
        </div>
        <div class="info-item">
          <label>位置:</label>
          <span>{{ detail.longitude }}, {{ detail.latitude }}</span>
        </div>
        <div class="info-item">
          <label>状态:</label>
          <span>{{ detail.status }}</span>
        </div>
      </div>
      
      <button @click="viewModel" class="btn-primary">
        查看 3D 模型
      </button>
    </div>
  </div>
</template>

<style scoped>
.windmill-detail-panel {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.info {
  margin: 20px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #66b1ff;
}
</style>
```

---

## 🗺️ 步骤 3: 在地图视图中集成

### `src/views/screen/marsmap/MapView.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePanelManager } from '@/core/panel'
import { eventBus, GlobalEventType } from '@/core/eventBus'
import { useAppStore } from '@/stores/modules/app'
import { WindmillBatchLoader } from '@/services/windmill/WindmillBatchLoader'
import { useMapInstance } from '@/mars3dmap/composables/useMapInstance'
import { getWindmills } from '@/api/windmill'

const appStore = useAppStore()
const { open } = usePanelManager()
const { mapInstance } = useMapInstance()

let batchLoader: WindmillBatchLoader | null = null

onMounted(async () => {
  // 等待地图就绪
  const event = await eventBus.waitFor(GlobalEventType.MAP_READY, 10000)
  
  // 设置风机点击监听
  setupWindmillClickListener()
  
  // 加载风机
  await loadWindmills()
})

onUnmounted(() => {
  batchLoader?.destroy()
})

// 设置风机点击监听
const setupWindmillClickListener = () => {
  if (!mapInstance.value) return
  
  mapInstance.value.on('click', (event: any) => {
    if (event.graphic?.attr?.type === 'windmill') {
      // 发布点击事件
      eventBus.publish(GlobalEventType.WINDMILL_CLICKED, {
        windmillId: event.graphic.attr.id,
        data: event.graphic.attr
      }, 'MapView')
      
      // 打开详情面板
      open('windmill-detail', {
        windmillId: event.graphic.attr.id,
        windmillData: event.graphic.attr
      })
    }
  })
}

// 加载风机
const loadWindmills = async () => {
  appStore.setLoading('windmills', true, '正在加载风机...', 0, 'model')
  
  try {
    // 创建批量加载器
    batchLoader = new WindmillBatchLoader({
      concurrency: 6,
      enableLOD: true,
      lodUpdateInterval: 500
    })
    
    batchLoader.setMap(mapInstance.value)
    
    // 监听进度
    batchLoader.loadQueue.on('task:completed', () => {
      const stats = batchLoader!.getStats()
      const progress = (stats.queue.completed / stats.queue.total) * 100
      
      appStore.setLoading(
        'windmills',
        true,
        `加载中 ${stats.queue.completed}/${stats.queue.total}`,
        progress,
        'model'
      )
    })
    
    // 获取风机列表
    const windmills = await getWindmills()
    
    // 开始加载
    await batchLoader.loadWindmills(windmills)
    
    appStore.setLoading('windmills', false)
    appStore.notify('风机加载完成', 'success')
    
  } catch (error) {
    appStore.setLoading('windmills', false)
    appStore.notify('风机加载失败', 'error')
    console.error('加载风机失败:', error)
  }
}
</script>

<template>
  <div class="map-view">
    <GisViewer @ready="onMapReady" />
    
    <!-- 加载遮罩 -->
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
```

---

## 🎮 步骤 4: 监听事件并打开 Babylon.js

### 在 `MapView.vue` 或专门的事件处理文件中：

```typescript
import { eventBus } from '@/core/eventBus'
import { usePanelManager } from '@/core/panel'

const { open } = usePanelManager()

// 监听"查看模型"事件
eventBus.subscribe('windmill:view-model', (event) => {
  const { windmillId } = event.payload
  
  // 方案1: 浮动窗口
  open('babylon-viewer-floating', {
    windmillId,
    modelUrl: `http://47.104.109.74:10555/linejson/feng/keng${windmillId}.glb`,
    enableMeasurement: true
  })
  
  // 方案2: 新标签页
  // window.open(`/babylon-viewer?windmillId=${windmillId}`, '_blank')
})
```

---

## 📦 步骤 5: 创建通用面板容器（可选）

`src/components/panels/PanelContainer.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePanelManager } from '@/core/panel'
import type { PanelInstance } from '@/core/panel/types'

const { openPanels } = usePanelManager()

// 拖拽逻辑
const dragging = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

const startDrag = (panelId: string, event: MouseEvent) => {
  const panel = openPanels.value.find(p => p.id === panelId)
  if (!panel || !panel.config.draggable) return
  
  dragging.value = panelId
  dragOffset.value = {
    x: event.clientX - panel.position.x,
    y: event.clientY - panel.position.y
  }
}

const onDrag = (event: MouseEvent) => {
  if (!dragging.value) return
  
  const panel = openPanels.value.find(p => p.id === dragging.value)
  if (!panel) return
  
  panel.position.x = event.clientX - dragOffset.value.x
  panel.position.y = event.clientY - dragOffset.value.y
}

const stopDrag = () => {
  dragging.value = null
}
</script>

<template>
  <div class="panel-container" @mousemove="onDrag" @mouseup="stopDrag">
    <div
      v-for="panel in openPanels"
      :key="panel.id"
      class="panel-wrapper"
      :class="{
        'panel-floating': panel.config.mode === 'floating',
        'panel-minimized': panel.state === 'minimized'
      }"
      :style="{
        left: panel.position.x + 'px',
        top: panel.position.y + 'px',
        width: panel.position.width + 'px',
        height: panel.position.height + 'px',
        zIndex: panel.zIndex
      }"
    >
      <div class="panel-header" @mousedown="startDrag(panel.id, $event)">
        <span class="panel-title">{{ panel.config.title || panel.config.name }}</span>
        <button @click="close(panel.id)">×</button>
      </div>
      
      <div class="panel-body">
        <component
          :is="panel.config.component"
          v-bind="panel.config.props"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.panel-wrapper {
  position: absolute;
  pointer-events: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  cursor: move;
}

.panel-body {
  overflow: auto;
  height: calc(100% - 48px);
}
</style>
```

---

## 🧪 步骤 6: 测试

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 测试场景

- ✅ 地图加载
- ✅ 风机批量加载（观察加载进度）
- ✅ 点击风机打开详情面板
- ✅ 点击"查看模型"打开 Babylon.js 场景
- ✅ 在 Babylon.js 中进行测量

---

## 📝 常见问题

### Q1: 面板没有显示？

**A:** 检查是否在 `src/config/panelRegistry.ts` 中注册了面板配置。

### Q2: 事件没有触发？

**A:** 确保事件类型在 `GlobalEventType` 枚举中定义，并且使用 `eventBus.publish()` 发布。

### Q3: 风机加载很慢？

**A:** 调整 `WindmillBatchLoader` 的并发数：

```typescript
const batchLoader = new WindmillBatchLoader({
  concurrency: 8,  // 增加并发数
  enableLOD: true
})
```

### Q4: 如何调试事件流？

**A:** 在开发环境中，所有事件会自动打印到控制台。查看控制台的 `[EventBus]` 日志。

---

## 🎯 下一步

- 📖 查看完整文档：`ARCHITECTURE_OPTIMIZATION.md`
- 🔍 查看使用示例：`src/examples/integrationExamples.ts`
- 📊 查看优化总结：`OPTIMIZATION_SUMMARY.md`

---

**祝集成顺利！** 🚀
