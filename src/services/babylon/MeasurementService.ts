/**
 * MeasurementService - 增强版测量服务
 * 功能：距离、面积、体积测量 + 挖填方计算（基于高程和横截面）
 * 设计：完整的工程量计算工具
 */

import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import type { BabylonService } from './BabylonService'

export interface MeasurementPoint {
  id: string
  position: BABYLON.Vector3
  marker?: BABYLON.Mesh
}

export interface MeasurementResult {
  id?: string
  type: 'distance' | 'area' | 'volume' | 'cut-fill' | 'triangle'
  value: number
  unit: string
  points: MeasurementPoint[]
  metadata?: Record<string, any>
}

export interface CutFillResult {
  cutVolume: number // 挖方量
  fillVolume: number // 填方量
  netVolume: number // 净土方量（挖-填）
  area: number // 计算面积
  averageHeight: number // 平均高度差
  unit: string
  crossSections?: CrossSection[] // 横截面数据
}

export interface TriangleMeasurementResult {
  horizontalDistance: number
  verticalDistance: number
  slopeDistance: number
  angle: number // degrees
}

export interface CrossSection {
  position: number // 位置（距离起点）
  cutArea: number // 挖方面积
  fillArea: number // 填方面积
  elevation: number // 高程
}

export interface ElevationProfile {
  distance: number // 距离
  originalElevation: number // 原始高程
  designElevation: number // 设计高程
  difference: number // 高差
}

export class MeasurementService {
  private babylonService: BabylonService
  private scene: BABYLON.Scene | null = null
  
  private measurementPoints: MeasurementPoint[] = []
  private measurementLines: BABYLON.LinesMesh[] = []
  private measurementMarkers: BABYLON.Mesh[] = []
  private measurementLabels: GUI.TextBlock[] = []
  
  // 三角测量实体列表
  private triangleEntities: TriangleEntity[] = []

  private isActive = false
  private currentMeasurementType: 'distance' | 'area' | 'volume' | 'cut-fill' | 'triangle' | null = null
  private pointerObserver: BABYLON.Observer<BABYLON.PointerInfo> | null = null
  private onResultChanged?: (result: MeasurementResult | null, allResults?: MeasurementResult[]) => void
  private onStatusChanged?: (status: string) => void

  // GUI
  private advancedTexture?: GUI.AdvancedDynamicTexture

  constructor(babylonService: BabylonService) {
    this.babylonService = babylonService
    this.scene = babylonService.getScene()
    
    if (this.scene) {
      this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('measurementUI')
    }
  }

  /**
   * 设置结果回调
   */
  public setResultCallback(callback: (result: MeasurementResult | null, allResults?: MeasurementResult[]) => void) {
    this.onResultChanged = callback
  }

  /**
   * 设置状态回调
   */
  public setStatusCallback(callback: (status: string) => void) {
    this.onStatusChanged = callback
  }

  /**
   * 开始测量
   */
  startMeasurement(type: 'distance' | 'area' | 'volume' | 'cut-fill' | 'triangle'): void {
    // 如果是三角测量，不清除已有的测量结果，只清除当前的临时点
    if (type === 'triangle') {
      this.clearCurrentPoints()
    } else {
      this.clearMeasurement()
    }
    
    this.isActive = true
    this.currentMeasurementType = type
    this.setupInputHandler()
    
    if (type === 'triangle') {
      this.onStatusChanged?.('请点击场景拾取起点 A')
    }
    
    console.log(`[MeasurementService] Started ${type} measurement`)
  }

  /**
   * 添加测量点
   */
  addPoint(position: BABYLON.Vector3): MeasurementPoint {
    const point: MeasurementPoint = {
      id: `point_${Date.now()}_${Math.random()}`,
      position: position.clone()
    }

    let color = new BABYLON.Color3(1, 0, 0) // 默认红色
    if (this.currentMeasurementType === 'triangle') {
      if (this.measurementPoints.length === 0) {
        color = new BABYLON.Color3(0, 1, 0) // 起点绿色
        this.onStatusChanged?.('已选点 A，请选择点 B')
      } else if (this.measurementPoints.length === 1) {
        color = new BABYLON.Color3(1, 0, 0) // 终点红色
      }
    }

    // 创建标记
    const marker = this.createMarker(position, color)
    point.marker = marker
    this.measurementMarkers.push(marker)

    this.measurementPoints.push(point)

    // 更新测量显示
    this.updateMeasurement()

    return point
  }

