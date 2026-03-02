/**
 * UnderwaterManager - 水下模型管理器
 * 功能：管理风机水下模型的加载、显示、隐藏和卸载
 * 支持：GLB模型 和 3D Tiles点云数据
 */

import * as mars3d from "mars3d";
import type { MapEngine } from "@/mars3dmap/core/MapEngine";
import type { LayerManager } from "@/mars3dmap/core/LayerManager";
import type { WindmillData } from "./types";
import { Cesium } from "mars3d";

/**
 * 模型类型枚举
 */
export enum ModelType {
  /** GLB/GLTF 3D模型 */
  GLB = "glb",
  /** 3D Tiles 点云数据 */
  TILES = "tiles",
}

/**
 * 水下模型配置选项
 */
export interface UnderwaterModelOptions {
  /** 模型缩放比例 */
  scale?: number;
  /** 高度偏移（米），负值表示向下偏移 */
  offsetAlt?: number;
  /** 是否显示 */
  show?: boolean;
  /** 模型旋转角度（度） */
  heading?: number;
  pitch?: number;
  roll?: number;
  /** 最小像素大小 */
  minimumPixelSize?: number;
  /** 最大像素大小 */
  maximumPixelSize?: number;
  /** 最大可视距离（米） */
  maximumDistance?: number;
}

/**
 * 点云图层配置选项
 */
export interface TilesetLayerOptions extends UnderwaterModelOptions {
  /** 点云的最大屏幕空间误差 */
  maximumScreenSpaceError?: number;
  /** 是否开启动态屏幕空间误差 */
  dynamicScreenSpaceError?: boolean;
  /** 跳过层级数 */
  skipLevelOfDetail?: boolean;
  /** 跳过的屏幕空间误差因子 */
  skipScreenSpaceErrorFactor?: number;
}

/**
 * 模型加载结果
 */
export interface ModelLoadResult {
  success: boolean;
  message?: string;
  graphic?: mars3d.graphic.ModelEntity | null;
  layer?: mars3d.layer.TilesetLayer | null;
}

/**
 * 模型信息
 */
interface ModelInfo {
  id: string;
  type: ModelType;
  url: string;
  windmillId: string;
  graphic?: mars3d.graphic.ModelEntity;
  layer?: mars3d.layer.TilesetLayer;
  options: UnderwaterModelOptions | TilesetLayerOptions;
  show: boolean;
}

/**
 * 风机模型组合信息（GLB + 点云）
 */
interface WindmillModelsInfo {
  windmillId: string;
  glbModel?: ModelInfo;
  tilesetModel?: ModelInfo;
}

/**
 * 水下模型管理器
 */
export class UnderwaterManager {
  private mapEngine: MapEngine;
  private layerManager: LayerManager;
  private map: mars3d.Map | null = null;

  /** 存储所有已加载的模型信息（按模型ID存储） */
  private models: Map<string, ModelInfo> = new Map();

  /** 存储风机的模型组合（按风机ID存储） */
  private windmillModels: Map<string, WindmillModelsInfo> = new Map();

  /** GLB模型图层 */
  private glbLayer: mars3d.layer.GraphicLayer | null = null;

  /** 点云图层容器 */
  private tilesetLayers: Map<string, mars3d.layer.TilesetLayer> = new Map();

  constructor(mapEngine: MapEngine, layerManager: LayerManager) {
    this.mapEngine = mapEngine;
    this.layerManager = layerManager;
    this.map = mapEngine.map;
  }

  /**
   * 初始化管理器
   */
  init(): void {
    this.initGLBLayer();
    console.log("[UnderwaterManager] Initialized");
  }

  /**
   * 初始化GLB模型图层
   */
  private initGLBLayer(): void {
    const layerId = "underwater-glb-layer";
    const existing = this.layerManager.getLayer(layerId);

    const layer =
      existing ||
      this.layerManager.addLayer({
        id: layerId,
        name: "水下模型图层",
        type: "graphic",
        show: true,
      });

    if (layer) {
      this.glbLayer = layer as mars3d.layer.GraphicLayer;
      console.log("[UnderwaterManager] GLB layer initialized");
    }
  }

