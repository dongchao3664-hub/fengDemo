# 🏗️ 地图引擎分层架构

**更新时间**: 2025-12-23  
**调整**: 重新设计 GisViewer 和 MapView 的职责划分

---

## 📊 新架构模型

```
┌─────────────────────────────────────────┐
│     MapContainer.vue                     │
│  (UI 层 - 面板、工具栏、交互)             │
│  职责：展示和交互                        │
└──────────────┬──────────────────────────┘
               │ 使用
               ▼
┌─────────────────────────────────────────┐
│     MapView.vue                         │
│  (中间层 - 业务逻辑入口)                  │
│  职责：                                  │
│  - 初始化 Hook（useMapManagement）     │
│  - 初始化 Hook（useBusinessManagement）│
│  - 加载业务数据（风机、电缆等）          │
│  - 业务管理器协调                       │
└──────────────┬──────────────────────────┘
               │ 包含
               ▼
┌─────────────────────────────────────────┐
│     GisViewer.vue                       │
│  (基础层 - 引擎初始化)                    │
│  职责：                                  │
│  - 地图实例创建                          │
│  - 配置加载                              │
│  - 性能优化配置                          │
│  - 地图销毁                              │
│  特点：                                  │
│  - 通用组件（可在其他项目复用）          │
│  - 不涉及业务逻辑                        │
│  - 专注引擎初始化                        │
└──────────────┬──────────────────────────┘
               │ 创建
               ▼
┌─────────────────────────────────────────┐
│     Mars3D 地图引擎                      │
│  (Cesium 底层 API)                      │
└─────────────────────────────────────────┘
```

---

## 📋 三层职责划分

### 1️⃣ 基础层 - GisViewer.vue

**位置**: `src/components/mars3d/GisViewer.vue`

**职责**:
- ✅ 地图实例创建和初始化
- ✅ 配置文件加载
- ✅ 性能优化应用
- ✅ 地图实例销毁

**暴露 API**:
```typescript
{
  mapInstance,      // Mars3D Map 实例
  isReady,          // 初始化完成标志
  getMap()          // 获取地图实例方法
}
```

**事件**:
```typescript
@ready(map)        // 地图初始化完成
@error(error)      // 初始化出错
```

**特点**:
- 纯 GIS 引擎初始化，**不涉及业务逻辑**
- **通用组件**，可在任何项目中复用
- **独立完整**，可单独测试

---

### 2️⃣ 中间层 - MapView.vue

**位置**: `src/views/screen/marsmap/MapView.vue`

**职责**:
- ✅ 使用 GisViewer 初始化地图引擎
- ✅ 添加基础底图（OSM、SeaMap 等）
- ✅ 添加装饰图层（水面等）
- ✅ 调用 useMapManagement 创建业务图层结构
- ✅ 进行图层二次配置（如需要）
- ✅ 调用 useBusinessManagement 初始化业务管理器
- ✅ 加载业务数据（风机、电缆等）
- ✅ 协调引擎、图层和业务逻辑

**初始化顺序**:
```
1. GisViewer 初始化引擎 (ready 事件)
2. addBaseMaps() 添加基础底图
3. addDecorativeLayers() 添加装饰图层
4. useMapManagement 创建业务图层
5. configureLayersSecondPass() 二次配置图层
6. useBusinessManagement 初始化业务管理器
7. loadBusinessData() 加载业务数据
```

**输入**:
```typescript
{
  map: Mars3D.Map      // 来自 GisViewer
  stores: Pinia        // 业务数据存储
}
```

**输出**:
```typescript
{
  mapInstance,         // 保存到 Pinia Store
  businessManagers,    // 已初始化的管理器
  layers,              // 所有已创建的图层
}
```

**特点**:
- **业务特定**，针对本项目场景设计
- **初始化协调器**，整合引擎、图层和业务逻辑
- **数据加载入口**，所有业务数据从这里加载
- **中间层职责**，接收引擎、驱动业务逻辑


---

### 3️⃣ 顶层 - MapContainer.vue

**位置**: `src/views/screen/marsmap/MapContainer.vue`

**职责**:
- ✅ UI 层展示（面板、工具栏）
- ✅ 用户交互处理
- ✅ 图层显隐控制
- ✅ 数据面板更新

**输入**:
```typescript
{
  mapInstance,         // 来自 Pinia Store（由 MapView 设置）
  windmills,          // 来自业务 Store
}
```

**输出**:
```typescript
{
  用户交互命令      // 显隐图层、选择数据等
}
```

**特点**:
- **纯 UI 层**，关注展示和交互
- **不直接操作引擎**，通过 Store 和 Hook 间接操作
- **可视化组件**，最接近用户

---

## 🔄 数据流向

### 初始化流程

```
用户访问页面
    ↓
MapContainer 加载
    ↓
MapView 挂载
    ↓
GisViewer 初始化地图引擎
    ↓ (ready 事件)
MapView 接收地图实例
    ↓
MapView 调用 useMapManagement 创建图层
    ↓
MapView 调用 useBusinessManagement 初始化管理器
    ↓
MapView 加载业务数据（风机、电缆等）
    ↓
业务管理器将数据渲染到地图
    ↓
MapContainer 展示 UI 和数据面板
    ↓
用户可以看到完整的地图场景
```

