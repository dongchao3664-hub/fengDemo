# 🌍 Mars3D + BabylonJS 双引擎 GIS 应用

> 一个完整的、生产级别的 GIS + 3D 渲染混合应用架构

## 📌 项目概览

结合了 **Mars3D（GIS 地图引擎）** 和 **BabylonJS（3D 渲染引擎）** 的企业级应用。

**核心功能**：
- 🗺️ 地图展示 - GIS 地理信息、瓦片图层、自定义地图
- 🌊 风能应用 - 风机位置（数百个）、风场数据、电缆线
- 🏗️ 3D 模型 - 点击风机查看水下结构的 3D 模型
- 📐 测量工具 - 距离、面积、体积（方量）测量

---

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```
访问 `http://localhost:5173`

### 3. 生产构建
```bash
npm run build
npm run preview
```

---

## 🏗️ 项目架构

### 目录结构

```
src/
├── models/              # 数据类型定义
│   ├── windmill.ts      # 风机数据模型
│   ├── measurement.ts   # 测量数据模型
│   ├── layer.ts         # 图层模型
│   └── common.ts        # 公共模型
├── api/                 # API 接口定义
│   ├── windmill.ts      # 风机 API
│   ├── windfield.ts     # 风场 API
│   ├── cable.ts         # 电缆线 API
│   └── model.ts         # 模型 API
├── services/            # 业务服务
│   ├── mars3d/
│   │   ├── MapService.ts          # 地图服务 ✅
│   │   ├── WindmillService.ts     # 风机服务 ✅
│   │   ├── LayerService.ts        # 图层服务 (待实现)
│   │   ├── WindFieldService.ts    # 风场服务 (待实现)
│   │   └── CableService.ts        # 电缆线服务 (待实现)
│   └── babylon/
│       ├── MeasurementService.ts  # 测量服务 ✅
│       ├── BabylonService.ts      # BabylonJS 服务 (待实现)
│       ├── ModelLoadService.ts    # 模型加载服务 (待实现)
│       └── CameraService.ts       # 相机服务 (待实现)
├── stores/              # Pinia 状态管理
│   ├── index.ts         # 主 Store
│   └── modules/
│       ├── windmill.ts  # 风机状态
│       └── measurement.ts # 测量状态
├── utils/
│   ├── http.ts          # HTTP 请求包装
│   └── index.ts         # 通用工具函数
├── views/               # 视图页面
│   └── MapView.vue      # 地图视图
└── App.vue              # 根组件（浮窗布局）
```

### 核心架构特点

1. **分层架构**
   - 数据层（Models） → API 层（API） → 业务层（Services） → 状态层（Stores） → UI 层（Vue Components）

2. **双引擎协作**
   - Mars3D：全球地图基层，交互入口
   - BabylonJS：详细 3D 模型展示，高精度测量

3. **响应式设计**
   - 地图全屏（z-index: 1）
   - 浮窗面板（z-index: 50-100）
   - 平滑动画过渡

---

## 📋 已完成工作

### ✅ 代码实现 (~2500 行)
- [x] 4 个数据模型文件
- [x] 4 个 API 接口文件
- [x] 3 个核心 Service（MapService, WindmillService, MeasurementService）
- [x] 5 个 Pinia Stores
- [x] HTTP 客户端和工具函数
- [x] 浮窗式应用布局

### ✅ 已安装依赖
```json
{
  "mars3d": "~3.10.0",
  "babylonjs": "^6",
  "babylonjs-loaders": "^6",
  "vue": "^3.4.19",
  "vue-router": "^4.2.5",
  "element-plus": "^2.4.4",
  "pinia": "^2.1.7",
  "axios": "^1.6.2"
}
```

### ✅ 文档
- 完整架构设计
- 代码示例
- API 参考
- 最佳实践

---

## 📖 开发指南

### Service 使用示例

#### MapService - 地图服务

```typescript
import { MapService } from '@/services/mars3d/MapService'

// 初始化地图
const mapService = new MapService()
await mapService.initMap('map-container', {
  lat: 20,
  lng: 110,
  height: 1000
})

// 飞到某个位置
await mapService.flyTo({ lng: 116.46, lat: 39.92, height: 500 })

// 鼠标拾取
mapService.enableMousePick((pickResult) => {
  console.log('点击了:', pickResult.entity)
})
```

#### WindmillService - 风机服务

```typescript
import { WindmillService } from '@/services/mars3d/WindmillService'

const windmillService = new WindmillService(mapService)

// 加载并渲染风机
await windmillService.loadWindmills()
windmillService.renderWindmills()

// 点击事件
windmillService.onWindmillClick((windmill) => {
  // 打开详情面板或 3D 模型
})

// 高亮风机
windmillService.highlightWindmill('windmill_id_1')
```

#### MeasurementService - 测量服务