  /**
   * 加载水下模型（支持同时加载GLB和点云）
   * @param windmillId 风机ID
   * @param options 配置选项
   */
  async loadUnderwaterModels(
    windmillId: string,
    options?: {
      glbOptions?: UnderwaterModelOptions;
      tilesetOptions?: TilesetLayerOptions;
      loadGLB?: boolean;
      loadTileset?: boolean;
    }
  ): Promise<{
    glbResult?: ModelLoadResult;
    tilesetResult?: ModelLoadResult;
    success: boolean;
    message?: string;
  }> {
    try {
      // 获取风机数据
      const windmill = await this.getWindmillData(windmillId);

      const results: {
        glbResult?: ModelLoadResult;
        tilesetResult?: ModelLoadResult;
      } = {};

      // 加载GLB模型
      const shouldLoadGLB =
        options?.loadGLB !== false && windmill.underwaterModelUrl;
      if (shouldLoadGLB) {
        results.glbResult = await this.loadGLBModel(
          windmillId,
          windmill,
          windmill.underwaterModelUrl!,
          options?.glbOptions || {}
        );
      }

      // 加载点云模型
      const shouldLoadTileset =
        options?.loadTileset !== false && windmill.underwaterTilesetUrl;
      if (shouldLoadTileset) {
        results.tilesetResult = await this.loadTilesetModel(
          windmillId,
          windmill,
          windmill.underwaterTilesetUrl!,
          options?.tilesetOptions || {}
        );
      }

      const glbSuccess = !shouldLoadGLB || results.glbResult?.success;
      const tilesetSuccess =
        !shouldLoadTileset || results.tilesetResult?.success;
      const allSuccess = glbSuccess && tilesetSuccess;

      return {
        ...results,
        success: allSuccess,
        message: allSuccess
          ? "模型加载成功"
          : `加载失败: GLB=${glbSuccess ? "成功" : "失败"}, 点云=${
              tilesetSuccess ? "成功" : "失败"
            }`,
      };
    } catch (error) {
      console.error("[UnderwaterManager] Load models error:", error);
      return {
        success: false,
        message: `加载失败: ${error}`,
      };
    }
  }

  /**
   * 加载水下模型（旧版兼容方法，自动检测类型）
   * @deprecated 推荐使用 loadUnderwaterModels
   */
  async loadUnderwaterModel(
    windmillId: string,
    options: UnderwaterModelOptions | TilesetLayerOptions = {}
  ): Promise<ModelLoadResult> {
    try {
      // 获取风机数据
      const windmill = await this.getWindmillData(windmillId);

      // 优先加载GLB，如果没有则加载点云
      if (windmill.underwaterModelUrl) {
        return await this.loadGLBModel(
          windmillId,
          windmill,
          windmill.underwaterModelUrl,
          options
        );
      } else if (windmill.underwaterTilesetUrl) {
        return await this.loadTilesetModel(
          windmillId,
          windmill,
          windmill.underwaterTilesetUrl,
          options as TilesetLayerOptions
        );
      } else {
        return {
          success: false,
          message: "No underwater model URL found for this windmill",
        };
      }
    } catch (error) {
      console.error("[UnderwaterManager] Load model error:", error);
      return {
        success: false,
        message: `Failed to load model: ${error}`,
      };
    }
  }

