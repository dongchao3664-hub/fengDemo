<template>
  <Transition name="slide-fade">
    <div v-show="visible" class="measurement-panel left-panel">
      <!-- <div class="panel-header">
        <span>测量工具</span>
        <el-icon class="close-btn" @click="emit('update:visible', false)">
          <Close />
        </el-icon>
      </div> -->

      <el-tabs v-model="activeTab" type="card">
        <!-- 风机选择选项卡 -->
        <el-tab-pane label="风机列表" name="windmill">
          <div class="panel-content">
            <!-- 调试信息 -->
            <div v-if="!treeData || treeData.length === 0" class="empty-hint">
              <el-empty description="暂无风机数据" />
              <p style="text-align: center; color: #999; font-size: 12px;">
                数据加载中...
              </p>
            </div>
            
            <el-tree
              v-else
              ref="treeRef"
              :data="treeData"
              node-key="id"
              :props="{ children: 'children', label: 'label' }"
              :current-node-key="currentWindmillId"
              :default-expand-all="true"
              highlight-current
              @node-click="handleTreeNodeClick"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <el-icon v-if="data.type === 'farm'" class="node-icon">
                    <Fold />
                  </el-icon>
                  <el-icon v-else class="node-icon">
                    <Connection />
                  </el-icon>
                  <span>{{ node.label }}</span>
                  <el-tag
                    v-if="data.type === 'windmill' && data.data"
                    :type="getStatusTagType(data.data.status)"
                    size="small"
                    class="status-tag"
                  >
                    {{ getStatusLabel(data.data.status) }}
                  </el-tag>
                </span>
              </template>
            </el-tree>
          </div>
        </el-tab-pane>

        <!-- 三角测量选项卡 -->
        <el-tab-pane label="三角测量" name="triangle">
          <div class="panel-content">
            <div class="measurement-section">
              <div class="section-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>坡度/距离测量</span>
              </div>
              
              <div class="measurement-controls">
                <div style="margin-bottom: 16px; color: #b4b8c2; font-size: 12px; line-height: 1.5;">
                  点击场景中的两个点，系统将自动计算两点间的斜距、水平距离、垂直高度差以及坡度角度。
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                  <el-button 
                    type="primary" 
                    :icon="isMeasuringTriangle ? 'VideoPause' : 'VideoPlay'"
                    @click="toggleTriangleMeasurement"
                    style="flex: 1;"
                  >
                    {{ isMeasuringTriangle ? '停止测量' : '开始测量' }}
                  </el-button>
                  <el-button 
                    type="danger" 
                    icon="Delete" 
                    plain
                    @click="clearTriangleMeasurement"
                  >
                    清除
                  </el-button>
                </div>

                <!-- 状态提示 -->
                <div v-if="triangleStatus" style="margin-bottom: 16px; padding: 8px; background: rgba(255, 170, 0, 0.1); border: 1px solid rgba(255, 170, 0, 0.3); border-radius: 4px; color: #ffaa00; font-size: 13px; text-align: center;">
                  {{ triangleStatus }}
                </div>

                <!-- 测量结果展示 -->
                <div v-if="props.triangleResults && props.triangleResults.length > 0" class="triangle-results-list">
                  <div v-for="(result, index) in props.triangleResults" :key="result.id || index" class="current-result" style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <span style="color: #00d4ff; font-size: 13px;">测量 {{ index + 1 }}</span>
                      <el-button type="danger" link size="small" @click="emit('delete-triangle', result.id!)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    
                    <div class="result-stats" style="grid-template-columns: 1fr 1fr;">
                      <div class="stat-item info">
                        <div class="stat-label">斜边距离</div>
                        <div class="stat-value">{{ (result.metadata as TriangleMeasurementResult).slopeDistance.toFixed(2) }} m</div>
                      </div>
                      <div class="stat-item info">
                        <div class="stat-label">水平距离</div>
                        <div class="stat-value">{{ (result.metadata as TriangleMeasurementResult).horizontalDistance.toFixed(2) }} m</div>
                      </div>
                      <div class="stat-item cut">
                        <div class="stat-label">垂直高度</div>
                        <div class="stat-value">{{ (result.metadata as TriangleMeasurementResult).verticalDistance.toFixed(2) }} m</div>
                      </div>
                      <div class="stat-item warning">
                        <div class="stat-label">坡度角度</div>
                        <div class="stat-value">{{ (result.metadata as TriangleMeasurementResult).angle.toFixed(1) }}°</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 方量测量选项卡 -->
        <el-tab-pane label="方量测量" name="measurement">
          <div class="panel-content">
            <!-- 测量控制区 -->
            <div class="measurement-section">
              <div class="section-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>方量计算</span>
              </div>
              <div class="measurement-controls">
                <el-form label-position="top" size="small">
                  <!-- 模型尺寸信息（一开始就显示） -->
                  <div v-if="props.modelHeightRange" class="model-info-box" style="margin-bottom: 16px; padding: 12px; background: rgba(0, 212, 255, 0.08); border-radius: 6px; border: 1px solid rgba(0, 212, 255, 0.2);">
                    <div style="color: #00d4ff; font-size: 13px; margin-bottom: 8px; font-weight: 500;">
                      📏 模型信息
                    </div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); line-height: 1.8;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>场景模型高度:</span>
                        <span style="color: rgba(255, 255, 255, 0.6); font-weight: 500;">
                          {{ props.modelHeightRange.min.toFixed(2) }} ~ {{ props.modelHeightRange.max.toFixed(2) }} m
                        </span>
                      </div>
                      <div v-if="heightOffset !== 0" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>实际高度范围:</span>
                        <span style="color: #00d4ff; font-weight: 500;">
                          {{ (props.modelHeightRange.min + heightOffset).toFixed(2) }} ~ {{ (props.modelHeightRange.max + heightOffset).toFixed(2) }} m
                        </span>
                      </div>
                      <div v-if="props.modelSize" style="display: flex; justify-content: space-between;">
                        <span>模型尺寸:</span>
                        <span style="color: #00d4ff; font-weight: 500;">
                          {{ props.modelSize.width.toFixed(2) }}×{{ props.modelSize.depth.toFixed(2) }}×{{ props.modelSize.height.toFixed(2) }} m
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 高度差值 -->
                  <el-form-item>
                    <template #label>
                      <span style="color: #ffffff;">高度差值（实际-场景）</span>
                    </template>
                    <el-input-number
                      v-model="heightOffset"
                      :min="-100"
                      :max="100"
                      :step="0.1"
                      :precision="2"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <div class="form-hint">
                      实际高度与场景高度的差值（如实际-19m，场景-7m，则差值为-12m）
                    </div>
                  </el-form-item>

                  <el-form-item>
                    <template #label>
                      <span style="color: #ffffff;">
                        基准高度 
                        <span v-if="heightOffset !== 0" style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                          (实际)
                        </span>
                        (m)
                      </span>
                    </template>
                    <el-input-number
                      v-model="displayedTargetHeight"
                      :min="actualHeightRange.min"
                      :max="actualHeightRange.max"
                      :step="0.1"
                      :precision="2"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <div class="form-hint">
                      <span v-if="heightOffset !== 0" style="color: rgba(0, 212, 255, 0.8);">
                        水平切面高度 (场景: {{ targetHeight.toFixed(2) }}m, 实际: {{ displayedTargetHeight.toFixed(2) }}m)
                        <br>
                        有效范围: {{ actualHeightRange.min.toFixed(2) }} ~ {{ actualHeightRange.max.toFixed(2) }}m
                      </span>
                      <span v-else-if="props.modelHeightRange">
                        水平切面的高度（场景坐标）
                        <br>
                        有效范围: {{ actualHeightRange.min.toFixed(2) }} ~ {{ actualHeightRange.max.toFixed(2) }}m
                      </span>
                      <span v-else>
                        水平切面的高度
                      </span>
                    </div>
                  </el-form-item>

                  <el-form-item label="采样分辨率 (m)" v-if="false">
                    <el-input-number
                      v-model="sampleResolution"
                      :min="0.5"
                      :max="5"
                      :step="0.5"
                      :precision="1"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <div class="form-hint">
                      建议值: 1.0-2.0m。分辨率越小，精度越高，但计算时间更长
                    </div>
                  </el-form-item>

                  <!-- 高级参数折叠面板 -->
                  <el-collapse v-model="activeAdvanced" style="margin-bottom: 16px;">
                    <el-collapse-item title="高级参数" name="advanced">
                      <!-- 圆柱扣除 -->
                      <div style="padding: 12px; background: rgba(255, 170, 0, 0.05); border-radius: 6px;">
                        <div style="color: #ffaa00; font-size: 13px; margin-bottom: 8px; font-weight: 500;">
                          风机基础扣除（可选）
                        </div>
                        <el-form-item style="margin-bottom: 0;">
                          <template #label>
                            <span style="color: #ffffff;">圆柱半径 (m)</span>
                          </template>
                          <el-input-number
                            v-model="cylinderRadius"
                            :min="0"
                            :max="10"
                            :step="0.1"
                            :precision="2"
                            controls-position="right"
                            style="width: 100%"
                          />
                          <div class="form-hint">
                            风机基础半径，0表示不扣除
                          </div>
                        </el-form-item>

                        <div v-if="cylinderRadius > 0 && hasModel && modelHeightRange" style="margin-top: 8px; padding: 8px; background: rgba(255, 170, 0, 0.1); border-radius: 4px; font-size: 12px; color: #ffaa00;">
                          <div v-if="heightOffset !== 0">
                            圆柱高度（自动）: {{ calculatedCylinderHeight.toFixed(2) }} m (场景) / {{ (calculatedCylinderHeight + heightOffset).toFixed(2) }} m (实际)
                          </div>
                          <div v-else>
                            圆柱高度（自动）: {{ calculatedCylinderHeight.toFixed(2) }} m
                          </div>
                          <div style="color: rgba(255, 255, 255, 0.6); margin-top: 4px;">
                            从坑底({{ modelHeightRange.min.toFixed(2) }}m) 到基准面({{ targetHeight.toFixed(2) }}m)
                          </div>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>

                  <el-form-item>
                    <el-button
                      type="primary"
                      :loading="isCalculating"
                      :disabled="!hasModel"
                      style="width: 100%"
                      @click="emit('calculate')"
                    >
                      <el-icon><DataAnalysis /></el-icon>
                      计算方量
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 当前测量结果区 -->
            <div v-if="measureResult" class="measurement-section">
              <div class="section-title">
                <el-icon><CirclePlus /></el-icon>
                <span>当前测量结果</span>
                <!-- 单位选择 -->
                <el-select 
                  v-model="selectedUnit" 
                  size="small" 
                  style="width: 80px; margin-left: auto;"
                  @change="handleUnitChange"
                >
                  <el-option label="m³" value="m³" />
                  <el-option label="L" value="L" />
                  <el-option label="dm³" value="dm³" />
                </el-select>
              </div>
              <div class="current-result">
                <div class="result-stats">
                  <div class="stat-item cut">
                    <div class="stat-label">挖方</div>
                    <div class="stat-value">{{ formatDisplayValue(displayedValues.cutVolume) }} {{ selectedUnit }}</div>
                  </div>
                  <div class="stat-item fill">
                    <div class="stat-label">原始填方</div>
                    <div class="stat-value">{{ formatDisplayValue(displayedValues.fillVolume) }} {{ selectedUnit }}</div>
                  </div>
                  <!-- 圆柱扣除显示 -->
                  <div v-if="measureResult.cylinderDeduction" class="stat-item deduction">
                    <div class="stat-label">圆柱扣除</div>
                    <div class="stat-value">{{ formatDisplayValue(displayedValues.cylinderDeduction) }} {{ selectedUnit }}</div>
                  </div>
                  <div v-if="measureResult.actualFillVolume" class="stat-item actual-fill">
                    <div class="stat-label">实际填方</div>
                    <div class="stat-value">{{ formatDisplayValue(displayedValues.actualFillVolume) }} {{ selectedUnit }}</div>
                  </div>
                  <div class="stat-item total">
                    <div class="stat-label">总方量</div>
                    <div class="stat-value">{{ formatDisplayValue(displayedValues.totalVolume) }} {{ selectedUnit }}</div>
                  </div>
                  <div class="stat-item area">
                    <div class="stat-label">水平面积</div>
                    <div class="stat-value">{{ measureResult.horizontalArea.toFixed(2) }} m²</div>
                  </div>
                  <!-- 模型尺寸信息 -->
                  <div v-if="measureResult.modelSize" class="stat-item info" style="grid-column: 1 / -1;">
                    <div class="stat-label">模型尺寸</div>
                    <div class="stat-value" style="font-size: 12px; line-height: 1.5;">
                      宽{{ measureResult.modelSize.width.toFixed(2) }}m × 
                      高{{ measureResult.modelSize.height.toFixed(2) }}m × 
                      深{{ measureResult.modelSize.depth.toFixed(2) }}m
                    </div>
                  </div>
                </div>
                <div class="result-actions">
                  <el-button
                    type="success"
                    size="small"
                    @click="emit('save-result')"
                  >
                    <el-icon><CirclePlus /></el-icon>
                    保存结果
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    @click="emit('clear-result')"
                  >
                    <el-icon><Delete /></el-icon>
                    清除
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 已保存的结果区 -->
            <div v-if="savedResults.length > 0" class="measurement-section">
              <div class="section-title">
                <el-icon><Tickets /></el-icon>
                <span>已保存的测量 ({{ savedResults.length }})</span>
              </div>
              <div class="saved-results">
                <div class="saved-list">
                  <div
                    v-for="(result, index) in savedResults"
                    :key="index"
                    class="saved-item"
                  >
                    <div class="saved-info">
                      <div class="saved-title">测量 {{ index + 1 }}</div>
                      <div class="saved-data">
                        <span>挖方: {{ result.cutVolume.toFixed(2) }} m³</span>
                        <span>填方: {{ result.fillVolume.toFixed(2) }} m³</span>
                        <span>总计: {{ result.totalVolume.toFixed(2) }} m³</span>
                      </div>
                    </div>
                    <el-button
                      type="danger"
                      size="small"
                      text
                      @click="emit('delete-saved', index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * MeasurementPanel - 测量面板组件
 * 职责：
 * 1. 显示风机列表树形结构
 * 2. 提供方量测量参数输入
 * 3. 显示测量结果
 * 4. 管理已保存的测量结果
 */

