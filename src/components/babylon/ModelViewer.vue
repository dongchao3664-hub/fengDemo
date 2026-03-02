<template>
  <div ref="containerRef" class="model-viewer" :style="{ width, height }">
    <canvas ref="canvasRef" class="model-viewer__canvas"></canvas>

    <!-- 加载中 -->
    <div v-if="loading" class="model-viewer__loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>

    <!-- 工具栏插槽 -->
    <div v-if="$slots.toolbar" class="model-viewer__toolbar">
      <slot name="toolbar"></slot>
    </div>

    <!-- 信息面板插槽 -->
    <div v-if="$slots.info" class="model-viewer__info">
      <slot name="info"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ModelViewer - 3D模型查看器组件
 * 功能：封装Babylon.js场景的Vue组件
 * 设计：支持模型加载、相机控制、测量工具
 */

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useBabylonScene } from '@/babylonjs'
import type * as BABYLON from 'babylonjs'

interface Props {
  width?: string
  height?: string
  modelUrl?: string
  autoLoadModel?: boolean
  showLoadingProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '100%',
  autoLoadModel: true,
  showLoadingProgress: true
})

const emit = defineEmits<{
  ready: [scene: BABYLON.Scene]
  modelLoaded: [mesh: BABYLON.AbstractMesh]
  error: [error: Error]
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(false)
const loadingProgress = ref(0)

const loadingText = computed(() => {
  if (loadingProgress.value > 0) {
    return `加载中... ${loadingProgress.value}%`
  }
  return '加载中...'
})

// 使用Babylon场景钩子
const { scene, sceneEngine, cameraManager, lightManager, glbLoader, isReady, initScene } =
  useBabylonScene()

// 暴露给父组件的方法和属性
defineExpose({
  scene,
  sceneEngine,
  cameraManager,
  lightManager,
  glbLoader,
  isReady,
  loadModel
})

onMounted(async () => {
  if (canvasRef.value) {
    try {
      // 初始化场景
      initScene(canvasRef.value, {
        antialias: true,
        adaptToDeviceRatio: true
      })

      emit('ready', scene.value!)

      // 自动加载模型
      if (props.autoLoadModel && props.modelUrl) {
        await loadModel(props.modelUrl)
      }
    } catch (error) {
      console.error('[ModelViewer] Init failed:', error)
      emit('error', error as Error)
    }
  }
})

/**
 * 加载模型
 */
async function loadModel(url: string): Promise<BABYLON.AbstractMesh | null> {
  if (!isReady.value) {
    console.warn('[ModelViewer] Scene not ready')
    return null
  }

  loading.value = true
  loadingProgress.value = 0

  try {
    const result = await glbLoader.load(url, {
      onProgress: (event) => {
        if (props.showLoadingProgress) {
          loadingProgress.value = Math.round((event.loaded / event.total) * 100)
        }
      }
    })

    // 相机聚焦到模型
    if (result.rootMesh) {
      cameraManager.focusOnTarget(result.rootMesh.position, 10)
    }

    emit('modelLoaded', result.rootMesh)
    return result.rootMesh
  } catch (error) {
    console.error('[ModelViewer] Failed to load model:', error)
    emit('error', error as Error)
    return null
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.model-viewer {
  position: relative;
  overflow: hidden;
  background: #1a1a1a;

  &__canvas {
    width: 100%;
    height: 100%;
    display: block;
    outline: none;
  }

  &__loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: #fff;

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #409eff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &__toolbar {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
  }

  &__info {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.6);
    padding: 12px 16px;
    border-radius: 4px;
    color: #fff;
    max-width: 300px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
