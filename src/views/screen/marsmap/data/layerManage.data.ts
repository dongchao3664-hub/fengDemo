/**
 * 图层管理数据定义
 * 统一管理所有地图图层的配置和状态
 * 参考模式：基于组织的层级结构，支持动态显隐
 */

export interface LayerItem {
  id: string
  name: string
  options?: Record<string, any>
}

export interface LayerGroup {
  label: string
  value: number
  img?: string
  layers: LayerItem[]
  show: boolean
  isDisplay: boolean // 面板是否显示该分组
}

export interface LayerManageData {
  // 默认展示的图层分组标签
  checkList: string[]
  // 所有图层分组定义
  layerList: LayerGroup[]
  // 颜色选择集合
  colorSel?: string[]
  // 其他配置
  [key: string]: any
}

// 默认图层数据配置
const layerManageData: LayerManageData = {
  // 默认展示图层
  checkList: ['风机', '电缆线', '风场数据'],

  // 图层管理数据定义
  layerList: [
    {
      label: '风机',
      value: 1,
      img: '',
      layers: [
        {
          name: '风机图层',
          id: 'windmillLayer',
          options: {
            clustering: {
              enabled: false,
              pixelRange: 50,
              radius: 36,
              fontColor: '#ffffff',
              color: 'rgba(0, 151, 229, 0.65)',
              opacity: '1',
              borderColor: 'rgba(42, 121, 183, 0.65)',
              borderOpacity: 0.15,
              borderWidth: 12,
              style: {
                visibleDepth: false,
              },
            },
          },
        },
      ],
      show: true,
      isDisplay: true,
    },
    {
      label: '电缆线',
      value: 2,
      img: '',
      layers: [
        {
          id: 'cableLayer',
          name: '电缆线图层',
          options: {
            clustering: {
              enabled: false,
            },
          },
        },
      ],
      show: true,
      isDisplay: true,
    },
    {
      label: '风场数据',
      value: 3,
      img: '',
      layers: [
        {
          id: 'windFieldLayer',
          name: '风场数据图层',
          options: {
            clustering: {
              enabled: false,
            },
          },
        },
      ],
      show: true,
      isDisplay: true,
    },

    {
      label: '风机模型',
      value: 4,
      img: '',
      layers: [
        {
          id: 'windmillModelLayer',
          name: '风机模型图层',
          options: {
            // 注意：此图层目前未使用
            // 实际风机模型在 windmillLayer 中管理
            // 水下模型使用独立图层：underwater-glb-layer
          },
        },
      ],
      show: true,
      isDisplay: false, // 暂时不在面板中显示
    },
    {
      label: '水下模型',
      value: 5,
      img: '',
      layers: [
        {
          id: 'underwater-glb-layer',
          name: '水下GLB模型图层',
          options: {
            // 动态创建，用于管理所有风机的水下GLB模型
            clustering: {
              enabled: false,
            },
          },
        },
      ],
      show: true,
      isDisplay: true,
    },
    {
      label: '测量工具',
      value: 99,
      img: '',
      layers: [
        {
          id: 'measurementLayer',
          name: '测量图层',
          options: {
            clustering: {
              enabled: false,
            },
          },
        },
      ],
      show: false,
      isDisplay: true,
    },
  ],

  // 颜色选择集合
  colorSel: [
    '#00A2FF',
    '#00FF84',
    '#30E3CC',
    '#c0ff00',
    '#FD8470',
    '#625ef7',
    '#01bbf9',
    '#dd8843',
    '#ced347',
    '#b837f4',
    '#ff769d',
  ],
}

export default layerManageData