import { ref, watch, onMounted, computed } from 'vue'
import {
  Close,
  Fold,
  Connection,
  DataAnalysis,
  CirclePlus,
  Delete,
  Tickets
} from '@element-plus/icons-vue'
import type { TreeNode } from '@/data/windmills'
import { 
  type VolumeResult, 
  VolumeUnit, 
  convertVolume 
} from '@/services/babylon/VolumeCalculationService'
import type { MeasurementResult, TriangleMeasurementResult } from '@/services/babylon/MeasurementService'
import route from 'koa-route';
import router from '@/router'

// Props
interface Props {
  visible: boolean
  treeData: TreeNode[]
  currentWindmillId: string
  targetHeight: number
  sampleResolution: number
  measureResult: VolumeResult | null
  triangleResults?: MeasurementResult[]
  savedResults: VolumeResult[]
  isCalculating: boolean
  hasModel: boolean
  modelHeightRange?: { min: number; max: number } | null
  modelSize?: { width: number; height: number; depth: number } | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:targetHeight': [value: number]
  'update:sampleResolution': [value: number]
  'update:heightOffset': [value: number]
  'update:cylinderRadius': [value: number]
  'node-click': [data: any]
  'calculate': []
  'save-result': []
  'clear-result': []
  'delete-saved': [index: number]
  'start-triangle-measure': []
  'clear-triangle-measure': []
  'delete-triangle': [id: string]
}>()

