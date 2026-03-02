/**
 * 路由守卫 - 集成骨架屏
 * 在路由切换时显示对应的骨架屏
 */

import { type Router } from 'vue-router'
import { h, render, type Component } from 'vue'
import MapSkeleton from '@/components/skeleton/MapSkeleton.vue'
import BabylonSkeleton from '@/components/skeleton/BabylonSkeleton.vue'
import { useFirstScreenLoader } from '@/core/loaders/FirstScreenLoader'

// 骨架屏映射
const skeletonMap: Record<string, Component> = {
  MapSkeleton,
  BabylonSkeleton
}

// 当前显示的骨架屏实例
let currentSkeletonVNode: any = null
let skeletonContainer: HTMLElement | null = null

/**
 * 显示骨架屏
 */
function showSkeleton(skeletonName: string, props?: Record<string, any>) {
  // 移除旧的骨架屏
  hideSkeleton()

  // 获取骨架屏组件
  const SkeletonComponent = skeletonMap[skeletonName]
  if (!SkeletonComponent) {
    console.warn(`骨架屏 ${skeletonName} 不存在`)
    return
  }

  // 创建容器
  skeletonContainer = document.createElement('div')
  skeletonContainer.id = 'route-skeleton-container'
  document.body.appendChild(skeletonContainer)

  // 创建并渲染骨架屏
  currentSkeletonVNode = h(SkeletonComponent, props || {})
  render(currentSkeletonVNode, skeletonContainer)
}

/**
 * 隐藏骨架屏
 */
function hideSkeleton() {
  if (skeletonContainer) {
    render(null, skeletonContainer)
    document.body.removeChild(skeletonContainer)
    skeletonContainer = null
    currentSkeletonVNode = null
  }
}

/**
 * 更新骨架屏进度
 */
function updateSkeletonProgress(progress: number, message?: string) {
  if (currentSkeletonVNode && currentSkeletonVNode.component) {
    const instance = currentSkeletonVNode.component
    if (instance.exposed?.updateProgress) {
      instance.exposed.updateProgress(progress, message)
    }
  }
}

/**
 * 设置路由守卫
 */
export function setupRouteGuards(router: Router) {
  // 路由切换前
  router.beforeEach((to, from, next) => {
    // 如果路由有 skeleton meta，显示骨架屏
    if (to.meta.skeleton) {
      showSkeleton(to.meta.skeleton as string, {
        showProgress: true,
        progress: 0,
        message: `正在加载${to.meta.title || '页面'}...`
      })
    }

    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - Mars3D + Babylon.js`
    }

    next()
  })

  // 路由切换后
  router.afterEach((to, from) => {
    // 组件加载完成后延迟隐藏骨架屏（给组件初始化时间）
    setTimeout(() => {
      hideSkeleton()
    }, 500)
  })

  // 路由错误处理
  router.onError((error) => {
    console.error('路由错误:', error)
    hideSkeleton()
  })
}

/**
 * Vue Hook: 在组件中使用路由加载状态
 */
export function useRouteLoading() {
  const { loader, totalProgress, currentStage } = useFirstScreenLoader()

  // 通知路由守卫更新进度
  const notifyProgress = (progress: number, message?: string) => {
    updateSkeletonProgress(progress, message)
  }

  return {
    loader,
    totalProgress,
    currentStage,
    notifyProgress
  }
}

/**
 * 导出工具函数
 */
export {
  showSkeleton,
  hideSkeleton,
  updateSkeletonProgress
}
