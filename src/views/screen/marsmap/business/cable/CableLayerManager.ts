/**
 * CableLayerManager - 海缆线图层管理
 * 负责在地图上加载、显示海缆线数据
 * 根据类型（掩埋/裸露）使用不同颜色
 */

import * as mars3d from 'mars3d'
import { bus } from '@/utils/busUtil'
import { attachGraphicEvents } from '@/views/screen/marsmap/business/common/graphicEventBinder'

// mockdata 中的海缆数据格式
export interface CablePoint {
  lon: number
  lat: number
  alt: number
  raw?: { x: number; y: number; z: number }
}

export interface CableMockData {
  id: string
  name: string
  type: number // 1=掩埋, 2=裸露
  layer: string
  points: CablePoint[]
}

// 海缆类型枚举
export enum CableType {
  BURIED = 1,   // 掩埋
  EXPOSED = 2,  // 裸露
}

export interface CableClickEvent {
  cable: CableMockData
  positions: [number, number, number][]
}

export class CableLayerManager {
  private mapInstance: any
  private layerId: string
  private cables: Map<string, CableMockData> = new Map()
  private graphics: Map<string, any> = new Map()
  private flashTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private onClickCallback?: (event: CableClickEvent) => void
  // 渲染高度模式：
  //  - 'override' 按类型固定高度（推荐，保证“裸露 > 掩埋”）
  //  - 'offset'   在数据 alt 基础上按类型偏移
  //  - 'none'     使用数据 alt 原样（可能出现层级不一致）
  private altitudeMode: 'override' | 'offset' | 'none' = 'override'

  // 类型对应颜色
  private readonly colorMap: Record<number, string> = {
    [CableType.BURIED]: '#58f1ff',   // 掩埋 - 绿色
    [CableType.EXPOSED]: '#dd4f17ff',  // 裸露 - 橙色
  }

   cableTypeStyles : Record<number, { label: string; color: string; width: number; glowPower: number; altitude: number }> = {
    [CableType.BURIED]: { label: "掩埋", color: "#58f1ff", width: 4, glowPower: 0.2, altitude: 4 },
    [CableType.EXPOSED]: { label: "裸露", color: "#dd4f17ff", width: 4, glowPower: 0.35, altitude: 6 }
  }

 defaultCableTypeStyle : any =   { label: "未知", color: "#94a3b8", width: 4, glowPower: 0.2, altitude: 5 }


  constructor(mapInstance: any, layerId: string = 'cableLayer') {
    this.mapInstance = mapInstance
    this.layerId = layerId
  }

   getCableTypeStyle(type:any) {
      return this.cableTypeStyles[type] || this.defaultCableTypeStyle
    }

  /**
   * 初始化海缆线图层
   */
  init(): void {
    if (!this.mapInstance) {
      console.warn('[CableLayerManager] Map instance is invalid')
      return
    }

    const layer = this.mapInstance.getLayerById(this.layerId)
    if (!layer) {
      console.warn(`[CableLayerManager] Layer "${this.layerId}" not found`)
      return
    }

    console.log('[CableLayerManager] Initialized')
  }

  /**
   * 设置渲染高度模式
   */
  setAltitudeMode(mode: 'override' | 'offset' | 'none'): void {
    this.altitudeMode = mode
  }

  /**
   * 加载海缆数据到地图（使用 mockdata 格式）
   */
  loadCables(cables: CableMockData[]): void {
    console.log('[CableLayerManager] loadCables called, count:', cables?.length)
    
    if (!this.mapInstance) {
      console.warn('[CableLayerManager] Map instance is invalid')
      return
    }

    const layer = this.mapInstance.getLayerById(this.layerId)
    console.log('[CableLayerManager] getLayerById result:', layer, 'layerId:', this.layerId)
    
    if (!layer) {
      console.warn(`[CableLayerManager] Layer "${this.layerId}" not found`)
      // 列出所有图层帮助调试
      const allLayers = this.mapInstance.getLayers?.() || []
      console.log('[CableLayerManager] Available layers:', allLayers.map((l: any) => l.id))
      return
    }

    // 清空旧数据
    this.cables.clear()
    this.graphics.clear()
    layer.clear()

    // 统计
    let buriedCount = 0
    let exposedCount = 0

    // 添加新数据
    cables.forEach((cable) => {
      this.addCable(cable, layer)
      if (cable.type === CableType.BURIED) buriedCount++
      else if (cable.type === CableType.EXPOSED) exposedCount++
    })

    console.log(`[CableLayerManager] Loaded ${cables.length} cables (掩埋: ${buriedCount}, 裸露: ${exposedCount})`)
    console.log('[CableLayerManager] graphics.size after load:', this.graphics.size)
  }