// Refs
const treeRef = ref()
const activeTab = ref('windmill') // 默认显示风机列表
const activeAdvanced = ref([]) // 高级参数折叠状态
const triangleStatus = ref('') // 三角测量状态提示

// 暴露给父组件的方法
const setTriangleStatus = (status: string) => {
  triangleStatus.value = status
}

defineExpose({
  setTriangleStatus
})

// 双向绑定
const targetHeight = ref(props.targetHeight)
const sampleResolution = ref(props.sampleResolution)

// 新增参数
const heightOffsetValue = ref(0) // 高度差值（实际高度 - 场景高度，单位：米）
const cylinderRadius = ref(0)

// computed双向绑定
const heightOffset = computed({
  get: () => heightOffsetValue.value,
  set: (value) => {
    heightOffsetValue.value = value
    emit('update:heightOffset', value)
  }
})

// 显示用的基准高度（应用差值后）
const displayedTargetHeight = computed({
  get: () => targetHeight.value + heightOffsetValue.value,
  set: (value) => {
    // 用户输入的是现实高度，需要转换回场景高度
    const modelHeight = value - heightOffsetValue.value
    targetHeight.value = modelHeight
  }
})

// 计算属性：实际高度的范围限制（应用差值后）
const actualHeightRange = computed(() => {
  if (!props.modelHeightRange) {
    return { min: -1000, max: 1000 } // 默认范围
  }
  
  // 实际高度 = 场景高度 + 差值
  // 例如：场景 -7.18~1.70，差值 -12，则实际 -19.18~-10.30
  const actualMin = props.modelHeightRange.min + heightOffsetValue.value
  const actualMax = props.modelHeightRange.max + heightOffsetValue.value
  
  return {
    min: actualMin,
    max: actualMax
  }
})