  /**
   * 完成测量
   */
  finishMeasurement(): MeasurementResult | null {
    if (!this.isActive || this.measurementPoints.length < 2) {
      console.warn('[MeasurementService] Not enough points')
      return null
    }

    let result: MeasurementResult | null = null

    switch (this.currentMeasurementType) {
      case 'distance':
        result = this.calculateDistance()
        break
      case 'area':
        result = this.calculateArea()
        break
      case 'volume':
        result = this.calculateVolume()
        break
      case 'cut-fill':
        result = this.calculateCutFill()
        break
      case 'triangle':
        result = this.calculateTriangle()
        break
    }

    this.isActive = false
    return result
  }

  /**
   * 清除测量
   */
  clearMeasurement(): void {
    // 移除事件监听
    if (this.pointerObserver && this.scene) {
      this.scene.onPointerObservable.remove(this.pointerObserver)
      this.pointerObserver = null
    }

    // 清除所有三角测量实体
    this.triangleEntities.forEach(e => e.dispose())
    this.triangleEntities = []

    // 清除标记
    this.measurementMarkers.forEach((marker) => marker.dispose())
    this.measurementMarkers = []

    // 清除线条
    this.measurementLines.forEach((line) => line.dispose())
    this.measurementLines = []

    // 清除标签
    this.measurementLabels.forEach((label) => {
      this.advancedTexture?.removeControl(label)
    })
    this.measurementLabels = []

    this.measurementPoints = []
    this.isActive = false
    this.currentMeasurementType = null
    this.onStatusChanged?.('')

    // 通知结果清空
    this.onResultChanged?.(null, [])

    console.log('[MeasurementService] Cleared measurement')
  }

  /**
   * 计算三角形测量（坡度、高度差）
   */
  private calculateTriangle(): MeasurementResult {
    if (this.measurementPoints.length < 2) {
      throw new Error('Triangle measurement requires at least 2 points')
    }

    const p1 = this.measurementPoints[0].position
    const p2 = this.measurementPoints[1].position

    // P3 是 P2 在 P1 水平面上的投影
    const p3 = new BABYLON.Vector3(p2.x, p1.y, p2.z)

    const horizontalDistance = BABYLON.Vector3.Distance(p1, p3)
    const verticalDistance = Math.abs(p2.y - p1.y)
    const slopeDistance = BABYLON.Vector3.Distance(p1, p2)
    
    // 计算角度 (弧度转角度)
    const angleRad = Math.atan2(verticalDistance, horizontalDistance)
    const angleDeg = angleRad * (180 / Math.PI)

    const triangleData: TriangleMeasurementResult = {
      horizontalDistance,
      verticalDistance,
      slopeDistance,
      angle: angleDeg
    }

    return {
      type: 'triangle',
      value: slopeDistance,
      unit: 'm',
      points: this.measurementPoints,
      metadata: triangleData
    }
  }

  /**
   * 自动测量最低点
   * @param centerPoint 中心点/标识点
   * @param radius 搜索半径
   */
  autoMeasureLowestPoint(centerPoint: BABYLON.Vector3, radius: number = 10): void {
    if (!this.scene) return
    
    // 1. 找出最低点
    let lowestPoint = centerPoint.clone()
    let minHeight = centerPoint.y
    
    // 简单的网格采样
    const steps = 10
    const stepSize = (radius * 2) / steps
    
    for (let x = -radius; x <= radius; x += stepSize) {
      for (let z = -radius; z <= radius; z += stepSize) {
        if (Math.abs(x) < 0.1 && Math.abs(z) < 0.1) continue
        
        const checkPos = new BABYLON.Vector3(centerPoint.x + x, centerPoint.y + 50, centerPoint.z + z)
        const elevation = this.getElevationAt(checkPos)
        
        if (elevation < minHeight) {
          minHeight = elevation
          lowestPoint = new BABYLON.Vector3(checkPos.x, elevation, checkPos.z)
        }
      }
    }
    
    // 2. 设置测量点
    this.clearMeasurement()
    this.currentMeasurementType = 'triangle'
    this.isActive = true
    
    this.addPoint(centerPoint)
    this.addPoint(lowestPoint)
    
    // 3. 完成测量
    this.finishMeasurement()
  }

