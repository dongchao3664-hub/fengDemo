# BabylonJS 模块重构说明

## 📁 新的文件结构

```
src/
├── views/screen/babylonjs/
│   ├── ModelDetailContainer.vue     # 路由入口（容器组件）
│   ├── ModelDetailView.vue          # 主视图层（业务逻辑）
│   ├── BabylonCanvas.vue            # Canvas 容器组件
│   ├── MeasurementPanel.vue         # 测量面板组件
│   └── ModelInfoPanel.vue           # 信息面板组件
│
└── services/babylon/
    ├── BabylonService.ts            # BabylonJS 场景服务
    ├── VolumeCalculationService.ts  # 方量计算服务（新增）
    ├── ModelLoadService.ts          # 模型加载服务
    └── MeasurementService.ts        # 测量服务
```

## 🏗️ 架构设计

### 分层结构（参考 marsmap 的设计）

```
┌─────────────────────────────────────────┐
│  ModelDetailContainer.vue (路由入口)     │
│  - 接收路由参数                          │
│  - 渲染 ModelDetailView                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  ModelDetailView.vue (主视图)           │
│  - 业务数据管理                          │
│  - 状态管理                              │
│  - 调用服务层                            │
└─────────────────────────────────────────┘
       ↓                ↓                ↓
┌───────────────┐ ┌──────────────┐ ┌──────────────┐
│ BabylonCanvas │ │ Measurement  │ │  ModelInfo   │
│     组件       │ │   Panel 组件  │ │  Panel 组件  │
└───────────────┘ └──────────────┘ └──────────────┘
       ↓
┌─────────────────────────────────────────┐
│  服务层 (Services)                       │
│  - BabylonService                       │
│  - VolumeCalculationService             │
│  - ModelLoadService                     │
│  - MeasurementService                   │
└─────────────────────────────────────────┘
```

## 📦 组件说明

### 1. ModelDetailContainer.vue
**职责**: 路由入口组件
- 作为路由入口，接收路由参数
- 渲染 ModelDetailView 组件
- 类似于 MapContainer 的角色

### 2. ModelDetailView.vue
**职责**: 主视图层，管理业务逻辑
- 初始化业务数据（风机、模型）
- 管理 UI 状态（面板开关、加载状态）
- 处理用户交互（切换风机、计算方量）
- 调用服务层 API
- 类似于 MapView 的角色

### 3. BabylonCanvas.vue
**职责**: BabylonJS 渲染画布
- 提供 Canvas 元素
- 初始化 BabylonJS 场景
- 加载和管理 3D 模型
- 暴露场景和模型引用
- 类似于 GisViewer 的角色

### 4. MeasurementPanel.vue
**职责**: 测量工具面板
- 显示风机列表树形结构
- 提供方量测量参数输入
- 显示测量结果
- 管理已保存的测量结果

### 5. ModelInfoPanel.vue
**职责**: 模型信息面板
- 显示风机基本信息
- 显示水下模型详细信息
- 显示模型描述和更新记录

## 🔧 服务层

### VolumeCalculationService (新增)
**功能**: 方量计算服务
- 基于基准高度计算模型的挖方、填方体积
- 计算水平投影面积
- 提供高性能体积计算算法

**快速算法原理**（推荐）:
1. 直接遍历模型的所有三角形面
2. 对每个三角形，计算它与基准面形成的棱柱体积
3. 使用带符号体积（Signed Volume）方法判断挖方/填方
4. 无需射线检测和采样，速度快10-100倍

**优势**:
- ⚡ 性能高：O(n)复杂度，n为三角形数量
- 🎯 精度高：直接基于模型原始几何数据
- 🔄 实时性：支持动态调整基准高度
- 💾 内存低：不需要大量采样点

