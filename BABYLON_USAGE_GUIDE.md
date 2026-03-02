# Babylon.js 模型加载与测量使用指南

## 📦 功能概览

本项目实现了完整的 Babylon.js 3D 模型加载和测量系统，包括：

- ✅ **BabylonService** - 场景初始化、相机控制、光照配置
- ✅ **ModelLoadService** - 模型加载、切换、预加载、缓存管理
- ✅ **MeasurementService** - 距离、面积、体积、挖填方计算
- ✅ **useBabylonModel** - Vue3 Composable 集成封装

## 🚀 快速开始

### 1. 基础使用

```vue
<template>
  <div class="viewer">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBabylonModel } from '@/babylonjs'

const canvasRef = ref<HTMLCanvasElement>()

const {
  initScene,
  loadModel,
  switchModel
} = useBabylonModel()

onMounted(async () => {
  // 初始化场景
  await initScene(canvasRef.value!)
  
  // 加载模型
  await loadModel({
    id: 'model1',
    name: '模型1',
    url: '/models/model1.glb'
  })
})
</script>
```

### 2. 模型动态切换

```typescript
// 预加载多个模型
await preloadModels([
  { id: 'model1', name: '模型1', url: '/models/model1.glb' },
  { id: 'model2', name: '模型2', url: '/models/model2.glb' },
  { id: 'model3', name: '模型3', url: '/models/model3.glb' }
])

// 切换显示
switchModel('model2') // 自动隐藏其他模型，相机飞行到目标

// 手动控制显隐
modelLoadService.showModel('model1')
modelLoadService.hideModel('model2')
```

### 3. 挖填方计算

```typescript
// 开始测量
startMeasurement('cut-fill')

// 添加测量点（通过点击场景）
// ... 用户交互添加点

// 完成测量
const result = finishMeasurement()

console.log('挖方量:', result.metadata.cutVolume, 'm³')
console.log('填方量:', result.metadata.fillVolume, 'm³')
console.log('净土方量:', result.metadata.netVolume, 'm³')
console.log('计算面积:', result.metadata.area, 'm²')

// 高级：指定设计高程
const detailedResult = computeCutFillVolume(10.5) // 设计高程 10.5m
console.log('横截面数据:', detailedResult.crossSections)
```

## 📖 API 文档

### BabylonService

```typescript
interface BabylonService {
  // 初始化场景
  init(options: BabylonServiceOptions): Promise<void>
  
  // 相机飞行到目标
  flyToMesh(mesh: AbstractMesh, config?: CameraAnimationConfig): Promise<void>
  
  // 高亮显示
  highlightMesh(mesh: AbstractMesh, color?: Color3): void
  removeHighlight(mesh: AbstractMesh): void
  clearAllHighlights(): void
  
  // 工具方法
  showInspector(): Promise<void>
  resetCamera(): void
  takeScreenshot(width?, height?): Promise<string>
  
  // 销毁
  dispose(): void
}
```

### ModelLoadService

```typescript
interface ModelLoadService {
  // 加载模型
  loadModel(modelInfo: ModelInfo, options?: ModelLoadOptions): Promise<LoadedModel>
  
  // 预加载
  preloadModel(modelInfo: ModelInfo): Promise<void>
  preloadModels(modelInfos: ModelInfo[]): Promise<void>
  
  // 显示/隐藏
  showModel(modelId: string): boolean
  hideModel(modelId: string): boolean
  switchModel(newModelId: string, hideOthers?: boolean): boolean
  
  // 查询
  getModel(modelId: string): LoadedModel | null
  getAllModels(): LoadedModel[]
  getCurrentModel(): LoadedModel | null
  
  // 管理
  removeModel(modelId: string): boolean
  clearAllModels(): void
  
  // 控制
  setModelVisibility(modelId: string, visible: boolean): boolean
  updateModelTransform(modelId: string, transform: TransformOptions): boolean
  highlightModel(modelId: string, color?: Color3): boolean
  
  // 动画
  playAnimation(modelId: string, index?: number, loop?: boolean): AnimationGroup | null
  stopAnimation(modelId: string, index?: number): void
}
```