  /**
   * 设置输入处理
   */
  private setupInputHandler(): void {
    if (!this.scene) return
    
    // 防止重复注册
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver)
    }

    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.isActive) return
      
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          // 鼠标右键 (2) 重置/取消当前操作
          if (pointerInfo.event.button === 2) {
            if (this.currentMeasurementType === 'triangle') {
              // 仅清除当前正在进行的选点，不清除已完成的
              this.clearCurrentPoints()
              this.onStatusChanged?.('已重置。请点击场景拾取起点 A')
            }
            return
          }

          if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedPoint) {
            // 左键点击
            if (pointerInfo.event.button === 0) {
              // 三角测量逻辑
              if (this.currentMeasurementType === 'triangle') {
                this.addPoint(pointerInfo.pickInfo.pickedPoint)
                
                // 如果收集了2个点，创建实体并重置
                if (this.measurementPoints.length === 2) {
                   const p1 = this.measurementPoints[0].position
                   const p2 = this.measurementPoints[1].position
                   
                   this.createTriangle(p1, p2)
                   
                   // 准备下一次测量
                   this.clearCurrentPoints()
                   this.onStatusChanged?.('测量完成。请继续点击起点 A，或右键取消')
                }
              } else {
                // 其他测量模式保持原样
                this.addPoint(pointerInfo.pickInfo.pickedPoint)
              }
            }
          }
          break
      }
    })
  }

  /**
   * 创建新的三角测量实体
   */
  private createTriangle(p1: BABYLON.Vector3, p2: BABYLON.Vector3) {
    if (!this.scene || !this.advancedTexture) return

    const entity = new TriangleEntity(this.scene, this.advancedTexture, p1, p2)
    
    // 绑定删除回调
    entity.onDelete = (id) => {
      this.removeTriangle(id)
    }

    this.triangleEntities.push(entity)
    this.notifyTriangleResults(entity.result)
  }

  /**
   * 移除指定的三角测量
   */
  public removeTriangle(id: string) {
    const index = this.triangleEntities.findIndex(e => e.id === id)
    if (index !== -1) {
      const entity = this.triangleEntities[index]
      entity.dispose()
      this.triangleEntities.splice(index, 1)
      
      // 通知更新
      this.notifyTriangleResults(null)
    }
  }

  /**
   * 通知结果更新
   */
  private notifyTriangleResults(currentResult: MeasurementResult | null) {
    const allResults = this.triangleEntities.map(e => e.result)
    this.onResultChanged?.(currentResult, allResults)
  }

  /**
   * 清除当前的临时点（用于三角测量连续操作）
   */
  private clearCurrentPoints() {
    this.measurementMarkers.forEach(m => m.dispose())
    this.measurementMarkers = []
    this.measurementPoints = []
    this.measurementLines.forEach(l => l.dispose())
    this.measurementLines = []
  }

  // ============== 距离/面积/体积计算 ==============

  /**
   * 计算距离
   */
  private calculateDistance(): MeasurementResult {
    let totalDistance = 0

    for (let i = 0; i < this.measurementPoints.length - 1; i++) {
      const p1 = this.measurementPoints[i].position
      const p2 = this.measurementPoints[i + 1].position
      totalDistance += BABYLON.Vector3.Distance(p1, p2)
    }

    return {
      type: 'distance',
      value: totalDistance,
      unit: 'm',
      points: this.measurementPoints
    }
  }

  /**
   * 计算面积
   */
  private calculateArea(): MeasurementResult {
    if (this.measurementPoints.length < 3) {
      throw new Error('Area measurement requires at least 3 points')
    }

    const area = this.calculatePolygonArea(
      this.measurementPoints.map((p) => p.position)
    )

    return {
      type: 'area',
      value: area,
      unit: 'm²',
      points: this.measurementPoints
    }
  }

  /**
   * 计算体积（基于多边形挤出）
   */
  private calculateVolume(): MeasurementResult {
    if (this.measurementPoints.length < 3) {
      throw new Error('Volume measurement requires at least 3 points')
    }

    const baseArea = this.calculatePolygonArea(
      this.measurementPoints.map((p) => p.position)
    )
    const avgHeight = this.calculateAverageHeight()
    const volume = baseArea * avgHeight

    return {
      type: 'volume',
      value: volume,
      unit: 'm³',
      points: this.measurementPoints,
      metadata: {
        baseArea,
        averageHeight: avgHeight
      }
    }
  }

  /**
   * 计算挖填方量（核心功能）
   */
  private calculateCutFill(): MeasurementResult {
    if (this.measurementPoints.length < 3) {
      throw new Error('Cut-fill calculation requires at least 3 points')
    }

    const cutFillResult = this.computeCutFillVolume()

    return {
      type: 'cut-fill',
      value: cutFillResult.netVolume,
      unit: 'm³',
      points: this.measurementPoints,
      metadata: cutFillResult
    }
  }

  /**
   * 计算挖填方量（详细算法）
   */
  computeCutFillVolume(designElevation = 0): CutFillResult {
    const points = this.measurementPoints.map((p) => p.position)
    const area = this.calculatePolygonArea(points)
    const crossSections = this.generateCrossSections(points, designElevation)

    let cutVolume = 0
    let fillVolume = 0

    for (let i = 0; i < crossSections.length - 1; i++) {
      const section1 = crossSections[i]
      const section2 = crossSections[i + 1]
      const distance = section2.position - section1.position

      const avgCutArea = (section1.cutArea + section2.cutArea) / 2
      const avgFillArea = (section1.fillArea + section2.fillArea) / 2

      cutVolume += avgCutArea * distance
      fillVolume += avgFillArea * distance
    }

    const netVolume = cutVolume - fillVolume
    const avgHeight = points.reduce((sum, p) => sum + (p.y - designElevation), 0) / points.length

    return {
      cutVolume,
      fillVolume,
      netVolume,
      area,
      averageHeight: avgHeight,
      unit: 'm³',
      crossSections
    }
  }

  /**
   * 生成横截面数据
   */
  private generateCrossSections(
    points: BABYLON.Vector3[],
    designElevation: number,
    numSections = 10
  ): CrossSection[] {
    const sections: CrossSection[] = []
    const minX = Math.min(...points.map((p) => p.x))
    const maxX = Math.max(...points.map((p) => p.x))
    const step = (maxX - minX) / (numSections - 1)

    for (let i = 0; i < numSections; i++) {
      const x = minX + step * i
      const intersections = this.getIntersectionsAtX(points, x)

      if (intersections.length >= 2) {
        const sectionArea = this.calculateSectionArea(intersections, designElevation)
        
        sections.push({
          position: x,
          cutArea: sectionArea.cut,
          fillArea: sectionArea.fill,
          elevation: sectionArea.avgElevation
        })
      }
    }

    return sections
  }

  /**
   * 获取多边形在指定 X 坐标的相交点
   */
  private getIntersectionsAtX(
    points: BABYLON.Vector3[],
    x: number
  ): Array<{ y: number; z: number }> {
    const intersections: Array<{ y: number; z: number }> = []

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]

      if ((p1.x <= x && p2.x >= x) || (p1.x >= x && p2.x <= x)) {
        const t = (x - p1.x) / (p2.x - p1.x)
        const y = p1.y + t * (p2.y - p1.y)
        const z = p1.z + t * (p2.z - p1.z)
        intersections.push({ y, z })
      }
    }

    return intersections.sort((a, b) => a.z - b.z)
  }

  /**
   * 计算横截面的挖填方面积
   */
  private calculateSectionArea(
    intersections: Array<{ y: number; z: number }>,
    designElevation: number
  ): { cut: number; fill: number; avgElevation: number } {
    let cutArea = 0
    let fillArea = 0
    let totalElevation = 0

    for (let i = 0; i < intersections.length - 1; i += 2) {
      const p1 = intersections[i]
      const p2 = intersections[i + 1]
      
      const width = Math.abs(p2.z - p1.z)
      const avgHeight = (p1.y + p2.y) / 2
      totalElevation += avgHeight

      const heightDiff = avgHeight - designElevation

      if (heightDiff > 0) {
        cutArea += width * heightDiff
      } else {
        fillArea += width * Math.abs(heightDiff)
      }
    }

    return {
      cut: cutArea,
      fill: fillArea,
      avgElevation: totalElevation / (intersections.length / 2)
    }
  }

  /**
   * 获取高程剖面
   */
  getElevationProfile(
    startPoint: BABYLON.Vector3,
    endPoint: BABYLON.Vector3,
    numSamples = 50
  ): ElevationProfile[] {
    const profile: ElevationProfile[] = []
    const totalDistance = BABYLON.Vector3.Distance(startPoint, endPoint)

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples
      const position = BABYLON.Vector3.Lerp(startPoint, endPoint, t)
      const distance = totalDistance * t

      const originalElevation = this.getElevationAt(position)
      const designElevation = this.getDesignElevation(position)

      profile.push({
        distance,
        originalElevation,
        designElevation,
        difference: originalElevation - designElevation
      })
    }

    return profile
  }

  /**
   * 获取指定位置的高程（从地形或模型）
   */
  private getElevationAt(position: BABYLON.Vector3): number {
    if (!this.scene) return position.y

    const ray = new BABYLON.Ray(
      new BABYLON.Vector3(position.x, 1000, position.z),
      new BABYLON.Vector3(0, -1, 0)
    )

    const pickInfo = this.scene.pickWithRay(ray)
    if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
      return pickInfo.pickedPoint.y
    }

    return position.y
  }

  /**
   * 获取设计高程（可从设计数据读取）
   */
  private getDesignElevation(_position: BABYLON.Vector3): number {
    return 0
  }

  // ============== 图形绘制工具 ==============

  /**
   * 计算多边形面积（2D投影）
   */
  private calculatePolygonArea(points: BABYLON.Vector3[]): number {
    let area = 0
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += points[i].x * points[j].z
      area -= points[j].x * points[i].z
    }

    return Math.abs(area) / 2
  }

  /**
   * 计算平均高度
   */
  private calculateAverageHeight(): number {
    const sum = this.measurementPoints.reduce((acc, p) => acc + p.position.y, 0)
    return sum / this.measurementPoints.length
  }

  /**
   * 更新测量显示
   */
  private updateMeasurement(): void {
    // 清除旧的线条
    this.measurementLines.forEach((line) => line.dispose())
    this.measurementLines = []

    if (this.measurementPoints.length < 2) return

    // 绘制线条
    for (let i = 0; i < this.measurementPoints.length - 1; i++) {
      const p1 = this.measurementPoints[i].position
      const p2 = this.measurementPoints[i + 1].position
      const line = this.createLine(p1, p2)
      this.measurementLines.push(line)
    }

    // 闭合多边形
    if (this.currentMeasurementType === 'area' || this.currentMeasurementType === 'volume') {
      if (this.measurementPoints.length >= 3) {
        const p1 = this.measurementPoints[this.measurementPoints.length - 1].position
        const p2 = this.measurementPoints[0].position
        const line = this.createLine(p1, p2)
        this.measurementLines.push(line)
      }
    }
  }

  /**
   * 创建标记点
   */
  private createMarker(
    position: BABYLON.Vector3,
    color: BABYLON.Color3 = new BABYLON.Color3(1, 0, 0),
    size: number = 0.5
  ): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized')

    const sphere = BABYLON.MeshBuilder.CreateSphere(
      'marker',
      { diameter: size },
      this.scene
    )
    sphere.position = position

    const material = new BABYLON.StandardMaterial('markerMat', this.scene)
    material.diffuseColor = color
    material.emissiveColor = color.scale(0.5)
    sphere.material = material

    return sphere
  }

  /**
   * 创建角度弧线
   */
  private createAngleArc(origin: BABYLON.Vector3, pBase: BABYLON.Vector3, pTop: BABYLON.Vector3): void {
    if (!this.scene) return

    const vec1 = pBase.subtract(origin).normalize().scale(2.0)
    const vec2 = pTop.subtract(origin).normalize().scale(2.0)
    
    const arcStart = origin.add(vec1)
    const arcEnd = origin.add(vec2)
    
    const arc = BABYLON.MeshBuilder.CreateDashedLines("arc", {
        points: [arcStart, arcEnd],
        dashSize: 1, 
        gapSize: 1
    }, this.scene)
    
    arc.color = new BABYLON.Color3(1, 1, 0)
    this.measurementLines.push(arc)
  }

  /**
   * 创建标签
   */
  private createLabel(position: BABYLON.Vector3, text: string, offsetY: number = 0): void {
    if (!this.advancedTexture || !this.scene) return

    const label = new GUI.TextBlock()
    label.text = text
    label.color = "white"
    label.fontSize = 14
    label.outlineWidth = 2
    label.outlineColor = "black"
    
    this.advancedTexture.addControl(label)
    label.linkWithMesh(this.createAnchor(position))
    label.linkOffsetY = -20 + offsetY
    
    this.measurementLabels.push(label)
  }

  /**
   * 创建锚点（用于标签定位）
   */
  private createAnchor(position: BABYLON.Vector3): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized')
    const anchor = new BABYLON.Mesh("anchor", this.scene)
    anchor.position = position
    anchor.isVisible = false
    this.measurementMarkers.push(anchor)
    return anchor
  }

  /**
   * 创建线条
   */
  private createLine(
    start: BABYLON.Vector3,
    end: BABYLON.Vector3,
    color: BABYLON.Color3 = new BABYLON.Color3(0, 1, 0)
  ): BABYLON.LinesMesh {
    if (!this.scene) throw new Error('Scene not initialized')

    const line = BABYLON.MeshBuilder.CreateLines(
      'line',
      { points: [start, end] },
      this.scene
    )
    line.color = color

    return line
  }

  /**
   * 销毁服务
   */
  dispose(): void {
    this.clearMeasurement()
    this.advancedTexture?.dispose()
  }
}