**使用示例**:
```typescript
import { volumeCalculationService } from '@/services/babylon/VolumeCalculationService'

// 快速方量计算（推荐）
const result = await volumeCalculationService.calculateVolumeFast(
  scene,
  model,
  targetHeight   // 基准高度（米）
)

console.log('挖方:', result.cutVolume)
console.log('填方:', result.fillVolume)
console.log('总方量:', result.totalVolume)
console.log('水平面积:', result.horizontalArea)
```

## 🎯 设计优势

### 1. 关注点分离
- **容器层**: 只负责路由参数接收和组件渲染
- **视图层**: 管理业务逻辑和状态
- **组件层**: 专注于 UI 展示和用户交互
- **服务层**: 提供可复用的业务功能

### 2. 可维护性
- 组件职责清晰，易于理解和修改
- 服务层独立，易于测试
- 代码结构清晰，便于团队协作

### 3. 可扩展性
- 可以轻松添加新的面板组件
- 服务层可以被其他组件复用
- 业务逻辑与 UI 分离，便于功能扩展

### 4. 可复用性
- BabylonCanvas 组件可以在其他页面复用
- 服务层可以被其他业务模块调用
- 面板组件可以独立使用或组合使用

## 📝 使用说明

### 在路由中配置

```typescript
{
  path: '/model/:id',
  name: 'ModelDetail',
  component: () => import('@/views/screen/babylonjs/ModelDetailContainer.vue')
}
```

### 访问页面

```
/model/wm001  // 访问风机 wm001 的水下模型
```

### 功能特性

1. **模型加载**: 自动加载当前风机的水下模型
2. **风机切换**: 通过左侧面板切换不同风机
3. **方量计算**: 输入基准高度和采样分辨率，计算挖方填方
4. **结果保存**: 保存多次测量结果
5. **相机控制**: 自由旋转、缩放、重置相机
6. **信息展示**: 实时显示风机和模型详细信息

## 🆕 最新功能扩展 (2025-12-26)

### 1. 自动风机模型组合显示

**功能**: 在加载水下坑模型时，自动在坑中心位置加载风机模型

**实现位置**: `BabylonService.ts` 的 `loadModel()` 方法

**关键特性**:
- 📍 **自动定位**: 风机自动放置在坑的水平中心点（X-Z平面中心）
- 📏 **高度对齐**: 风机底部高度设置为坑的最低点（minY）
- ⚡ **异步加载**: 风机模型后台异步加载，不阻塞主模型显示
- 🔄 **自动清理**: 切换风机时自动清理旧的风机模型

**计算原理**:
```typescript
// 计算坑的中心点
centerX = (boundingBox.min.x + boundingBox.max.x) / 2
centerZ = (boundingBox.min.z + boundingBox.max.z) / 2
height = boundingBox.min.y  // 坑底高度

// 风机位置
windmill.position = new Vector3(centerX, height, centerZ)
```

**风机模型地址**: `http://47.104.109.74:10555/linejson/feng/gan.gltf`

### 2. 相机视角优化

**问题**: 原相机距离太近，视角过低，不利于观察整体结构

**优化方案**:
- 📷 **相机距离**: 从 `maxSize * 2` 增加到 `maxSize * 3.5`（提升75%）
- 🎯 **目标点抬高**: 从模型中心抬高30%高度，获得更好俯视角度
- 📐 **仰角优化**: 设置60度仰角（Math.PI/3），类似鸟瞰视角
- 🔍 **半径限制**: 自动调整 `upperRadiusLimit` 防止限制生效

**视觉效果**:
```typescript
相机距离: maxSize * 3.5 (开阔视野)
目标高度: center.y + size.y * 0.3 (抬高30%)
仰角: 60° (俯视观察)
```

### 3. 方量计算功能扩展

#### 3.1 圆柱体积扣除

**应用场景**: 针对风机基础，需要从填方中扣除圆柱形风机基础的体积

**新增参数**:
```typescript
cylinderRadius: number   // 圆柱半径（米）
cylinderHeight: number   // 圆柱高度（米），从坑底到指定高度
```

