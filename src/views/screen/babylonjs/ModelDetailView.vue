<template>
  <div class="model-detail-view">
    <!-- BabylonJS 渲染画布 -->
    <BabylonCanvas
      ref="babylonCanvasRef"
      @ready="onBabylonReady"
      @error="onBabylonError"
      @model-loaded="onModelLoaded"
      @load-progress="onLoadProgress"
    />

    <!-- 顶部工具栏 -->
    <div class="babylon-toolbar">
      <div class="toolbar-content">
        <div class="toolbar-left">
          <el-button text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
        <div class="toolbar-center">
          <span class="app-title">{{ currentWindmillName }} - 水下模型查看</span>
        </div>
        <div class="toolbar-right">
          <el-button
            :type="leftPanelOpen ? 'primary' : ''"
            size="small"
            @click="leftPanelOpen = !leftPanelOpen"
          >
            <el-icon><Tickets /></el-icon>
            测量面板
          </el-button>
          <el-button
            :type="infoPanelOpen ? 'primary' : ''"
            size="small"
            @click="infoPanelOpen = !infoPanelOpen"
          >
            <el-icon><InfoFilled /></el-icon>
            信息面板
          </el-button>
          <el-button size="small" @click="resetCamera">
            <el-icon><Refresh /></el-icon>
            重置相机
          </el-button>
          <el-button @click="showInspector" size="small">
            调试器
          </el-button>
        </div>
      </div>
    </div>

    <!-- 测量面板 -->
    <MeasurementPanel
      ref="measurementPanelRef"
      v-model:visible="leftPanelOpen"
      v-model:target-height="targetHeight"
      v-model:sample-resolution="sampleResolution"
      v-model:height-offset="heightOffset"
      v-model:cylinder-radius="cylinderRadius"
      :tree-data="treeData"
      :current-windmill-id="windmillId"
      :measure-result="measureResult"
      :triangle-results="(triangleResults as any)"
      :saved-results="savedResults"
      :is-calculating="isCalculating"
      :has-model="hasModel"
      :model-height-range="modelHeightRange"
      :model-size="modelSize"
      @node-click="handleTreeNodeClick"
      @calculate="calculateCutFill"
      @save-result="saveMeasurement"
      @clear-result="clearMeasurement"
      @delete-saved="deleteSavedResult"
      @start-triangle-measure="startTriangleMeasure"
      @clear-triangle-measure="clearTriangleMeasure"
      @delete-triangle="deleteTriangle"
    />

    <!-- 信息面板 -->
    <ModelInfoPanel
      v-model:visible="infoPanelOpen"
      :windmill-data="currentWindmillData"
      :underwater-model="underwaterModel"
    />

    <!-- 底部状态栏 -->
    <div class="babylon-footer" v-if="false">
      <div class="footer-content">
        <span>当前风机: {{ currentWindmillName }}</span>
        <span class="spacer"></span>
        <span v-if="isModelLoading" class="status-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          模型加载中...
        </span>
        <span v-else-if="isCalculating" class="status-active">
          <el-icon class="is-loading"><Loading /></el-icon>
          方量计算中...
        </span>
        <span v-else-if="hasModel" class="status-active">
          ⚫ 模型已加载
        </span>
        <span v-else class="status-normal">就绪</span>
        <span class="spacer"></span>
        <span>© 2025 Mars3D BabylonJS Platform</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ModelDetailView - 模型详情视图组件
 * 职责：
 * 1. 集成 BabylonCanvas、MeasurementPanel、ModelInfoPanel
 * 2. 管理业务数据和状态
 * 3. 处理用户交互逻辑
 * 4. 调用服务层进行方量计算
 * 
 * 分层：
 * - BabylonCanvas: 基础渲染引擎（通用组件）
 * - ModelDetailView: 中间层（业务数据和逻辑）
 * - ModelDetailContainer: 顶层（路由入口）
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  Tickets,
  InfoFilled,
  Loading
} from '@element-plus/icons-vue'
import BabylonCanvas from './BabylonCanvas.vue'
import MeasurementPanel from './MeasurementPanel.vue'
import ModelInfoPanel from './ModelInfoPanel.vue'
import {
  mockWindFarms,
  convertToTreeData,
  getWindmillById,
  getFarmByWindmillId,
  getUnderwaterModelDetail,
  type Windmill,
  type UnderwaterModelDetail,
  type TreeNode
} from '@/data/windmills'
import { volumeCalculationService, type VolumeResult } from '@/services/babylon/VolumeCalculationService'
import { MeasurementService, type TriangleMeasurementResult, type MeasurementResult } from '@/services/babylon/MeasurementService'
import { babylonService } from '@/services/babylon/BabylonService'

