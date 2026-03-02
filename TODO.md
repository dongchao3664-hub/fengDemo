# 待办事项清单 (TODO List)

## 🎯 当前版本: v2.0.0-alpha

更新时间: 2025-12-22

---

## 🔴 高优先级任务

### 1. ModelDetailContainer重构 【未开始】
**预计耗时:** 1-2天  
**负责人:** 待分配  
**依赖:** 无

**详细任务:**
- [ ] 读取并分析 ModelDetailContainer.vue (1528行)
  - [ ] 分析Babylon.js场景初始化逻辑
  - [ ] 分析测量逻辑实现（挖填方计算）
  - [ ] 分析树形导航实现
  - [ ] 分析多标签页UI结构

- [ ] 创建 ModelDetailContainerRefactored.vue
  - [ ] 使用 ModelViewer 组件
  - [ ] 使用 useBabylonMeasure 钩子
  - [ ] 使用 MeasurementPanel 组件
  - [ ] 集成 WindmillModel 加载模型
  - [ ] 保持原有功能完整性

- [ ] 测试新组件
  - [ ] 测试模型加载
  - [ ] 测试挖填方计算准确性
  - [ ] 测试面积计算
  - [ ] 测试树形导航
  - [ ] 测试模型切换

- [ ] 对比验证
  - [ ] 对比计算结果一致性
  - [ ] 对比性能表现
  - [ ] 记录代码行数变化

**成功标准:**
- ✅ 所有测量功能正常
- ✅ 计算结果与旧版一致
- ✅ 代码量减少 > 60%
- ✅ 类型安全完整

---

### 2. 路由层完善 【部分完成】
**预计耗时:** 2小时  
**当前状态:** 已添加示例路由，需要添加重构版路由

**任务:**
- [x] 添加示例路由 (/examples/map, /examples/model)
- [ ] 添加重构版路由
  - [ ] /map-refactored → MapContainerRefactored
  - [ ] /model-refactored/:id → ModelDetailContainerRefactored
- [ ] 在Home页面添加导航按钮
  - [ ] 新架构演示按钮
  - [ ] 对比演示按钮
- [ ] 添加路由守卫
  - [ ] 权限检查
  - [ ] 加载状态

---

### 3. 数据服务层创建 【未开始】
**预计耗时:** 1天  
**负责人:** 待分配

**任务:**
- [ ] 创建 `src/services/` 目录结构
  ```
  services/
  ├── api/
  │   ├── WindmillService.ts     # 风机API服务
  │   ├── CableService.ts        # 电缆API服务
  │   └── ModelService.ts        # 模型API服务
  └── mock/
      ├── mockWindmillService.ts # 模拟数据服务
      └── mockCableService.ts
  ```

- [ ] 实现 WindmillService
  - [ ] getWindmills() - 获取风机列表
  - [ ] getWindmillById() - 获取单个风机
  - [ ] updateWindmill() - 更新风机信息
  - [ ] deleteWindmill() - 删除风机

- [ ] 实现 CableService
  - [ ] getCables() - 获取电缆列表
  - [ ] getCableById() - 获取单个电缆
  - [ ] updateCable() - 更新电缆

- [ ] 实现 ModelService
  - [ ] getModelUrl() - 获取模型URL
  - [ ] uploadModel() - 上传模型
  - [ ] getModelMetadata() - 获取模型元数据

- [ ] 在组件中集成服务
  - [ ] 替换MapContainerRefactored中的模拟数据
  - [ ] 替换ModelDetailContainerRefactored中的数据加载

---

## 🟡 中优先级任务

### 4. Store层优化 【未开始】
**预计耗时:** 1天

**评估任务:**
- [ ] 分析现有Store使用情况
  - [ ] useMars3dStore 使用分析
  - [ ] useBabylonStore 使用分析
  - [ ] useWindmillStore 使用分析
  - [ ] useMeasurementStore 使用分析

