<template>
  <div class="model-viewer">
    <!-- 3D 画布 -->
    <canvas ref="canvasRef" class="babylon-canvas"></canvas>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-overlay">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error.message"
      type="error"
      :closable="false"
      class="error-alert"
    />

    <!-- 控制面板 -->
    <div class="control-panel">
      <!-- 模型选择 -->
      <el-card class="control-card">
        <template #header>
          <span>模型管理</span>
        </template>
        
        <el-select
          v-model="selectedModelId"
          placeholder="选择模型"
          @change="handleModelChange"
          style="width: 100%"
        >
          <el-option
            v-for="model in availableModels"
            :key="model.id"
            :label="model.name"
            :value="model.id"
          />
        </el-select>

        <div class="button-group">
          <el-button @click="handleLoadModel" type="primary" :disabled="!selectedModelId">
            加载模型
          </el-button>
          <el-button @click="handleClearModels" type="danger">
            清除所有
          </el-button>
        </div>

        <!-- 已加载模型列表 -->
        <div v-if="loadedModels.length > 0" class="loaded-models">
          <el-divider>已加载模型</el-divider>
          <el-tag
            v-for="model in loadedModels"
            :key="model.id"
            :type="model.id === currentModelId ? 'success' : 'info'"
            closable
            @close="handleRemoveModel(model.id)"
            @click="handleSwitchModel(model.id)"
            class="model-tag"
          >
            {{ getModelName(model.id) }}
          </el-tag>
        </div>
      </el-card>

      <!-- 测量工具 -->
      <el-card class="control-card">
        <template #header>
          <span>测量工具</span>
        </template>

        <el-segmented v-model="measurementMode" :options="measurementModeOptions" block />

        <div v-if="measurementMode === 'basic'" class="measurement-buttons">
          <el-button @click="startMeasurement('distance')" size="small">
            距离测量
          </el-button>
          <el-button @click="startMeasurement('area')" size="small">
            面积测量
          </el-button>
          <el-button @click="startMeasurement('volume')" size="small">
            体积测量
          </el-button>
          <el-button @click="startMeasurement('cut-fill')" type="warning" size="small">
            挖填方计算
          </el-button>
        </div>

        <div v-else class="measurement-buttons">
          <el-button 
            @click="toggleTriangleMeasurement" 
            :type="showTrianglePanel ? 'danger' : 'primary'"
            size="small"
          >
            <el-icon><Compass /></el-icon>
            {{ showTrianglePanel ? '关闭三角测量' : '三角形测量' }}
          </el-button>
        </div>

        <div class="button-group">
          <el-button @click="handleFinishMeasurement" type="success" size="small">
            完成测量
          </el-button>
          <el-button @click="clearMeasurement" size="small">
            清除测量
          </el-button>
        </div>

        <!-- 测量结果 -->
        <div v-if="measurementResult" class="measurement-result">
          <el-divider>测量结果</el-divider>
          <div class="result-item">
            <span class="label">类型:</span>
            <span class="value">{{ getMeasurementTypeLabel(measurementResult.type) }}</span>
          </div>
          <div class="result-item">
            <span class="label">数值:</span>
            <span class="value">{{ measurementResult.value.toFixed(2) }} {{ measurementResult.unit }}</span>
          </div>

          <!-- 挖填方详细结果 -->
          <div v-if="measurementResult.type === 'cut-fill' && measurementResult.metadata">
            <div class="result-item">
              <span class="label">挖方量:</span>
              <span class="value">{{ measurementResult.metadata.cutVolume.toFixed(2) }} m³</span>
            </div>
            <div class="result-item">
              <span class="label">填方量:</span>
              <span class="value">{{ measurementResult.metadata.fillVolume.toFixed(2) }} m³</span>
            </div>
            <div class="result-item">
              <span class="label">净土方量:</span>
              <span class="value">{{ measurementResult.metadata.netVolume.toFixed(2) }} m³</span>
            </div>
            <div class="result-item">
              <span class="label">计算面积:</span>
              <span class="value">{{ measurementResult.metadata.area.toFixed(2) }} m²</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 相机工具 -->
      <el-card class="control-card">
        <template #header>
          <span>视图控制</span>
        </template>

        <div class="button-group">
          <el-button @click="resetCamera" size="small">
            重置视角
          </el-button>
          <el-button @click="handleTakeScreenshot" size="small">
            截图
          </el-button>
          <el-button @click="showInspector" size="small">
            调试器
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 三角形测量面板 -->
    <triangle-measurement-panel
      v-if="triangleServiceReady"
      v-model:visible="showTrianglePanel"
      :triangles="triangleMeasurements"
      :is-measuring="isTriangleMeasuring"
      :current-points="currentTrianglePoints"
      :show-auto-measure="true"
      @start-measurement="handleStartTriangleMeasurement"
      @stop-measurement="handleStopTriangleMeasurement"
      @clear-last="handleClearLastTriangle"
      @clear-all="handleClearAllTriangles"
      @export-data="handleExportTriangleData"
      @auto-measure="handleAutoMeasure"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBabylonModel } from '@/babylonjs/composables/useBabylonModel'
