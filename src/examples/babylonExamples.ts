/**
 * Babylon.js 快速开始示例
 * 演示如何使用 useBabylonModel 实现模型加载和挖填方计算
 */

import { ref, onMounted } from 'vue'
import { useBabylonModel } from '@/babylonjs'
import type { ModelInfo } from '@/services/babylon/ModelLoadService'

export function setupBabylonExample() {
  const canvasRef = ref<HTMLCanvasElement>()

  // 初始化 Babylon
  const {
    isReady,
    isLoading,
    currentModelId,
    loadedModels,
    initScene,
    loadModel,
    preloadModels,
    switchModel,
    startMeasurement,
    finishMeasurement,
    computeCutFillVolume
  } = useBabylonModel({
    enableInspector: true,
    enableHighlight: true,
    enableMeasurement: true
  })

  /**
   * 示例1: 基础模型加载
   */
  async function example1_BasicModelLoading() {
    if (!canvasRef.value) return

    // 初始化场景
    await initScene(canvasRef.value)

    // 加载单个模型
    const model = await loadModel({
      id: 'windmill_base',
      name: '风机基础',
      url: '/models/windmill_base.glb'
    }, {
      position: new BABYLON.Vector3(0, 0, 0),
      castShadow: true,
      receiveShadow: true
    })

    console.log('模型加载成功:', model)
  }

  /**
   * 示例2: 多模型预加载与切换
   */
  async function example2_MultipleModels() {
    if (!canvasRef.value) return

    await initScene(canvasRef.value)

    // 定义多个模型
    const models: ModelInfo[] = [
      {
        id: 'model1',
        name: '风机基础A型',
        url: '/models/windmill_base_a.glb',
        type: 'structure'
      },
      {
        id: 'model2',
        name: '风机基础B型',
        url: '/models/windmill_base_b.glb',
        type: 'structure'
      },
      {
        id: 'model3',
        name: '风机基础C型',
        url: '/models/windmill_base_c.glb',
        type: 'structure'
      }
    ]

    // 批量预加载（不显示）
    console.log('开始预加载模型...')
    await preloadModels(models)
    console.log('预加载完成！')

    // 切换显示不同模型
    switchModel('model1') // 显示模型1
    
    setTimeout(() => {
      switchModel('model2') // 2秒后切换到模型2
    }, 2000)

    setTimeout(() => {
      switchModel('model3') // 4秒后切换到模型3
    }, 4000)
  }

  /**
   * 示例3: 自定义模型处理
   */
  async function example3_CustomizeModel() {
    if (!canvasRef.value) return

    await initScene(canvasRef.value)

    await loadModel({
      id: 'tunnel',
      name: '隧道模型',
      url: '/models/tunnel.glb'
    }, {
      visible: true,
      customize: (meshes, scene, id) => {
        console.log(`处理模型 ${id}，共 ${meshes.length} 个网格`)

        // 设置特定网格半透明
        const innerWall = scene.getMeshByName('inner_wall')
        if (innerWall?.material) {
          innerWall.material.alpha = 0.5
          innerWall.material.transparencyMode = 2
        }

        // 调整根节点位置
        meshes[0].position.y += 2

        // 禁用背景的点击
        const background = scene.getMeshByName('background')
        if (background) {
          background.isPickable = false
        }

        // 添加自定义元数据
        meshes[0].metadata = {
          loadTime: new Date().toISOString(),
          customFlag: true
        }
      }
    })
  }

  /**
   * 示例4: 距离测量
   */
  async function example4_DistanceMeasurement() {
    // 开始距离测量
    startMeasurement('distance')

    // 用户点击场景添加点...
    // （实际中通过 scene.onPointerDown 事件添加点）

    // 完成测量
    const result = finishMeasurement()
    if (result) {
      console.log(`距离: ${result.value.toFixed(2)} ${result.unit}`)
    }
  }

  /**
   * 示例5: 面积测量
   */
  async function example5_AreaMeasurement() {
    // 开始面积测量
    startMeasurement('area')

    // 用户点击场景添加至少3个点...

    // 完成测量
    const result = finishMeasurement()
    if (result) {
      console.log(`面积: ${result.value.toFixed(2)} ${result.unit}`)
    }
  }

  /**
   * 示例6: 挖填方计算（核心功能）
   */
  async function example6_CutFillCalculation() {
    if (!canvasRef.value) return

    await initScene(canvasRef.value)

    // 加载地形模型
    await loadModel({
      id: 'terrain',
      name: '地形模型',
      url: '/models/terrain.glb'
    })

    // 开始挖填方测量
    startMeasurement('cut-fill')

    // 用户在地形上点击添加多边形顶点...
    // （至少3个点，形成闭合区域）

    // 完成测量
    const result = finishMeasurement()
    
    if (result && result.type === 'cut-fill') {
      const cutFillData = result.metadata
      
      console.log('========== 挖填方计算结果 ==========')
      console.log(`挖方量: ${cutFillData.cutVolume.toFixed(2)} m³`)
      console.log(`填方量: ${cutFillData.fillVolume.toFixed(2)} m³`)
      console.log(`净土方量: ${cutFillData.netVolume.toFixed(2)} m³`)
      console.log(`计算面积: ${cutFillData.area.toFixed(2)} m²`)
      console.log(`平均高度差: ${cutFillData.averageHeight.toFixed(2)} m`)
      console.log(`横截面数量: ${cutFillData.crossSections?.length || 0}`)
      console.log('====================================')

      // 显示横截面详细数据
      cutFillData.crossSections?.forEach((section, index) => {
        console.log(`截面 ${index + 1}:`)
        console.log(`  位置: ${section.position.toFixed(2)}m`)
        console.log(`  挖方面积: ${section.cutArea.toFixed(2)}m²`)
        console.log(`  填方面积: ${section.fillArea.toFixed(2)}m²`)
        console.log(`  高程: ${section.elevation.toFixed(2)}m`)
      })
    }
  }

  /**
   * 示例7: 指定设计高程的挖填方计算
   */
  async function example7_CutFillWithDesignElevation() {
    // 先进行挖填方测量（添加测量点）
    startMeasurement('cut-fill')
    
    // ... 用户添加点

    // 方式1: 使用默认高程（0m）
    const defaultResult = computeCutFillVolume()
    console.log('默认高程结果:', defaultResult)

    // 方式2: 指定设计高程为 10m
    const customResult = computeCutFillVolume(10.0)
    console.log('设计高程10m结果:', customResult)

    // 方式3: 指定设计高程为 -5m（地下工程）
    const undergroundResult = computeCutFillVolume(-5.0)
    console.log('设计高程-5m结果:', undergroundResult)

    // 对比不同设计高程的结果
    console.log('========== 不同设计高程对比 ==========')
    console.log('设计高程 0m:')
    console.log(`  挖方: ${defaultResult.cutVolume.toFixed(2)} m³`)
    console.log(`  填方: ${defaultResult.fillVolume.toFixed(2)} m³`)
    console.log('设计高程 10m:')
    console.log(`  挖方: ${customResult.cutVolume.toFixed(2)} m³`)
    console.log(`  填方: ${customResult.fillVolume.toFixed(2)} m³`)
    console.log('========================================')
  }

  /**
   * 示例8: 实战 - 风电场水下结构检查流程
   */
  async function example8_WindFarmInspection() {
    if (!canvasRef.value) return

    // 1. 初始化场景
    await initScene(canvasRef.value)

    // 2. 预加载所有风机基础模型
    const windmillModels: ModelInfo[] = [
      { id: 'wm_001', name: '风机001基础', url: '/models/windmill_001.glb' },
      { id: 'wm_002', name: '风机002基础', url: '/models/windmill_002.glb' },
      { id: 'wm_003', name: '风机003基础', url: '/models/windmill_003.glb' }
    ]

    console.log('预加载风机模型...')
    await preloadModels(windmillModels)
    console.log('预加载完成')

    // 3. 模拟用户点击地图上的风机
    function onWindmillClick(windmillId: string) {
      console.log(`点击了风机: ${windmillId}`)
      
      // 切换到对应的3D模型
      switchModel(`wm_${windmillId}`)
      
      // 高亮显示
      // highlightModel(`wm_${windmillId}`)
    }

    // 4. 模拟点击风机001
    onWindmillClick('001')

    // 5. 进行体积测量
    setTimeout(() => {
      console.log('开始体积测量...')
      startMeasurement('volume')
      
      // 用户绘制测量区域...
      
      // 完成测量
      const result = finishMeasurement()
      if (result) {
        console.log(`风机基础体积: ${result.value.toFixed(2)} m³`)
      }
    }, 2000)
  }

  /**
   * 示例9: 实战 - 隧道挖填方计算
   */
  async function example9_TunnelExcavation() {
    if (!canvasRef.value) return

    // 1. 初始化并加载隧道模型
    await initScene(canvasRef.value)
    
    await loadModel({
      id: 'tunnel_section',
      name: '隧道断面',
      url: '/models/tunnel_section.glb'
    }, {
      customize: (meshes, scene) => {
        // 设置隧道内壁半透明以便观察
        const innerWall = scene.getMeshByName('inner_wall')
        if (innerWall?.material) {
          innerWall.material.alpha = 0.6
        }
      }
    })

    // 2. 开始挖方计算
    console.log('开始隧道挖方计算...')
    startMeasurement('cut-fill')

    // 3. 用户在隧道断面上标记范围...
    // （这里假设用户已完成标记）

    // 4. 指定隧道设计高程并计算
    const designElevation = 50.0 // 设计高程50m
    const result = computeCutFillVolume(designElevation)

    // 5. 输出工程量报告
    console.log('========== 隧道工程量报告 ==========')
    console.log(`设计高程: ${designElevation}m`)
    console.log(`开挖土方量: ${result.cutVolume.toFixed(2)} m³`)
    console.log(`回填土方量: ${result.fillVolume.toFixed(2)} m³`)
    console.log(`净开挖量: ${result.netVolume.toFixed(2)} m³`)
    console.log(`断面面积: ${result.area.toFixed(2)} m²`)
    console.log('====================================')

    // 6. 根据工程量估算成本
    const excavationCost = result.cutVolume * 120 // 假设开挖单价120元/m³
    const backfillCost = result.fillVolume * 80   // 假设回填单价80元/m³
    const totalCost = excavationCost + backfillCost

    console.log('========== 成本估算 ==========')
    console.log(`开挖成本: ¥${excavationCost.toFixed(2)}`)
    console.log(`回填成本: ¥${backfillCost.toFixed(2)}`)
    console.log(`总成本: ¥${totalCost.toFixed(2)}`)
    console.log('==============================')
  }

  return {
    canvasRef,
    isReady,
    isLoading,
    currentModelId,
    loadedModels,
    
    // 示例方法
    example1_BasicModelLoading,
    example2_MultipleModels,
    example3_CustomizeModel,
    example4_DistanceMeasurement,
    example5_AreaMeasurement,
    example6_CutFillCalculation,
    example7_CutFillWithDesignElevation,
    example8_WindFarmInspection,
    example9_TunnelExcavation
  }
}
