# UnderwaterManager 使用指南（支持GLB和点云共存）

## 概述

`UnderwaterManager` 是用于管理风机水下模型的管理器，**支持同时加载GLB模型和3D Tiles点云**：
- **GLB/GLTF模型**：使用 `mars3d.graphic.ModelEntity` 加载（如水下基础结构模型）
- **3D Tiles点云**：使用 `mars3d.layer.TilesetLayer` 加载（如水下扫描点云数据）

## 核心特性

✅ **模型共存**：一个风机可以同时拥有GLB模型和点云模型  
✅ **独立控制**：GLB和点云可以独立加载、显示、隐藏  
✅ **统一管理**：通过风机ID统一管理其所有水下模型  
✅ **性能优化**：避免重复加载，支持按需加载

## 数据结构

### 风机数据配置

```typescript
const windmillData: WindmillData = {
  id: 'windmill-001',
  name: '风机-001',
  position: {
    lng: 120.5,
    lat: 30.2,
    alt: 10
  },
  modelUrl: '/models/windmill.glb',  // 风机本体模型
  underwaterModelUrl: '/models/underwater-foundation.glb',  // 水下GLB模型
  underwaterTilesetUrl: '/tiles/underwater-scan/tileset.json',  // 水下点云URL
  status: 'online'
}
```

## 使用方法

### 1. 初始化

```typescript
import { UnderwaterManager } from '@/views/screen/marsmap/business'

const underwaterManager = new UnderwaterManager(mapEngine, layerManager)
underwaterManager.init()
```

### 2. 同时加载GLB和点云（推荐）

```typescript
// 加载风机的所有水下模型
const result = await underwaterManager.loadUnderwaterModels('windmill-001', {
  // GLB模型配置
  glbOptions: {
    scale: 1.5,
    offsetAlt: -50,
    show: true,
    minimumPixelSize: 50
  },
  // 点云配置
  tilesetOptions: {
    scale: 1.0,
    offsetAlt: -30,
    show: true,
    maximumScreenSpaceError: 16
  },
  // 控制加载哪些模型（默认都加载）
  loadGLB: true,
  loadTileset: true
})

if (result.success) {
  console.log('所有模型加载成功')
  console.log('GLB结果:', result.glbResult)
  console.log('点云结果:', result.tilesetResult)
}
```

### 3. 只加载GLB模型

```typescript
const result = await underwaterManager.loadUnderwaterModels('windmill-001', {
  glbOptions: {
    scale: 1.5,
    offsetAlt: -50,
    show: true
  },
  loadGLB: true,
  loadTileset: false  // 不加载点云
})
```

### 4. 只加载点云模型

```typescript
const result = await underwaterManager.loadUnderwaterModels('windmill-001', {
  tilesetOptions: {
    scale: 1.0,
    offsetAlt: -30,
    show: true,
    maximumScreenSpaceError: 16
  },
  loadGLB: false,  // 不加载GLB
  loadTileset: true
})
```

### 5. 使用旧版API（向后兼容）

```typescript
// 优先加载GLB，如果没有则加载点云
const result = await underwaterManager.loadUnderwaterModel('windmill-001', {
  scale: 1,
  offsetAlt: -50,
  show: true
})
```

### 6. 控制显示/隐藏

```typescript
// 显示风机的所有水下模型（GLB + 点云）
underwaterManager.showModel('windmill-001')

// 隐藏风机的所有水下模型
underwaterManager.hideModel('windmill-001')

// 切换显示状态
underwaterManager.toggleModel('windmill-001')
```

### 7. 卸载模型

```typescript
// 卸载风机的所有水下模型
underwaterManager.unloadUnderwaterModel('windmill-001')

// 卸载所有风机的水下模型
underwaterManager.unloadAllModels()
```

### 8. 状态查询

