<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="chart-controls">
      <el-space>
        <el-button 
          :type="viewMode === 'single' ? 'primary' : 'default'"
          @click="viewMode = 'single'"
        >
          <el-icon><Connection /></el-icon>
          当前线段
        </el-button>
        <el-button 
          :type="viewMode === 'all' ? 'primary' : 'default'"
          @click="viewMode = 'all'"
        >
          <el-icon><DataAnalysis /></el-icon>
          全部数据
        </el-button>
        <el-divider direction="vertical" />
        <span>预警阈值：</span>
        <el-input-number
          v-model="warningThreshold"
          :min="-100"
          :max="100"
          :step="0.5"
          size="small"
          style="width: 120px"
          @change="updateChart"
        />
        <span>米</span>
      </el-space>
    </div>

    <div ref="chartRef" class="chart-container"></div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="exportData">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { Connection, DataAnalysis, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface CablePoint {
  lon: number
  lat: number
  alt: number
  name?: string
  raw?: {
    x: number
    y: number
    z: number
  }
}

interface CableData {
  id: string
  name: string
  type: number
  points: CablePoint[]
}

interface Props {
  cableData?: CableData
  allCablesData?: CableData[]
}

const props = defineProps<Props>()
const visible = defineModel<boolean>('visible', { default: false })

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const viewMode = ref<'single' | 'all'>('single')
const warningThreshold = ref(0.6) // 默认预警阈值

const dialogTitle = computed(() => {
  if (viewMode.value === 'single' && props.cableData) {
    return `海缆高程分析 - ${props.cableData.name}`
  }
  return '海缆高程分析 - 全部数据'
})

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()

  // 响应式调整
  window.addEventListener('resize', handleResize)
}

// 销毁图表
const destroyChart = () => {
  if (chartInstance) {
    window.removeEventListener('resize', handleResize)
    chartInstance.dispose()
    chartInstance = null
  }
}

// 处理窗口大小变化
const handleResize = () => {
  chartInstance?.resize()
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return

  const option = viewMode.value === 'single' 
    ? getSingleCableOption() 
    : getAllCablesOption()

  chartInstance.setOption(option, true)
}