const router = useRouter()
const route = useRoute()

// ============== Refs ==============

const babylonCanvasRef = ref()
// 获取路由参数 id，可以为空
const windmillId = ref<string>((route.params.id as string) || '')
const currentWindmillData = ref<Windmill | null>(null)
const underwaterModel = ref<UnderwaterModelDetail | null>(null)
const treeData = ref<TreeNode[]>([])

// UI 状态
const leftPanelOpen = ref(true)
const infoPanelOpen = ref(false)
const isModelLoading = ref(false)
const isCalculating = ref(false)
const hasModel = ref(false)

// 模型高度范围
const modelHeightRange = ref<{ min: number; max: number } | null>(null)

// 模型尺寸信息
const modelSize = ref<{ width: number; height: number; depth: number } | null>(null)

// 测量数据
const targetHeight = ref(0)
const sampleResolution = ref(1.0) // 默认 1米，避免计算量过大
const measureResult = ref<VolumeResult | null>(null)
const savedResults = ref<VolumeResult[]>([])
const triangleResults = ref<MeasurementResult[]>([])
const measurementService = ref<MeasurementService | null>(null)
const measurementPanelRef = ref()

// 新增：圆柱扣除参数（风机基础）
const cylinderRadius = ref(0) // 圆柱半径（米），0表示不扣除

// 新增：高度差值（实际高度 - 场景高度）
const heightOffset = ref(0) // 高度差值，单位：米

// ============== 计算属性 ==============

const currentWindmillName = computed(() => {
  if (!windmillId.value) {
    return '请从左侧列表选择风机'
  }
  return currentWindmillData.value?.name || '加载中...'
})

// ============== 初始化 ==============

/**
 * 初始化当前风机数据
 */
const initializeCurrentWindmill = () => {
  console.log('🔍 初始化当前风机，windmillId:', windmillId.value || '(空)')
  console.log('📋 可用的风机列表:', mockWindFarms.flatMap(farm => farm.windmills.map(w => w.id)))
  
  // 如果没有提供 id，不加载任何模型，只显示风机列表
  if (!windmillId.value) {
    console.log('ℹ️ 未提供风机ID，等待用户选择')
    currentWindmillData.value = null
    underwaterModel.value = null
    return
  }
  
  const windmill = getWindmillById(windmillId.value)
  
  if (windmill) {
    console.log('✅ 找到风机:', windmill)
    currentWindmillData.value = windmill
    underwaterModel.value = getUnderwaterModelDetail(windmillId.value)
    
    const farm = getFarmByWindmillId(windmillId.value)
    if (farm) {
      console.log('✅ 所属风电场:', farm.name)
    }
  } else {
    console.error('❌ 风机信息不存在:', windmillId.value)
    ElMessage.error(`风机信息不存在: ${windmillId.value}，请从列表中选择`)
    // 清空无效的 id
    windmillId.value = ''
    currentWindmillData.value = null
    underwaterModel.value = null
  }
}

/**
 * 初始化树形数据
 */
const initializeTreeData = () => {
  treeData.value = convertToTreeData(mockWindFarms)
  console.log('🌲 树形数据初始化完成, 节点数:', treeData.value.length)
  console.log('🌲 树形数据:', treeData.value)
}

// ============== BabylonJS 事件处理 ==============

/**
 * BabylonJS 场景就绪
 */
