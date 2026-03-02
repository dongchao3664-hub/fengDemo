/**
 * WindmillLayerManager - 风机图层管理
 * 负责在地图上加载、显示、交互风机数据
 * 使用 ModelPrimitive 加载 glb 模型
 */

import * as mars3d from "mars3d";
import { bus } from "@/utils/busUtil";
import { attachGraphicEvents } from "@/views/screen/marsmap/business/common/graphicEventBinder";
import { Cesium } from "mars3d";

// mockdata 中的风机数据格式
export interface WindmillPoint {
  lon: number;
  lat: number;
  alt: number;
  raw?: { x: number; y: number; z: number };
}

export interface WindmillMockData {
  id: string;
  name: string;
  type: number;
  layer: string;
  points: WindmillPoint[];
  [key: string]: any;
}

export interface WindmillClickEvent {
  windmill: WindmillMockData;
  position: [number, number, number];
}

// 默认风机模型地址
const DEFAULT_MODEL_URL = "https://data.mars3d.cn/gltf/mars/fengche.gltf";

export class WindmillLayerManager {
  private mapInstance: any;
  private layerId: string;
  private windmills: Map<string, WindmillMockData> = new Map();
  private graphics: Map<string, any> = new Map();
  private flashTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private onClickCallback?: (event: WindmillClickEvent) => void;
  private modelUrl: string;

  constructor(
    mapInstance: any,
    layerId: string = "windmillLayer",
    modelUrl?: string
  ) {
    this.mapInstance = mapInstance;
    this.layerId = layerId;
    this.modelUrl = modelUrl || DEFAULT_MODEL_URL;
  }

  /**
   * 初始化风机图层
   */
  init(): void {
    if (!this.mapInstance) {
      console.warn("[WindmillLayerManager] Map instance is invalid");
      return;
    }

    const layer = this.mapInstance.getLayerById(this.layerId);
    if (!layer) {
      console.warn(`[WindmillLayerManager] Layer "${this.layerId}" not found`);
      return;
    }

    console.log("[WindmillLayerManager] Initialized");
  }

  /**
   * 加载风机数据到地图（使用 mockdata 格式）
   */
  loadWindmills(windmills: WindmillMockData[]): void {
    console.log(
      "[WindmillLayerManager] loadWindmills called, count:",
      windmills?.length
    );

    if (!this.mapInstance) {
      console.warn("[WindmillLayerManager] Map instance is invalid");
      return;
    }

    const layer = this.mapInstance.getLayerById(this.layerId);
    console.log(
      "[WindmillLayerManager] getLayerById result:",
      layer,
      "layerId:",
      this.layerId
    );

    if (!layer) {
      console.warn(`[WindmillLayerManager] Layer "${this.layerId}" not found`);
      // 列出所有图层帮助调试
      const allLayers = this.mapInstance.getLayers?.() || [];
      console.log(
        "[WindmillLayerManager] Available layers:",
        allLayers.map((l: any) => l.id)
      );
      return;
    }

    // 清空旧数据
    this.windmills.clear();
    this.graphics.clear();
    layer.clear();

    // 添加新数据
    windmills.forEach((windmill) => {
      this.addWindmill(windmill, layer);
    });

    console.log(
      `[WindmillLayerManager] Loaded ${windmills.length} windmills (ModelPrimitive)`
    );
    console.log(
      "[WindmillLayerManager] graphics.size after load:",
      this.graphics.size
    );
  }

  /**
   * 添加单个风机（使用 ModelPrimitive）
   */
  private addWindmill(windmill: WindmillMockData, layer: any): void {
    if (!windmill.points || windmill.points.length === 0) {
      console.warn(
        `[WindmillLayerManager] Windmill ${windmill.id} has no points`
      );
      return;
    }

    this.windmills.set(windmill.id, windmill);

    const point = windmill.points[0];

    // 使用 ModelPrimitive 加载 glb 模型
    const graphic = new mars3d.graphic.ModelPrimitive({
      id: windmill.id,
      name: windmill.name,
      position: [point.lon, point.lat, point.alt || 0],
      style: {
        url: this.modelUrl,
        scale: 110, // 模型缩放
        // minimumPixelSize: 50, // 最小像素大小
        // maximumScale: 20000, // 最大缩放
        heading:309,
        pitch: 0,
        roll: 0,
        scaleByDistance: new Cesium.NearFarScalar(800, 1.2, 12000, 0.4),
        distanceDisplayCondition: true,
        distanceDisplayCondition_near: 0,
        distanceDisplayCondition_far: 15000,
        distanceDisplayBillboard: {
          image: "/img/marker/fengche.png",
          scale: 0.7,
          color: "#e2f3ff",
          scaleByDistance: new Cesium.NearFarScalar(800, 1.1, 16000, 0.5),
        },
        setHeight: -10,
      },
      attr:  {
        menuId: "windmill", // 业务类型标识
        ...windmill
      },
    });

    // 添加事件监听（参考 addMenuGraphicOnLisen）
    this.bindGraphicEvents(graphic, windmill);

    layer.addGraphic(graphic);
    this.graphics.set(windmill.id, graphic);
  }

