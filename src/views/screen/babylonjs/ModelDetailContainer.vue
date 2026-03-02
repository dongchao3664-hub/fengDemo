<template>
  <div class="model-detail-container-wrapper">
    <!-- 使用 ModelDetailView 组件 -->
    <ModelDetailView />
  </div>
</template>

<script setup lang="ts">
/**
 * ModelDetailContainer - 模型详情容器组件（路由入口）
 * 职责：
 * 1. 作为路由入口，接收路由参数
 * 2. 渲染 ModelDetailView 组件
 * 
 * 类似于 MapContainer 的角色
 */

import ModelDetailView from './ModelDetailView.vue'
</script>

<style scoped lang="less">
.model-detail-container-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