const onBabylonReady = (scene: any) => {
  console.log('✅ BabylonJS 场景就绪')
  console.log('🔍 当前 windmillId:', windmillId.value)
  console.log('🔍 当前 currentWindmillData:', currentWindmillData.value)
  
  // 如果路由携带了 id，尝试加载模型
  if (windmillId.value) {
    // 确保 windmill 数据已初始化（可能 onMounted 还没执行）
    if (!currentWindmillData.value) {
      console.log('⏳ windmill 数据未初始化，立即初始化')
      const windmill = getWindmillById(windmillId.value)
      if (windmill) {
        currentWindmillData.value = windmill
        underwaterModel.value = getUnderwaterModelDetail(windmillId.value)
      }
    }
    
    // 检查是否有模型 URL
    if (currentWindmillData.value?.underwaterModelUrl) {
      console.log('🚀 自动加载模型:', currentWindmillData.value.name)
      loadModel(currentWindmillData.value.underwaterModelUrl)
    } else {
      console.warn('⚠️ 风机数据存在但没有模型 URL')
    }
  } else {
    console.log('ℹ️ 等待用户从列表中选择风机')
  }

  // 初始化测量服务
  measurementService.value = new MeasurementService(babylonService)
  measurementService.value.setResultCallback((result, allResults) => {
    if (allResults) {
      triangleResults.value = allResults
    } else {
      triangleResults.value = []
    }
  })
  measurementService.value.setStatusCallback((status) => {
    measurementPanelRef.value?.setTriangleStatus(status)
  })
}

/**
 * BabylonJS 错误
 */
const onBabylonError = (error: Error) => {
  console.error('❌ BabylonJS 错误:', error)
  ElMessage.error('场景初始化失败')
}

/**
 * 模型加载完成
 */
const onModelLoaded = (model: any) => {
  console.log('✅ 模型加载完成')
  hasModel.value = true
  isModelLoading.value = false
  
  // 获取模型的高度范围，设置默认基准高度
  if (model) {
    try {
      const boundingVectors = model.getHierarchyBoundingVectors()
      const minY = boundingVectors.min.y
      const maxY = boundingVectors.max.y
      
      // 保存模型高度范围
      modelHeightRange.value = { min: minY, max: maxY }
      
      // 保存模型尺寸信息
      const sizeX = boundingVectors.max.x - boundingVectors.min.x
      const sizeY = boundingVectors.max.y - boundingVectors.min.y
      const sizeZ = boundingVectors.max.z - boundingVectors.min.z
      modelSize.value = {
        width: sizeX,
        height: sizeY,
        depth: sizeZ
      }
      
      // 设置默认基准高度为模型最低点（通常用于计算挖方）
      targetHeight.value = minY
      
      console.log('📏 模型信息:', {
        高度范围: `${minY.toFixed(2)}m ~ ${maxY.toFixed(2)}m`,
        尺寸: `${sizeX.toFixed(1)}m × ${sizeZ.toFixed(1)}m × ${sizeY.toFixed(1)}m`,
        默认基准高度: minY.toFixed(2) + 'm'
      })
      
      ElMessage.success(`模型加载成功 (高度: ${minY.toFixed(1)}~${maxY.toFixed(1)}m, 尺寸: ${sizeX.toFixed(1)}×${sizeZ.toFixed(1)}×${sizeY.toFixed(1)}m)`)
    } catch (error) {
      console.error('❌ 获取模型信息失败:', error)
      modelHeightRange.value = null
      modelSize.value = null
      ElMessage.success('模型加载成功')
    }
  } else {
    modelHeightRange.value = null
    modelSize.value = null
    ElMessage.success('模型加载成功')
  }
}

/**
 * 加载进度
 */
const onLoadProgress = (percent: number) => {
  console.log(`📦 加载进度: ${percent.toFixed(1)}%`)
}

// ============== 业务方法 ==============

/**
 * 加载模型
 */
const loadModel = async (modelUrl: string) => {
  if (!babylonCanvasRef.value) {
    console.error('❌ BabylonCanvas 未初始化')
    return
  }

  isModelLoading.value = true
  hasModel.value = false

  try {
    await babylonCanvasRef.value.loadModel(modelUrl)
  } catch (error) {
    console.error('❌ 模型加载失败:', error)
    ElMessage.error('模型加载失败')
    isModelLoading.value = false
  }
}