import { ElMessage } from 'element-plus'
import { Loading, Compass } from '@element-plus/icons-vue'
import type { ModelInfo } from '@/services/babylon/ModelLoadService'
import type { MeasurementResult } from '@/services/babylon/MeasurementService'
// import TriangleMeasurementPanel from './TriangleMeasurementPanel.vue'
// import { TriangleMeasurementService } from '@/services/babylon/TriangleMeasurementService'
// import type { TriangleData, AutoMeasureConfig } from '@/services/babylon/TriangleMeasurementService'
import * as BABYLON from 'babylonjs'

// Canvas 引用
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 使用 composable
const {
  isReady,
  isLoading,
  currentModelId,
  loadedModels,
  error,
  babylonService,
  initScene,
  loadModel,
  switchModel,
  removeModel,
  clearAllModels,
  startMeasurement,
  finishMeasurement,
  clearMeasurement,
  resetCamera,
  takeScreenshot,
  showInspector
} = useBabylonModel({
  enableInspector: false,
  enableHighlight: true,
  enableMeasurement: true
})

// 可用模型列表（示例数据）
const availableModels = ref<ModelInfo[]>([
  {
    id: 'box',
    name: '立方体模型',
    url: 'http://47.104.109.74:10555/linejson/feng/output.glb',
    type: 'geometry'
  },
  {
    id: 'teapot',
    name: '茶壶模型',
    url: 'https://data.mars3d.cn/gltf/mars/fengche.gltf',
    type: 'geometry'
  },
])

const selectedModelId = ref<string>('')
const measurementResult = ref<MeasurementResult | null>(null)

// 测量模式
const measurementMode = ref<'basic' | 'triangle'>('basic')
const measurementModeOptions = [
  { label: '基础测量', value: 'basic' },
  { label: '三角形测量', value: 'triangle' }
]

// 三角形测量相关状态
const showTrianglePanel = ref(false)
const triangleServiceReady = ref(false)
const isTriangleMeasuring = ref(false)
const currentTrianglePoints = ref(0)
const triangleMeasurements = ref<TriangleData[]>([])
let triangleService: TriangleMeasurementService | null = null
let pointObserver: BABYLON.Observer<BABYLON.PointerInfo> | null = null

/**
 * 初始化
 */
onMounted(async () => {
  if (!canvasRef.value) return

  try {
    await initScene(canvasRef.value)
    ElMessage.success('场景初始化成功')
    
    // 初始化三角形测量服务
    initTriangleService()
  } catch (err) {
    ElMessage.error('场景初始化失败')
    console.error(err)
  }
})

/**
 * 初始化三角形测量服务
 */
const initTriangleService = () => {
  try {
    // 从useBabylonModel获取babylonService实例
    if (babylonService) {
      triangleService = new TriangleMeasurementService(babylonService)
      triangleServiceReady.value = true
      console.log('✅ 三角形测量服务初始化成功')
    }
  } catch (err) {
    console.error('❌ 三角形测量服务初始化失败:', err)
  }
}

/**
 * 加载模型
 */
const handleLoadModel = async () => {
  if (!selectedModelId.value) return

  const modelInfo = availableModels.value.find(m => m.id === selectedModelId.value)
  if (!modelInfo) return

  try {
    await loadModel(modelInfo, {
      visible: true,
      castShadow: true,
      receiveShadow: true,
      onProgress: (event) => {
        // 可以显示进度
        console.log('Loading progress:', event.loaded / event.total * 100 + '%')
      }
    })
    ElMessage.success(`模型 ${modelInfo.name} 加载成功`)
  } catch (err) {
    ElMessage.error('模型加载失败')
    console.error(err)
  }
}

/**
 * 切换模型
 */
const handleModelChange = (modelId: string) => {
  // 可以在这里实现预加载等逻辑
  console.log('Selected model:', modelId)
}

/**
 * 切换显示模型
 */
const handleSwitchModel = (modelId: string) => {
  const success = switchModel(modelId)
  if (success) {
    ElMessage.success('模型切换成功')
  }
}

/**
 * 移除模型
 */
const handleRemoveModel = (modelId: string) => {
  const success = removeModel(modelId)
  if (success) {
    ElMessage.success('模型已移除')
  }
}

/**
 * 清除所有模型
 */
const handleClearModels = () => {
  clearAllModels()
  ElMessage.success('已清除所有模型')
}

/**
 * 完成测量
 */
const handleFinishMeasurement = () => {
  const result = finishMeasurement()
  if (result) {
    measurementResult.value = result
    ElMessage.success('测量完成')
  } else {
    ElMessage.warning('请先添加测量点')
  }
}

/**
 * 截图
 */
const handleTakeScreenshot = async () => {
  try {
    const dataUrl = await takeScreenshot()
    // 下载图片
    const link = document.createElement('a')
    link.download = `screenshot_${Date.now()}.png`
    link.href = dataUrl
    link.click()
    ElMessage.success('截图成功')
  } catch (err) {
    ElMessage.error('截图失败')
    console.error(err)
  }
}