  /**
   * 加载GLB模型
   */
  private async loadGLBModel(
    windmillId: string,
    windmill: WindmillData,
    modelUrl: string,
    options: UnderwaterModelOptions
  ): Promise<ModelLoadResult> {
    if (!this.glbLayer) {
      return {
        success: false,
        message: "GLB layer not initialized",
      };
    }

    const modelId = `underwater-glb-${windmillId}`;

    // 检查是否已加载
    if (this.models.has(modelId)) {
      console.warn(`[UnderwaterManager] GLB model already loaded: ${modelId}`);
      const existing = this.models.get(modelId);
      return {
        success: true,
        message: "GLB model already loaded",
        graphic: existing?.graphic,
      };
    }

    try {
      const {
        scale = 1,
        offsetAlt = -50,
        show = true,
        heading = 0,
        pitch = 0,
        roll = 0,
        minimumPixelSize = 50,
        maximumPixelSize,
        maximumDistance,
      } = options;

      // 计算模型位置（在风机位置下方）
      const position = [
        windmill.position.lng,
        windmill.position.lat,
        windmill.position.alt + offsetAlt,
      ];

      // 创建模型实体
      const graphic = new mars3d.graphic.ModelEntity({
        id: modelId,
        name: `${windmill.name}-水下GLB模型`,
        position: position,
        style: {
          url: modelUrl,
          scale: scale,
          heading: heading,
          pitch: pitch,
          roll: roll,
          minimumPixelSize: minimumPixelSize,
          maximumPixelSize: maximumPixelSize,
          distanceDisplayCondition: maximumDistance
            ? new Cesium.DistanceDisplayCondition(0, maximumDistance)
            : undefined,
          clampToGround: false,
        },
        show: show,
        attr: {
          windmillId: windmillId,
          type: "underwater-model",
          modelType: ModelType.GLB,
        },
      });

      // 添加到图层
      this.glbLayer.addGraphic(graphic);

      // 保存模型信息
      const modelInfo: ModelInfo = {
        id: modelId,
        type: ModelType.GLB,
        url: modelUrl,
        windmillId: windmillId,
        graphic: graphic,
        options: options,
        show: show,
      };
      this.models.set(modelId, modelInfo);

      // 更新风机模型组合信息
      this.updateWindmillModelsInfo(windmillId, "glb", modelInfo);

      console.log(
        `[UnderwaterManager] GLB model loaded for windmill: ${windmillId}`
      );

      return {
        success: true,
        message: "GLB model loaded successfully",
        graphic: graphic,
      };
    } catch (error) {
      console.error("[UnderwaterManager] Load GLB model error:", error);
      return {
        success: false,
        message: `Failed to load GLB model: ${error}`,
      };
    }
  }

  /**
   * 加载3D Tiles点云模型
   */
  private async loadTilesetModel(
    windmillId: string,
    windmill: WindmillData,
    modelUrl: string,
    options: TilesetLayerOptions
  ): Promise<ModelLoadResult> {
    if (!this.map) {
      return {
        success: false,
        message: "Map not initialized",
      };
    }

    const modelId = `underwater-tileset-${windmillId}`;

    // 检查是否已加载
    if (this.models.has(modelId)) {
      console.warn(
        `[UnderwaterManager] Tileset model already loaded: ${modelId}`
      );
      const existing = this.models.get(modelId);
      return {
        success: true,
        message: "Tileset model already loaded",
        layer: existing?.layer,
      };
    }

    try {
      const {
        scale = 1,
        offsetAlt = -50,
        show = true,
        heading = 0,
        pitch = 0,
        roll = 0,
        maximumScreenSpaceError = 16,
        dynamicScreenSpaceError = false,
        skipLevelOfDetail = true,
        skipScreenSpaceErrorFactor = 16,
        maximumDistance,
      } = options;

      // 计算点云位置
      const position = [
        windmill.position.lng,
        windmill.position.lat,
        windmill.position.alt + offsetAlt,
      ];

      // 创建3D Tiles图层
      const tilesetLayer = new mars3d.layer.TilesetLayer({
        id: modelId,
        name: `${windmill.name}-水下点云`,
        url: modelUrl,
        position: position,
        scale: scale,
        heading: heading,
        pitch: pitch,
        roll: roll,
        maximumScreenSpaceError: maximumScreenSpaceError,
        dynamicScreenSpaceError: dynamicScreenSpaceError,
        skipLevelOfDetail: skipLevelOfDetail,
        skipScreenSpaceErrorFactor: skipScreenSpaceErrorFactor,
        show: show,
        flyTo: false,
        maximumDistanceDisplayCondition: maximumDistance,
        attr: {
          windmillId: windmillId,
          type: "underwater-model",
          modelType: ModelType.TILES,
        },
      });

      // 添加到地图
      this.map.addLayer(tilesetLayer);

      // 保存到容器（使用modelId作为key，避免冲突）
      this.tilesetLayers.set(modelId, tilesetLayer);

      // 保存模型信息
      const modelInfo: ModelInfo = {
        id: modelId,
        type: ModelType.TILES,
        url: modelUrl,
        windmillId: windmillId,
        layer: tilesetLayer,
        options: options,
        show: show,
      };
      this.models.set(modelId, modelInfo);

      // 更新风机模型组合信息
      this.updateWindmillModelsInfo(windmillId, "tileset", modelInfo);

      console.log(
        `[UnderwaterManager] Tileset model loaded for windmill: ${windmillId}`
      );

      return {
        success: true,
        message: "Tileset model loaded successfully",
        layer: tilesetLayer,
      };
    } catch (error) {
      console.error("[UnderwaterManager] Load tileset model error:", error);
      return {
        success: false,
        message: `Failed to load tileset model: ${error}`,
      };
    }
  }

