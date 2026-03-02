/**
 * VolumeCalculationService - 方量计算服务
 * 
 * 功能：
 * 1. 基于基准高度计算模型的挖方、填方体积
 * 2. 计算水平投影面积
 * 3. 提供体积计算的核心算法
 */

import * as BABYLON from 'babylonjs'

/**
 * 方量计算结果
 */
export interface VolumeResult {
  /** 挖方体积（立方米） */
  cutVolume: number
  /** 填方体积（立方米） */
  fillVolume: number
  /** 总方量（立方米） */
  totalVolume: number
  /** 水平投影面积（平方米） */
  horizontalArea: number
  /** 基准高度（米） */
  targetHeight: number
  /** 采样分辨率（米） */
  sampleResolution: number
  /** 计算时间戳 */
  timestamp: number
  /** 总采样点数 */
  totalSamples?: number
  /** 有效采样点数 */
  validSamples?: number
  
  // ========== 新增字段 ==========
  /** 圆柱扣除体积（立方米），从填方中扣除 */
  cylinderDeduction?: number
  /** 实际填方体积（扣除圆柱后，立方米） */
  actualFillVolume?: number
  /** 圆柱参数（如果有的话） */
  cylinderParams?: {
    radius: number // 半径（米）
    height: number // 高度（米）
    bottomY: number // 底部高度（米）
  }
  /** 高度差值（实际高度 - 场景高度）米 */
  heightOffset?: number
  /** 实际基准高度（应用差值后）米 */
  actualTargetHeight?: number
  /** 模型尺寸信息 */
  modelSize?: {
    width: number  // X轴长度（米）
    height: number // Y轴高度（米）
    depth: number  // Z轴深度（米）
    minY: number   // Y轴最小值
    maxY: number   // Y轴最大值
  }
}

/**
 * 体积单位枚举
 */
export enum VolumeUnit {
  CubicMeter = 'm³',       // 立方米
  CubicDecimeter = 'dm³',  // 立方分米
  CubicCentimeter = 'cm³', // 立方厘米
  CubicMillimeter = 'mm³', // 立方毫米
  Liter = 'L',             // 升
}

/**
 * 单位转换系数（从立方米转换）
 */
const VOLUME_CONVERSION: Record<VolumeUnit, number> = {
  [VolumeUnit.CubicMeter]: 1,
  [VolumeUnit.CubicDecimeter]: 1000,
  [VolumeUnit.CubicCentimeter]: 1000000,
  [VolumeUnit.CubicMillimeter]: 1000000000,
  [VolumeUnit.Liter]: 1000,
}

/**
 * 体积单位转换
 */
export function convertVolume(volume: number, targetUnit: VolumeUnit): number {
  return volume * VOLUME_CONVERSION[targetUnit]
}

/**
 * 格式化体积显示
 */
export function formatVolume(volume: number, unit: VolumeUnit, decimals: number = 2): string {
  const converted = convertVolume(volume, unit)
  return `${converted.toFixed(decimals)} ${unit}`
}

/**
 * 方量计算服务类
 */
class VolumeCalculationService {
  /**
   * 验证基准高度是否合理
   * @param model 模型网格
   * @param targetHeight 基准高度
   * @returns 是否合理
   */
  validateTargetHeight(model: BABYLON.AbstractMesh, targetHeight: number): boolean {
    const boundingInfo = model.getBoundingInfo()
    const min = boundingInfo.boundingBox.minimumWorld.y
    const max = boundingInfo.boundingBox.maximumWorld.y

    // 基准高度应该在模型高度范围内或附近
    return targetHeight >= min - 10 && targetHeight <= max + 10
  }

