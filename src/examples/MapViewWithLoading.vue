/**
 * MapView 组件 - 集成首屏加载优化
 * 展示如何使用骨架屏和加载进度
 */
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFirstScreenLoader } from '@/core/loaders/FirstScreenLoader'
import { useAppStore } from '@/stores/modules/app'
import { eventBus, GlobalEventType } from '@/core/eventBus'
import GisViewer from '@/components/mars3d/GisViewer.vue'

const appStore = useAppStore()
const { loader, totalProgress, currentStage, startStage, updateStage, completeStage } = useFirstScreenLoader()

const mapInstance = ref<any>(null)
const isMapReady = ref(false)

onMounted(async () => {
  await initializeMap()
})

/**
 * 初始化地图（带进度反馈）
 */
async function initializeMap() {
  try {
    // 阶段1: 加载配置
    startStage('config', '正在加载地图配置...')
    await loadMapConfig()
    completeStage('config')

    // 阶段2: 初始化引擎
    startStage('engine', '正在初始化地图引擎...')
    await initMapEngine()
    completeStage('engine')

    // 阶段3: 加载图层
    startStage('layers', '正在加载地图图层...')
    await loadMapLayers()
    completeStage('layers')

    // 阶段4: 加载业务数据
    startStage('data', '正在加载业务数据...')
    await loadBusinessData()
    completeStage('data')

    // 完成
    isMapReady.value = true
    eventBus.publish(GlobalEventType.MAP_READY, { map: mapInstance.value })

  } catch (error) {
    console.error('地图初始化失败:', error)
    appStore.notify('地图加载失败', 'error')
  }
}

async function loadMapConfig() {
  // 模拟加载配置
  await delay(300)
}

async function initMapEngine() {
  // 模拟引擎初始化
  for (let i = 0; i <= 100; i += 10) {
    updateStage('engine', i, `初始化中... ${i}%`)
    await delay(50)
  }
}

async function loadMapLayers() {
  // 模拟加载图层
  const layers = ['底图', '影像', '标注', '地形']
  for (let i = 0; i < layers.length; i++) {
    const progress = Math.round((i + 1) / layers.length * 100)
    updateStage('layers', progress, `加载图层: ${layers[i]}`)
    await delay(200)
  }
}

async function loadBusinessData() {
  // 模拟加载业务数据
  const tasks = ['风机数据', '电缆数据', '海域数据']
  for (let i = 0; i < tasks.length; i++) {
    const progress = Math.round((i + 1) / tasks.length * 100)
    updateStage('data', progress, `加载: ${tasks[i]}`)
    await delay(300)
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const onMapReady = (map: any) => {
  mapInstance.value = map
}
</script>

<template>
  <div class="map-view-wrapper">
    <!-- 骨架屏会在路由守卫中自动显示，这里不需要手动处理 -->
    <GisViewer @ready="onMapReady" />

    <!-- 可选：在组件内部也显示加载进度 -->
    <div v-if="!isMapReady" class="internal-loading">
      <div class="loading-info">
        <div class="stage-name">{{ currentStage?.stage }}</div>
        <div class="stage-message">{{ currentStage?.message }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${totalProgress}%` }"></div>
        </div>
        <div class="progress-text">{{ totalProgress }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-view-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
}

.internal-loading {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  min-width: 300px;
  z-index: 1000;
}

.stage-name {
  font-size: 12px;
  color: #667eea;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.stage-message {
  font-size: 14px;
  margin-bottom: 12px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease-out;
}

.progress-text {
  font-size: 12px;
  color: #667eea;
  text-align: right;
}
</style>