  /**
   * 更新风机模型组合信息
   */
  private updateWindmillModelsInfo(
    windmillId: string,
    modelType: "glb" | "tileset",
    modelInfo: ModelInfo
  ): void {
    if (!this.windmillModels.has(windmillId)) {
      this.windmillModels.set(windmillId, { windmillId });
    }

    const info = this.windmillModels.get(windmillId)!;
    if (modelType === "glb") {
      info.glbModel = modelInfo;
    } else {
      info.tilesetModel = modelInfo;
    }
  }

  /**
   * 显示风机的所有模型
   */
  showModel(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    if (!info) {
      console.warn(
        `[UnderwaterManager] No models found for windmill: ${windmillId}`
      );
      return false;
    }

    let success = false;

    // 显示GLB模型
    if (info.glbModel?.graphic) {
      info.glbModel.graphic.show = true;
      info.glbModel.show = true;
      success = true;
    }

    // 显示点云模型
    if (info.tilesetModel?.layer) {
      info.tilesetModel.layer.show = true;
      info.tilesetModel.show = true;
      success = true;
    }

    if (success) {
      console.log(
        `[UnderwaterManager] Models shown for windmill: ${windmillId}`
      );
    }
    return success;
  }

  /**
   * 隐藏风机的所有模型
   */
  /**
   * 隐藏风机的所有模型
   */
  hideModel(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    if (!info) {
      console.warn(
        `[UnderwaterManager] No models found for windmill: ${windmillId}`
      );
      return false;
    }

    let success = false;

    // 隐藏GLB模型
    if (info.glbModel?.graphic) {
      info.glbModel.graphic.show = false;
      info.glbModel.show = false;
      success = true;
    }

    // 隐藏点云模型
    if (info.tilesetModel?.layer) {
      info.tilesetModel.layer.show = false;
      info.tilesetModel.show = false;
      success = true;
    }

    if (success) {
      console.log(
        `[UnderwaterManager] Models hidden for windmill: ${windmillId}`
      );
    }
    return success;
  }

  /**
   * 卸载风机的所有模型
   */
  /**
   * 卸载风机的所有模型
   */
  unloadUnderwaterModel(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    if (!info) {
      console.warn(
        `[UnderwaterManager] No models found for windmill: ${windmillId}`
      );
      return false;
    }

    let success = false;

    try {
      // 卸载GLB模型
      if (info.glbModel) {
        if (info.glbModel.graphic && this.glbLayer) {
          this.glbLayer.removeGraphic(info.glbModel.graphic);
          info.glbModel.graphic.destroy();
        }
        this.models.delete(info.glbModel.id);
        success = true;
      }

      // 卸载点云模型
      if (info.tilesetModel) {
        if (info.tilesetModel.layer && this.map) {
          this.map.removeLayer(info.tilesetModel.layer);
        }
        this.tilesetLayers.delete(info.tilesetModel.id);
        this.models.delete(info.tilesetModel.id);
        success = true;
      }

      // 从记录中删除
      this.windmillModels.delete(windmillId);

      if (success) {
        console.log(
          `[UnderwaterManager] Models unloaded for windmill: ${windmillId}`
        );
      }
      return success;
    } catch (error) {
      console.error("[UnderwaterManager] Unload model error:", error);
      return false;
    }
  }