/**
 * 树节点点击
 */
const handleTreeNodeClick = (data: any) => {
  console.log('🖱️ 树节点点击:', data)
  
  if (data.type === 'windmill' && data.id !== windmillId.value) {
    switchWindmill(data.id)
  }
}

/**
 * 切换风机
 */
const switchWindmill = (newWindmillId: string) => {
  console.log('🔄 切换风机:', newWindmillId)
  console.log('📍 当前风机:', windmillId.value)

  const newWindmill = getWindmillById(newWindmillId)
  if (!newWindmill) {
    console.error('❌ 无法找到指定风机:', newWindmillId)
    ElMessage.error('无法找到指定风机')
    return
  }

  // 更新路由
  windmillId.value = newWindmillId
  router.replace(`/model/${newWindmillId}`)

  // 更新数据
  currentWindmillData.value = newWindmill
  underwaterModel.value = getUnderwaterModelDetail(newWindmillId)

  // 清空测量数据和高度范围
  console.log('🗑️ 切换风机时清空测量数据')
  clearMeasurement()
  savedResults.value = []
  modelHeightRange.value = null
  targetHeight.value = 0

  // 加载新模型
  if (newWindmill.underwaterModelUrl) {
    console.log('📦 加载新风机的模型')
    loadModel(newWindmill.underwaterModelUrl)
  }
}

/**
 * 计算方量
 */