// 计算属性：圆柱高度（从坑底到基准面）
const calculatedCylinderHeight = computed(() => {
  if (!props.modelHeightRange || cylinderRadius.value <= 0) return 0
  const height = targetHeight.value - props.modelHeightRange.min
  return Math.max(0, height)
})

// 单位选择
const selectedUnit = ref('m³')

// 单位转换后的显示值
const displayedValues = ref({
  cutVolume: 0,
  fillVolume: 0,
  totalVolume: 0,
  cylinderDeduction: 0,
  actualFillVolume: 0
})

// 监听 treeData 变化，用于调试
watch(() => props.treeData, (newData) => {
  console.log('📊 MeasurementPanel treeData 更新:', newData)
  console.log('📊 treeData 长度:', newData?.length)
}, { immediate: true })

watch(() => props.currentWindmillId, (newId) => {
  console.log('🔑 MeasurementPanel currentWindmillId 更新:', newId)
}, { immediate: true })

onMounted(() => {
  console.log('✅ MeasurementPanel 已挂载')
  console.log('📊 初始 treeData:', props.treeData)
  console.log('🔑 初始 currentWindmillId:', props.currentWindmillId)
})

// 监听变化并向上传递
watch(() => targetHeight.value, (val) => emit('update:targetHeight', val))
watch(() => sampleResolution.value, (val) => emit('update:sampleResolution', val))
watch(() => cylinderRadius.value, (val) => emit('update:cylinderRadius', val))