### MeasurementService

```typescript
interface MeasurementService {
  // 测量控制
  startMeasurement(type: 'distance' | 'area' | 'volume' | 'cut-fill'): void
  addPoint(position: Vector3): MeasurementPoint
  finishMeasurement(): MeasurementResult | null
  clearMeasurement(): void
  
  // 挖填方计算
  computeCutFillVolume(designElevation?: number): CutFillResult
  getElevationProfile(start: Vector3, end: Vector3, samples?: number): ElevationProfile[]
  
  // 销毁
  dispose(): void
}
```

## 🎯 核心特性

### 1. 模型加载优化

使用 `AssetContainer` 实现高效的模型管理：

```typescript
// 预加载但不添加到场景（节省性能）
await preloadModel({ id: 'model1', url: '/models/model1.glb' })

// 需要时才添加到场景
showModel('model1')

// 不需要时移除（保留在缓存中）
hideModel('model1')

// 完全销毁
removeModel('model1')
```

### 2. 自定义模型处理

```typescript
await loadModel(
  { id: 'tunnel', url: '/models/tunnel.glb' },
  {
    customize: (meshes, scene, id) => {
      // 设置半透明
      const material = scene.getMaterialByName('wall')
      if (material) {
        material.alpha = 0.5
      }
      
      // 调整位置
      meshes[0].position.y += 2
      
      // 禁用某些网格的点击
      const background = scene.getMeshByName('background')
      if (background) {
        background.isPickable = false
      }
    }
  }
)
```

### 3. 挖填方计算原理

#### 算法流程

1. **定义测量区域** - 用户绘制多边形（至少3个点）
2. **生成横截面** - 沿主轴方向生成多个截面
3. **计算高差** - 每个截面对比原始高程与设计高程
4. **分类累加** - 高于设计高程为挖方，低于为填方
5. **积分求和** - 使用梯形公式计算总体积

#### 数据结构

```typescript
interface CutFillResult {
  cutVolume: number      // 挖方量 (m³)
  fillVolume: number     // 填方量 (m³)
  netVolume: number      // 净土方量 = 挖方 - 填方
  area: number           // 计算区域面积 (m²)
  averageHeight: number  // 平均高度差 (m)
  crossSections: CrossSection[] // 横截面详细数据
}

interface CrossSection {
  position: number    // 距离起点的位置
  cutArea: number     // 该截面挖方面积
  fillArea: number    // 该截面填方面积
  elevation: number   // 该截面平均高程
}
```

#### 使用示例

```typescript
// 1. 开始挖填方测量
startMeasurement('cut-fill')

// 2. 添加多边形顶点（通过点击模型表面）
// 点击事件会自动添加点

// 3. 完成测量，获取结果
const result = finishMeasurement()

// 4. 显示详细结果
console.log(`
  挖方量: ${result.metadata.cutVolume.toFixed(2)} m³
  填方量: ${result.metadata.fillVolume.toFixed(2)} m³
  净土方量: ${result.metadata.netVolume.toFixed(2)} m³
  计算面积: ${result.metadata.area.toFixed(2)} m²
  
  横截面数量: ${result.metadata.crossSections.length}
`)

// 5. 高级：指定设计高程重新计算
const customResult = computeCutFillVolume(15.0) // 设计高程 15m
```

### 4. 高程剖面分析

```typescript
// 获取两点间的高程剖面
const profile = measurementService.getElevationProfile(
  startPoint,
  endPoint,
  100 // 采样点数量
)

// 绘制剖面图
profile.forEach(p => {
  console.log(`
    距离: ${p.distance.toFixed(2)}m
    原始高程: ${p.originalElevation.toFixed(2)}m
    设计高程: ${p.designElevation.toFixed(2)}m
    高差: ${p.difference.toFixed(2)}m
  `)
})
```

## 🔧 配置选项

### BabylonServiceOptions

```typescript
{
  canvas: HTMLCanvasElement,        // 必需：渲染画布
  antialias?: boolean,              // 抗锯齿（默认 true）
  enableInspector?: boolean,        // 启用调试器（默认 false）
  enableHighlight?: boolean,        // 启用高亮层（默认 true）
  clearColor?: BABYLON.Color4       // 背景色
}
```