const calculateCutFill = async () => {
  if (!babylonCanvasRef.value) {
    ElMessage.error('场景未初始化')
    return
  }

  const scene = babylonCanvasRef.value.getScene()
  const model = babylonCanvasRef.value.getCurrentModel()

  // 详细的模型验证和调试信息
  console.log('🔍 准备计算方量')
  console.log('📦 场景对象:', scene ? '✅ 已加载' : '❌ 未加载')
  console.log('📦 模型对象:', model ? '✅ 已加载' : '❌ 未加载')
  
  if (model) {
    console.log('📦 模型详细信息:', {
      name: model.name,
      type: model.getClassName(),
      totalVertices: model.getTotalVertices(),
      isVisible: model.isVisible,
      isEnabled: model.isEnabled(),
      hasChildren: model.getChildren().length > 0,
      childrenCount: model.getChildren().length
    })
  }

  if (!scene || !model) {
    ElMessage.error('场景或模型未加载')
    console.error('❌ 计算终止：场景或模型未加载')
    return
  }

  try {
    isCalculating.value = true

    // 验证基准高度
    if (!volumeCalculationService.validateTargetHeight(model, targetHeight.value)) {
      ElMessage.warning('基准高度可能不合理，但仍继续计算')
    }

    // 创建计算提示
    const loadingMessage = ElMessage({
      message: '正在快速计算方量...',
      type: 'info',
      duration: 0,
      showClose: false
    })

    try {
      // 计算圆柱高度（从坑底到基准面）
      const calculatedCylinderHeight = modelHeightRange.value 
        ? Math.max(0, targetHeight.value - modelHeightRange.value.min)
        : 0

      // 执行快速方量计算（使用heightOffset差值方式）
      measureResult.value = await volumeCalculationService.calculateVolumeFast(
        scene,
        model,
        targetHeight.value, // 场景坐标系的高度值
        cylinderRadius.value > 0 ? cylinderRadius.value : undefined,
        cylinderRadius.value > 0 && calculatedCylinderHeight > 0 ? calculatedCylinderHeight : undefined,
        heightOffset.value !== 0 ? heightOffset.value : undefined // 传递高度差值
      )

      loadingMessage.close()
      
      // 验证计算结果是否正确保存
      console.log('✅ 快速计算完成，结果已保存:', {
        measureResult: measureResult.value,
        cutVolume: measureResult.value?.cutVolume,
        fillVolume: measureResult.value?.fillVolume,
        totalVolume: measureResult.value?.totalVolume,
        cylinderHeight: calculatedCylinderHeight,
        heightOffset: heightOffset.value, // 高度差值
        计算耗时: `${Date.now() - measureResult.value.timestamp}ms`
      })
      
      // 验证模型是否还在
      console.log('✅ 验证模型状态:', {
        hasModel: hasModel.value,
        modelExists: !!babylonCanvasRef.value?.getCurrentModel()
      })
      
      ElMessage.success('方量计算完成')
    } catch (error) {
      loadingMessage.close()
      throw error
    }
  } catch (error) {
    console.error('❌ 方量计算失败:', error)
    ElMessage.error(`方量计算失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isCalculating.value = false
  }
}

/**
 * 保存测量结果
 */
const saveMeasurement = () => {
  if (measureResult.value) {
    console.log('💾 保存测量结果:', measureResult.value)
    savedResults.value.push({ ...measureResult.value })
    ElMessage.success('测量结果已保存')
    // 注意：保存后不清空当前结果，让用户可以继续查看
    // measureResult.value = null
    console.log('✅ 结果已保存，当前结果保留显示')
  } else {
    console.warn('⚠️ 没有可保存的测量结果')
  }
}

/**
 * 清除测量结果
 */
const clearMeasurement = () => {
  console.log('🗑️ 清除测量结果')
  measureResult.value = null
}

/**
 * 删除已保存的结果
 */
const deleteSavedResult = (index: number) => {
  savedResults.value.splice(index, 1)
  ElMessage.success('已删除')
}

/**
 * 重置相机
 */
const resetCamera = () => {
  if (babylonCanvasRef.value) {
    babylonCanvasRef.value.resetCamera()
    ElMessage.success('相机已重置')
  }
}

/**
 * 显示调试器
 */
const showInspector = (value: boolean) => {
  if (babylonCanvasRef.value) {
    babylonCanvasRef.value.showInspector(value)
  }
}



/**
 * 返回地图
 */
const goBack = () => {
  router.push('/map')
}

// ============== 测量逻辑 ==============

const startTriangleMeasure = () => {
  measurementService.value?.startMeasurement('triangle')
}

const clearTriangleMeasure = () => {
  measurementService.value?.clearMeasurement()
  triangleResults.value = []
}

const deleteTriangle = (id: string) => {
  measurementService.value?.removeTriangle(id)
}

// ============== 生命周期 ==============

onMounted(() => {
  console.log('🎬 ModelDetailView 已挂载')
  console.log('📍 当前路由参数:', route.params.id)

  // 初始化数据
  initializeCurrentWindmill()
  initializeTreeData()
})

onBeforeUnmount(() => {
  measurementService.value?.dispose()
})
</script>

<style scoped lang="less">
// 色彩系统
@primary-blue: #00d4ff;
@secondary-blue: #0099ff;
@success-green: #00ff88;
@warning-orange: #ffaa00;
@danger-red: #ff4444;
@dark-bg: rgba(10, 25, 47, 0.85);
@panel-bg: rgba(15, 35, 65, 0.9);
@border-color: rgba(0, 212, 255, 0.2);
@text-primary: #e0e6ed;
@text-secondary: #a0aec0;
@text-light: #64748b;

.model-detail-view {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  // background: linear-gradient(135deg, #0a1e3a 0%, #1a0e2e 100%);
  overflow: hidden;

  // 顶部工具栏
  .babylon-toolbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: @dark-bg;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid @border-color;
    // box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 200;

    .toolbar-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 24px;
      gap: 20px;

      .toolbar-left,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .toolbar-center {
        flex: 1;
        text-align: center;

        .app-title {
          font-size: 18px;
          font-weight: 600;
          color: @primary-blue;
          text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
      }
    }
  }

  // 底部状态栏
  .babylon-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: @dark-bg;
    backdrop-filter: blur(12px);
    border-top: 1px solid @border-color;
    z-index: 200;

    .footer-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 24px;
      font-size: 13px;
      color: @text-secondary;

      .spacer {
        flex: 1;
      }

      .status-loading {
        display: flex;
        align-items: center;
        gap: 6px;
        color: @warning-orange;
      }

      .status-active {
        color: @success-green;
      }

      .status-normal {
        color: @text-secondary;
      }
    }
  }
}
</style>
