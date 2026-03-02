import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { setupRouteGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      layout: 'landing'
    }
  },
  {
    path: '/map',
    
    name: 'mapfrom',
    component: () => import('@/views/screen/marsmap/MapContainer.vue'),
    meta: {
      title: '测试',
      layout: 'mapfrom',
      skeleton: 'MapSkeleton' 
    }
  },

  {
    path: '/mapview',
    name: 'MapView',
    component: () => import('@/views/screen/marsmap/MapView.vue'),
    meta: {
      title: 'GIS地图',
      layout: 'map'
    }
  },
  {
    path: '/model/:id?',
    name: 'ModelDetail',
    component: () => import('@/views/screen/babylonjs/ModelDetailContainer.vue'),
    meta: {
      title: '3D模型详情',
      layout: 'babylon'
    }
  },
  {
    path: '/triangle-measurement',
    name: 'TriangleMeasurement',
    component: () => import('@/views/screen/babylonjs/triangle/TriangleMeasurement.vue'),
    meta: {
      title: '三角形测量工具',
      layout: 'babylon'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  },

]


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || 'Mars3D GIS Platform'
  next()
})
// 设置路由守卫
// setupRouteGuards(router)  // 👈 加这行
export default router
