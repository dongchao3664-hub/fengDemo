import * as mars3d from 'mars3d'


const WATER_PALETTE = Object.freeze({
  base: "#115E94",
  highlight: "#01355C",
  shadow: "#0b1f33",
  opacity: 0.3,
  specular: 0.8
})
/**
 * 添加水体
 */
export const addDemoWater = (layer: mars3d.layer.GraphicLayer) => {
  const graphic = new mars3d.graphic.Water({
    positions: [
      [119.344752, 34.862266, -4.8],
      [120.256501, 34.348555, -2.8],
      [120.724807, 33.405536, 2.3],
      [120.935426, 32.813278, 1.2],
      [120.925185, 32.617806, 0.6],
      [121.004139, 32.545189, 1.7],
      [121.431176, 32.386957, 2],
      [121.614237, 32.197095, -80.2],
      [121.881148, 32.075953, -179],
      [121.977611, 31.974617, -193.4],
      [122.068525, 31.735654, -124.7],
      [122.040797, 31.597342, -99.9],
      [122.038854, 31.49636, -152.8],
      [122.090797, 30.954689, -88],
      [129.084737, 28.323302, -618.6],
      [130.355722, 31.590909, -6.1],
      [129.934481, 32.618896, 4.8],
      [129.267006, 34.195144, -136.8],
      [128.141566, 34.673341, -37.6],
      [126.563434, 33.098953, -45],
      [126.175698, 33.211259, -11.4],
      [126.018934, 33.557685, -94.4],
      [126.204697, 34.228677, -36.2],
      [126.076589, 34.544976, 5.6],
      [126.256639, 36.226113, -22.8],
      [125.822428, 37.415208, -26],
      [124.710804, 37.624781, -36.5],
      [123.665922, 37.506053, -11.7],
      [122.653557, 36.900644, 6.6],
      [121.990288, 36.791932, 5.8],
      [121.784392, 36.967659, 22.2],
      [120.821011, 36.173217, -2],
      [119.910432, 35.81935, 20],
      [119.533959, 35.403175, 32.6],
    ],
    style: {
      height: 150, // 水面高度
      normalMap: "/img/textures/waterNormals.jpg", // 水正常扰动的法线图
      frequency: 8000.0, // 控制波数的数字
      animationSpeed: 0.02, // 控制水的动画速度
      amplitude: 5.0, // 控制水波振幅
      specularIntensity: WATER_PALETTE.specular, // 控制镜面反射强度
      baseWaterColor: WATER_PALETTE.base, // 海水主体颜色
      blendColor: WATER_PALETTE.highlight, // 混合过渡色，靠近岸线更明亮
      // horizonColor: WATER_PALETTE.shadow,
      opacity: WATER_PALETTE.opacity, // 透明度
      clampToGround: false, // 是否贴地
      reflectivity: 0.4
     
    },
    allowDrillPick: true,
  })
  layer.addGraphic(graphic)
}

//添加天空盒
export const addSkyBox = (map: mars3d.Map) => {
  map.scene.skyBox = new mars3d.GroundSkyBox({
    sources: {
      positiveX: "https://data.mars3d.cn/img/skybox-near/lantian/Right.jpg",
      negativeX: "https://data.mars3d.cn/img/skybox-near/lantian/Left.jpg",
      positiveY: "https://data.mars3d.cn/img/skybox-near/lantian/Front.jpg",
      negativeY: "https://data.mars3d.cn/img/skybox-near/lantian/Back.jpg",
      positiveZ: "https://data.mars3d.cn/img/skybox-near/lantian/Up.jpg",
      negativeZ: "https://data.mars3d.cn/img/skybox-near/lantian/Down.jpg"
    }
  })
}


 export function addImageLayer(map : mars3d.Map) {
    // 方式2：在创建地球后调用addLayer添加图层(直接new对应type类型的图层类)
    let tileLayer = new mars3d.layer.ImageLayer({
      name: '海图',
      url: '/img/textures/hai.png',
      rectangle: { xmin: 119.175812, xmax: 125.836669, ymin: 31.702384, ymax: 36.091933 },
      zIndex: 20,
    });
    map.addLayer(tileLayer);
  }