// 获取单条海缆的图表配置
const getSingleCableOption = (): EChartsOption => {
  if (!props.cableData?.points) {
    return getEmptyOption()
  }

  const points = props.cableData.points
  const xData = points.map((p, idx) => p.name || `点${idx + 1}`)
  const yData = points.map(p => p.alt || 0)

  return {
    title: {
      text: props.cableData.name,
      subtext: `共 ${points.length} 个测量点`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        const point = points[param.dataIndex]
        return `
          <div style="padding: 8px;">
            <strong>${param.name}</strong><br/>
            高程: ${param.value.toFixed(2)} 米<br/>
            经度: ${point.lon.toFixed(6)}°<br/>
            纬度: ${point.lat.toFixed(6)}°
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '22%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: 45,
        interval: 0
      },
      name: '测量点'
    },
    yAxis: {
      type: 'value',
      name: '高程 (米)',
      min: 'dataMin',
      axisLabel: {
        formatter: '{value} m'
      }
    },
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: 100,
        bottom: '12%',
        height: 20
      },
      {
        type: 'inside',
        start: 0,
        end: 100
      }
    ],
    visualMap: {
      show: true,
      dimension: 1,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      pieces: [
        {
          lt: warningThreshold.value - 0.1,
          label: `正常 (< ${(warningThreshold.value - 0.1).toFixed(1)}m)`,
          color: '#67C23A'
        },
        {
          gte: warningThreshold.value - 0.1,
          lte: warningThreshold.value + 0.1,
          label: `接近预警 (${(warningThreshold.value - 0.1).toFixed(1)}-${(warningThreshold.value + 0.1).toFixed(1)}m)`,
          color: '#E6A23C'
        },
        {
          gt: warningThreshold.value + 0.1,
          label: `预警 (> ${(warningThreshold.value + 0.1).toFixed(1)}m)`,
          color: '#F56C6C'
        }
      ],
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '高程',
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        itemStyle: {},

        markLine: {
          silent: false,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            color: '#F56C6C',
            width: 2
          },
          label: {
            show: true,
            formatter: `预警线: ${warningThreshold.value}m`,
            position: 'insideEndTop',
            color: '#fff',
            backgroundColor: '#F56C6C',
            padding: [4, 8],
            borderRadius: 3,
            fontSize: 12
          },
          data: [
            {
              yAxis: warningThreshold.value
            }
          ]
        }
      }
    ]
  }
}

// 获取全部海缆的图表配置
const getAllCablesOption = (): EChartsOption => {
  if (!props.allCablesData || props.allCablesData.length === 0) {
    return getEmptyOption()
  }

  // 收集所有点
  const allPoints: Array<{ name: string; alt: number; cableName: string; point: CablePoint }> = []
  
  props.allCablesData.forEach(cable => {
    cable.points.forEach((point, idx) => {
      allPoints.push({
        name: point.name || `${cable.name}-点${idx + 1}`,
        alt: point.alt || 0,
        cableName: cable.name,
        point
      })
    })
  })

  const xData = allPoints.map(p => p.name)
  const yData = allPoints.map(p => p.alt)

  return {
    title: {
      text: '全部海缆高程分析',
      subtext: `共 ${props.allCablesData.length} 条海缆，${allPoints.length} 个测量点`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        const pointData = allPoints[param.dataIndex]
        return `
          <div style="padding: 8px;">
            <strong>${pointData.cableName}</strong><br/>
            点位: ${pointData.name}<br/>
            高程: ${param.value.toFixed(2)} 米<br/>
            经度: ${pointData.point.lon.toFixed(6)}°<br/>
            纬度: ${pointData.point.lat.toFixed(6)}°
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '22%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        show: false // 太多点时隐藏标签
      },
      name: '测量点序号'
    },
    yAxis: {
      type: 'value',
      name: '高程 (米)',
      min: 'dataMin',
      axisLabel: {
        formatter: '{value} m'
      }
    },
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: 100, // 默认显示全部
        bottom: '12%',
        height: 20
      },
      {
        type: 'inside',
        start: 0,
        end: 100
      }
    ],
    visualMap: {
      show: true,
      dimension: 1,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      pieces: [
        {
          lt: warningThreshold.value - 0.1,
          label: `正常 (< ${(warningThreshold.value - 0.1).toFixed(1)}m)`,
          color: '#67C23A'
        },
        {
          gte: warningThreshold.value - 0.1,
          lte: warningThreshold.value + 0.1,
          label: `接近预警 (${(warningThreshold.value - 0.1).toFixed(1)}-${(warningThreshold.value + 0.1).toFixed(1)}m)`,
          color: '#E6A23C'
        },
        {
          gt: warningThreshold.value + 0.1,
          label: `预警 (> ${(warningThreshold.value + 0.1).toFixed(1)}m)`,
          color: '#F56C6C'
        }
      ],
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '高程',
        type: 'line',
        data: yData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2
        },
        itemStyle: {},
        markLine: {
          silent: false,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            color: '#F56C6C',
            width: 2
          },
          label: {
            show: true,
            formatter: `预警线: ${warningThreshold.value}m`,
            position: 'insideEndTop',
            color: '#fff',
            backgroundColor: '#F56C6C',
            padding: [4, 8],
            borderRadius: 3,
            fontSize: 12
          },
          data: [
            {
              yAxis: warningThreshold.value
            }
          ]
        }
      }
    ]
  }
}

// 空数据配置
const getEmptyOption = (): EChartsOption => {
  return {
    title: {
      text: '暂无数据',
      left: 'center',
      top: 'center'
    }
  }
}

// 导出数据
const exportData = () => {
  const data = viewMode.value === 'single' 
    ? [props.cableData] 
    : props.allCablesData

  if (!data || data.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  // 转换为CSV格式
  let csv = '海缆名称,点位名称,经度,纬度,高程\n'
  
  data.forEach(cable => {
    if (!cable) return
    cable.points.forEach((point, idx) => {
      csv += `${cable.name},${point.name || `点${idx + 1}`},${point.lon},${point.lat},${point.alt || 0}\n`
    })
  })

  // 下载
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `海缆高程数据_${new Date().getTime()}.csv`
  link.click()

  ElMessage.success('数据导出成功')
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 监听可见性变化
watch(visible, async (newVal) => {
  if (newVal) {
    await nextTick()
    initChart()
  } else {
    destroyChart()
  }
})

// 监听视图模式变化
watch(viewMode, () => {
  updateChart()
})

// 监听数据变化
watch(() => [props.cableData, props.allCablesData], () => {
  if (visible.value) {
    updateChart()
  }
}, { deep: true })

onUnmounted(() => {
  destroyChart()
})
</script>

<style scoped lang="scss">
.chart-controls {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.chart-container {
  width: 100%;
  height: 500px;
  min-height: 400px;
}
</style>