  /**
   * 添加单条海缆线
   */
  private addCable(cable: CableMockData, layer: any): void {
    if (!cable.points || cable.points.length < 2) {
      console.warn(`[CableLayerManager] Cable ${cable.id} has insufficient points`)
      return
    }

    this.cables.set(cable.id, cable)
 // 将 points 转换为坐标数组
    const positions = cable.points.map((p) => [p.lon, p.lat, p.alt || 0])

    // 根据类型获取样式（包含期望的分层高度）
    const styleInfo = this.getCableTypeStyle(cable.type)

    // 将 points 转换为坐标数组（按 altitudeMode 计算高度）
    // const positions = cable.points.map((p) => {
    //   const baseAlt = p.alt ?? 0
    //   let alt: number
    //   if (this.altitudeMode === 'override') {
    //     alt = styleInfo.altitude
    //   } else if (this.altitudeMode === 'offset') {
    //     alt = baseAlt + styleInfo.altitude
    //   } else {
    //     alt = baseAlt
    //   }
    //   return [p.lon, p.lat, alt]
    // })

    // 根据类型获取颜色
    const color = this.colorMap[cable.type] || '#0099ff'
    const glowPower = cable.type === CableType.BURIED ? 0.18 : 0.28

    // 创建折线图形
    const graphic = new mars3d.graphic.PolylineEntity({
      id: cable.id,
      name: cable.name,
      positions: positions,
      style: {
        color: styleInfo.color,
        width: styleInfo.width,
        clampToGround: true,
        // materialType: mars3d.MaterialType.PolylineGlow,
        // materialOptions: {
        //   color: styleInfo.color,
        //   glowPower: styleInfo.glowPower
        // },
        depthFailMaterialType: mars3d.MaterialType.PolylineGlow,
        depthFailMaterialOptions: {
          color: styleInfo.color,
          glowPower: Math.max(0.12, styleInfo.glowPower - 0.05)
        },
        shadowMode: mars3d.Cesium.ShadowMode.DISABLED,
      },
      attr: {
        id: cable.id,
        name: cable.name,
        type: cable.type,
        typeName: cable.type === CableType.BURIED ? '掩埋' : '裸露',
        layer: cable.layer,
        menuId: 'cable', // 业务类型标识
      },
    })

    // 添加事件监听
    this.bindGraphicEvents(graphic, cable, positions as [number, number, number][])

    layer.addGraphic(graphic)
    this.graphics.set(cable.id, graphic)
  }

  /**
   * 绑定图形事件监听
   */
  private bindGraphicEvents(graphic: any, cable: CableMockData, positions: [number, number, number][]): void {
    const originalColor = this.colorMap[cable.type] || '#58f1ff'
    const styleInfo = this.getCableTypeStyle(cable.type)

    attachGraphicEvents(graphic, {
      click: () => {
        console.log('[CableLayerManager] 点击了', cable.id)

        this.onClickCallback?.({
          cable,
          positions,
        })

        bus.emit('openPoupBill', {
          type: 'cable',
          data: cable,
        })

        bus.emit('selectCable', {
          id: cable.id,
          data: cable,
        })

        graphic.flyTo({
          radius: 450,
          scale: 1.5,
          pitch: -60,
          complete: () => {},
        })
      },
      mouseOver: () => {
        console.log('[CableLayerManager] 鼠标移入', cable.id)

        graphic.setStyle({
          color: "#ffff00",
          width: styleInfo.width + 2,
          label: {
            text: cable.name,
            font_weight: 'bold',
            font_size: 16,
            font_family: '微软雅黑',
            color: '#ffffff',
            outline: true,
            outlineColor: '#c07979ff',
            outlineWidth: 2,
            pixelOffsetY: -20,
            visibleDepth: false,
            distanceDisplayCondition: true,
            distanceDisplayCondition_far: 50000,
            distanceDisplayCondition_near: 0,
          },
        })
      },
      mouseOut: () => {
        console.log('[CableLayerManager] 鼠标移出', cable.id)

        graphic.setStyle({
          color: styleInfo.color,
          width: styleInfo.width,
          label: {
            text: '',
          },
        })
      },
    })
  }

