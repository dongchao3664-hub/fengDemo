<template>
  <canvas ref="canvasRef" class="babylon-canvas"></canvas>
</template>

<script setup lang="ts">
/**
 * BabylonCanvas - BabylonJS 渲染画布组件
 * 职责：
 * 1. 提供 Canvas 元素
 * 2. 初始化 BabylonJS 场景
 * 3. 加载和管理 3D 模型
 * 4. 暴露场景和模型引用供外部使用
 * 
 * 类似于 GisViewer，但针对 BabylonJS
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { babylonService } from '@/services/babylon/BabylonService'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const emit = defineEmits<{
  ready: [scene: any]
  error: [error: Error]
  loadProgress: [percent: number]
  modelLoaded: [model: any]
}>()

/**
 * 初始化 BabylonJS 场景
 */
const initializeScene = () => {
  if (!canvasRef.value) {
    console.error('❌ Canvas 元素未找到')
    emit('error', new Error('Canvas 元素未找到'))
    return
  }

  try {
    console.log('🎬 初始化 BabylonJS 场景')
    babylonService.initialize(canvasRef.value)
    
    const scene = babylonService.getScene()
    if (scene) {
      console.log('✅ BabylonJS 场景初始化成功')
      emit('ready', scene)
    } else {
      throw new Error('场景初始化失败')
    }
  } catch (error) {
    console.error('❌ BabylonJS 场景初始化失败:', error)
    emit('error', error as Error)
  }
}

/**
 * 加载模型
 * @param modelUrl 模型 URL
 */
const loadModel = async (modelUrl: string) => {
  if (!modelUrl) {
    console.warn('⚠️ 模型 URL 为空')
    return null
  }

  try {
    console.log('📦 开始加载模型:', modelUrl)

    // 清理旧模型
    babylonService.clearScene()

    // 加载新模型
    const mesh = await babylonService.loadModel(modelUrl, (evt: ProgressEvent) => {
      if (evt.lengthComputable) {
        const percent = (evt.loaded / evt.total) * 100
        emit('loadProgress', percent)
        console.log(`📦 加载进度: ${percent.toFixed(1)}%`)
      }
    })

    if (mesh) {
      console.log('✅ 模型加载成功')
      emit('modelLoaded', mesh)
      return mesh
    } else {
      throw new Error('模型加载失败')
    }
  } catch (error) {
    console.error('❌ 模型加载失败:', error)
    emit('error', error as Error)
    return null
  }
}

/**
 * 重置相机
 */
const resetCamera = () => {
  babylonService.resetCamera()
}

/**
 * 清理场景
 */
const clearScene = () => {
  babylonService.clearScene()
}

/**
 * 获取场景
 */
const getScene = () => {
  return babylonService.getScene()
}

/**
 * 获取当前模型
 */
const getCurrentModel = () => {
  return babylonService.getCurrentModel()
}

/**
 * 显示调试器
 */
const showInspector = (embedded: boolean) => {
  babylonService.showInspector(embedded)
}

// 暴露方法给父组件
defineExpose({
  loadModel,
  resetCamera,
  clearScene,
  getScene,
  getCurrentModel,
  showInspector
})

onMounted(() => {
  console.log('🎬 BabylonCanvas 已挂载')
  initializeScene()
})

onBeforeUnmount(() => {
  console.log('🔌 BabylonCanvas 卸载中，清理资源')
  babylonService.dispose()
})
</script>

<style scoped lang="less">
.babylon-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}
</style>