  /**
   * 切换模型显示状态
   */
  toggleModel(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    if (!info) {
      console.warn(
        `[UnderwaterManager] No models found for windmill: ${windmillId}`
      );
      return false;
    }

    // 检查是否有任何模型是显示的
    const isAnyVisible = info.glbModel?.show || info.tilesetModel?.show;

    if (isAnyVisible) {
      return this.hideModel(windmillId);
    } else {
      return this.showModel(windmillId);
    }
  }

  /**
   * 更新模型配置
   */
  updateModelOptions(
    windmillId: string,
    options: Partial<UnderwaterModelOptions | TilesetLayerOptions>
  ): boolean {
    const modelInfo = this.models.get(windmillId);
    if (!modelInfo) {
      console.warn(
        `[UnderwaterManager] Model not found for windmill: ${windmillId}`
      );
      return false;
    }

    try {
      if (modelInfo.type === ModelType.GLB && modelInfo.graphic) {
        // 更新GLB模型样式
        if (options.scale !== undefined) {
          modelInfo.graphic.style.scale = options.scale;
        }
        if (options.heading !== undefined) {
          modelInfo.graphic.style.heading = options.heading;
        }
        if (options.pitch !== undefined) {
          modelInfo.graphic.style.pitch = options.pitch;
        }
        if (options.roll !== undefined) {
          modelInfo.graphic.style.roll = options.roll;
        }
        if (options.show !== undefined) {
          modelInfo.graphic.show = options.show;
          modelInfo.show = options.show;
        }
      } else if (modelInfo.type === ModelType.TILES && modelInfo.layer) {
        // 更新点云图层配置
        const tilesetOptions = options as TilesetLayerOptions;
        if (tilesetOptions.scale !== undefined) {
          modelInfo.layer.scale = tilesetOptions.scale;
        }
        if (tilesetOptions.maximumScreenSpaceError !== undefined) {
          modelInfo.layer.maximumScreenSpaceError =
            tilesetOptions.maximumScreenSpaceError;
        }
        if (options.show !== undefined) {
          modelInfo.layer.show = options.show;
          modelInfo.show = options.show;
        }
      }

      // 更新配置记录
      modelInfo.options = { ...modelInfo.options, ...options };

      console.log(
        `[UnderwaterManager] Model options updated for windmill: ${windmillId}`
      );
      return true;
    } catch (error) {
      console.error("[UnderwaterManager] Update model options error:", error);
      return false;
    }
  }

  /**
   * 飞行到模型位置
   */
  flyToModel(windmillId: string, options?: any): void {
    const info = this.windmillModels.get(windmillId);
    if (!info) {
      console.warn(
        `[UnderwaterManager] No models found for windmill: ${windmillId}`
      );
      return;
    }

    try {
      // 优先飞到GLB模型
      if (info.glbModel?.graphic) {
        info.glbModel.graphic.flyTo(options);
      } else if (info.tilesetModel?.layer) {
        info.tilesetModel.layer.flyTo(options);
      }
      console.log(
        `[UnderwaterManager] Flying to model for windmill: ${windmillId}`
      );
    } catch (error) {
      console.error("[UnderwaterManager] Fly to model error:", error);
    }
  }

  /**
   * 检查风机是否有已加载的模型
   */
  isModelLoaded(windmillId: string): boolean {
    return this.windmillModels.has(windmillId);
  }

  /**
   * 检查风机是否有已加载的GLB模型
   */
  isGLBModelLoaded(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    return !!info?.glbModel;
  }

