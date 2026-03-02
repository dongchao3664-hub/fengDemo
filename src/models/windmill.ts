/**
 * Windmill 数据模型
 * 定义风机相关的数据结构
 */

/** 风机基本信息 */
export interface Windmill {
  id: string                    // 风机唯一ID
  name: string                  // 风机名称
  position: {
    lng: number                 // 经度
    lat: number                 // 纬度
    height: number              // 高度
  }
  modelUrl: string              // 表面模型 URL
  underwaterModelUrl: string    // 水下模型 URL
  power: number                 // 装机容量 (MW)
  status: 'normal' | 'stopped' | 'error' | 'maintaining'
  installDate: string           // 安装日期
  manufacturer: string          // 制造商
  metadata?: Record<string, any> // 其他元数据
}

/** 风机详情信息（可能需要单独加载） */
export interface WindmillDetail {
  id: string
  name: string
  // 基本规格
  spec: {
    type: string                // 风机型号
    ratedPower: number          // 额定功率
    rotorDiameter: number       // 转子直径
    hubHeight: number           // 轮毂高度
    minWindSpeed: number        // 最小风速
    ratedWindSpeed: number      // 额定风速
    maxWindSpeed: number        // 最大风速
  }
  // 位置信息
  location: {
    lng: number
    lat: number
    height: number
    depth: number               // 水深
  }
  // 水下状况
  underwaterCondition: {
    seabedType: string          // 海床类型
    sedimentThickness: number   // 沉积物厚度
    cableDepth: number          // 电缆埋深
    foundationType: string      // 基础类型 (monopile, jacket, etc)
    lastInspectionDate: string  // 最后检测日期
    damageReport?: string       // 损伤报告
  }
  // 维护信息
  maintenance: {
    lastMaintenanceDate: string
    nextMaintenanceDate: string
    maintenanceHistory: Array<{
      date: string
      type: string
      description: string
    }>
  }
}

/** 风机渲染配置 */
export interface WindmillRenderConfig {
  modelScale: number            // 模型缩放
  modelColor: string            // 模型颜色
  selectedColor: string         // 选中时颜色
  highlightColor: string        // 高亮颜色
  iconUrl?: string              // 标记图标
}

/** 风机查询结果 */
export interface WindmillQuery {
  windmills: Windmill[]
  total: number
  page: number
  pageSize: number
}

/** 风机统计信息 */
export interface WindmillStatistics {
  total: number                 // 总数
  online: number                // 在线
  offline: number               // 离线
  error: number                 // 错误
  totalCapacity: number         // 总装机容量
  averagePower: number          // 平均功率
}
