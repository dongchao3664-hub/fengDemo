<template>
  <div class="home-container">
    <div class="home-header">
      <!-- <img src="//mars3d.cn/logo.png" alt="Mars3D Logo" class="logo"> -->
      <h1>3D GIS Platform</h1>
      <p class="subtitle">基于 Vue3 + BabylonJS 的双引擎 GIS 应用</p>
    </div>

    <div class="home-content">
      <div class="cards-grid">
        <!-- 地图应用卡片 -->
        <div class="card" @click="navigateTo('/map')">
          <div class="card-icon">
            <el-icon><MapLocation /></el-icon>
          </div>
          <h3>地图应用</h3>
          <p>浏览地理信息、风机分布、风场数据和电缆线信息</p>
          <div class="card-features">
            <span>🗺️ 地图展示</span>
            <span>📍 风机分布</span>
            <span>🌊 风场数据</span>
          </div>
          <el-button type="primary" class="card-btn">进入地图</el-button>
        </div>

        <!-- 模型应用卡片 -->
        <div class="card" @click="showModelDialog = true">
          <div class="card-icon">
            <el-icon><Box /></el-icon>
          </div>
          <h3>3D模型</h3>
          <p>查看风机水下结构、进行精确测量（距离、面积、体积）</p>
          <div class="card-features">
            <span>🏗️ 3D模型</span>
            <span>📐 精确测量</span>
            <span>🔍 细节展示</span>
          </div>
          <el-button type="primary" class="card-btn">选择模型</el-button>
        </div>

        <!-- 三角形测量卡片 -->
        <div class="card" @click="navigateTo('/triangle-measurement')">
          <div class="card-icon">
            <el-icon><Compass /></el-icon>
          </div>
          <h3>三角形测量</h3>
          <p>交互式三角形测量工具，计算边长、角度、面积和垂线</p>
          <div class="card-features">
            <span>📐 边长角度</span>
            <span>⊥ 垂线计算</span>
            <span>🤖 自动测量</span>
          </div>
          <el-button type="success" class="card-btn">开始测量</el-button>
        </div>
      </div>
    </div>

    <!-- 模型选择对话框 -->
    <el-dialog v-model="showModelDialog" title="选择风机模型" width="600px">
      <div class="model-list">
        <p class="hint">选择一个风机查看其水下模型，或直接进入浏览所有风机</p>
        <div class="windmill-options">
          <el-button 
            type="success"
            class="windmill-btn"
            @click="navigateToModel('')"
          >
            <el-icon><List /></el-icon>
            进入模型查看器（浏览所有）
          </el-button>
          <el-divider />
          <el-button 
            v-for="wm in availableWindmills" 
            :key="wm.id"
            type="primary"
            plain
            class="windmill-btn"
            @click="navigateToModel(wm.id)"
          >
            {{ wm.name }} ({{ wm.code }})
          </el-button>
        </div>
      </div>
    </el-dialog>

    <div class="home-footer">
      <p>©  3D GIS Platform |</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MapLocation, Box, List, Compass } from '@element-plus/icons-vue'
import { mockWindFarms } from '@/data/windmills'

const router = useRouter()
const showModelDialog = ref(false)

// 获取所有可用的风机列表
const availableWindmills = computed(() => {
  return mockWindFarms.flatMap(farm => farm.windmills)
})

const navigateTo = (path: string) => {
  router.push(path)
}

const navigateToModel = (windmillId: string) => {
  showModelDialog.value = false
  if (windmillId) {
    router.push(`/model/${windmillId}`)
  } else {
    router.push('/model')
  }
}
</script>

<style scoped lang="less">
.home-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  overflow: auto;

  .home-header {
    flex-shrink: 0;
    text-align: center;
    padding: 60px 20px 40px;

    .logo {
      width: 100px;
      height: 100px;
      margin-bottom: 20px;
      filter: brightness(0) invert(1);
    }

    h1 {
      font-size: 48px;
      margin: 0 0 10px;
      font-weight: bold;
    }

    .subtitle {
      font-size: 18px;
      margin: 0;
      opacity: 0.9;
    }
  }

  .home-content {
    flex: 1;
    padding: 40px 20px;
    display: flex;
    align-items: center;
    justify-content: center;

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      max-width: 1400px;
      width: 100%;

      .card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 30px 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #333;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;

        &:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }

        .card-icon {
          font-size: 48px;
          color: #667eea;
          margin-bottom: 15px;
          display: flex;
          justify-content: center;
        }

        h3 {
          font-size: 24px;
          margin: 0 0 10px;
          color: #333;
        }

        p {
          font-size: 14px;
          color: #666;
          margin: 0 0 20px;
          line-height: 1.6;
        }

        .card-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          flex: 1;

          span {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
          }
        }

        .card-btn {
          width: 100%;
        }
      }
    }
  }

  .home-footer {
    flex-shrink: 0;
    text-align: center;
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 14px;
    opacity: 0.9;

    p {
      margin: 0;
    }
  }
}

.model-list {
  padding: 20px;

  .hint {
    color: #666;
    text-align: center;
    margin-bottom: 20px;
  }

  .windmill-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;

    .windmill-btn {
      width: 100%;
      height: 48px;
      font-size: 14px;
    }
  }
}
</style>