### 交互流程

```
用户在面板勾选图层
    ↓
MapContainer 触发 handleLayerCheck()
    ↓
调用 toggleLayersBySelection()
    ↓
Hook 更新 Store 中的 mapInstance
    ↓
Mars3D 引擎更新图层显隐
    ↓
用户看到地图更新
```

---

## 📝 代码示例

### GisViewer 使用示例

```vue
<template>
  <GisViewer
    config-url="config/config.json"
    @ready="onMapReady"
    @error="onMapError"
  />
</template>

<script setup>
const onMapReady = (map) => {
  console.log('地图引擎已初始化:', map)
  // map 现在可以使用了
}

const onMapError = (error) => {
  console.error('地图初始化失败:', error)
}
</script>
```

### MapView 使用示例

```typescript
// 在 GisViewer ready 时
const onGisReady = async (map) => {
  // 1. 创建图层结构
  const { createLayerManagement } = useMapManagement(options)
  createLayerManagement(layerManageData)
  
  // 2. 初始化业务管理器
  const businessMgmt = useBusinessManagement({ mapInstance: map })
  businessMgmt.initManagers()
  
  // 3. 加载业务数据
  await loadBusinessData(map)
}
```

### MapContainer 使用示例

```typescript
// 获取地图实例（由 MapView 保存到 Store）
const map = mapStore.mapInstance

// 处理图层勾选
const handleLayerCheck = (checkedKeys) => {
  toggleLayersBySelection(map, layerManageData, checkedKeys)
}
```

---

## ✅ 优势对比

### 优化前（混合式）
```
问题：
- MapView 混合了引擎初始化和业务逻辑
- 难以复用 GisViewer
- 职责不清
- 难以测试
```

### 优化后（分层式）
```
优势：
✅ 职责清晰（3 个独立的层次）
✅ GisViewer 可独立使用和复用
✅ MapView 专注业务逻辑
✅ MapContainer 专注 UI 交互
✅ 各层可以独立测试
✅ 易于扩展（添加新业务只需修改 MapView）
```

---

## 🧪 测试策略

### GisViewer 测试
```typescript
// 单元测试：地图初始化
describe('GisViewer', () => {
  it('应该初始化地图引擎', async () => {
    const wrapper = mount(GisViewer, {
      props: { configUrl: 'config.json' }
    })
    
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isReady).toBe(true)
    expect(wrapper.vm.mapInstance).toBeDefined()
  })
})
```

### MapView 测试
```typescript
// 集成测试：业务逻辑
describe('MapView', () => {
  it('应该初始化所有管理器', async () => {
    const wrapper = mount(MapView)
    
    // 等待地图初始化
    await wrapper.vm.$nextTick()
    
    // 验证管理器已初始化
    expect(mapStore.mapInstance).toBeDefined()
    expect(businessManagement).toBeDefined()
  })
})
```

### MapContainer 测试
```typescript
// UI 测试：交互
describe('MapContainer', () => {
  it('应该切换图层显隐', async () => {
    const wrapper = mount(MapContainer)
    
    // 模拟用户勾选
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    
    // 验证层已显示
    expect(toggleLayersBySelection).toHaveBeenCalled()
  })
})
```

---

## 🚀 扩展指南

### 添加新业务层

**步骤**:

1. **创建新的 Manager**
   ```typescript
   // src/views/screen/marsmap/business/heatmap/HeatmapLayerManager.ts
   class HeatmapLayerManager { /* ... */ }
   ```

2. **在 data 中定义配置**
   ```typescript
   // src/views/screen/marsmap/data/layerManage.data.ts
   {
     label: '热力图',
     layers: [{ id: 'heatmap-layer', name: '...' }]
   }
   ```

3. **在 MapView 中初始化**
   ```typescript
   const heatmapManager = new HeatmapLayerManager(map)
   heatmapManager.init()
   ```

4. **在 MapContainer 中展示**
   ```typescript
   // 面板会自动包含新的图层选项
   ```

---

## 📊 层级对应表

| 层级 | 文件 | 职责 | 复用性 | 依赖 |
|------|------|------|--------|------|
| 基础 | GisViewer.vue | 引擎初始化 | ⭐⭐⭐⭐⭐ | mars3d |
| 中间 | MapView.vue | 业务入口 | ⭐⭐ | GisViewer + Hooks |
| 顶层 | MapContainer.vue | UI 交互 | ⭐ | MapView + Stores |

---

## 🎯 总结

**新架构的核心**：
1. **GisViewer** - 通用的引擎初始化组件（可在其他项目复用）
2. **MapView** - 业务特定的逻辑入口（加载数据和初始化管理器）
3. **MapContainer** - UI 和交互层（展示面板和处理用户交互）

**分层优势**：
- ✅ 职责清晰，易于维护
- ✅ 可单独测试和复用
- ✅ 易于扩展新功能
- ✅ 代码质量高，耦合度低

---

**架构完成** ✅  
**下一步**: 功能测试 → 性能优化