### ModelLoadOptions

```typescript
{
  position?: Vector3,               // 模型位置
  rotation?: Vector3,               // 模型旋转
  scaling?: Vector3,                // 模型缩放
  visible?: boolean,                // 是否可见（默认 true）
  castShadow?: boolean,            // 投射阴影
  receiveShadow?: boolean,         // 接收阴影
  onProgress?: (event) => void,    // 加载进度回调
  onComplete?: (meshes) => void,   // 加载完成回调
  customize?: (meshes, scene, id) => void // 自定义处理函数
}
```

## 💡 最佳实践

### 1. 性能优化

```typescript
// ❌ 不好：频繁加载/卸载
for (let i = 0; i < 10; i++) {
  await loadModel(models[i])
  removeModel(models[i].id)
}

// ✅ 好：预加载 + 切换显示
await preloadModels(models)
for (let i = 0; i < 10; i++) {
  switchModel(models[i].id)
}
```

### 2. 资源管理

```typescript
// 组件卸载时清理资源
onBeforeUnmount(() => {
  clearAllModels()          // 清理模型
  measurementService.dispose() // 清理测量
  babylonService.dispose()  // 销毁场景
})
```

### 3. 错误处理

```typescript
try {
  await loadModel(modelInfo)
} catch (error) {
  console.error('模型加载失败:', error)
  ElMessage.error('模型加载失败，请检查文件路径')
}
```

## 📊 实际应用场景

### 场景1：风电场水下结构检查

```typescript
// 1. 预加载所有风机基础模型
await preloadModels(windmillBaseModels)

// 2. 点击地图上的风机，切换显示对应的3D模型
onWindmillClick((windmill) => {
  switchModel(`windmill_${windmill.id}`)
})

// 3. 进行体积测量
startMeasurement('volume')
```

### 场景2：隧道断面分析

```typescript
// 1. 加载隧道模型
await loadModel({
  id: 'tunnel',
  url: '/models/tunnel.glb'
}, {
  customize: (meshes, scene) => {
    // 设置内壁半透明
    const innerWall = scene.getMeshByName('inner_wall')
    if (innerWall?.material) {
      innerWall.material.alpha = 0.5
    }
  }
})

// 2. 计算挖填方
startMeasurement('cut-fill')
// ... 用户绘制测量区域
const result = finishMeasurement()
console.log('土方量:', result.metadata.netVolume, 'm³')
```

### 场景3：地形挖填方计算

```typescript
// 1. 加载地形模型
await loadModel({
  id: 'terrain',
  url: '/models/terrain_mesh.glb'
})

// 2. 开始挖填方计算
startMeasurement('cut-fill')

// 3. 用户在地形上标记区域（点击添加顶点）

// 4. 指定设计高程并计算
const result = computeCutFillVolume(100.0) // 设计高程100m

// 5. 查看横截面数据
result.crossSections.forEach((section, index) => {
  console.log(`截面 ${index}:`)
  console.log(`  位置: ${section.position}m`)
  console.log(`  挖方面积: ${section.cutArea}m²`)
  console.log(`  填方面积: ${section.fillArea}m²`)
})
```

## 🐛 常见问题

### Q: 模型加载后看不见？

A: 检查以下几点：
1. 模型尺寸是否过大或过小（调整 scaling）
2. 相机位置是否合适（使用 `flyToMesh`）
3. 模型是否被添加到场景（检查 `visible` 选项）

### Q: 测量结果不准确？

A: 确保：
1. 模型单位为米
2. 测量点在模型表面上（使用射线拾取）
3. 多边形顶点顺序正确（逆时针）

### Q: 挖填方计算结果异常？

A: 检查：
1. 测量区域是否为闭合多边形（至少3个点）
2. 设计高程是否合理
3. 横截面数量是否足够（默认10个）

## 📚 参考资料

- [Babylon.js 官方文档](https://doc.babylonjs.com/)
- [工程量计算规范](https://www.example.com)
- [挖填方计算方法](https://www.example.com)

---

**最后更新**: 2025年12月24日