watch(() => props.targetHeight, (val) => targetHeight.value = val)
watch(() => props.sampleResolution, (val) => sampleResolution.value = val)

/**
 * 树节点点击
 */
const handleTreeNodeClick = (data: any) => {
  emit('node-click', data)
}

/**
 * 获取状态标签
 */
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '停止',
    maintenance: '维护中',
    warning: '告警',
    offline: '离线'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    running: 'success',
    stopped: 'info',
    maintenance: 'warning',
    warning: 'warning',
    offline: 'danger'
  }
  return typeMap[status] || 'info'
}

/**
 * 单位转换映射
 */
const getVolumeUnit = (unitStr: string): VolumeUnit => {
  const unitMap: Record<string, VolumeUnit> = {
    'm³': VolumeUnit.CubicMeter,
    'L': VolumeUnit.Liter,
    'dm³': VolumeUnit.CubicDecimeter,
    'cm³': VolumeUnit.CubicCentimeter
  }
  return unitMap[unitStr] || VolumeUnit.CubicMeter
}

/**
 * 处理单位切换
 */
const handleUnitChange = () => {
  if (!props.measureResult) return
  
  const unit = getVolumeUnit(selectedUnit.value)
  displayedValues.value = {
    cutVolume: convertVolume(props.measureResult.cutVolume, unit),
    fillVolume: convertVolume(props.measureResult.fillVolume, unit),
    totalVolume: convertVolume(props.measureResult.totalVolume, unit),
    cylinderDeduction: props.measureResult.cylinderDeduction 
      ? convertVolume(props.measureResult.cylinderDeduction, unit) 
      : 0,
    actualFillVolume: props.measureResult.actualFillVolume 
      ? convertVolume(props.measureResult.actualFillVolume, unit) 
      : convertVolume(props.measureResult.fillVolume, unit)
  }
}

/**
 * 监听测量结果变化，更新显示值
 */
watch(() => props.measureResult, (newResult) => {
  if (newResult) {
    handleUnitChange()
  }
}, { immediate: true })

/**
 * 格式化显示数值
 */
const formatDisplayValue = (value: number): string => {
  if (selectedUnit.value === 'L' || selectedUnit.value === 'cm³') {
    return value.toFixed(0)
  }
  return value.toFixed(2)
}

function toggleTriangleMeasurement(){
  const baseUrl = import.meta.env.BASE_URL
  const url = `${baseUrl}test.html`.replace('//', '/')
  window.open(url, '_blank')
}
</script>

<style scoped lang="less">
@primary-blue: #00d4ff;
@secondary-blue: #0099ff;
@success-green: #00ff88;
@warning-orange: #ffaa00;
@danger-red: #ff4444;
@dark-bg: rgba(52, 81, 133, 0.85);
@panel-bg: rgba(74, 110, 165, 0.9);
@border-color: rgba(159, 222, 235, 0.2);
@text-primary: #fafafa;
@text-secondary: #e9b3b3;
@text-light: #b4b8c2;