/**
 * 三角测量实体类
 * 封装单个三角测量的所有资源和逻辑
 */
class TriangleEntity {
  public id: string
  public result: MeasurementResult
  public onDelete?: (id: string) => void

  private meshes: BABYLON.AbstractMesh[] = []
  private labels: GUI.Control[] = []
  private scene: BABYLON.Scene
  private ui: GUI.AdvancedDynamicTexture

  constructor(scene: BABYLON.Scene, ui: GUI.AdvancedDynamicTexture, p1: BABYLON.Vector3, p2: BABYLON.Vector3) {
    this.scene = scene
    this.ui = ui
    this.id = `triangle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.result = {} as MeasurementResult
    this.calculateAndDraw(p1, p2)
  }

  private calculateAndDraw(p1: BABYLON.Vector3, p2: BABYLON.Vector3) {
    const p3 = new BABYLON.Vector3(p2.x, p1.y, p2.z) // 垂足

    // 1. 计算数据
    const horizontalDistance = BABYLON.Vector3.Distance(p1, p3)
    const verticalDistance = Math.abs(p2.y - p1.y)
    const slopeDistance = BABYLON.Vector3.Distance(p1, p2)
    const angleRad = Math.atan2(verticalDistance, horizontalDistance)
    const angleDeg = angleRad * (180 / Math.PI)

    this.result = {
      id: this.id,
      type: 'triangle',
      value: slopeDistance,
      unit: 'm',
      points: [
        { id: 'p1', position: p1 },
        { id: 'p2', position: p2 }
      ],
      metadata: {
        horizontalDistance,
        verticalDistance,
        slopeDistance,
        angle: angleDeg
      } as TriangleMeasurementResult
    }

    // 2. 绘制图形
    // 标记点
    this.createMarker(p1, new BABYLON.Color3(0, 1, 0)) // 起点绿
    this.createMarker(p2, new BABYLON.Color3(1, 0, 0)) // 终点红
    this.createMarker(p3, new BABYLON.Color3(1, 1, 0), 0.3) // 垂足黄

    // 线条
    this.createLine(p1, p2, new BABYLON.Color3(1, 1, 1)) // 斜边白
    this.createLine(p1, p3, new BABYLON.Color3(0, 0, 1)) // 平边蓝
    this.createLine(p3, p2, new BABYLON.Color3(1, 0, 0)) // 垂边红

    // 角度弧
    this.createAngleArc(p1, p3, p2)

    // 3. 标签
    this.createLabel(BABYLON.Vector3.Center(p1, p2), `斜: ${slopeDistance.toFixed(2)}m`)
    this.createLabel(BABYLON.Vector3.Center(p1, p3), `平: ${horizontalDistance.toFixed(2)}m`)
    this.createLabel(BABYLON.Vector3.Center(p3, p2), `垂: ${verticalDistance.toFixed(2)}m`)
    this.createLabel(p1, `∠${angleDeg.toFixed(1)}°`, -40)
  }

  private createMarker(position: BABYLON.Vector3, color: BABYLON.Color3, size: number = 0.5) {
    const sphere = BABYLON.MeshBuilder.CreateSphere(`marker_${this.id}`, { diameter: size }, this.scene)
    sphere.position = position
    const material = new BABYLON.StandardMaterial(`mat_${this.id}`, this.scene)
    material.diffuseColor = color
    material.emissiveColor = color.scale(0.5)
    sphere.material = material
    
    this.registerAction(sphere)
    this.meshes.push(sphere)
  }

  private createLine(start: BABYLON.Vector3, end: BABYLON.Vector3, color: BABYLON.Color3) {
    const line = BABYLON.MeshBuilder.CreateLines(`line_${this.id}`, { points: [start, end] }, this.scene)
    line.color = color
    
    // 线条难以点击，增加一个透明的管子用于点击检测
    const tube = BABYLON.MeshBuilder.CreateTube(`tube_${this.id}`, {
        path: [start, end],
        radius: 0.1,
        updatable: false
    }, this.scene)
    tube.isVisible = false
    this.registerAction(tube)
    this.meshes.push(tube)

    this.meshes.push(line)
  }

  private createAngleArc(origin: BABYLON.Vector3, pBase: BABYLON.Vector3, pTop: BABYLON.Vector3) {
    const vec1 = pBase.subtract(origin).normalize().scale(2.0)
    const vec2 = pTop.subtract(origin).normalize().scale(2.0)
    const arcStart = origin.add(vec1)
    const arcEnd = origin.add(vec2)
    
    const arc = BABYLON.MeshBuilder.CreateDashedLines(`arc_${this.id}`, {
        points: [arcStart, arcEnd],
        dashSize: 1, gapSize: 1
    }, this.scene)
    arc.color = new BABYLON.Color3(1, 1, 0)
    this.meshes.push(arc)
  }

  private createLabel(position: BABYLON.Vector3, text: string, offsetY: number = 0) {
    const label = new GUI.TextBlock()
    label.text = text
    label.color = "white"
    label.fontSize = 14
    label.outlineWidth = 2
    label.outlineColor = "black"
    
    this.ui.addControl(label)
    
    // 创建锚点
    const anchor = new BABYLON.Mesh(`anchor_${this.id}`, this.scene)
    anchor.position = position
    anchor.isVisible = false
    this.meshes.push(anchor)
    
    label.linkWithMesh(anchor)
    label.linkOffsetY = -20 + offsetY
    
    this.labels.push(label)
  }

  private registerAction(mesh: BABYLON.AbstractMesh) {
    mesh.actionManager = new BABYLON.ActionManager(this.scene)
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
          trigger: BABYLON.ActionManager.OnRightPickTrigger
        },
        () => {
          if (this.onDelete) {
            this.onDelete(this.id)
          }
        }
      )
    )
  }

  dispose() {
    this.meshes.forEach(m => m.dispose())
    this.labels.forEach(l => this.ui.removeControl(l))
    this.meshes = []
    this.labels = []
  }
}
