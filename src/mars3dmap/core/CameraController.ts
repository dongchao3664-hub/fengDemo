/**
 * CameraController - Mars3D 相机控制器
 * 功能：相机飞行、视角控制、锁定跟随
 * 设计：独立的相机操作封装
 */

import * as mars3d from 'mars3d'
import type { MapEngine } from './MapEngine'

export interface FlyToOptions {
  duration?: number
  complete?: () => void
  cancel?: () => void
  easingFunction?: (t: number) => number
}

export interface CameraView {
  lng: number
  lat: number
  alt: number
  heading?: number
  pitch?: number
  roll?: number
}

export class CameraController {
  private mapEngine: MapEngine

  constructor(mapEngine: MapEngine) {
    this.mapEngine = mapEngine
  }

  /**
   * 飞行到指定坐标
   */
  flyTo(position: CameraView, options?: FlyToOptions): void {
    const map = this.mapEngine.getInstance()
    if (!map) {
      console.warn('[CameraController] Map not initialized')
      return
    }

    map.flyToPoint(position, {
      duration: options?.duration || 2,
      complete: options?.complete,
      cancel: options?.cancel
    })
  }

  /**
   * 飞行到矩形范围
   */
  flyToBounds(
    west: number,
    south: number,
    east: number,
    north: number,
    options?: FlyToOptions
  ): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    const rectangle = mars3d.Rectangle.fromDegrees(west, south, east, north)
    map.flyTo(rectangle, {
      duration: options?.duration || 2,
      complete: options?.complete,
      cancel: options?.cancel
    })
  }

  /**
   * 飞行到实体/图形
   */
  flyToGraphic(graphic: mars3d.graphic.BaseGraphic, options?: FlyToOptions): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    graphic.flyTo({
      duration: options?.duration || 2,
      complete: options?.complete,
      cancel: options?.cancel
    })
  }

  /**
   * 立即设置相机视角（无动画）
   */
  setCameraView(view: CameraView): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    map.setCameraView(view, { duration: 0 })
  }

  /**
   * 获取当前相机视角
   */
  getCameraView(): CameraView | null {
    const map = this.mapEngine.getInstance()
    if (!map) return null

    return map.getCameraView() as CameraView
  }

  /**
   * 缩放到指定级别
   */
  zoomTo(level: number, duration = 1): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    const currentView = this.getCameraView()
    if (!currentView) return

    // Mars3D的高度与缩放级别转换
    const alt = this.levelToAltitude(level)
    this.flyTo({ ...currentView, alt }, { duration })
  }

  /**
   * 放大
   */
  zoomIn(step = 0.5): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    const currentView = this.getCameraView()
    if (!currentView) return

    const newAlt = currentView.alt * (1 - step)
    this.flyTo({ ...currentView, alt: newAlt }, { duration: 0.5 })
  }

  /**
   * 缩小
   */
  zoomOut(step = 0.5): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    const currentView = this.getCameraView()
    if (!currentView) return

    const newAlt = currentView.alt * (1 + step)
    this.flyTo({ ...currentView, alt: newAlt }, { duration: 0.5 })
  }

  /**
   * 旋转相机（俯仰角）
   */
  rotatePitch(angle: number, duration = 1): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    const currentView = this.getCameraView()
    if (!currentView) return

    this.flyTo(
      {
        ...currentView,
        pitch: (currentView.pitch || 0) + angle
      },
      { duration }
    )
  }

  /**
   * 旋转相机（方位角）
   */
  rotateHeading(angle: number, duration = 1): void {
    const map = this.mapEngine.getInstance()
    if (!map) return

    const currentView = this.getCameraView()
    if (!currentView) return

    this.flyTo(
      {
        ...currentView,
        heading: (currentView.heading || 0) + angle
      },
      { duration }
    )
  }

  /**
   * 复位相机（俯视地球）
   */
  reset(duration = 2): void {
    this.flyTo(
      {
        lng: 120.0,
        lat: 30.0,
        alt: 100000,
        heading: 0,
        pitch: -90,
        roll: 0
      },
      { duration }
    )
  }

  // ========== 私有方法 ==========

  private levelToAltitude(level: number): number {
    // 简化的缩放级别到高度转换
    return 40075000 / Math.pow(2, level)
  }
}
