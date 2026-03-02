import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Mars3D 应用状态
 */
export const useMars3dStore = defineStore('mars3d', () => {
  const mapInstance = ref<any>(null)
  const isMapLoaded = ref(false)
  const visibleLayers = ref<string[]>([])
  const mapBounds = ref<any>(null)

  const setMapInstance = (instance: any) => {
    mapInstance.value = instance
  }

  const setMapLoaded = (value: boolean) => {
    isMapLoaded.value = value
  }

  const addVisibleLayer = (layerId: string) => {
    if (!visibleLayers.value.includes(layerId)) {
      visibleLayers.value.push(layerId)
    }
  }

  const removeVisibleLayer = (layerId: string) => {
    visibleLayers.value = visibleLayers.value.filter(id => id !== layerId)
  }

  const toggleLayerVisibility = (layerId: string) => {
    if (visibleLayers.value.includes(layerId)) {
      removeVisibleLayer(layerId)
    } else {
      addVisibleLayer(layerId)
    }
  }

  return {
    mapInstance,
    isMapLoaded,
    visibleLayers,
    mapBounds,
    setMapInstance,
    setMapLoaded,
    addVisibleLayer,
    removeVisibleLayer,
    toggleLayerVisibility
  }
})

/**
 * 应用全局状态
 */
export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebarOpen = ref(true)
  // 主题
  const theme = ref<'light' | 'dark'>('light')
  // 加载状态
  const isLoading = ref(false)
  
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  const setTheme = (value: 'light' | 'dark') => {
    theme.value = value
  }

  const setLoading = (value: boolean) => {
    isLoading.value = value
  }
  
  return {
    sidebarOpen,
    theme,
    isLoading,
    toggleSidebar,
    setTheme,
    setLoading
  }
})

/**
 * BabylonJS 应用状态
 */
export const useBabylonStore = defineStore('babylon', () => {
  const scene = ref<any>(null)
  const camera = ref<any>(null)
  const isSceneReady = ref(false)
  const currentModel = ref<any>(null)
  const modelInfo = ref<any>(null)
  const isModelLoading = ref(false)

  const initBabylonScene = (babylonScene: any, babylonCamera: any) => {
    scene.value = babylonScene
    camera.value = babylonCamera
    isSceneReady.value = true
  }

  const setCurrentModel = (model: any) => {
    currentModel.value = model
  }

  const setModelInfo = (info: any) => {
    modelInfo.value = info
  }

  const setModelLoading = (value: boolean) => {
    isModelLoading.value = value
  }

  const disposeScene = () => {
    if (scene.value) {
      scene.value.dispose()
    }
    scene.value = null
    camera.value = null
    currentModel.value = null
    modelInfo.value = null
    isSceneReady.value = false
  }

  return {
    scene,
    camera,
    isSceneReady,
    currentModel,
    modelInfo,
    isModelLoading,
    initBabylonScene,
    setCurrentModel,
    setModelInfo,
    setModelLoading,
    disposeScene
  }
})

/**
 * 风机数据状态（需要额外创建在 modules/windmill.ts）
 * 测量状态（需要额外创建在 modules/measurement.ts）
 */

// 为了向后兼容，保留旧的 useMapStore
export const useMapStore = useMars3dStore