  /**
   * 根据类型筛选显示
   */
  filterByType(type: CableType | null): void {
    console.log('[CableLayerManager] filterByType:', type, 'graphics count:', this.graphics.size)
    this.graphics.forEach((graphic, id) => {
      const cable = this.cables.get(id)
      if (cable) {
        graphic.show = type === null || cable.type === type
      }
    })
  }

  /**
   * 播放闪烁效果
   */
  private startFlashEffect(graphic: any, cableId: string, baseColor: string): void {
    this.stopFlashEffect(cableId)

    let tick = 0
    const timer = setInterval(() => {
      const isBright = tick % 2 === 0
      graphic.setStyle({
        width: isBright ? 6 : 4,
        opacity: 1,
        color: isBright ? '#ffff66' : baseColor,
      })

      tick += 1
      if (tick >= 6) {
        this.stopFlashEffect(cableId)
        graphic.setStyle({
          width: 5,
          opacity: 1,
          color: '#ffff00',
        })
      }
    }, 200)

    this.flashTimers.set(cableId, timer)
  }

  /**
   * 停止单个闪烁
   */
  private stopFlashEffect(cableId: string): void {
    const timer = this.flashTimers.get(cableId)
    if (timer) {
      clearInterval(timer)
      this.flashTimers.delete(cableId)
    }
  }

  /**
   * 停止全部闪烁
   */
  private stopAllFlashEffects(): void {
    this.flashTimers.forEach((timer) => clearInterval(timer))
    this.flashTimers.clear()
  }

  /**
   * 高亮指定的海缆线
   */
  highlight(cableIds: string[]): void {
    console.log('[CableLayerManager] highlight:', cableIds, 'graphics count:', this.graphics.size)
    this.graphics.forEach((graphic, id) => {
      const cable = this.cables.get(id)
      const baseColor = cable ? this.colorMap[cable.type] || '#0099ff' : '#0099ff'
      const isHighlighted = cableIds.includes(id)
      if (isHighlighted) {
        console.log('[CableLayerManager] Highlighting cable:', id)
        graphic.setStyle({
          width: 5,
          opacity: 1,
          color: '#ffff00',
          label: {
            text: cable?.name || '',
          },
        })
        this.startFlashEffect(graphic, id, baseColor)
      } else {
        this.stopFlashEffect(id)
        graphic.setStyle({
          width: 3,
          opacity: 0.9,
          color: baseColor,
          label: {
            text: '',
          },
        })
      }
    })
  }

  /**
   * 清空高亮
   */
  clearHighlight(): void {
    this.stopAllFlashEffects()
    this.graphics.forEach((graphic, id) => {
      const cable = this.cables.get(id)
      const baseColor = cable ? this.colorMap[cable.type] || '#0099ff' : '#0099ff'
      graphic.setStyle({
        width: 3,
        opacity: 0.9,
        color: baseColor,
        label: {
          text: '',
        },
      })
    })
  }

  /**
   * 获取海缆数据
   */
  getCable(cableId: string): CableMockData | undefined {
    return this.cables.get(cableId)
  }

  /**
   * 获取所有海缆
   */
  getAllCables(): CableMockData[] {
    return Array.from(this.cables.values())
  }

  /**
   * 飞行定位到指定海缆（定位到第一个点）
   */
  flyTo(cableId: string): void {
    console.log('[CableLayerManager] flyTo:', cableId)
    const cable = this.cables.get(cableId)
    if (cable && cable.points && cable.points.length > 0) {
      const point = cable.points[0]
      this.mapInstance.setCameraView({
        lng: point.lon,
        lat: point.lat + 0.002,
        alt: 2500,
        heading: 360,
        pitch: -90,
      })
      console.log('[CableLayerManager] Flying to:', point.lon, point.lat)
    }
  }

  /**
   * 注册点击回调
   */
  onClick(callback: (event: CableClickEvent) => void): void {
    this.onClickCallback = callback
  }

  /**
   * 清空图层
   */
  clear(): void {
    if (this.mapInstance) {
      const layer = this.mapInstance.getLayerById(this.layerId)
      if (layer) {
        layer.clear()
      }
    }
    this.cables.clear()
    this.graphics.clear()
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.clear()
    this.onClickCallback = undefined
  }
}
