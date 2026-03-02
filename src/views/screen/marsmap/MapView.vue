<template>
  <GisViewer
    ref="gisViewerRef"
    width="100%"
    height="100%"
    config-url="config/config.json"
    @ready="onGisReady"
    @error="onGisError"
  />
</template>

<script setup lang="ts">
/**
 * MapView - 地图业务场景组件
 * 职责：
 * 1. 使用 GisViewer 初始化基础地图引擎
 * 2. 调用 useMapManagement 创建图层结构
 * 3. 调用 useBusinessManagement 初始化业务管理器
 * 4. 加载业务数据（风机、电缆等）
 * 
 * 分层：
 * - GisViewer: 基础引擎初始化（通用组件）
 * - MapView: 中间层（业务数据加载和初始化入口）
 * - MapContainer: 顶层（UI 和交互）
 */

import { ref, onUnmounted } from 'vue'
import * as mars3d from 'mars3d'
import GisViewer from '@/components/mars3d/GisViewer.vue'
import { useMapManagement } from '@/mars3dmap/composables/useMapManagement'
import { useBusinessManagement } from '@/mars3dmap/composables/useBusinessManagement'
import { useMars3dStore } from '@/stores'
import { useBusinessStore } from '@/stores/modules/business'
import layerManageData from './data/layerManage.data'
import { addBaseMaps, addDecorativeLayers, configureLayersSecondPass } from './business/mapInitializer'
// 导入 mockdata 数据
import { cableData, windmillData } from './data/mockdata'

const gisViewerRef = ref()
const mapStore = useMars3dStore()
const businessStore = useBusinessStore()

let businessManagement: any = null

/**
 * GisViewer 引擎初始化完成
 */
const onGisReady = async (map: mars3d.Map) => {
  try {
    mapStore.setMapInstance(map)
    mapStore.setMapLoaded(true)

    // 1. 添加底图和装饰层
    // addBaseMaps(map)
    addDecorativeLayers(map)

    map.setCameraView({"lat":32.633408,"lng":121.623763,"alt":1212,"heading":3.2,"pitch":-9.3})

    // 2. 创建业务图层结构（传入 map 实例）
    const { createLayerManagement } = useMapManagement({
      container: '',
      layerConfig: layerManageData,
      mapInstance: map, // 传入已初始化的地图实例
    })
    createLayerManagement(layerManageData)
    console.log('[MapView] createLayerManagement 完成')
    
    // 验证图层是否创建成功
    const windmillLayer = map.getLayerById('windmillLayer')
    const cableLayer = map.getLayerById('cableLayer')
    console.log('[MapView] windmillLayer:', windmillLayer)
    console.log('[MapView] cableLayer:', cableLayer)

    // 3. 二次配置图层
    configureLayersSecondPass(map)

    // 4. 初始化业务管理器
    businessManagement = useBusinessManagement({
      mapInstance: map,
      enableWindmill: true,
      enableCable: true,
      enableUnderwaterModel: true,  // 启用水下模型管理器
      enablePointCloud: false,      // 暂不启用点云（后续需要时改为true）
    })
    businessManagement.initManagers()
    console.log('[MapView] initManagers 完成')

    // 5. 加载海缆数据（根据 type 区分掩埋/裸露颜色）
    console.log('[MapView] 开始加载 cableData, 数量:', cableData.length)
    businessManagement.loadCables(cableData)

    // 6. 加载风机数据（使用 ModelPrimitive 加载 glb 模型）
    console.log('[MapView] 开始加载 windmillData, 数量:', windmillData.length)
    businessManagement.loadWindmills(windmillData)

    // 7. 将业务管理器和数据保存到 store，供面板使用
    console.log('[MapView] Setting businessManager to store:', businessManagement)
    console.log('[MapView] businessManagement.highlightWindmills:', typeof businessManagement.highlightWindmills)
    console.log('[MapView] businessManagement.flyToWindmill:', typeof businessManagement.flyToWindmill)
    businessStore.setBusinessManager(businessManagement)
    businessStore.setWindmills(windmillData)
    businessStore.setCables(cableData)

    // 8. 初始化事件总线监听（联动面板等 UI）
    businessStore.initBusListeners()

    console.log('[MapView] 初始化完成')
    mapStore.setMapInstance(map)
  } catch (error) {
    console.error('[MapView] 初始化失败:', error)
    onGisError(error as Error)
  }
}

/**
 * GisViewer 初始化失败
 */
const onGisError = (error: Error) => {
  console.error('[MapView] 地图引擎初始化失败:', error)
}

/**
 * 组件卸载
 */
onUnmounted(() => {
  // 销毁事件总线监听
  businessStore.destroyBusListeners()
  
  if (businessManagement) {
    businessManagement.destroy()
  }
  if (gisViewerRef.value?.mapInstance) {
    // GisViewer 会自动销毁地图实例
  }
})
</script>

<style scoped>
</style>