  /**
   * 计算方量（挖方和填方）- 异步版本
   * 
   * 算法原理：
   * 1. 获取模型的包围盒，确定计算范围
   * 2. 在水平面上按照采样分辨率进行网格划分
   * 3. 对每个采样点进行射线检测，获取模型表面的高度
   * 4. 计算每个网格单元的体积：
   *    - 如果表面高度 > 基准高度，计算挖方体积
   *    - 如果表面高度 < 基准高度，计算填方体积
   * 5. 累加所有网格单元的体积
   * 
   * @param scene BabylonJS 场景
   * @param model 模型网格
   * @param targetHeight 基准高度（单位：米，模型坐标系）
   * @param sampleResolution 采样分辨率（单位：米）
   * @param onProgress 进度回调函数（可选）
   * @param cylinderRadius 圆柱半径（可选，用于风机基础扣除）
   * @param cylinderHeight 圆柱高度（可选，从底部到指定高度）
   * @param heightOffset 高度差值（可选，实际高度 - 场景高度，单位：米）
   * @returns 方量计算结果
   */
  async calculateVolume(
    scene: BABYLON.Scene,
    model: BABYLON.AbstractMesh,
    targetHeight: number,
    sampleResolution: number = 0.5,
    onProgress?: (percent: number) => void,
    cylinderRadius?: number,
    cylinderHeight?: number,
    heightOffset: number = 0
  ): Promise<VolumeResult> {
    const startTime = Date.now()

    // 1. 获取模型的包围盒（使用层级包围盒包含所有子网格）
    const boundingVectors = model.getHierarchyBoundingVectors()
    const min = boundingVectors.min
    const max = boundingVectors.max

    // 保存模型尺寸信息
    const modelSize = {
      width: max.x - min.x,
      height: max.y - min.y,
      depth: max.z - min.z,
      minY: min.y,
      maxY: max.y
    }

    console.log('📐 模型包围盒:', {
      min: { x: min.x.toFixed(2), y: min.y.toFixed(2), z: min.z.toFixed(2) },
      max: { x: max.x.toFixed(2), y: max.y.toFixed(2), z: max.z.toFixed(2) },
      size: {
        宽度X: modelSize.width.toFixed(2) + 'm',
        高度Y: modelSize.height.toFixed(2) + 'm',
        深度Z: modelSize.depth.toFixed(2) + 'm'
      }
    })

    // 计算实际基准高度（应用差值）
    const actualTargetHeight = targetHeight + heightOffset
    if (heightOffset !== 0) {
      console.log('📏 高度差值转换:', {
        场景基准高度: targetHeight.toFixed(2) + 'm',
        高度差值: heightOffset.toFixed(2) + 'm',
        实际基准高度: actualTargetHeight.toFixed(2) + 'm'
      })
    }

    // 2. 计算采样网格的行列数
    const xRange = max.x - min.x
    const zRange = max.z - min.z
    let adjustedResolution = sampleResolution
    let cols = Math.ceil(xRange / adjustedResolution)
    let rows = Math.ceil(zRange / adjustedResolution)
    let totalPoints = cols * rows

    // 最大采样点限制（避免卡死）
    const MAX_SAMPLES = 100000 // 10万个点
    const WARN_SAMPLES = 50000 // 5万个点警告
    
    if (totalPoints > MAX_SAMPLES) {
      // 自动调整分辨率
      const scale = Math.sqrt(totalPoints / MAX_SAMPLES)
      adjustedResolution = sampleResolution * scale
      cols = Math.ceil(xRange / adjustedResolution)
      rows = Math.ceil(zRange / adjustedResolution)
      totalPoints = cols * rows
      
      console.warn(`⚠️ 采样点过多，已自动调整分辨率: ${sampleResolution.toFixed(2)}m → ${adjustedResolution.toFixed(2)}m`)
      console.warn(`⚠️ 采样点数量: ${totalPoints.toLocaleString()}`)
    } else if (totalPoints > WARN_SAMPLES) {
      console.warn(`⚠️ 采样点较多 (${totalPoints.toLocaleString()})，计算可能需要一些时间...`)
    }

    console.log('📊 采样网格:', { 
      cols, 
      rows, 
      totalPoints: totalPoints.toLocaleString(),
      resolution: adjustedResolution.toFixed(2) + 'm'
    })

    // 3. 收集所有可用于射线检测的网格（包括子网格）
    const meshesToCheck: BABYLON.AbstractMesh[] = []
    const collectMeshes = (node: BABYLON.Node) => {
      if (node instanceof BABYLON.AbstractMesh && node.getTotalVertices() > 0) {
        meshesToCheck.push(node)
      }
      node.getChildren().forEach(child => collectMeshes(child))
    }
    collectMeshes(model)
    
    console.log(`🎯 用于射线检测的网格数量: ${meshesToCheck.length}`)

    // 4. 初始化计算变量
    let cutVolume = 0 // 挖方体积
    let fillVolume = 0 // 填方体积
    let horizontalArea = 0 // 水平投影面积
    let validSamples = 0 // 有效采样点数
    let processedPoints = 0

    // 诊断统计：表面高度分布与基准面关系
    let minSurfaceHeight = Number.POSITIVE_INFINITY
    let maxSurfaceHeight = Number.NEGATIVE_INFINITY
    let aboveCount = 0
    let belowCount = 0
    const edgeHeights: number[] = []

    // 5. 异步分批处理采样网格（避免阻塞主线程）
    const BATCH_SIZE = 500 // 每批处理 500 个点
    const progressStep = Math.max(1, Math.floor(totalPoints / 20)) // 每5%报告一次进度
    
    // 定义处理单个采样点的函数
    const processSample = (i: number, j: number) => {
      processedPoints++
      
      // 计算当前采样点的世界坐标
      const x = min.x + (j + 0.5) * adjustedResolution
      const z = min.z + (i + 0.5) * adjustedResolution

      // 从上方发射射线检测模型表面高度
      const rayOrigin = new BABYLON.Vector3(x, max.y + 10, z)
      const rayDirection = new BABYLON.Vector3(0, -1, 0)
      const rayLength = max.y - min.y + 20
      const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength)

      // 射线检测（检测所有子网格）
      const hit = scene.pickWithRay(
        ray,
        (mesh: BABYLON.AbstractMesh) => meshesToCheck.includes(mesh)
      )

      if (hit && hit.hit && hit.pickedPoint) {
        validSamples++

        // 获取表面高度
        const surfaceHeight = hit.pickedPoint.y

        // 更新诊断统计
        if (surfaceHeight < minSurfaceHeight) minSurfaceHeight = surfaceHeight
        if (surfaceHeight > maxSurfaceHeight) maxSurfaceHeight = surfaceHeight

        // 计算网格单元面积
        const cellArea = adjustedResolution * adjustedResolution
        horizontalArea += cellArea

        // 计算高度差
        const heightDiff = surfaceHeight - targetHeight

        // 根据高度差判断挖方或填方
        if (heightDiff > 0) {
          // 表面高于基准面 -> 挖方
          cutVolume += heightDiff * cellArea
          aboveCount++
        } else if (heightDiff < 0) {
          // 表面低于基准面 -> 填方
          fillVolume += Math.abs(heightDiff) * cellArea
          belowCount++
        }

        // 边缘高度采样（用于估算周边地面基准）
        if (i === 0 || j === 0 || i === rows - 1 || j === cols - 1) {
          edgeHeights.push(surfaceHeight)
        }
      }
    }

