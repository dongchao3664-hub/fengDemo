/**
 * 风场 / 厂区 / 风机数据结构定义
 * 用于 BabylonJS 3D 模型展示和树形导航
 */

// ============== 基础数据类型 ==============

/**
 * 风机基本信息
 */
export interface Windmill {
  id: string
  name: string
  code: string // 设备编号
  power: number // 装机功率（kW）
  status: 'running' | 'maintenance' | 'offline' | 'fault'
  position: {
    lng: number
    lat: number
    height: number
  }
  modelUrl: string // GLTF 模型 URL
  underwaterModelUrl: string // 水下模型 URL（局部细节）
  lastMaintenanceDate: string
  nextMaintenanceDate: string
}

/**
 * 厂区（风电场）
 */
export interface WindFarm {
  id: string
  name: string
  location: string
  totalCapacity: number // 总装机容量（MW）
  windmills: Windmill[]
  statistics: {
    totalWindmills: number
    runningCount: number
    maintenanceCount: number
    faultCount: number
    avgEfficiency: number // 平均效率（%）
  }
}

/**
 * 水下模型详情（局部细节结构）
 */
export interface UnderwaterModelDetail {
  id: string
  windmillId: string
  windmillName: string
  modelType: 'foundation' | 'pile' | 'cable' | 'complete' // 模型类型
  description: string // 模型描述
  modelUrl: string // GLTF 模型 URL
  vertices: number // 顶点数
  faces: number // 面数
  materials: number // 材质数
  fileSize: number // 文件大小（MB）
  createdDate: string
  lastUpdateDate: string
  boundingBox: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
  }
}

/**
 * 树形结构用的节点
 */
export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  data?: Windmill | WindFarm
  type: 'farm' | 'windmill' // 节点类型
}

// ============== 模拟数据 ==============

/**
 * 模拟风电场数据
 */
export const mockWindFarms: WindFarm[] = [
  {
    id: 'farm001',
    name: '华能风电场 A 区',
    location: '河北省张家口市',
    totalCapacity: 300,
    windmills: [
      {
        id: '1d96e130f8944f2dbdb1e5458b4d78f5',
        name: '风机 A-001',
        code: 'HN-A-001',
        power: 2500,
        status: 'running',
        position: {
          lng: 115.05,
          lat: 40.85,
          height: 100
        },
        modelUrl: 'http://47.104.109.74:10555/linejson/feng/fengche.gltf',
        underwaterModelUrl: 'http://47.104.109.74:10555/linejson/feng/output2.glb',
        lastMaintenanceDate: '2025-01-10',
        nextMaintenanceDate: '2025-04-10'
      },
      {
        id: 'wm002',
        name: '风机 A-002',
        code: 'HN-A-002',
        power: 2500,
        status: 'running',
        position: {
          lng: 115.06,
          lat: 40.85,
          height: 100
        },
        modelUrl: '/models/windmill/wm002.glb',
        underwaterModelUrl: '/models/underwater/wm002-foundation.glb',
        lastMaintenanceDate: '2025-01-12',
        nextMaintenanceDate: '2025-04-12'
      },
      {
        id: 'wm003',
        name: '风机 A-003',
        code: 'HN-A-003',
        power: 2500,
        status: 'maintenance',
        position: {
          lng: 115.07,
          lat: 40.85,
          height: 100
        },
        modelUrl: '/models/windmill/wm003.glb',
        underwaterModelUrl: '/models/underwater/wm003-foundation.glb',
        lastMaintenanceDate: '2025-01-15',
        nextMaintenanceDate: '2025-04-15'
      },
      {
        id: 'wm004',
        name: '风机 A-004',
        code: 'HN-A-004',
        power: 2500,
        status: 'running',
        position: {
          lng: 115.08,
          lat: 40.85,
          height: 100
        },
        modelUrl: '/models/windmill/wm004.glb',
        underwaterModelUrl: '/models/underwater/wm004-foundation.glb',
        lastMaintenanceDate: '2025-01-08',
        nextMaintenanceDate: '2025-04-08'
      },
      {
        id: 'wm005',
        name: '风机 A-005',
        code: 'HN-A-005',
        power: 2500,
        status: 'fault',
        position: {
          lng: 115.09,
          lat: 40.85,
          height: 100
        },
        modelUrl: '/models/windmill/wm005.glb',
        underwaterModelUrl: '/models/underwater/wm005-foundation.glb',
        lastMaintenanceDate: '2025-01-06',
        nextMaintenanceDate: '2025-04-06'
      }
    ],
    statistics: {
      totalWindmills: 5,
      runningCount: 3,
      maintenanceCount: 1,
      faultCount: 1,
      avgEfficiency: 92.5
    }
  },
  {
    id: 'farm002',
    name: '华能风电场 B 区',
    location: '河北省张家口市',
    totalCapacity: 250,
    windmills: [
      {
        id: 'wm101',
        name: '风机 B-001',
        code: 'HN-B-001',
        power: 2500,
        status: 'running',
        position: {
          lng: 115.15,
          lat: 40.90,
          height: 100
        },
        modelUrl: '/models/windmill/wm101.glb',
        underwaterModelUrl: '/models/underwater/wm101-foundation.glb',
        lastMaintenanceDate: '2025-01-11',
        nextMaintenanceDate: '2025-04-11'
      },
      {
        id: 'wm102',
        name: '风机 B-002',
        code: 'HN-B-002',
        power: 2500,
        status: 'running',
        position: {
          lng: 115.16,
          lat: 40.90,
          height: 100
        },
        modelUrl: '/models/windmill/wm102.glb',
        underwaterModelUrl: '/models/underwater/wm102-foundation.glb',
        lastMaintenanceDate: '2025-01-13',
        nextMaintenanceDate: '2025-04-13'
      },
      {
        id: 'wm103',
        name: '风机 B-003',
        code: 'HN-B-003',
        power: 2500,
        status: 'running',
        position: {
          lng: 115.17,
          lat: 40.90,
          height: 100
        },
        modelUrl: '/models/windmill/wm103.glb',
        underwaterModelUrl: '/models/underwater/wm103-foundation.glb',
        lastMaintenanceDate: '2025-01-09',
        nextMaintenanceDate: '2025-04-09'
      }
    ],
    statistics: {
      totalWindmills: 3,
      runningCount: 3,
      maintenanceCount: 0,
      faultCount: 0,
      avgEfficiency: 95.2
    }
  }
]