  /**
   * 检查风机是否有已加载的点云模型
   */
  isTilesetModelLoaded(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    return !!info?.tilesetModel;
  }

  /**
   * 检查模型是否显示
   */
  isModelVisible(windmillId: string): boolean {
    const info = this.windmillModels.get(windmillId);
    if (!info) return false;

    return info.glbModel?.show || false || info.tilesetModel?.show || false;
  }

  /**
   * 获取风机的模型信息
   */
  getModelInfo(windmillId: string): WindmillModelsInfo | undefined {
    return this.windmillModels.get(windmillId);
  }

  /**
   * 检查模型是否显示
   */
  isModelVisible(windmillId: string): boolean {
    const modelInfo = this.models.get(windmillId);
    return modelInfo ? modelInfo.show : false;
  }

  /**
   * 获取模型信息
   */
  getModelInfo(windmillId: string): ModelInfo | undefined {
    return this.models.get(windmillId);
  }

  /**
   * 获取所有已加载的模型
   */
  getAllModels(): WindmillModelsInfo[] {
    return Array.from(this.windmillModels.values());
  }

  /**
   * 批量卸载模型
   */
  unloadAllModels(): void {
    const windmillIds = Array.from(this.windmillModels.keys());
    windmillIds.forEach((id) => this.unloadUnderwaterModel(id));
    console.log("[UnderwaterManager] All models unloaded");
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.unloadAllModels();
    this.glbLayer = null;
    this.tilesetLayers.clear();
    this.models.clear();
    this.windmillModels.clear();
    console.log("[UnderwaterManager] Destroyed");
  }

  // ======================== 私有辅助方法 ========================

  /**
   * 检测模型类型
   */
  private detectModelType(url: string): ModelType {
    const lowerUrl = url.toLowerCase();

    // 检查3D Tiles标识
    if (
      lowerUrl.includes("tileset.json") ||
      lowerUrl.includes("3dtiles") ||
      lowerUrl.includes("/tiles/")
    ) {
      return ModelType.TILES;
    }

    // 检查GLB/GLTF标识
    if (lowerUrl.endsWith(".glb") || lowerUrl.endsWith(".gltf")) {
      return ModelType.GLB;
    }

    // 默认返回GLB
    return ModelType.GLB;
  }

  /**
   * 获取风机数据
   */
  private async getWindmillData(windmillId: string): Promise<WindmillData> {
    // TODO: 从业务数据源获取风机信息
    // 这里需要注入数据获取方法，或者从 store 中获取
    const graphicLayer = this.map.getLayerById("windmillLayer");
    const graphic = graphicLayer.getGraphicById(windmillId)?.options;
    // 临时实现：从 map 的 graphic 属性中获取
    if (graphic.id === windmillId || graphic.attr?.id === windmillId) {
      console.log(
        "[UnderwaterManager] Found graphic:",
        graphic.id,
        graphic.attr
      );

      const windmill: WindmillData = {
        id: windmillId,
        name: graphic.attr?.name || graphic.name || windmillId,
        position: {
          lng: graphic.position[0],
          lat: graphic.position[1],
          alt: graphic.position[2] || 0,
        },
        modelUrl: graphic.attr?.modelUrl || graphic.style?.url || "",
        underwaterModelUrl:
          graphic.attr?.underwaterModelUrl ||
          graphic.attr?.underwater_model_url,
        underwaterTilesetUrl:
          graphic.attr?.underwaterTilesetUrl ||
          graphic.attr?.underwater_tileset_url,
        status: graphic.attr?.status || "online",
        power: graphic.attr?.power,
        metadata: graphic.attr,
      };

      console.log("[UnderwaterManager] Windmill data:", {
        id: windmill.id,
        underwaterModelUrl: windmill.underwaterModelUrl,
        underwaterTilesetUrl: windmill.underwaterTilesetUrl,
      });

      return windmill;
    }

    // 如果没找到，抛出错误
    console.warn(`[UnderwaterManager] Windmill not found: ${windmillId}`);
    throw new Error(`Windmill not found: ${windmillId}`);
  }
}