```typescript
// 检查是否有已加载的模型
const isLoaded = underwaterManager.isModelLoaded('windmill-001')

// 检查是否有GLB模型
const hasGLB = underwaterManager.isGLBModelLoaded('windmill-001')

// 检查是否有点云模型
const hasTileset = underwaterManager.isTilesetModelLoaded('windmill-001')

// 检查是否可见
const isVisible = underwaterManager.isModelVisible('windmill-001')

// 获取模型信息
const info = underwaterManager.getModelInfo('windmill-001')
console.log('GLB模型:', info?.glbModel)
console.log('点云模型:', info?.tilesetModel)
```

### 9. 飞行到模型

```typescript
underwaterManager.flyToModel('windmill-001', {
  duration: 2,
  offset: { heading: 0, pitch: -45, range: 500 }
})
```

## 配置参数

### GLB模型配置 (UnderwaterModelOptions)

```typescript
{
  scale: 1.5,              // 缩放比例
  offsetAlt: -50,          // 高度偏移（米），负值向下
  show: true,              // 是否显示
  heading: 0,              // 航向角（度）
  pitch: 0,                // 俯仰角（度）
  roll: 0,                 // 翻滚角（度）
  minimumPixelSize: 50,    // 最小像素大小
  maximumPixelSize: 500,   // 最大像素大小
  maximumDistance: 5000    // 最大可视距离（米）
}
```

### 点云配置 (TilesetLayerOptions)

继承所有GLB配置，额外包含：

```typescript
{
  maximumScreenSpaceError: 16,      // 最大屏幕空间误差（越小越精细）
  dynamicScreenSpaceError: false,   // 动态屏幕空间误差
  skipLevelOfDetail: true,          // 跳过层级细节
  skipScreenSpaceErrorFactor: 16    // 跳过因子
}
```

## 实际应用示例

### 在MapContainer.vue中使用

```vue
<template>
  <div>
    <el-button @click="loadModels">加载水下模型</el-button>
    <el-button @click="toggleModels">切换显示</el-button>
    <el-button @click="unloadModels">卸载模型</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useBusinessStore } from '@/stores/modules/business'

const businessStore = useBusinessStore()
const loading = ref(false)

// 加载模型
const loadModels = async () => {
  loading.value = true
  
  try {
    const underwaterManager = businessStore.businessManager?.underwaterManager?.value
    
    if (!underwaterManager) {
      ElMessage.error('水下模型管理器未初始化')
      return
    }

    const windmillId = 'windmill-001'
    
    // 同时加载GLB和点云
    const result = await underwaterManager.loadUnderwaterModels(windmillId, {
      glbOptions: {
        scale: 1.5,
        offsetAlt: -50,
        show: true
      },
      tilesetOptions: {
        scale: 1.0,
        offsetAlt: -30,
        show: true,
        maximumScreenSpaceError: 16
      }
    })
    
    if (result.success) {
      ElMessage.success('水下模型加载成功')
      
      // 飞行到模型位置
      setTimeout(() => {
        underwaterManager.flyToModel(windmillId, {
          duration: 2,
          offset: { pitch: -45, range: 300 }
        })
      }, 500)
    } else {
      ElMessage.error(result.message || '加载失败')
    }
  } catch (error) {
    console.error('加载错误:', error)
    ElMessage.error('加载错误')
  } finally {
    loading.value = false
  }
}

// 切换显示
const toggleModels = () => {
  const underwaterManager = businessStore.businessManager?.underwaterManager?.value
  if (underwaterManager) {
    const success = underwaterManager.toggleModel('windmill-001')
    ElMessage.success(success ? '状态已切换' : '操作失败')
  }
}

// 卸载模型
const unloadModels = () => {
  const underwaterManager = businessStore.businessManager?.underwaterManager?.value
  if (underwaterManager) {
    const success = underwaterManager.unloadUnderwaterModel('windmill-001')
    ElMessage.success(success ? '模型已卸载' : '操作失败')
  }
}
</script>
```

### 批量加载场景

```typescript
// 批量加载多个风机的水下模型
const windmillIds = ['windmill-001', 'windmill-002', 'windmill-003']

for (const id of windmillIds) {
  await underwaterManager.loadUnderwaterModels(id, {
    glbOptions: { scale: 1.5, offsetAlt: -50 },
    tilesetOptions: { scale: 1.0, offsetAlt: -30, maximumScreenSpaceError: 16 }
  })
}
```

