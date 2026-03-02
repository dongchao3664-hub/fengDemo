/**
 * LOD (Level of Detail) 管理器
 * 根据相机距离动态调整模型细节级别，提升性能
 */

/**
 * LOD 级别配置
 */
export interface LODLevel {
  distance: number              // 距离阈值
  modelUrl?: string             // 模型 URL（可选，用于不同 LOD 模型）
  visible: boolean              // 是否可见
  simplificationLevel?: number  // 简化级别 0-1
}

/**
 * LOD 配置
 */
export interface LODConfig {
  levels: LODLevel[]
  enableAutoSwitch?: boolean    // 是否自动切换
  transitionDuration?: number   // 切换过渡时间（毫秒）
  updateInterval?: number       // 更新间隔（毫秒）
}

/**
 * LOD 实例
 */
export interface LODInstance {
  id: string
  position: { x: number; y: number; z: number }
  config: LODConfig
  currentLevel: number
  currentDistance: number
}

/**
 * LOD 管理器
 */
export class LODManager {
  private instances: Map<string, LODInstance> = new Map()
  private cameraPosition = { x: 0, y: 0, z: 0 }
  private isRunning = false
  private updateTimer: any = null
  private defaultUpdateInterval = 500 // 500ms

  /**
   * 注册 LOD 实例
   */
  register(
    id: string,
    position: { x: number; y: number; z: number },
    config: LODConfig
  ): void {
    // 对 levels 按距离排序
    const sortedLevels = [...config.levels].sort((a, b) => a.distance - b.distance)
    
    const instance: LODInstance = {
      id,
      position,
      config: {
        ...config,
        levels: sortedLevels,
        enableAutoSwitch: config.enableAutoSwitch ?? true,
        updateInterval: config.updateInterval ?? this.defaultUpdateInterval
      },
      currentLevel: 0,
      currentDistance: 0
    }
    
    this.instances.set(id, instance)
  }

  /**
   * 批量注册
   */
  registerBatch(
    items: Array<{
      id: string
      position: { x: number; y: number; z: number }
      config: LODConfig
    }>
  ): void {
    items.forEach(item => this.register(item.id, item.position, item.config))
  }

  /**
   * 取消注册
   */
  unregister(id: string): void {
    this.instances.delete(id)
  }

  /**
   * 更新相机位置
   */
  updateCameraPosition(x: number, y: number, z: number): void {
    this.cameraPosition = { x, y, z }
    
    if (this.isRunning) {
      this.updateAll()
    }
  }

  /**
   * 开始自动更新
   */
  start(updateInterval?: number): void {
    if (this.isRunning) {
      return
    }
    
    this.isRunning = true
    
    const interval = updateInterval ?? this.defaultUpdateInterval
    
    this.updateTimer = setInterval(() => {
      this.updateAll()
    }, interval)
    
    console.log(`[LODManager] Started with ${this.instances.size} instances`)
  }

  /**
   * 停止自动更新
   */
  stop(): void {
    this.isRunning = false
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  /**
   * 更新所有实例
   */
  updateAll(): void {
    this.instances.forEach(instance => {
      this.updateInstance(instance)
    })
  }

  /**
   * 更新单个实例
   */
  private updateInstance(instance: LODInstance): void {
    if (!instance.config.enableAutoSwitch) {
      return
    }
    
    // 计算距离
    const distance = this.calculateDistance(
      this.cameraPosition,
      instance.position
    )
    
    instance.currentDistance = distance
    
    // 确定当前应该使用的 LOD 级别
    const newLevel = this.determineLODLevel(distance, instance.config.levels)
    
    if (newLevel !== instance.currentLevel) {
      this.switchLevel(instance, newLevel)
    }
  }

  /**
   * 确定 LOD 级别
   */
  private determineLODLevel(distance: number, levels: LODLevel[]): number {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (distance >= levels[i].distance) {
        return i
      }
    }
    return 0
  }

  /**
   * 切换 LOD 级别
   */
  private switchLevel(instance: LODInstance, newLevel: number): void {
    const oldLevel = instance.currentLevel
    instance.currentLevel = newLevel
    
    console.log(`[LODManager] ${instance.id} switched from Level ${oldLevel} to Level ${newLevel}`)
    
    // 可以在这里触发事件，通知外部进行模型切换
    // this.emit('lod:changed', { id: instance.id, oldLevel, newLevel })
  }

  /**
   * 计算距离
   */
  private calculateDistance(
    pos1: { x: number; y: number; z: number },
    pos2: { x: number; y: number; z: number }
  ): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    const dz = pos1.z - pos2.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * 获取实例当前 LOD 级别
   */
  getCurrentLevel(id: string): number | undefined {
    return this.instances.get(id)?.currentLevel
  }

  /**
   * 获取实例当前距离
   */
  getCurrentDistance(id: string): number | undefined {
    return this.instances.get(id)?.currentDistance
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number
    byLevel: Record<number, number>
  } {
    const stats = {
      total: this.instances.size,
      byLevel: {} as Record<number, number>
    }
    
    this.instances.forEach(instance => {
      const level = instance.currentLevel
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1
    })
    
    return stats
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stop()
    this.instances.clear()
  }
}

/**
 * 预设 LOD 配置
 */
export const LODPresets = {
  /**
   * 风机模型 LOD 配置
   */
  windmill: {
    levels: [
      { distance: 0, visible: true, simplificationLevel: 0 },      // 0-500m: 高精度
      { distance: 500, visible: true, simplificationLevel: 0.3 },  // 500-2000m: 中精度
      { distance: 2000, visible: true, simplificationLevel: 0.6 }, // 2000-5000m: 低精度
      { distance: 5000, visible: false }                           // >5000m: 不可见
    ],
    enableAutoSwitch: true,
    updateInterval: 500
  } as LODConfig,
  
  /**
   * 建筑模型 LOD 配置
   */
  building: {
    levels: [
      { distance: 0, visible: true, simplificationLevel: 0 },
      { distance: 1000, visible: true, simplificationLevel: 0.5 },
      { distance: 3000, visible: false }
    ],
    enableAutoSwitch: true,
    updateInterval: 500
  } as LODConfig,
  
  /**
   * 地形模型 LOD 配置
   */
  terrain: {
    levels: [
      { distance: 0, visible: true, simplificationLevel: 0 },
      { distance: 10000, visible: true, simplificationLevel: 0.4 },
      { distance: 50000, visible: true, simplificationLevel: 0.7 }
    ],
    enableAutoSwitch: true,
    updateInterval: 1000
  } as LODConfig
}