- [ ] 决策：是否创建新Store
  - [ ] 选项A: 保持现有Store，添加适配层
  - [ ] 选项B: 创建新Store使用新架构
  - [ ] 选项C: 完全移除Store，使用Composables

**如果选择创建新Store:**
- [ ] 创建 `stores/v2/` 目录
- [ ] 实现 useMapStore (基于MapEngine)
- [ ] 实现 useSceneStore (基于SceneEngine)
- [ ] 实现 useBusinessStore (基于业务管理器)
- [ ] 提供迁移工具

---

### 5. 现有services/目录审查 【未开始】
**预计耗时:** 4小时

**任务:**
- [ ] 审查 `services/babylon/` 目录
  - [ ] 列出所有文件和功能
  - [ ] 评估哪些需要保留
  - [ ] 评估哪些需要迁移到新架构
  - [ ] 评估哪些可以删除

- [ ] 审查 `services/mars3d/` 目录
  - [ ] 列出所有文件和功能
  - [ ] 评估保留/迁移/删除

- [ ] 制定整合计划
  - [ ] 迁移到新架构的步骤
  - [ ] 向后兼容性方案

---

### 6. API层整合 【未开始】
**预计耗时:** 1天

**任务:**
- [ ] 审查现有 `api/` 目录
  - api/cable.ts
  - api/model.ts
  - api/windfield.ts
  - api/windmill.ts

- [ ] 评估是否需要重构
- [ ] 与数据服务层对接
- [ ] 统一错误处理
- [ ] 添加请求拦截器
- [ ] 添加响应拦截器

---

## 🟢 低优先级任务

### 7. 测试 【未开始】
**预计耗时:** 2-3天

**单元测试:**
- [ ] 测试 mars3dmap 模块
  - [ ] MapEngine 测试
  - [ ] LayerManager 测试
  - [ ] CameraController 测试

- [ ] 测试 babylonjs 模块
  - [ ] SceneEngine 测试
  - [ ] 测量引擎测试
  - [ ] GLBLoader 测试

- [ ] 测试 business 模块
  - [ ] WindmillManager 测试
  - [ ] CableLineManager 测试
  - [ ] WindmillModel 测试

**集成测试:**
- [ ] 地图加载测试
- [ ] 模型加载测试
- [ ] 测量功能集成测试

**E2E测试:**
- [ ] 用户流程测试
- [ ] 跨浏览器测试

**测试覆盖率目标:** > 80%

---

### 8. 性能优化 【未开始】
**预计耗时:** 1-2周

**优化任务:**
- [ ] 大量风机加载优化
  - [ ] 实现分批加载
  - [ ] 实现虚拟滚动
  - [ ] 实现LOD（细节层次）

- [ ] 模型加载优化
  - [ ] 实现模型缓存
  - [ ] 实现懒加载
  - [ ] 压缩模型文件

- [ ] 渲染优化
  - [ ] 场景优化
  - [ ] 材质优化
  - [ ] 光照优化

- [ ] 内存优化
  - [ ] 实现资源回收
  - [ ] 监控内存使用
  - [ ] 防止内存泄漏

**性能目标:**
- 首屏加载 < 2s
- 100个风机加载 < 1s
- 帧率稳定在 60fps

---

### 9. 用户体验优化 【未开始】
**预计耗时:** 1周

**任务:**
- [ ] 加载动画
  - [ ] 地图加载动画
  - [ ] 模型加载动画
  - [ ] 数据加载骨架屏

- [ ] 错误提示改进
  - [ ] 友好的错误消息
  - [ ] 错误恢复建议
  - [ ] 错误日志记录

- [ ] 响应式设计
  - [ ] 移动端适配
  - [ ] 平板适配
  - [ ] 小屏幕优化

- [ ] 交互优化
  - [ ] 快捷键支持
  - [ ] 右键菜单
  - [ ] 拖拽功能

---

### 10. 文档完善 【进行中】
**当前状态:** 核心文档已完成

