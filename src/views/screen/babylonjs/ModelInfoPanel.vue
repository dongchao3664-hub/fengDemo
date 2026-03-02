<template>
  <Transition name="slide-fade-right">
    <div v-show="visible" class="info-panel">
      <div class="panel-header">
        <span>模型信息</span>
        <el-icon class="close-btn" @click="emit('update:visible', false)">
          <Close />
        </el-icon>
      </div>

      <div class="panel-content">
        <el-card v-if="windmillData && underwaterModel" shadow="hover">
          <!-- 风机基本信息 -->
          <template #header>
            <div class="card-header">
              <span class="windmill-name">{{ windmillData.name }}</span>
              <el-tag :type="getStatusTagType(windmillData.status)" size="large">
                {{ getStatusLabel(windmillData.status) }}
              </el-tag>
            </div>
          </template>

          <!-- 基础属性 -->
          <div class="info-section">
            <h4 class="section-title">
              <el-icon><InfoFilled /></el-icon>
              基础信息
            </h4>
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">风机编号</span>
                  <span class="value">{{ windmillData.id }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">设备编号</span>
                  <span class="value">{{ windmillData.code }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">经度</span>
                  <span class="value">{{ windmillData.position.lng.toFixed(6) }}°</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">纬度</span>
                  <span class="value">{{ windmillData.position.lat.toFixed(6) }}°</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 水下模型信息 -->
          <div class="info-section">
            <h4 class="section-title">
              <el-icon><Box /></el-icon>
              水下模型信息
            </h4>
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">模型类型</span>
                  <span class="value">{{ underwaterModel.modelType }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">创建日期</span>
                  <span class="value">{{ underwaterModel.createdDate }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">顶点数</span>
                  <span class="value">{{ underwaterModel.vertices.toLocaleString() }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">面数</span>
                  <span class="value">{{ underwaterModel.faces.toLocaleString() }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">材质数</span>
                  <span class="value">{{ underwaterModel.materials }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <span class="label">文件大小</span>
                  <span class="value">{{ underwaterModel.fileSize.toFixed(2) }} MB</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 模型描述 -->
          <div class="info-section">
            <h4 class="section-title">
              <el-icon><Document /></el-icon>
              模型描述
            </h4>
            <div class="model-description">
              <p>{{ underwaterModel.description }}</p>
              <el-divider />
              <div class="update-info">
                <span>最后更新: {{ underwaterModel.lastUpdateDate }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-empty v-else description="请从左侧列表选择风机查看详情" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * ModelInfoPanel - 模型信息面板组件
 * 职责：
 * 1. 显示风机基本信息
 * 2. 显示水下模型详细信息
 * 3. 显示检查记录
 */

import { Close, InfoFilled, Box, Document } from '@element-plus/icons-vue'
import type { Windmill, UnderwaterModelDetail } from '@/data/windmills'

// Props
interface Props {
  visible: boolean
  windmillData: Windmill | null
  underwaterModel: UnderwaterModelDetail | null
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

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
</script>

<style scoped lang="less">
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

.info-panel {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 400px;
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

  .panel-content {
    padding: 16px;
    max-height: calc(100vh - 220px);
    overflow-y: auto;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .windmill-name {
        font-size: 16px;
        font-weight: 600;
        color: @primary-blue;
      }
    }

    .info-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px 0;
        color: @primary-blue;
        font-size: 14px;
        font-weight: 600;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;

        .label {
          font-size: 12px;
          color: @text-secondary;
        }

        .value {
          font-size: 14px;
          color: @text-primary;
          font-weight: 500;
        }
      }

      .inspection-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .inspection-item {
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid @border-color;
          border-radius: 6px;

          .inspection-date {
            font-size: 12px;
            color: @text-secondary;
            margin-bottom: 6px;
          }

          .inspection-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;

            .inspection-type {
              font-size: 13px;
              color: @text-primary;
              font-weight: 500;
            }
          }

          .inspection-notes {
            font-size: 12px;
            color: @text-light;
            line-height: 1.5;
          }
        }
      }
    }
  }
}

// 滑入动画
.slide-fade-right-enter-active,
.slide-fade-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-right-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>