### 条件加载

```typescript
// 根据数据可用性动态决定加载哪些模型
const windmill = await getWindmillData('windmill-001')

await underwaterManager.loadUnderwaterModels('windmill-001', {
  glbOptions: { scale: 1.5, offsetAlt: -50 },
  tilesetOptions: { scale: 1.0, offsetAlt: -30 },
  loadGLB: !!windmill.underwaterModelUrl,       // 有URL才加载
  loadTileset: !!windmill.underwaterTilesetUrl  // 有URL才加载
})
```

## 最佳实践

### 1. 模型层次设计

```
风机水下结构
├── GLB模型（结构细节）
│   ├── 基础框架
│   ├── 桩基
│   └── 连接件
└── 点云模型（地形扫描）
    ├── 海底地形
    ├── 沉积层
    └── 周边环境
```

### 2. 性能优化

```typescript
// 近距离：加载高精度GLB和点云
if (distance < 1000) {
  await underwaterManager.loadUnderwaterModels(windmillId, {
    glbOptions: { scale: 1.5, minimumPixelSize: 50 },
    tilesetOptions: { maximumScreenSpaceError: 8 }  // 高精度
  })
}
// 中距离：只加载GLB
else if (distance < 5000) {
  await underwaterManager.loadUnderwaterModels(windmillId, {
    glbOptions: { scale: 1.5, minimumPixelSize: 30 },
    loadTileset: false
  })
}
// 远距离：不加载水下模型
else {
  // 不加载
}
```

### 3. 错误处理

```typescript
const result = await underwaterManager.loadUnderwaterModels(windmillId)

// 检查各模型加载结果
if (result.glbResult && !result.glbResult.success) {
  console.error('GLB模型加载失败:', result.glbResult.message)
}

if (result.tilesetResult && !result.tilesetResult.success) {
  console.error('点云模型加载失败:', result.tilesetResult.message)
}

// 至少有一个成功就认为部分成功
if (result.glbResult?.success || result.tilesetResult?.success) {
  ElMessage.success('模型加载完成（部分成功）')
}
```

## API 变更

### 新增方法

- `loadUnderwaterModels()` - 同时加载GLB和点云（推荐）
- `isGLBModelLoaded()` - 检查GLB模型
- `isTilesetModelLoaded()` - 检查点云模型

### 方法行为变更

- `showModel()` - 显示风机的**所有**模型（GLB + 点云）
- `hideModel()` - 隐藏风机的**所有**模型
- `toggleModel()` - 切换风机的**所有**模型
- `unloadUnderwaterModel()` - 卸载风机的**所有**模型
- `isModelLoaded()` - 检查是否有**任意**模型已加载
- `getModelInfo()` - 返回包含GLB和点云的组合信息

### 向后兼容

- `loadUnderwaterModel()` - 保留，优先加载GLB，无GLB则加载点云

## 注意事项

1. **URL配置**：确保在风机数据中正确配置 `underwaterModelUrl` 和 `underwaterTilesetUrl`
2. **性能考虑**：点云数据量大，建议根据距离动态调整 `maximumScreenSpaceError`
3. **高度偏移**：GLB和点云可能需要不同的 `offsetAlt` 值
4. **同时显示**：GLB和点云会同时显示，注意视觉效果
5. **内存管理**：及时卸载不需要的模型，避免内存占用过高

## 完整类型定义

```typescript
interface WindmillModelsInfo {
  windmillId: string
  glbModel?: ModelInfo      // GLB模型信息
  tilesetModel?: ModelInfo  // 点云模型信息
}

interface ModelInfo {
  id: string
  type: 'glb' | 'tiles'
  url: string
  windmillId: string
  graphic?: mars3d.graphic.ModelEntity  // GLB模型实例
  layer?: mars3d.layer.TilesetLayer     // 点云图层实例
  options: UnderwaterModelOptions | TilesetLayerOptions
  show: boolean
}
```
