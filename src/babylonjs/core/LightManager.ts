/**
 * LightManager - Babylon.js 光照管理器
 * 功能：光源创建、配置、管理
 * 设计：支持多种光源类型
 */

import * as BABYLON from 'babylonjs'
import type { SceneEngine } from './SceneEngine'

export type LightType = 'hemispheric' | 'directional' | 'point' | 'spot'

export interface LightConfig {
  type: LightType
  name?: string
  intensity?: number
  direction?: BABYLON.Vector3
  position?: BABYLON.Vector3
  diffuse?: BABYLON.Color3
  specular?: BABYLON.Color3
  groundColor?: BABYLON.Color3
}

export class LightManager {
  private sceneEngine: SceneEngine
  private lights: Map<string, BABYLON.Light> = new Map()

  constructor(sceneEngine: SceneEngine) {
    this.sceneEngine = sceneEngine
  }

  /**
   * 添加光源
   */
  addLight(config: LightConfig): BABYLON.Light | null {
    const scene = this.sceneEngine.getScene()
    if (!scene) {
      console.warn('[LightManager] Scene not initialized')
      return null
    }

    const name = config.name || `light_${this.lights.size}`

    if (this.lights.has(name)) {
      console.warn(`[LightManager] Light "${name}" already exists`)
      return this.lights.get(name) || null
    }

    let light: BABYLON.Light

    switch (config.type) {
      case 'hemispheric':
        light = this.createHemisphericLight(scene, name, config)
        break
      case 'directional':
        light = this.createDirectionalLight(scene, name, config)
        break
      case 'point':
        light = this.createPointLight(scene, name, config)
        break
      case 'spot':
        light = this.createSpotLight(scene, name, config)
        break
      default:
        console.warn(`[LightManager] Unknown light type: ${config.type}`)
        return null
    }

    // 设置强度
    if (config.intensity !== undefined) {
      light.intensity = config.intensity
    }

    this.lights.set(name, light)
    console.log(`[LightManager] Light "${name}" added`)

    return light
  }

  /**
   * 移除光源
   */
  removeLight(name: string): boolean {
    const light = this.lights.get(name)
    if (!light) {
      console.warn(`[LightManager] Light "${name}" not found`)
      return false
    }

    light.dispose()
    this.lights.delete(name)
    console.log(`[LightManager] Light "${name}" removed`)
    return true
  }

  /**
   * 获取光源
   */
  getLight(name: string): BABYLON.Light | null {
    return this.lights.get(name) || null
  }

  /**
   * 切换光源
   */
  toggleLight(name: string, enabled?: boolean): boolean {
    const light = this.lights.get(name)
    if (!light) return false

    light.setEnabled(enabled !== undefined ? enabled : !light.isEnabled())
    return true
  }

  /**
   * 设置光源强度
   */
  setIntensity(name: string, intensity: number): boolean {
    const light = this.lights.get(name)
    if (!light) return false

    light.intensity = intensity
    return true
  }

  /**
   * 创建默认照明
   */
  createDefaultLighting(): void {
    this.addLight({
      type: 'hemispheric',
      name: 'default_hemi',
      direction: new BABYLON.Vector3(0, 1, 0),
      intensity: 0.7
    })

    this.addLight({
      type: 'directional',
      name: 'default_dir',
      direction: new BABYLON.Vector3(-1, -2, -1),
      intensity: 0.5
    })
  }

  /**
   * 清空所有光源
   */
  clearAll(): void {
    this.lights.forEach((light) => {
      light.dispose()
    })
    this.lights.clear()
    console.log('[LightManager] All lights cleared')
  }

  // ========== 私有方法 ==========

  private createHemisphericLight(
    scene: BABYLON.Scene,
    name: string,
    config: LightConfig
  ): BABYLON.HemisphericLight {
    const light = new BABYLON.HemisphericLight(
      name,
      config.direction || new BABYLON.Vector3(0, 1, 0),
      scene
    )

    if (config.diffuse) light.diffuse = config.diffuse
    if (config.specular) light.specular = config.specular
    if (config.groundColor) light.groundColor = config.groundColor

    return light
  }

  private createDirectionalLight(
    scene: BABYLON.Scene,
    name: string,
    config: LightConfig
  ): BABYLON.DirectionalLight {
    const light = new BABYLON.DirectionalLight(
      name,
      config.direction || new BABYLON.Vector3(-1, -2, -1),
      scene
    )

    if (config.position) light.position = config.position
    if (config.diffuse) light.diffuse = config.diffuse
    if (config.specular) light.specular = config.specular

    return light
  }

  private createPointLight(
    scene: BABYLON.Scene,
    name: string,
    config: LightConfig
  ): BABYLON.PointLight {
    const light = new BABYLON.PointLight(
      name,
      config.position || new BABYLON.Vector3(0, 10, 0),
      scene
    )

    if (config.diffuse) light.diffuse = config.diffuse
    if (config.specular) light.specular = config.specular

    return light
  }

  private createSpotLight(
    scene: BABYLON.Scene,
    name: string,
    config: LightConfig
  ): BABYLON.SpotLight {
    const light = new BABYLON.SpotLight(
      name,
      config.position || new BABYLON.Vector3(0, 10, 0),
      config.direction || new BABYLON.Vector3(0, -1, 0),
      Math.PI / 3,
      2,
      scene
    )

    if (config.diffuse) light.diffuse = config.diffuse
    if (config.specular) light.specular = config.specular

    return light
  }
}
