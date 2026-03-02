<template>
  <div ref="containerRef" class="gis-viewer" :style="{ width, height }">
    <div :id="containerId" class="gis-viewer__map"></div>
    <slot name="tools"></slot>
    <slot name="overlay"></slot>
  </div>
</template>

<script setup lang="ts">
/**
 * GisViewer - GIS地图查看器组件
 * 功能：封装Mars3D地图的Vue组件，整合mars-map优化逻辑
 * 设计：提供插槽支持自定义工具和覆盖物
 */

import { ref, onMounted, onBeforeUnmount, watch, toRaw } from 'vue'
import * as mars3d from 'mars3d'

interface Props {
  width?: string
  height?: string
  configUrl?: string // 地图配置文件URL
  autoInit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '100%',
  autoInit: true
})

const emit = defineEmits<{
  ready: [map: any]
  error: [error: Error]
}>()

// 唯一容器ID
const containerId = `gis-viewer-${Math.random().toString(36).slice(2)}`
const containerRef = ref<HTMLElement | null>(null)

// 地图实例
const mapInstance = ref<mars3d.Map | null>(null)
const isReady = ref(false)

// 暴露给父组件的方法和属性
defineExpose({
  mapInstance,
  isReady,
  getMap: () => mapInstance.value
})

/**
 * 应用mars-map的优化配置
 */
const applyOptimizations = (mapInstance: mars3d.Map) => {
  // 针对不同终端的优化配置
  if (mars3d.Util.isPCBroswer()) {
    mapInstance.zoomFactor = 2.0 // 鼠标滚轮放大的步长参数

    // IE浏览器优化
    if (window.navigator.userAgent.toLowerCase().indexOf('msie') >= 0) {
      mapInstance.viewer.targetFrameRate = 20 // 限制帧率
      mapInstance.scene.requestRenderMode = false // 取消实时渲染
    }
  } else {
    mapInstance.zoomFactor = 5.0 // 鼠标滚轮放大的步长参数

    // 移动设备上禁掉以下几个选项，可以相对更加流畅
    mapInstance.scene.requestRenderMode = false // 取消实时渲染
    mapInstance.scene.fog.enabled = false
    mapInstance.scene.skyAtmosphere.show = false
    mapInstance.scene.globe.showGroundAtmosphere = false
  }

  // 二三维切换不用动画
  if (mapInstance.viewer.sceneModePicker) {
    mapInstance.viewer.sceneModePicker.viewModel.duration = 0.0
  }
}

/**
 * 加载地图配置
 */
const loadMapConfig = async () => {
  let finalOptions: any = {}

  if (props.configUrl) {
    try {
      finalOptions = await mars3d.Util.fetchJson({ url: props.configUrl })
      console.log('[GisViewer] 地图配置加载成功:', finalOptions)
    } catch (error) {
      console.error('[GisViewer] 加载配置文件失败:', error)
      throw error
    }
  }

  return finalOptions
}

/**
 * 初始化地图
 */
const initializeMap = async () => {
  try {
    const containerElement = document.getElementById(containerId)
    if (!containerElement) {
      throw new Error(`Container with id "${containerId}" not found`)
    }

    const mapOptions = await loadMapConfig()
    mapInstance.value = new mars3d.Map(containerId, mapOptions)
    
    // 应用优化配置
    applyOptimizations(mapInstance.value)
    
    isReady.value = true
    console.log('[GisViewer] 地图引擎初始化完成')
    
    emit('ready', mapInstance.value)
  } catch (error) {
    console.error('[GisViewer] 地图初始化失败:', error)
    emit('error', error as Error)
    throw error
  }
}

/**
 * 销毁地图
 */
const destroyMap = () => {
  if (mapInstance.value) {
    mapInstance.value.destroy()
    mapInstance.value = null
    isReady.value = false
  }
}

onMounted(async () => {
  if (props.autoInit) {
    await initializeMap()
  }
})

onBeforeUnmount(() => {
  destroyMap()
})

// 监听配置变化
watch(
  () => props.configUrl,
  async () => {
    if (isReady.value) {
      destroyMap()
      await initializeMap()
    }
  }
)
</script>

<style scoped lang="less">
.gis-viewer {
  position: relative;
  overflow: hidden;

  &__map {
    width: 100%;
    height: 100%;
  }
}
</style>