.left-panel {
  position: absolute;
  top: 70px;
  left: 20px;
  width: 360px;
  max-height: calc(100vh - 140px);
  background: @panel-bg;
  backdrop-filter: blur(12px);
  border: 1px solid @border-color;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 100;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 153, 255, 0.1));
    border-bottom: 1px solid @border-color;
    color: @text-primary;
    font-weight: 600;

    .close-btn {
      cursor: pointer;
      font-size: 18px;
      transition: all 0.3s;

      &:hover {
        color: @primary-blue;
        transform: rotate(90deg);
      }
    }
  }

  // el-tabs 样式
  :deep(.el-tabs) {
    .el-tabs__header {
      margin: 0;
      background: rgba(0, 0, 0, 0.2);
    }

    .el-tabs__nav-wrap {
      padding: 8px;
    }

    .el-tabs__item {
      color: @text-secondary;
      
      &.is-active {
        color: @primary-blue;
      }
    }

    .el-tabs__content {
      padding: 0;
    }
  }

  .panel-content {
    padding: 16px;
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    
    // 确保树形组件可见
    :deep(.el-tree) {
      background: transparent;
      color: @text-primary;
      
      .el-tree-node__content {
        height: 36px;
        line-height: 36px;
        
        &:hover {
          background-color: rgba(0, 212, 255, 0.1);
        }
      }
      
      .el-tree-node.is-current > .el-tree-node__content {
        background-color: rgba(0, 212, 255, 0.2);
      }
    }

    // 测量区块样式
    .measurement-section {
      margin-bottom: 20px;
      padding: 16px;
      background: rgba(0, 212, 255, 0.05);
      border: 1px solid @border-color;
      border-radius: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid @border-color;
        color: @primary-blue;
        font-weight: 600;
        font-size: 14px;

        .el-icon {
          font-size: 16px;
        }
      }
    }

    .measurement-controls {
      .form-hint {
        margin-top: 4px;
        font-size: 12px;
        color: @text-light;
      }

      :deep(.el-form-item) {
        margin-bottom: 16px;
      }

      :deep(.el-button) {
        height: 36px;
        font-weight: 500;
      }

      :deep(.el-collapse) {
        border: none;
        background: transparent;

        .el-collapse-item__header {
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid @border-color;
          border-radius: 6px;
          color: @primary-blue;
          padding: 0 12px;
          height: 36px;
          line-height: 36px;
        }

        .el-collapse-item__wrap {
          background: transparent;
          border: none;
        }

        .el-collapse-item__content {
          padding: 12px 0 0 0;
          color: @text-primary;
        }
      }
    }

    .current-result {
      .result-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;

        .stat-item {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          border-left: 3px solid;

          &.cut {
            border-color: @warning-orange;
          }

          &.fill {
            border-color: @secondary-blue;
          }

          &.total {
            border-color: @primary-blue;
          }

          &.area {
            border-color: @success-green;
          }

          &.deduction {
            border-color: #ff6b6b;
          }

          &.actual-fill {
            border-color: #51cf66;
          }

          &.info {
            border-color: #339af0;
          }

          .stat-label {
            font-size: 12px;
            color: @text-secondary;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 14px;
            font-weight: 600;
            color: @text-primary;
          }
        }
      }

      .result-actions {
        display: flex;
        gap: 8px;
        
        :deep(.el-button) {
          flex: 1;
        }
      }
    }

    .saved-results {
      .saved-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .saved-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.1);
          border-radius: 6px;
          transition: all 0.3s;

          &:hover {
            background: rgba(0, 0, 0, 0.3);
            border-color: @border-color;
          }

          .saved-info {
            flex: 1;

            .saved-title {
              font-size: 13px;
              color: @text-primary;
              margin-bottom: 6px;
              font-weight: 500;
            }

            .saved-data {
              display: flex;
              flex-direction: column;
              gap: 2px;
              font-size: 12px;
              color: @text-secondary;
            }
          }
        }
      }
    }
  }
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  width: 100%;

  .node-icon {
    color: @primary-blue;
    font-size: 16px;
  }

  .status-tag {
    margin-left: auto;
  }
}

.empty-hint {
  padding: 20px;
  text-align: center;
}

// 滑入动画
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}
</style>