    // 分批异步处理
    let batchCount = 0
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        processSample(i, j)
        batchCount++
        
        // 每处理 BATCH_SIZE 个点，让出主线程
        if (batchCount >= BATCH_SIZE) {
          // 报告进度
          if (onProgress) {
            const percent = (processedPoints / totalPoints) * 100
            onProgress(percent)
          }
          
          // 让出主线程，避免卡死
          await new Promise(resolve => setTimeout(resolve, 0))
          batchCount = 0
        }
      }
    }
    
    // 最终进度
    if (onProgress) {
      onProgress(100)
    }

    const endTime = Date.now()
    const totalVolume = cutVolume + fillVolume
    const hitRate = totalPoints > 0 ? (validSamples / totalPoints * 100) : 0

    // 估算边缘高度（周边可能代表“天然地面”参考）
    const edgeMedian = edgeHeights.length ? this._median(edgeHeights) : NaN
    const aboveRate = totalPoints > 0 ? (aboveCount / totalPoints) * 100 : 0
    const belowRate = totalPoints > 0 ? (belowCount / totalPoints) * 100 : 0

    console.log('✅ 方量计算完成:', {
      挖方: `${cutVolume.toFixed(2)} m³`,
      填方: `${fillVolume.toFixed(2)} m³`,
      总方量: `${totalVolume.toFixed(2)} m³`,
      水平面积: `${horizontalArea.toFixed(2)} m²`,
      总采样点: totalPoints.toLocaleString(),
      有效采样点: validSamples.toLocaleString(),
      命中率: `${hitRate.toFixed(1)}%`,
      计算耗时: `${endTime - startTime}ms`,
      实际分辨率: `${adjustedResolution.toFixed(2)}m`,
      表面高度范围: `${minSurfaceHeight.toFixed(2)} → ${maxSurfaceHeight.toFixed(2)} (m)`,
      基准面相对分布: { 高于基准: `${aboveRate.toFixed(1)}%`, 低于基准: `${belowRate.toFixed(1)}%` },
      周边高度中位数估算: isNaN(edgeMedian) ? 'N/A' : `${edgeMedian.toFixed(2)} m`
    })
    
    if (hitRate < 50) {
      console.warn('⚠️ 射线检测命中率过低，结果可能不准确')
    }

    // 基准面诊断提示
    if (belowCount === 0 && aboveCount > 0) {
      console.warn('⚠️ 所有采样点均高于基准面，当前基准面可能偏低（位于模型下方）。请尝试提高 targetHeight 到周边地面高度，例如使用“周边高度中位数”估算值。')
    } else if (aboveCount === 0 && belowCount > 0) {
      console.warn('⚠️ 所有采样点均低于基准面，当前基准面可能偏高（位于模型上方）。请尝试降低 targetHeight 到周边地面高度。')
    }

    // 计算圆柱扣除体积（如果提供了参数）
    let cylinderDeduction = 0
    let actualFillVolume = fillVolume
    let cylinderParams: VolumeResult['cylinderParams'] | undefined

    if (cylinderRadius && cylinderHeight && cylinderHeight > 0) {
      cylinderDeduction = Math.PI * cylinderRadius * cylinderRadius * cylinderHeight
      actualFillVolume = Math.max(0, fillVolume - cylinderDeduction)
      cylinderParams = { radius: cylinderRadius, height: cylinderHeight, bottomY: min.y }
      console.log('🔵 圆柱扣除:', { 半径: cylinderRadius.toFixed(2) + 'm', 高度: cylinderHeight.toFixed(2) + 'm', 圆柱体积: cylinderDeduction.toFixed(2) + ' m³', 扣除后填方: actualFillVolume.toFixed(2) + ' m³' })
    }

    return {
      cutVolume,
      fillVolume,
      totalVolume,
      horizontalArea,
      targetHeight,
      sampleResolution: adjustedResolution,
      timestamp: Date.now(),
      totalSamples: totalPoints,
      validSamples,
      cylinderDeduction: cylinderDeduction > 0 ? cylinderDeduction : undefined,
      actualFillVolume: cylinderDeduction > 0 ? actualFillVolume : undefined,
      cylinderParams,
      heightOffset: heightOffset !== 0 ? heightOffset : undefined,
      actualTargetHeight: heightOffset !== 0 ? actualTargetHeight : undefined,
      modelSize
    }
  }

  /**   * 快速方量计算（基于网格几何）- 推荐使用
   * 
   * 算法原理：
   * 1. 直接遍历模型的所有三角形面
   * 2. 对每个三角形，计算它与基准面形成的棱柱体积
   * 3. 使用带符号体积（Signed Volume）方法判断挖方/填方
   * 4. 无需射线检测和采样，速度快10-100倍
   * 
   * 优势：
   * - 性能高：O(n)复杂度，n为三角形数量
   * - 精度高：直接基于模型原始几何数据
   * - 实时性：支持动态调整基准高度
   * - 内存低：不需要大量采样点
   * 
   * @param scene BabylonJS 场景
   * @param model 模型网格
   * @param targetHeight 基准高度（单位：米）
   * @param cylinderRadius 圆柱半径（可选）
   * @param cylinderHeight 圆柱高度（可选）
   * @param heightOffset 高度差值（可选，实际高度 - 场景高度，单位：米）
   * @returns 方量计算结果
   */
  async calculateVolumeFast(
    scene: BABYLON.Scene,
    model: BABYLON.AbstractMesh,
    targetHeight: number,
    cylinderRadius?: number,
    cylinderHeight?: number,
    heightOffset: number = 0
  ): Promise<VolumeResult> {
    const startTime = Date.now()

    // 获取模型包围盒信息
    const boundingVectors = model.getHierarchyBoundingVectors()
    const min = boundingVectors.min
    const max = boundingVectors.max

    const modelSize = {
      width: max.x - min.x,
      height: max.y - min.y,
      depth: max.z - min.z,
      minY: min.y,
      maxY: max.y
    }

    console.log('📐 模型尺寸:', {
      宽度X: modelSize.width.toFixed(2) + 'm',
      高度Y: modelSize.height.toFixed(2) + 'm',
      深度Z: modelSize.depth.toFixed(2) + 'm',
      最小Y: modelSize.minY.toFixed(2) + 'm',
      最大Y: modelSize.maxY.toFixed(2) + 'm'
    })

    const actualTargetHeight = targetHeight + heightOffset
    if (heightOffset !== 0) {
      console.log('📏 高度差值转换:', { 
        场景高度: targetHeight.toFixed(2) + 'm', 
        高度差值: heightOffset.toFixed(2) + 'm', 
        实际高度: actualTargetHeight.toFixed(2) + 'm' 
      })
    }

    // 1. 收集所有网格及其几何数据
    const meshes: BABYLON.Mesh[] = []
    const collectMeshes = (node: BABYLON.Node) => {
      if (node instanceof BABYLON.Mesh && node.getTotalVertices() > 0) {
        meshes.push(node)
      }
      node.getChildren().forEach(child => collectMeshes(child))
    }
    collectMeshes(model)

    console.log(`🚀 快速方量计算启动，处理 ${meshes.length} 个网格`)

    let cutVolume = 0
    let fillVolume = 0
    let horizontalArea = 0
    let totalTriangles = 0

    // 诊断统计
    let minSurfaceHeight = Number.POSITIVE_INFINITY
    let maxSurfaceHeight = Number.NEGATIVE_INFINITY
    let aboveCount = 0
    let belowCount = 0

    // 2. 遍历每个网格
    for (const mesh of meshes) {
      const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
      const indices = mesh.getIndices()
      
      if (!positions || !indices) continue

      const worldMatrix = mesh.getWorldMatrix()
      totalTriangles += indices.length / 3

      // 3. 遍历每个三角形
      for (let i = 0; i < indices.length; i += 3) {
        // 获取三角形的三个顶点索引
        const i0 = indices[i] * 3
        const i1 = indices[i + 1] * 3
        const i2 = indices[i + 2] * 3

        // 获取局部坐标系下的顶点位置
        const v0Local = new BABYLON.Vector3(positions[i0], positions[i0 + 1], positions[i0 + 2])
        const v1Local = new BABYLON.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2])
        const v2Local = new BABYLON.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2])

        // 转换到世界坐标系
        const v0 = BABYLON.Vector3.TransformCoordinates(v0Local, worldMatrix)
        const v1 = BABYLON.Vector3.TransformCoordinates(v1Local, worldMatrix)
        const v2 = BABYLON.Vector3.TransformCoordinates(v2Local, worldMatrix)

        // 更新高度统计
        const heights = [v0.y, v1.y, v2.y]
        for (const h of heights) {
          if (h < minSurfaceHeight) minSurfaceHeight = h
          if (h > maxSurfaceHeight) maxSurfaceHeight = h
        }

        // 计算三角形面积（水平投影）
        const edge1 = new BABYLON.Vector3(v1.x - v0.x, 0, v1.z - v0.z)
        const edge2 = new BABYLON.Vector3(v2.x - v0.x, 0, v2.z - v0.z)
        const cross = BABYLON.Vector3.Cross(edge1, edge2)
        const triArea = cross.length() / 2

        // 计算三角形重心高度
        const avgHeight = (v0.y + v1.y + v2.y) / 3

        // 判断三角形相对基准面的位置
        const heightDiff = avgHeight - targetHeight

        if (heightDiff > 0) {
          // 高于基准面 -> 挖方
          // 计算三角形与基准面形成的棱柱/棱锥体积
          const volume = this._calculateTrianglePrismVolume(v0, v1, v2, targetHeight)
          if (volume > 0) {
            cutVolume += volume
            aboveCount++
          }
        } else if (heightDiff < 0) {
          // 低于基准面 -> 填方
          const volume = this._calculateTrianglePrismVolume(v0, v1, v2, targetHeight)
          if (volume > 0) {
            fillVolume += volume
            belowCount++
          }
        }

        horizontalArea += triArea
      }
    }

    const endTime = Date.now()
    const totalVolume = cutVolume + fillVolume

    // 计算圆柱扣除
    let cylinderDeduction = 0
    let actualFillVolume = fillVolume
    let cylinderParams: VolumeResult['cylinderParams'] | undefined

    if (cylinderRadius && cylinderHeight && cylinderHeight > 0) {
      cylinderDeduction = Math.PI * cylinderRadius * cylinderRadius * cylinderHeight
      actualFillVolume = Math.max(0, fillVolume - cylinderDeduction)
      cylinderParams = { radius: cylinderRadius, height: cylinderHeight, bottomY: min.y }
      console.log('🔵 圆柱扣除:', {
        半径: cylinderRadius.toFixed(2),
        高度: cylinderHeight.toFixed(2),
        体积: cylinderDeduction.toFixed(2),
        扣除后填方: actualFillVolume.toFixed(2)
      })
    }

    // 估算边缘高度（简化版：取高度范围的80%分位）
    const edgeMedian = minSurfaceHeight + (maxSurfaceHeight - minSurfaceHeight) * 0.8

    console.log('✅ 快速方量计算完成:', {
      挖方: `${cutVolume.toFixed(2)} m³`,
      填方: `${fillVolume.toFixed(2)} m³`,
      圆柱扣除: cylinderDeduction > 0 ? `${cylinderDeduction.toFixed(2)} m³` : '无',
      实际填方: cylinderDeduction > 0 ? `${actualFillVolume.toFixed(2)} m³` : '同填方',
      总方量: `${totalVolume.toFixed(2)} m³`,
      水平面积: `${horizontalArea.toFixed(2)} m²`,
      三角形数: totalTriangles.toLocaleString(),
      计算耗时: `${endTime - startTime}ms`,
      表面高度范围: `${minSurfaceHeight.toFixed(2)} → ${maxSurfaceHeight.toFixed(2)} (m)`,
      基准高度: `${targetHeight.toFixed(2)} m`,
      挖方三角形: aboveCount.toLocaleString(),
      填方三角形: belowCount.toLocaleString()
    })

    // 基准面诊断提示
    if (belowCount === 0 && aboveCount > 0) {
      console.warn('⚠️ 所有三角形均高于基准面，建议提高 targetHeight')
    } else if (aboveCount === 0 && belowCount > 0) {
      console.warn('⚠️ 所有三角形均低于基准面，建议降低 targetHeight')
    }

    return {
      cutVolume,
      fillVolume,
      totalVolume,
      horizontalArea,
      targetHeight,
      sampleResolution: 0, // 不适用
      timestamp: Date.now(),
      totalSamples: totalTriangles,
      validSamples: totalTriangles,
      cylinderDeduction: cylinderDeduction > 0 ? cylinderDeduction : undefined,
      actualFillVolume: cylinderDeduction > 0 ? actualFillVolume : undefined,
      cylinderParams,
      heightOffset: heightOffset !== 0 ? heightOffset : undefined,
      actualTargetHeight: heightOffset !== 0 ? actualTargetHeight : undefined,
      modelSize
    }
  }

  /**
   * 计算三角形与基准面形成的棱柱体积
   * 使用带符号体积方法
   */
  private _calculateTrianglePrismVolume(
    v0: BABYLON.Vector3,
    v1: BABYLON.Vector3,
    v2: BABYLON.Vector3,
    baseHeight: number
  ): number {
    // 将三角形顶点投影到基准面
    const h0 = v0.y - baseHeight
    const h1 = v1.y - baseHeight
    const h2 = v2.y - baseHeight

    // 三角形水平投影面积
    const edge1 = new BABYLON.Vector3(v1.x - v0.x, 0, v1.z - v0.z)
    const edge2 = new BABYLON.Vector3(v2.x - v0.x, 0, v2.z - v0.z)
    const cross = BABYLON.Vector3.Cross(edge1, edge2)
    const area = Math.abs(cross.length()) / 2

    // 使用三点高度的平均值计算棱柱体积
    const avgHeight = Math.abs((h0 + h1 + h2) / 3)
    
    return area * avgHeight
  }
  /**
   * 快速估算基准高度（基于网格边界）
   * 从模型边缘网格顶点采样高度，速度快
   */
  estimateTargetHeightFast(
    model: BABYLON.AbstractMesh
  ): number | null {
    const boundingVectors = model.getHierarchyBoundingVectors()
    const min = boundingVectors.min
    const max = boundingVectors.max

    const edgeMargin = 0.1 // 边缘范围（包围盒的10%）
    const xMargin = (max.x - min.x) * edgeMargin
    const zMargin = (max.z - min.z) * edgeMargin

    const edgeHeights: number[] = []

    // 收集网格
    const meshes: BABYLON.Mesh[] = []
    const collectMeshes = (node: BABYLON.Node) => {
      if (node instanceof BABYLON.Mesh && node.getTotalVertices() > 0) {
        meshes.push(node)
      }
      node.getChildren().forEach(child => collectMeshes(child))
    }
    collectMeshes(model)

    // 遍历所有顶点，采样边缘区域的高度
    for (const mesh of meshes) {
      const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
      if (!positions) continue

      const worldMatrix = mesh.getWorldMatrix()

      for (let i = 0; i < positions.length; i += 3) {
        const vLocal = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2])
        const v = BABYLON.Vector3.TransformCoordinates(vLocal, worldMatrix)

        // 判断是否在边缘区域
        const isEdgeX = v.x < min.x + xMargin || v.x > max.x - xMargin
        const isEdgeZ = v.z < min.z + zMargin || v.z > max.z - zMargin

        if (isEdgeX || isEdgeZ) {
          edgeHeights.push(v.y)
        }
      }
    }

    if (edgeHeights.length === 0) {
      console.warn('⚠️ 无法采样边缘高度')
      return null
    }

    // 使用80%分位数（比中位数更稳定，排除坑底影响）
    edgeHeights.sort((a, b) => a - b)
    const percentile80Index = Math.floor(edgeHeights.length * 0.8)
    const estimatedHeight = edgeHeights[percentile80Index]

    console.log('🧮 快速基准高度估算:', {
      采样点数: edgeHeights.length,
      '80%分位': estimatedHeight.toFixed(2) + ' m',
      最小值: edgeHeights[0].toFixed(2) + ' m',
      最大值: edgeHeights[edgeHeights.length - 1].toFixed(2) + ' m',
      中位数: edgeHeights[Math.floor(edgeHeights.length / 2)].toFixed(2) + ' m'
    })

    return estimatedHeight
  }
  /**   * 估算基准高度：取包围盒边界处的表面高度中位数
   * 适用于“坑洞”场景，边界通常代表周边天然地面高度
   */
  estimateTargetHeightByEdges(
    scene: BABYLON.Scene,
    model: BABYLON.AbstractMesh,
    sampleResolution: number = 1
  ): number | null {
    const boundingVectors = model.getHierarchyBoundingVectors()
    const min = boundingVectors.min
    const max = boundingVectors.max

    const xRange = max.x - min.x
    const zRange = max.z - min.z
    let cols = Math.ceil(xRange / sampleResolution)
    let rows = Math.ceil(zRange / sampleResolution)

    const meshesToCheck: BABYLON.AbstractMesh[] = []
    const collectMeshes = (node: BABYLON.Node) => {
      if (node instanceof BABYLON.AbstractMesh && node.getTotalVertices() > 0) {
        meshesToCheck.push(node)
      }
      node.getChildren().forEach(child => collectMeshes(child))
    }
    collectMeshes(model)

    const edgeHeights: number[] = []
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // 仅边缘单元
        if (!(i === 0 || j === 0 || i === rows - 1 || j === cols - 1)) continue

        const x = min.x + (j + 0.5) * sampleResolution
        const z = min.z + (i + 0.5) * sampleResolution

        const rayOrigin = new BABYLON.Vector3(x, max.y + 10, z)
        const rayDirection = new BABYLON.Vector3(0, -1, 0)
        const rayLength = max.y - min.y + 20
        const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength)

        const hit = scene.pickWithRay(
          ray,
          (mesh: BABYLON.AbstractMesh) => meshesToCheck.includes(mesh)
        )

        if (hit && hit.hit && hit.pickedPoint) {
          edgeHeights.push(hit.pickedPoint.y)
        }
      }
    }

    if (edgeHeights.length === 0) {
      console.warn('⚠️ 无法在模型边界采样到高度，估算基准面失败。')
      return null
    }

    const median = this._median(edgeHeights)
    console.log('🧮 周边基准高度估算:', {
      采样点数: edgeHeights.length,
      中位数: median.toFixed(2) + ' m',
      最小值: Math.min(...edgeHeights).toFixed(2) + ' m',
      最大值: Math.max(...edgeHeights).toFixed(2) + ' m'
    })

    return median
  }

  // 计算中位数（私有辅助）
  private _median(values: number[]): number {
    if (values.length === 0) return NaN
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  /**
   * 格式化体积（立方米）
   * @param volume 体积值
   * @returns 格式化字符串
   */
  formatVolume(volume: number): string {
    return `${volume.toFixed(2)} m³`
  }

  /**
   * 格式化面积（平方米）
   * @param area 面积值
   * @returns 格式化字符串
   */
  formatArea(area: number): string {
    return `${area.toFixed(2)} m²`
  }
}

// 导出单例
export const volumeCalculationService = new VolumeCalculationService()