/**
 * 获取模型名称
 */
const getModelName = (modelId: string): string => {
  const model = availableModels.value.find(m => m.id === modelId)
  return model?.name || modelId
}

/**
 * 获取测量类型标签
 */
const getMeasurementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    distance: '距离测量',
    area: '面积测量',
    volume: '体积测量',
    'cut-fill': '挖填方计算'
  }
  return labels[type] || type
}

/**
 * 切换三角形测量面板
 */
const toggleTriangleMeasurement = () => {
  showTrianglePanel.value = !showTrianglePanel.value
  if (showTrianglePanel.value && !isTriangleMeasuring.value) {
    handleStartTriangleMeasurement()
  }
}

/**
 * 开始三角形测量
 */
const handleStartTriangleMeasurement = () => {
  if (!triangleService) {
    ElMessage.error('三角形测量服务未就绪')
    return
  }

  triangleService.startMeasurement()
  isTriangleMeasuring.value = true
  currentTrianglePoints.value = 0

  // 监听点击事件
  const babylonService = (window as any).__babylonService__
  const scene = babylonService?.getScene()
  
//   if (scscene = babylonServicenterObservable.add((pointerInfo: BABYLON.PointerInfo) => {
//       if (!isTriangleMeasuring.value) return

//       if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
//         const pickResult = pointerInfo.pickInfo
//         if (pickResult && pickResult.hit && pickResult.pickedPoint) {
//           currentTrianglePoints.value++

//           if (currentTrianglePoints.value === 3) {
//             setTimeout(() => {
//               updateTrianglesList()
//               currentTrianglePoints.value = 0
//             }, 100)
//           }
//         }
//       }
//     })
//   }

//   ElMessage.info('三角形测量已启动，请在场景中选择3个点')
// }

/**
 * 停止三角形测量
 */
const handleStopTriangleMeasurement = () => {
  if (!triangleService) return

  triangleService.stopMeasurement()
  isTriangleMeasuring.value = false
  currentTrianglePoints.value = 0

  // 移除事件监听
  if (pointObserver) {
    const babylonService = (window as any).__babylonService__
    const scene = babylonService
      scene.onPointerObservable.remove(pointObserver)
    }
    pointObserver = null
  }

  ElMessage.success('三角形测量已停止')
}

/**
 * 更新三角形列表
 */
const updateTrianglesList = () => {
  if (!triangleService) return
  triangleMeasurements.value = triangleService.getAllTriangles()
}

/**
 * 清除最后一个三角形
 */
const handleClearLastTriangle = () => {
  if (!triangleService) return
  triangleService.clearLastTriangle()
  updateTrianglesList()
}

/**
 * 清除所有三角形
 */
const handleClearAllTriangles = () => {
  if (!triangleService) return
  triangleService.clearAll()
  triangleMeasurements.value = []
  currentTrianglePoints.value = 0
}

/**
 * 导出三角形数据
 */
const handleExportTriangleData = () => {
  if (!triangleService) return

  const jsonData = triangleService.exportData()
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `triangle-measurement-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 自动测量
 */
const handleAutoMeasure = async () => {
  if (!triangleService) {
    ElMessage.error('三角形测量服务未就绪')
    return
  }

  const babylonService = (window as any).__babylonService__
  const scene = babylonService?.getScene()

  try {
    // 获取场景中的所有网格
    const meshes = scene.meshes.filter((m: BABYLON.AbstractMesh) => 
      m.name !== 'ground' && m.isVisible && m.getTotalVertices() > 0
    )

    if (meshes.length === 0) {
      ElMessage.warning('场景中没有可测量的模型')
      return
    }

    const configs: AutoMeasureConfig[] = meshes.slice(0, 5).map((mesh: BABYLON.AbstractMesh, index: number) => ({
      modelMesh: mesh as BABYLON.Mesh,
      regionName: `区域${index + 1}`,
      referencePoint: new BABYLON.Vector3(0, 20, 0)
    }))

    const results = await triangleService.batchAutoMeasure(configs)
    ElMessage.success(`自动测量完成，共测量 ${results.length} 个区域`)
  } catch (err) {
    console.error('自动测量失败:', err)
    ElMessage.error('自动测量失败')
  }
}
</script>

<style scoped lang="less">
.model-viewer {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.babylon-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  z-index: 100;

  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
}

.error-alert {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  z-index: 200;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  z-index: 50;
}

.control-card {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;

  .el-button {
    flex: 1;
  }
}

.measurement-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.loaded-models {
  margin-top: 12px;
}

.model-tag {
  margin: 4px;
  cursor: pointer;
  user-select: none;
}

.measurement-result {
  margin-top: 12px;

  .result-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;

    .label {
      font-weight: 500;
      color: #606266;
    }

    .value {
      color: #409eff;
      font-weight: 600;
    }
  }
}
</style>