**待完善:**
- [x] STRUCTURE.md - 架构设计
- [x] USAGE.md - 使用指南
- [x] MIGRATION.md - 迁移指南
- [x] QUICK_REFERENCE.md - 快速参考
- [x] OPTIMIZATION_SUMMARY.md - 优化总结
- [x] SUMMARY.md - 项目总结
- [ ] API.md - 完整API文档
- [ ] CHANGELOG.md - 变更日志
- [ ] CONTRIBUTING.md - 贡献指南

**内联文档:**
- [ ] 补充代码注释
- [ ] 添加JSDoc文档
- [ ] 添加使用示例

---

## 🎨 增强功能 (Future)

### 11. 新功能开发
- [ ] 实时数据更新
  - WebSocket 集成
  - 实时风机状态更新

- [ ] 数据可视化增强
  - 风速风向可视化
  - 功率曲线图表
  - 历史数据分析

- [ ] 协作功能
  - 多用户协作
  - 标注和批注
  - 分享功能

- [ ] 导出功能
  - 导出报告
  - 导出截图
  - 导出数据

---

## 📊 完成度统计

### 架构重构
- [x] Mars3D 模块 (100%)
- [x] Babylon.js 模块 (100%)
- [x] 业务模块 (100%)
- [x] 组件模块 (100%)
- [x] 工具模块 (100%)
- [x] 数据适配器 (100%)

### 视图重构
- [x] Home.vue (无需修改)
- [x] MapView.vue (无需修改)
- [x] MapContainerRefactored.vue (100%)
- [ ] ModelDetailContainerRefactored.vue (0%)

### 文档
- [x] 核心文档 (100%)
- [ ] API文档 (0%)
- [ ] 变更日志 (0%)

### 测试
- [ ] 单元测试 (0%)
- [ ] 集成测试 (0%)
- [ ] E2E测试 (0%)

### 整体完成度
**70%** (核心架构完成，视图层和测试待完善)

---

## 🏆 里程碑

### Milestone 1: 核心架构 ✅ (已完成)
- ✅ 设计模块化架构
- ✅ 实现所有核心模块
- ✅ 编写核心文档

**完成日期:** 2025-12-22

### Milestone 2: 视图层重构 🔄 (进行中)
- ✅ MapContainerRefactored.vue
- ⏳ ModelDetailContainerRefactored.vue
- ⏳ 路由层完善

**预计完成:** 2025-12-25

### Milestone 3: 服务层和测试 ⏳ (待开始)
- ⏳ 数据服务层
- ⏳ API整合
- ⏳ Store优化
- ⏳ 测试用例

**预计完成:** 2025-12-31

### Milestone 4: 优化和发布 ⏳ (待开始)
- ⏳ 性能优化
- ⏳ UX优化
- ⏳ 文档完善
- ⏳ v2.0.0 正式发布

**预计完成:** 2026-01-15

---

## 📝 备注

### 优先级定义
- 🔴 **高优先级:** 影响核心功能，需要立即处理
- 🟡 **中优先级:** 重要但不紧急，可以计划进行
- 🟢 **低优先级:** 增强和优化，时间允许时处理

### 任务状态
- ✅ **已完成:** 任务已完成并验证
- 🔄 **进行中:** 任务正在进行
- ⏳ **待开始:** 任务已规划但未开始
- ❌ **已取消:** 任务被取消

### 更新记录
- 2025-12-22: 创建TODO清单，核心架构完成
- (待更新...)

---

## 🤝 协作指南

### 认领任务
1. 在任务前标注 `【认领 - 姓名】`
2. 更新预计完成时间
3. 定期同步进度

### 完成任务
1. 勾选所有子任务 ✅
2. 更新任务状态
3. 记录实际完成时间
4. 提交PR并关联任务

### 新增任务
1. 添加到对应优先级分类
2. 填写预计耗时
3. 详细描述任务内容

---

**最后更新:** 2025-12-22  
**维护者:** 项目组  
**版本:** v1.0
