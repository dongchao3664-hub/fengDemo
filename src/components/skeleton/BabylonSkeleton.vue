/**
 * 骨架屏组件 - Babylon.js 加载
 * 在 3D 场景加载时显示
 */
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  showProgress?: boolean
  message?: string
  progress?: number
  stage?: string            // 当前加载阶段
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true,
  message: '正在加载 3D 场景...',
  progress: 0,
  stage: '初始化'
})

const animationClass = ref('fade-in')

onMounted(() => {
  setTimeout(() => {
    animationClass.value = 'fade-in pulse'
  }, 100)
})
</script>

<template>
  <div class="babylon-skeleton" :class="animationClass">
    <!-- 顶部工具栏骨架 -->
    <div class="skeleton-header">
      <div class="skeleton-back-btn"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-actions">
        <div class="skeleton-action-btn"></div>
        <div class="skeleton-action-btn"></div>
        <div class="skeleton-action-btn"></div>
      </div>
    </div>

    <!-- 3D 视口区域 -->
    <div class="skeleton-viewport">
      <!-- 背景网格效果 -->
      <div class="skeleton-grid">
        <div class="grid-line" v-for="i in 10" :key="'h' + i"></div>
        <div class="grid-line vertical" v-for="i in 10" :key="'v' + i"></div>
      </div>

      <!-- 左侧工具面板骨架 -->
      <div class="skeleton-tool-panel">
        <div class="tool-section">
          <div class="tool-header"></div>
          <div class="tool-item"></div>
          <div class="tool-item"></div>
          <div class="tool-item"></div>
        </div>
        <div class="tool-section">
          <div class="tool-header"></div>
          <div class="tool-item"></div>
          <div class="tool-item"></div>
        </div>
      </div>

      <!-- 右侧属性面板骨架 -->
      <div class="skeleton-property-panel">
        <div class="property-header"></div>
        <div class="property-item"></div>
        <div class="property-item"></div>
        <div class="property-item"></div>
      </div>

      <!-- 底部测量控制栏骨架 -->
      <div class="skeleton-measure-bar">
        <div class="measure-btn"></div>
        <div class="measure-btn"></div>
        <div class="measure-btn"></div>
        <div class="measure-result"></div>
      </div>

      <!-- 中心 3D 加载指示器 -->
      <div class="skeleton-center-loader">
        <!-- 3D 立方体动画 -->
        <div class="loader-3d">
          <div class="cube">
            <div class="cube-face cube-front"></div>
            <div class="cube-face cube-back"></div>
            <div class="cube-face cube-left"></div>
            <div class="cube-face cube-right"></div>
            <div class="cube-face cube-top"></div>
            <div class="cube-face cube-bottom"></div>
          </div>
        </div>

        <div class="loader-info">
          <div class="loader-message">{{ message }}</div>
          <div class="loader-stage">当前阶段: {{ stage }}</div>
          
          <div v-if="showProgress" class="loader-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
              <div class="progress-glow" :style="{ width: `${progress}%` }"></div>
            </div>
            <div class="progress-text">{{ progress }}%</div>
          </div>

          <div class="loader-tips">
            <div class="tip">• 正在初始化 WebGL 上下文</div>
            <div class="tip">• 正在加载 3D 模型</div>
            <div class="tip">• 正在编译着色器</div>
          </div>
        </div>
      </div>

      <!-- 右下角性能监控骨架 -->
      <div class="skeleton-stats">
        <div class="stats-item"></div>
        <div class="stats-item"></div>
        <div class="stats-item"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes rotate3d {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

@keyframes glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.babylon-skeleton {
  position: fixed;
  inset: 0;
  background: #1a1a2e;
  animation: fadeIn 0.3s ease-in-out;
}

.fade-in.pulse {
  animation: fadeIn 0.3s ease-in-out, pulse 2s ease-in-out infinite;
}

/* 骨架元素通用样式 */
.skeleton-back-btn,
.skeleton-title,
.skeleton-action-btn,
.tool-header,
.tool-item,
.property-header,
.property-item,
.measure-btn,
.measure-result,
.stats-item {
  background: linear-gradient(90deg, #2a2a3e 25%, #3a3a4e 50%, #2a2a3e 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 4px;
}

/* 顶部工具栏 */
.skeleton-header {
  height: 60px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
}

.skeleton-back-btn {
  width: 100px;
  height: 36px;
}

.skeleton-title {
  width: 200px;
  height: 32px;
  flex: 1;
}

.skeleton-actions {
  display: flex;
  gap: 12px;
}

.skeleton-action-btn {
  width: 80px;
  height: 36px;
}

/* 视口区域 */
.skeleton-viewport {
  position: relative;
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
  overflow: hidden;
}

/* 网格背景 */
.skeleton-grid {
  position: absolute;
  inset: 0;
  opacity: 0.1;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
}

.grid-line.vertical {
  top: 0;
  bottom: 0;
  width: 1px;
  height: auto;
  background: linear-gradient(180deg, transparent, #667eea, transparent);
}

.grid-line:nth-child(1) { top: 10%; }
.grid-line:nth-child(2) { top: 20%; }
.grid-line:nth-child(3) { top: 30%; }
.grid-line:nth-child(4) { top: 40%; }
.grid-line:nth-child(5) { top: 50%; }
.grid-line:nth-child(6) { top: 60%; }
.grid-line:nth-child(7) { top: 70%; }
.grid-line:nth-child(8) { top: 80%; }
.grid-line:nth-child(9) { top: 90%; }

.grid-line.vertical:nth-child(11) { left: 10%; }
.grid-line.vertical:nth-child(12) { left: 20%; }
.grid-line.vertical:nth-child(13) { left: 30%; }
.grid-line.vertical:nth-child(14) { left: 40%; }
.grid-line.vertical:nth-child(15) { left: 50%; }
.grid-line.vertical:nth-child(16) { left: 60%; }
.grid-line.vertical:nth-child(17) { left: 70%; }
.grid-line.vertical:nth-child(18) { left: 80%; }
.grid-line.vertical:nth-child(19) { left: 90%; }

/* 左侧工具面板 */
.skeleton-tool-panel {
  position: absolute;
  left: 20px;
  top: 20px;
  width: 260px;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.tool-section {
  margin-bottom: 20px;
}

.tool-header {
  height: 32px;
  margin-bottom: 12px;
}

.tool-item {
  height: 40px;
  margin-bottom: 8px;
}

/* 右侧属性面板 */
.skeleton-property-panel {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 300px;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.property-header {
  height: 36px;
  margin-bottom: 16px;
}

.property-item {
  height: 48px;
  margin-bottom: 12px;
}

/* 底部测量栏 */
.skeleton-measure-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 20px;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.measure-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.measure-result {
  width: 200px;
  height: 48px;
}

/* 中心加载器 */
.skeleton-center-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

/* 3D 立方体 */
.loader-3d {
  perspective: 1000px;
  margin: 0 auto 32px;
}

.cube {
  position: relative;
  width: 120px;
  height: 120px;
  transform-style: preserve-3d;
  animation: rotate3d 4s linear infinite;
  margin: 0 auto;
}

.cube-face {
  position: absolute;
  width: 120px;
  height: 120px;
  background: rgba(102, 126, 234, 0.2);
  border: 2px solid rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.cube-front  { transform: rotateY(0deg) translateZ(60px); }
.cube-back   { transform: rotateY(180deg) translateZ(60px); }
.cube-left   { transform: rotateY(-90deg) translateZ(60px); }
.cube-right  { transform: rotateY(90deg) translateZ(60px); }
.cube-top    { transform: rotateX(90deg) translateZ(60px); }
.cube-bottom { transform: rotateX(-90deg) translateZ(60px); }

/* 加载信息 */
.loader-info {
  color: #fff;
}

.loader-message {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #e0e0e0;
}

.loader-stage {
  font-size: 14px;
  color: #667eea;
  margin-bottom: 20px;
}

.loader-progress {
  width: 400px;
  margin: 0 auto 20px;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: visible;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s ease-out;
}

.progress-glow {
  position: absolute;
  top: -2px;
  left: 0;
  height: 10px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 5px;
  filter: blur(8px);
  opacity: 0.6;
  animation: glow 1s ease-in-out infinite;
  transition: width 0.3s ease-out;
}

.progress-text {
  font-size: 16px;
  color: #667eea;
  font-weight: 600;
}

.loader-tips {
  margin-top: 24px;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.tip {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  padding-left: 8px;
}

/* 性能监控 */
.skeleton-stats {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-item {
  width: 100px;
  height: 32px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 响应式 */
@media (max-width: 768px) {
  .skeleton-tool-panel,
  .skeleton-property-panel {
    display: none;
  }

  .loader-progress {
    width: 300px;
  }

  .cube {
    width: 80px;
    height: 80px;
  }

  .cube-face {
    width: 80px;
    height: 80px;
  }

  .cube-front  { transform: rotateY(0deg) translateZ(40px); }
  .cube-back   { transform: rotateY(180deg) translateZ(40px); }
  .cube-left   { transform: rotateY(-90deg) translateZ(40px); }
  .cube-right  { transform: rotateY(90deg) translateZ(40px); }
  .cube-top    { transform: rotateX(90deg) translateZ(40px); }
  .cube-bottom { transform: rotateX(-90deg) translateZ(40px); }
}
</style>
