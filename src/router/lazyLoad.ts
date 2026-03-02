/**
 * 路由懒加载优化配置
 * 使用 Vite 的动态导入和预加载功能
 */

import { type RouteRecordRaw } from 'vue-router'

/**
 * 懒加载组件工厂函数
 * 支持预加载和骨架屏
 */
export function lazyLoad(
  importFunc: () => Promise<any>,
  options?: {
    skeleton?: any           // 骨架屏组件
    preload?: boolean        // 是否预加载
    webpackChunkName?: string // Chunk 名称
  }
) {
  return async () => {
    // 如果启用预加载，提前触发加载
    if (options?.preload) {
      importFunc()
    }

    try {
      const component = await importFunc()
      return component
    } catch (error) {
      console.error('组件加载失败:', error)
      // 返回错误组件
    //   return import('@/components/ErrorBoundary.vue')
    }
  }
}

/**
 * 优化后的路由配置
 */
export const optimizedRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      preload: true // 预加载
    }
  },
  {
    path: '/map',
    name: 'MapView',
    component: lazyLoad(
      () => import(
        /* webpackChunkName: "map-view" */
        /* webpackPrefetch: true */
        '@/views/screen/marsmap/MapView.vue'
      ),
      {
        skeleton: () => import('@/components/skeleton/MapSkeleton.vue'),
        preload: false
      }
    ),
    meta: {
      title: '地图视图',
      skeleton: 'MapSkeleton',
      keepAlive: true,
      requiresAuth: false
    }
  },
  {
    path: '/babylon',
    name: 'BabylonView',
    component: lazyLoad(
      () => import(
        /* webpackChunkName: "babylon-view" */
        /* webpackPrefetch: true */
        '@/views/screen/babylonjs/BabylonCanvas.vue'
      ),
      {
        skeleton: () => import('@/components/skeleton/BabylonSkeleton.vue'),
        preload: false
      }
    ),
    meta: {
      title: 'Babylon.js 视图',
      skeleton: 'BabylonSkeleton',
      keepAlive: true,
      requiresAuth: false
    }
  },
  {
    path: '/babylon-viewer',
    name: 'BabylonViewer',
    component: lazyLoad(
      () => import(
        /* webpackChunkName: "babylon-viewer" */
        '@/views/screen/babylonjs/ModelViewer.vue'
      ),
      {
        skeleton: () => import('@/components/skeleton/BabylonSkeleton.vue')
      }
    ),
    meta: {
      title: '模型查看器',
      skeleton: 'BabylonSkeleton'
    }
  }
]

/**
 * 路由预加载策略
 */
export function setupRoutePreload() {
  // 在空闲时预加载关键路由
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // 预加载地图视图
      import(
        /* webpackChunkName: "map-view" */
        /* webpackPrefetch: true */
        '@/views/screen/marsmap/MapView.vue'
      )
    }, { timeout: 2000 })

    requestIdleCallback(() => {
      // 预加载 Babylon 视图
      import(
        /* webpackChunkName: "babylon-view" */
        /* webpackPrefetch: true */
        '@/views/screen/babylonjs/BabylonCanvas.vue'
      )
    }, { timeout: 3000 })
  } else {
    // 降级方案：使用 setTimeout
    setTimeout(() => {
      import('@/views/screen/marsmap/MapView.vue')
    }, 2000)

    setTimeout(() => {
      import('@/views/screen/babylonjs/BabylonCanvas.vue')
    }, 3000)
  }
}

/**
 * 根据用户行为智能预加载
 */
export function setupIntelligentPreload() {
  // 监听鼠标悬停在导航链接上
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href^="/"]')
    
    if (link) {
      const href = link.getAttribute('href')
      
      // 鼠标悬停时预加载对应路由
      if (href === '/map') {
        import('@/views/screen/marsmap/MapView.vue')
      } else if (href === '/babylon') {
        import('@/views/screen/babylonjs/BabylonCanvas.vue')
      }
    }
  }, { passive: true })
}