```typescript
import { MeasurementService } from '@/services/babylon/MeasurementService'

const measureService = new MeasurementService(babylonScene)

// 添加测量点
const point = measureService.addPoint({ x: 0, y: 10, z: 0 })

// 计算距离
const distance = measureService.calculateDistance(point1, point2)

// 完成面积测量
const result = measureService.finishAreaMeasurement([p1, p2, p3])
console.log(`面积: ${result.value} ${result.unit}`)
```

### Pinia Store 使用示例

#### 获取风机数据

```typescript
import { useWindmillStore } from '@/stores/modules/windmill'

export default {
  setup() {
    const windmillStore = useWindmillStore()
    
    // 获取数据
    windmillStore.fetchWindmills()
    
    // 选择风机
    windmillStore.selectWindmill(windmill)
    
    // 获取详情
    windmillStore.fetchWindmillDetail(windmill.id)
    
    return {
      windmills: windmillStore.windmills,
      selected: windmillStore.selectedWindmill,
      loading: windmillStore.isLoading
    }
  }
}
```

#### 测量状态管理

```typescript
import { useMeasurementStore } from '@/stores/modules/measurement'

const measureStore = useMeasurementStore()

// 开始测量
measureStore.startMeasurement('distance')

// 添加点
measureStore.addPoint(point)

// 完成测量
measureStore.finishMeasurement(result)

// 获取结果
const results = measureStore.results
```

---

## 🎯 后续任务

### 第 1 阶段（高优先级）✅ 已完成
- [x] 实现 BabylonService（3D 场景初始化）
- [x] 实现 ModelLoadService（GLTF 加载，支持动态切换）
- [x] 扩展 MeasurementService（添加挖填方计算功能）
- [x] 创建 useBabylonModel Composable
- [x] 创建 ModelViewer.vue（完整示例组件）
- [x] 编写使用文档（BABYLON_USAGE_GUIDE.md）

### 第 2 阶段（中等优先级）
- [ ] 实现 LayerService（图层管理）
- [ ] 实现 WindFieldService（风场渲染）
- [ ] 创建图层管理组件

### 第 3 阶段（低优先级）
- [ ] 性能优化
- [ ] 单元测试
- [ ] 部署配置

---

## 🔧 常见操作

### 添加新的 API 接口

1. 在 `src/api/` 下创建文件
2. 使用 HTTP 工具类：
```typescript
import { http } from '@/utils/http'

export async function getMyData(id: string) {
  return http.get<MyDataType>(`/api/data/${id}`)
}
```

### 创建新的 Service

1. 在 `src/services/` 下创建文件
2. 遵循依赖注入模式：
```typescript
export class MyService {
  constructor(private dependency: SomeDependency) {}
  
  async doSomething() {
    // 业务逻辑
  }
}
```

### 创建新的 Store

1. 在 `src/stores/modules/` 下创建文件
2. 使用 Pinia 组合式 API：
```typescript
export const useMyStore = defineStore('my', () => {
  const state = ref({})
  const actions = { /* ... */ }
  return { state, ...actions }
})
```

---

## 📊 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4.19 | UI 框架 |
| TypeScript | 5.2.2 | 类型系统 |
| Vite | 5.1.3 | 构建工具 |
| Pinia | 2.1.7 | 状态管理 |
| Vue Router | 4.2.5 | 路由管理 |
| Element Plus | 2.4.4 | UI 组件库 |
| Axios | 1.6.2 | HTTP 请求 |
| Mars3D | 3.10.0 | GIS 引擎 |
| BabylonJS | ^6 | 3D 引擎 |

---

## ⚙️ 环境配置

### 开发环境 (.env.development)
```
VITE_API_BASE_URL=http://localhost:3000
VITE_MARS3D_TOKEN=your_token
```

### 生产环境 (.env.production)
```
VITE_API_BASE_URL=https://api.example.com
VITE_MARS3D_TOKEN=your_token
```

---

## 🐛 故障排查

### 问题：地图不显示
- 检查 MapService.initMap 是否成功调用
- 查看浏览器控制台是否有错误
- 确保地图容器 DOM 元素存在

### 问题：风机点击无反应
- 确认 WindmillService 已加载数据
- 检查 enableMousePick 是否正确设置
- 验证 GLTF 模型 URL 是否正确

### 问题：3D 模型加载失败
- 检查模型文件路径
- 验证 BabylonJS 加载器已导入
- 查看网络标签页的加载状态

---

## 💡 最佳实践

1. **使用 TypeScript** - 所有代码使用类型注解
2. **分离关注点** - 业务逻辑放在 Service，UI 逻辑放在 Component
3. **使用 Store 管理状态** - 避免 Props/Emit 层级过深
4. **异步处理** - 使用 async/await，添加错误处理
5. **样式隔离** - 使用 scoped 或 CSS Modules
6. **懒加载路由** - 动态导入大型组件

---

## 📞 帮助与支持

- 查看完整代码注释和类型定义
- 参考 `src/services` 中的实现示例
- 检查 `DEVELOPMENT_GUIDE.md` 中的完整示例

---

**项目创建日期**: 2025年12月20日  
**当前状态**: 架构完整，核心服务完成，准备开发阶段
