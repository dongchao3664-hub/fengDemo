<template>
  <div class="measurement-panel">
    <div class="measurement-panel__header">
      <h3>测量工具</h3>
      <button @click="handleClose" class="close-btn">×</button>
    </div>

    <div class="measurement-panel__content">
      <!-- 测量类型选择 -->
      <div class="measure-type">
        <button
          v-for="type in measureTypes"
          :key="type.value"
          :class="['type-btn', { active: currentType === type.value }]"
          @click="currentType = type.value"
        >
          {{ type.label }}
        </button>
      </div>

      <!-- 方量测算 -->
      <div v-if="currentType === 'volume'" class="measure-section">
        <div class="input-group">
          <label>参考高度（m）：</label>
          <input v-model.number="referenceHeight" type="number" step="0.1" />
        </div>

        <button @click="handleMeasureVolume" :disabled="calculating" class="measure-btn">
          {{ calculating ? '计算中...' : '开始测算' }}
        </button>

        <!-- 方量结果 -->
        <div v-if="volumeResult" class="result-box">
          <div class="result-item">
            <span class="label">挖方量：</span>
            <span class="value">{{ volumeResult.cutVolume }} m³</span>
          </div>
          <div class="result-item">
            <span class="label">填方量：</span>
            <span class="value">{{ volumeResult.fillVolume }} m³</span>
          </div>
          <div class="result-item highlight">
            <span class="label">总方量：</span>
            <span class="value">{{ volumeResult.totalVolume }} m³</span>
          </div>
        </div>
      </div>

      <!-- 面积测算 -->
      <div v-if="currentType === 'area'" class="measure-section">
        <button @click="handleMeasureSurfaceArea" :disabled="calculating" class="measure-btn">
          {{ calculating ? '计算中...' : '计算表面积' }}
        </button>

        <!-- 面积结果 -->
        <div v-if="areaResult" class="result-box">
          <div class="result-item highlight">
            <span class="label">表面积：</span>
            <span class="value">{{ areaResult.surfaceArea }} m²</span>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <div class="measurement-panel__footer">
      <button @click="handleClear" class="clear-btn">清除测量</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MeasurementPanel - 测量面板组件
 * 功能：提供方量、面积测算UI
 * 设计：配合useBabylonMeasure使用
 */

import { ref, computed } from 'vue'
import { useBabylonMeasure } from '@/babylonjs'
import type { SceneEngine } from '@/babylonjs/core/SceneEngine'
import type * as BABYLON from 'babylonjs'

interface Props {
  sceneEngine: SceneEngine
  targetMesh: BABYLON.Mesh | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const currentType = ref<'volume' | 'area'>('volume')
const referenceHeight = ref(0)

const measureTypes = [
  { label: '方量测算', value: 'volume' as const },
  { label: '面积测算', value: 'area' as const }
]

// 使用测量钩子
const {
  volumeResult,
  areaResult,
  isCalculating: calculating,
  error,
  measureVolume,
  measureSurfaceArea,
  clearMeasurements
} = useBabylonMeasure(props.sceneEngine)

/**
 * 测量方量
 */
async function handleMeasureVolume() {
  if (!props.targetMesh) {
    error.value = '请先加载模型'
    return
  }

  try {
    await measureVolume(props.targetMesh, referenceHeight.value)
  } catch (err) {
    console.error('[MeasurementPanel] Volume measure failed:', err)
  }
}

/**
 * 测量表面积
 */
async function handleMeasureSurfaceArea() {
  if (!props.targetMesh) {
    error.value = '请先加载模型'
    return
  }

  try {
    await measureSurfaceArea(props.targetMesh)
  } catch (err) {
    console.error('[MeasurementPanel] Surface area measure failed:', err)
  }
}

/**
 * 清除测量结果
 */
function handleClear() {
  clearMeasurements()
}

/**
 * 关闭面板
 */
function handleClose() {
  emit('close')
}
</script>

<style scoped lang="less">
.measurement-panel {
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  color: #fff;
  width: 320px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 1;

      &:hover {
        color: #409eff;
      }
    }
  }

  &__content {
    padding: 16px;
  }

  &__footer {
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .measure-type {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    .type-btn {
      flex: 1;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &.active {
        background: #409eff;
        border-color: #409eff;
      }
    }
  }

  .measure-section {
    .input-group {
      margin-bottom: 12px;

      label {
        display: block;
        font-size: 14px;
        margin-bottom: 4px;
        color: rgba(255, 255, 255, 0.8);
      }

      input {
        width: 100%;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        border-radius: 4px;
        font-size: 14px;

        &:focus {
          outline: none;
          border-color: #409eff;
        }
      }
    }

    .measure-btn {
      width: 100%;
      padding: 10px;
      background: #409eff;
      border: none;
      color: #fff;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover:not(:disabled) {
        background: #66b1ff;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .result-box {
      margin-top: 16px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;

      .result-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 14px;

        &.highlight {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-weight: 500;
          color: #67c23a;
        }

        .label {
          color: rgba(255, 255, 255, 0.7);
        }

        .value {
          font-weight: 500;
        }
      }
    }
  }

  .error-message {
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(245, 108, 108, 0.1);
    border: 1px solid rgba(245, 108, 108, 0.3);
    border-radius: 4px;
    color: #f56c6c;
    font-size: 13px;
  }

  .clear-btn {
    width: 100%;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