  /**
   * 绑定图形事件监听
   */
  private bindGraphicEvents(graphic: any, windmill: WindmillMockData): void {
    const point = windmill.points[0];

    attachGraphicEvents(graphic, {
      click: () => {
        console.log("[WindmillLayerManager] 点击了", windmill.id);

        this.onClickCallback?.({
          windmill,
          position: [point.lon, point.lat, point.alt || 0],
        });

        bus.emit("openPoupBill", {
          type: "windmill",
          data: windmill,
        });

        bus.emit("selectWindmill", {
          id: windmill.id,
          data: windmill,
        });

        graphic.flyTo({
          radius: 1650,
          heading: 35,
          pitch: -17,
          complete: () => {},
        });
      },
      mouseOver: () => {
        console.log("[WindmillLayerManager] 鼠标移入", windmill.id);

        graphic.setStyle({
          scale: 100,
          silhouette: true,
          silhouetteColor: "#00ffff",
          silhouetteSize: 3,
          label: {
            text: windmill.name,
            font_weight: "bold",
            font_size: 16,
            font_family: "微软雅黑",
            color: "#ffffff",
            outline: true,
            outlineColor: "#000000",
            outlineWidth: 2,
            pixelOffsetY: 80,
            visibleDepth: false,
            distanceDisplayCondition: false,
            distanceDisplayCondition_far: 50000,
            distanceDisplayCondition_near: 0,
          },
        });

      },
      mouseOut: () => {
        console.log("[WindmillLayerManager] 鼠标移出", windmill.id);

        graphic.setStyle({
          scale: 100,
          silhouette: false,
          label: {
            text: "",
          },
        });

        graphic.closeHighlight();
      },
    });
  }

  /**
   * 播放闪烁高亮效果
   */
  private startFlashEffect(graphic: any, windmillId: string): void {
    this.stopFlashEffect(windmillId);

    let tick = 0;
    const timer = setInterval(() => {
      const isVisible = tick % 2 === 0;
      if (isVisible) {
        graphic.openHighlight?.({
          scale: 18,
          silhouette: true,
          silhouetteColor: "#00ffff",
          silhouetteSize: 3,
        });
      } else {
        graphic.closeHighlight?.();
      }

      tick += 1;
      if (tick >= 6) {
        this.stopFlashEffect(windmillId);
        graphic.closeHighlight?.();
      }
    }, 220);

    this.flashTimers.set(windmillId, timer);
  }

  /**
   * 停止指定风机的闪烁效果
   */
  private stopFlashEffect(windmillId: string): void {
    const timer = this.flashTimers.get(windmillId);
    if (timer) {
      clearInterval(timer);
      this.flashTimers.delete(windmillId);
    }
  }

  /**
   * 停止所有闪烁效果
   */
  private stopAllFlashEffects(): void {
    this.flashTimers.forEach((timer) => clearInterval(timer));
    this.flashTimers.clear();
  }

  /**
   * 高亮指定的风机
   */
  highlight(windmillIds: string[]): void {
    console.log(
      "[WindmillLayerManager] highlight:",
      windmillIds,
      "graphics count:",
      this.graphics.size
    );
    this.graphics.forEach((graphic, id) => {
      const isHighlighted = windmillIds.includes(id);
      if (isHighlighted) {
        console.log("[WindmillLayerManager] Highlighting:", id);
        graphic.setStyle({ scale: 110 });
        this.startFlashEffect(graphic, id);
      } else {
        graphic.setStyle({ scale: 100 });
        this.stopFlashEffect(id);
        graphic.closeHighlight?.();
      }
    });
  }

  /**
   * 清空高亮
   */
  clearHighlight(): void {
    this.stopAllFlashEffects();
    this.graphics.forEach((graphic) => {
      graphic.setStyle({
        scale: 10,
      });
      graphic.closeHighlight?.();
    });
  }

  /**
   * 注册点击回调
   */
  onClick(callback: (event: WindmillClickEvent) => void): void {
    this.onClickCallback = callback;
  }

  /**
   * 获取风机数据
   */
  getWindmill(windmillId: string): WindmillMockData | undefined {
    return this.windmills.get(windmillId);
  }

  /**
   * 获取所有风机
   */
  getAllWindmills(): WindmillMockData[] {
    return Array.from(this.windmills.values());
  }

  /**
   * 飞行定位到指定风机
   */
  flyTo(windmillId: string): void {
    console.log("[WindmillLayerManager] flyTo:", windmillId);
    const windmill = this.windmills.get(windmillId);
    console.log("[WindmillLayerManager] windmill found:", !!windmill);
    if (windmill && windmill.points && windmill.points.length > 0) {
      const point = windmill.points[0];
      // 使用 setCameraView 飞行定位（参考 flytoChang 实现）
      this.mapInstance.setCameraView({
        lng: point.lon,
        lat: point.lat + 0.002, // 稍微偏移，使目标在视野中心偏下
        alt: 2500,
        heading: 360,
        pitch: -90,
      });
      console.log("[WindmillLayerManager] Flying to:", point.lon, point.lat);
    }
  }

  /**
   * 清空图层
   */
  clear(): void {
    this.stopAllFlashEffects();
    if (this.mapInstance) {
      const layer = this.mapInstance.getLayerById(this.layerId);
      if (layer) {
        layer.clear();
      }
    }
    this.windmills.clear();
    this.graphics.clear();
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.clear();
    this.onClickCallback = undefined;
  }
}
