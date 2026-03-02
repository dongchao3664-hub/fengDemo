<p align="center">
<img src="//mars3d.cn/logo.png" width="300px" />
</p>

<p align="center">
  <strong>Mars3D + BabylonJS 双引擎 GIS 应用</strong>
</p>
<p align="center">
  基于 Vue 3.4 + Vite 5 + TypeScript 的企业级 GIS + 3D 渲染应用
</p>

[English](./README_EN.md) | [中文](./README.md)

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

### 生产构建

```bash
npm run build
npm run preview
```

## 📖 项目文档

### 📘 完整文档
👉 **[查看完整文档](./DOCUMENTATION.md)** - 包含架构、API、使用示例、迁移指南等所有内容

### 🚀 快速链接
- [项目概述](./DOCUMENTATION.md#项目概述)
- [快速开始](./DOCUMENTATION.md#快速开始)
- [架构设计](./DOCUMENTATION.md#架构设计)
- [使用指南](./DOCUMENTATION.md#使用指南)
- [API参考](./DOCUMENTATION.md#api参考)
- [迁移指南](./DOCUMENTATION.md#迁移指南)
- [待办事项](./TODO.md)

### 🎮 Babylon.js 模块（新增）
- **[Babylon.js 使用指南](./BABYLON_USAGE_GUIDE.md)** - 模型加载、测量、挖填方计算完整指南
- **[实现总结](./IMPLEMENTATION_SUMMARY.md)** - 技术实现细节和亮点
- **[示例代码](./src/examples/babylonExamples.ts)** - 9个从基础到高级的示例

### 主要功能
- 🗺️ Mars3D GIS 地图展示
- 🌊 风机风场数据可视化
- 🏗️ BabylonJS 3D 模型展示
- 📐 高精度测量工具（距离、面积、体积）
- 🎯 双引擎协作架构
- ⚡ 完全解耦的模块化设计

## 🆕 新架构亮点

### 引擎解耦
- ✅ Mars3D 和 Babylon.js 完全独立
- ✅ 可以单独使用任一引擎
- ✅ 通过业务层桥接

### 模块化
- ✅ 5大核心模块：mars3dmap、babylonjs、business、components、utils
- ✅ 清晰的依赖关系
- ✅ 高度可复用

### 类型安全
- ✅ 完整的 TypeScript 类型定义
- ✅ 严格的类型检查
- ✅ 良好的IDE支持

### 代码减少
- ✅ 业务代码减少 65%
- ✅ 测量逻辑减少 87%
- ✅ 更易维护

## 🏗️ 项目结构

```
src/
├── models/              # 数据类型定义
├── api/                 # API 接口
├── services/            # 业务逻辑服务
├── stores/              # Pinia 状态管理
├── utils/               # 通用工具
├── views/               # 页面视图
└── App.vue              # 根组件
```

详见 [PROJECT.md](./PROJECT.md#-项目架构)

## 🛠️ 技术栈

| 技术 | 版本 |
|------|------|
| Vue | 3.4.19 |
| TypeScript | 5.2.2 |
| Vite | 5.1.3 |
| Mars3D | 3.10.0 |
| BabylonJS | ^6 |
| Pinia | 2.1.7 |
| Element Plus | 2.4.4 |

## 📋 开发指南

### Service 使用示例

```typescript
import { MapService } from '@/services/mars3d/MapService'

const mapService = new MapService()
await mapService.initMap('map-container')
```

更多示例见 [PROJECT.md](./PROJECT.md#-开发指南)

## ⚙️ 环境配置

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000

# .env.production  
VITE_API_BASE_URL=https://api.example.com
```

## 📞 支持

- 查看 [PROJECT.md](./PROJECT.md) 完整文档
- 参考 `src/services` 代码示例
- 检查浏览器控制台错误信息

## 📄 License

Apache-2.0

npm run dev
```

### 打包构建

```
npm run build
```

### 运行效果

[在线体验](http://marsgis.gitee.io/mars3d-es5-template/)

## 如何集成到自己已有的项目中

1. ### 安装 mars3d 依赖包

```bash
npm install mars3d   //或  cnpm install mars3d   或  yarn add mars3d
```

2. ### 拷贝文件
   > 场景配置文件：`public\config\config.json`

> 组件定义文件：`src\components\mars-work\mars-map.vue`

3. ### 需要的组件中引入 Map 组件创建地球

参考 `src\App.vue`文件引入 Map 组件和构造创建地球，主要关注下下面代码处

```javascript
// script

import MarsMap from "./components/mars-work/mars-map.vue";
```

```html
<!-- template -->
<MarsMap :url="configUrl" map-key="test" @onload="marsOnload" />
```

4. ### 访问 mars3d 和 Cesium 实例

项目中已经将 mars3d 和 Cesium 实例挂载到 globalProperties，通过如下方式获取

```javascript
const instance = getCurrentInstance();
const mars3d = instance?.appContext.config.globalProperties.mars3d;
const Cesium = instance?.appContext.config.globalProperties.Cesium;
```

## Mars3D 是什么

> `Mars3D平台` 是[火星科技](http://marsgis.cn/)研发的一款基于 WebGL 技术实现的三维客户端开发平台，基于[Cesium](https://cesium.com/cesiumjs/)优化提升与 B/S 架构设计，支持多行业扩展的轻量级高效能 GIS 开发平台，能够免安装、无插件地在浏览器中高效运行，并可快速接入与使用多种 GIS 数据和三维模型，呈现三维空间的可视化，完成平台在不同行业的灵活应用。

> Mars3D 平台可用于构建无插件、跨操作系统、 跨浏览器的三维 GIS 应用程序。平台使用 WebGL 来进行硬件加速图形化，跨平台、跨浏览器来实现真正的动态大数据三维可视化。通过 Mars3D 产品可快速实现浏览器和移动端上美观、流畅的三维地图呈现与空间分析。

### 相关网站

- Mars3D 官网：[http://mars3d.cn](http://mars3d.cn)

- Mars3D 开源项目列表：[https://github.com/marsgis/mars3d](https://github.com/marsgis/mars3d)

## 版权说明

1. Mars3D 平台由[火星科技](http://marsgis.cn/)自主研发，拥有所有权利。
2. 任何个人或组织可以在遵守相关要求下可以免费无限制使用。
