/**
 * 骨架屏组件 - 地图加载
 * 在地图加载时显示，避免空白页
 */
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  showProgress?: boolean    // 是否显示进度条
  message?: string          // 加载提示信息
  progress?: number         // 加载进度 0-100
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true,
  message: '正在加载地图...',
  progress: 0
})

const animationClass = ref('fade-in')

onMounted(() => {
  setTimeout(() => {
    animationClass.value = 'fade-in pulse'
  }, 100)
})
</script>

<template>
  <div class="map-skeleton" :class="animationClass">
    <!-- 顶部工具栏骨架 -->
    <div class="skeleton-header">
      <div class="skeleton-logo"></div>
      <div class="skeleton-nav">
        <div class="skeleton-nav-item"></div>
        <div class="skeleton-nav-item"></div>
        <div class="skeleton-nav-item"></div>
      </div>
      <div class="skeleton-toolbar">
        <div class="skeleton-icon"></div>
        <div class="skeleton-icon"></div>
        <div class="skeleton-icon"></div>
      </div>
    </div>

    <!-- 地图区域骨架 -->
    <div class="skeleton-map-area">
      <!-- 地图背景渐变 -->
      <div class="skeleton-map-bg"></div>

      <!-- 左侧面板骨架 -->
      <div class="skeleton-left-panel">
        <div class="skeleton-panel-header"></div>
        <div class="skeleton-panel-item"></div>
        <div class="skeleton-panel-item"></div>
        <div class="skeleton-panel-item"></div>
      </div>

      <!-- 右侧控制器骨架 -->
      <div class="skeleton-right-controls">
        <div class="skeleton-control-btn"></div>
        <div class="skeleton-control-btn"></div>
        <div class="skeleton-control-btn"></div>
      </div>

      <!-- 中心加载指示器 -->
      <div class="skeleton-center-loader">
        <div class="loader-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        
        <div class="loader-text">
          <div class="loader-message">{{ message }}</div>
          
          <div v-if="showProgress" class="loader-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
            <div class="progress-text">{{ progress }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态栏骨架 -->
    <div class="skeleton-footer">
      <div class="skeleton-footer-item"></div>
      <div class="skeleton-footer-item"></div>
      <div class="skeleton-footer-item"></div>
    </div>
  </div>
</template>

<style scoped>
/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.map-skeleton {
  position: fixed;
  inset: 0;
  background: #f5f7fa;
  animation: fadeIn 0.3s ease-in-out;
}

.fade-in.pulse {
  animation: fadeIn 0.3s ease-in-out, pulse 2s ease-in-out infinite;
}

/* 骨架元素通用样式 */
.skeleton-header,
.skeleton-footer,
.skeleton-left-panel,
.skeleton-right-controls,
.skeleton-logo,
.skeleton-nav-item,
.skeleton-icon,
.skeleton-panel-header,
.skeleton-panel-item,
.skeleton-control-btn,
.skeleton-footer-item {
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #f0f0f0 50%,
    #e0e0e0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 4px;
}

/* 顶部工具栏 */
.skeleton-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.skeleton-logo {
  width: 150px;
  height: 40px;
}

.skeleton-nav {
  display: flex;
  gap: 20px;
  flex: 1;
  margin: 0 40px;
}

.skeleton-nav-item {
  width: 80px;
  height: 32px;
}

.skeleton-toolbar {
  display: flex;
  gap: 12px;
}

.skeleton-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

/* 地图区域 */
.skeleton-map-area {
  position: relative;
  height: calc(100vh - 60px - 40px);
  overflow: hidden;
}

.skeleton-map-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 50%,
    #f093fb 100%
  );
  opacity: 0.1;
}

/* 左侧面板 */
.skeleton-left-panel {
  position: absolute;
  left: 20px;
  top: 20px;
  width: 280px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-panel-header {
  height: 40px;
  margin-bottom: 16px;
}

.skeleton-panel-item {
  height: 60px;
  margin-bottom: 12px;
}

.skeleton-panel-item:last-child {
  margin-bottom: 0;
}

/* 右侧控制器 */
.skeleton-right-controls {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-control-btn {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 中心加载器 */
.skeleton-center-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.loader-spinner {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
}

.spinner-ring {
  position: absolute;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.spinner-ring:nth-child(2) {
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  animation-duration: 1.2s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  animation-duration: 1s;
}

.loader-text {
  color: #666;
}

.loader-message {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #333;
}

.loader-progress {
  width: 300px;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease-out;
}

.progress-text {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

/* 底部状态栏 */
.skeleton-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
}

.skeleton-footer-item {
  width: 120px;
  height: 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .skeleton-left-panel {
    width: 220px;
  }

  .skeleton-nav {
    display: none;
  }

  .loader-progress {
    width: 240px;
  }
}
</style>