**计算公式**: `V = π × r² × h`

**结果输出**:
- `cylinderDeduction`: 圆柱扣除体积（m³）
- `actualFillVolume`: 实际填方体积 = 原填方 - 圆柱体积
- `cylinderParams`: 圆柱参数详情

**使用示例**:
```typescript
// 计算时传入圆柱参数
const result = await volumeCalculationService.calculateVolumeFast(
  scene, model, targetHeight,
  2.5,  // 圆柱半径 2.5米
  3.0   // 圆柱高度 3.0米
)

console.log('原始填方:', result.fillVolume)
console.log('圆柱扣除:', result.cylinderDeduction)
console.log('实际填方:', result.actualFillVolume)
```

#### 3.2 高度差值转换

**应用场景**: 模型高度与实际高度存在固定差值（如场景-7m对应实际-19m，差值为-12m）

**新增参数**:
```typescript
heightOffset: number  // 高度差值（实际高度 - 场景高度），单位：米
```

**工作原理**:
- 输入场景坐标系的基准高度
- 通过差值计算实际高度：实际高度 = 场景高度 + 差值
- 结果中保存差值信息和实际高度

**使用示例**:
```typescript
// 场景 -7m 对应实际 -19m，差值 = -19 - (-7) = -12
const result = await volumeCalculationService.calculateVolumeFast(
  scene, model,
  -7,          // 场景基准高度
  undefined,   // 不扣除圆柱
  undefined,
  -12          // 高度差值
)

console.log('场景基准高度:', result.targetHeight)      // -7
console.log('实际基准高度:', result.actualTargetHeight) // -19
console.log('高度差值:', result.heightOffset)          // -12
```

#### 3.3 模型尺寸信息输出

**新增字段**: `modelSize`

**包含信息**:
```typescript
{
  width: number   // X轴宽度（米）
  height: number  // Y轴高度（米）
  depth: number   // Z轴深度（米）
  minY: number    // Y轴最小值（米）
  maxY: number    // Y轴最大值（米）
}
```

**控制台输出**:
```javascript
📐 模型尺寸: {
  宽度X: '10.50m',
  高度Y: '5.20m', 
  深度Z: '8.30m',
  最小Y: '-7.00m',
  最大Y: '-1.80m'
}
```

#### 3.4 体积单位转换工具

**新增功能**: 支持多种体积单位的转换和格式化显示

**支持单位**:
```typescript
enum VolumeUnit {
  CubicMeter = 'm³',       // 立方米
  CubicDecimeter = 'dm³',  // 立方分米
  CubicCentimeter = 'cm³', // 立方厘米
  CubicMillimeter = 'mm³', // 立方毫米
  Liter = 'L'              // 升
}
```

**工具函数**:
```typescript
import { 
  convertVolume, 
  formatVolume, 
  VolumeUnit 
} from '@/services/babylon/VolumeCalculationService'

// 转换单位
const volume = 125.5 // 立方米
convertVolume(volume, VolumeUnit.Liter)           // 125500
convertVolume(volume, VolumeUnit.CubicCentimeter) // 125500000

// 格式化显示
formatVolume(volume, VolumeUnit.CubicMeter, 2)  // "125.50 m³"
formatVolume(volume, VolumeUnit.Liter, 0)       // "125500 L"
```

### 4. VolumeResult 接口扩展

**新增字段完整列表**:
```typescript
interface VolumeResult {
  // 原有字段
  cutVolume: number
  fillVolume: number
  totalVolume: number
  horizontalArea: number
  targetHeight: number
  // ... 其他原有字段
  
  // 新增字段
  cylinderDeduction?: number        // 圆柱扣除体积
  actualFillVolume?: number         // 实际填方体积
  cylinderParams?: {                // 圆柱参数
    radius: number
    height: number
    bottomY: number
  }
  heightOffset?: number             // 高度差值（实际高度 - 场景高度）
  actualTargetHeight?: number       // 实际基准高度
  modelSize?: {                     // 模型尺寸
    width: number
    height: number
    depth: number
    minY: number
    maxY: number
  }
}
```