// ============== 水下模型详情数据 ==============

/**
 * 模拟水下模型详情数据
 */
export const mockUnderwaterModels: Record<string, UnderwaterModelDetail> = {
  wm001: {
    id: 'underwater_wm001',
    windmillId: 'wm001',
    windmillName: '风机 A-001',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm001-foundation.glb',
    vertices: 125000,
    faces: 250000,
    materials: 48,
    fileSize: 45.2,
    createdDate: '2024-12-01',
    lastUpdateDate: '2025-01-15',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm002: {
    id: 'underwater_wm002',
    windmillId: 'wm002',
    windmillName: '风机 A-002',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm002-foundation.glb',
    vertices: 128000,
    faces: 256000,
    materials: 48,
    fileSize: 46.8,
    createdDate: '2024-12-02',
    lastUpdateDate: '2025-01-16',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm003: {
    id: 'underwater_wm003',
    windmillId: 'wm003',
    windmillName: '风机 A-003',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm003-foundation.glb',
    vertices: 122000,
    faces: 244000,
    materials: 48,
    fileSize: 43.5,
    createdDate: '2024-12-03',
    lastUpdateDate: '2025-01-17',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm004: {
    id: 'underwater_wm004',
    windmillId: 'wm004',
    windmillName: '风机 A-004',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm004-foundation.glb',
    vertices: 126000,
    faces: 252000,
    materials: 48,
    fileSize: 45.9,
    createdDate: '2024-12-04',
    lastUpdateDate: '2025-01-18',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm005: {
    id: 'underwater_wm005',
    windmillId: 'wm005',
    windmillName: '风机 A-005',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm005-foundation.glb',
    vertices: 124000,
    faces: 248000,
    materials: 48,
    fileSize: 44.6,
    createdDate: '2024-12-05',
    lastUpdateDate: '2025-01-19',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm101: {
    id: 'underwater_wm101',
    windmillId: 'wm101',
    windmillName: '风机 B-001',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm101-foundation.glb',
    vertices: 127000,
    faces: 254000,
    materials: 48,
    fileSize: 46.2,
    createdDate: '2024-12-06',
    lastUpdateDate: '2025-01-20',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm102: {
    id: 'underwater_wm102',
    windmillId: 'wm102',
    windmillName: '风机 B-002',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm102-foundation.glb',
    vertices: 125000,
    faces: 250000,
    materials: 48,
    fileSize: 45.1,
    createdDate: '2024-12-07',
    lastUpdateDate: '2025-01-21',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  },
  wm103: {
    id: 'underwater_wm103',
    windmillId: 'wm103',
    windmillName: '风机 B-003',
    modelType: 'foundation',
    description: '重力式基础结构，包括基础桩、导管架、过渡件',
    modelUrl: '/models/underwater/wm103-foundation.glb',
    vertices: 126000,
    faces: 252000,
    materials: 48,
    fileSize: 45.7,
    createdDate: '2024-12-08',
    lastUpdateDate: '2025-01-22',
    boundingBox: {
      min: { x: -25, y: -30, z: -50 },
      max: { x: 25, y: 30, z: 10 }
    }
  }
}

// ============== 辅助函数 ==============

/**
 * 将风场数据转换为树形结构
 */
export function convertToTreeData(farms: WindFarm[]): TreeNode[] {
  return farms.map(farm => ({
    id: farm.id,
    label: `${farm.name} (${farm.statistics.totalWindmills})`,
    type: 'farm',
    data: farm,
    children: farm.windmills.map(wm => ({
      id: wm.id,
      label: `${wm.name} (${wm.code})`,
      type: 'windmill',
      data: wm
    }))
  }))
}

/**
 * 获取指定风机的信息
 */
export function getWindmillById(windmillId: string): Windmill | null {
  for (const farm of mockWindFarms) {
    const windmill = farm.windmills.find(wm => wm.id === windmillId)
    if (windmill) {
      return windmill
    }
  }
  return null
}

/**
 * 获取指定风机所属的厂区
 */
export function getFarmByWindmillId(windmillId: string): WindFarm | null {
  return mockWindFarms.find(farm => farm.windmills.some(wm => wm.id === windmillId)) || null
}

/**
 * 获取指定风机的所有同厂区风机列表
 */
export function getSiblingWindmills(windmillId: string): Windmill[] {
  const farm = getFarmByWindmillId(windmillId)
  return farm ? farm.windmills : []
}

/**
 * 获取水下模型详情
 */
export function getUnderwaterModelDetail(windmillId: string): UnderwaterModelDetail | null {
  return mockUnderwaterModels[windmillId] || null
}