### 5. 完整使用示例

```typescript
import { volumeCalculationService } from '@/services/babylon/VolumeCalculationService'

// 基础计算（保持向后兼容）
const basic = await volumeCalculationService.calculateVolumeFast(
  scene, model, -7
)

// 完整功能计算
const advanced = await volumeCalculationService.calculateVolumeFast(
  scene, 
  model,
  -7,      // 场景基准高度
  2.5,     // 圆柱半径 2.5米
  3.0,     // 圆柱高度 3.0米  
  -12      // 高度差值（实际-19 - 场景-7 = -12）
)

// 查看结果
console.log('📏 模型尺寸:', advanced.modelSize)
console.log('📐 挖方体积:', advanced.cutVolume, 'm³')
console.log('📐 原始填方:', advanced.fillVolume, 'm³')
console.log('🔵 圆柱扣除:', advanced.cylinderDeduction, 'm³')
console.log('✅ 实际填方:', advanced.actualFillVolume, 'm³')
console.log('📊 高度差值:', advanced.heightOffset)
console.log('🎯 实际高度:', advanced.actualTargetHeight, 'm')

// 单位转换显示
import { formatVolume, VolumeUnit } from '@/services/babylon/VolumeCalculationService'
console.log('填方(升):', formatVolume(advanced.actualFillVolume, VolumeUnit.Liter, 0))
```

### 6. 参数预留设计

**设计理念**: 所有新增参数都是**可选的**，不影响现有功能

```typescript
// ModelDetailView.vue 中的参数
const cylinderRadius = ref(0)   // 0 表示不扣除
const cylinderHeight = ref(0)   // 0 表示不扣除
const heightOffset = ref(0)     // 0 表示无差值，场景=实际

// 调用时自动判断
volumeCalculationService.calculateVolumeFast(
  scene, model, targetHeight,
  cylinderRadius.value > 0 ? cylinderRadius.value : undefined,
  cylinderHeight.value > 0 ? cylinderHeight.value : undefined,
  heightOffset.value !== 0 ? heightOffset.value : undefined
)
```

**特点**:
- ✅ 参数为可选，不传时保持原有行为
- ✅ 通过条件判断决定是否启用功能
- ✅ 便于后续根据实际需求调整参数值
- ✅ 不影响已有的方量计算功能

### 7. 控制台调试输出增强

**模型加载阶段**:
```javascript
📐 模型包围盒: { min, max, size }
📐 模型尺寸: { 宽度X, 高度Y, 深度Z, 最小Y, 最大Y }
📏 高度比例转换: { 模型基准高度, 高度比例, 实际基准高度 }
📷 相机设置: { radius, target, beta }
```

**风机加载阶段**:
```javascript
🚀 开始加载风机模型: gan.gltf
✅ 风机定位: (centerX, minY, centerZ)
✅ 风机模型加载成功
```

**方量计算阶段**:
```javascript
🚀 快速方量计算启动，处理 X 个网格
🔵 圆柱扣除: { 半径, 高度, 体积, 扣除后填方 }
✅ 快速方量计算完成: { 挖方, 填方, 圆柱扣除, 实际填方, 总方量, ... }
```

## 🔄 迁移说明

原 ModelDetailContainer.vue 已备份为 `ModelDetailContainer.vue.backup`

新架构完全重写，主要变化：
- 将单一大文件拆分为多个小组件
- 引入服务层管理业务逻辑
- 采用与 marsmap 一致的分层架构
- 添加完整的方量计算功能

## 📚 相关文档

- [BabylonJS 官方文档](https://doc.babylonjs.com/)
- [Mars3D 文档](https://mars3d.cn/doc.html)
- [项目架构文档](../../ARCHITECTURE_LAYERS.md)
