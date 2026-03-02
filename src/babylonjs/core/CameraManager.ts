/**
 * CameraManager - Babylon.js 相机管理器
 * 功能：相机创建、配置、控制
 * 设计：支持多种相机类型
 */

import * as BABYLON from "babylonjs";
import type { SceneEngine } from "./SceneEngine";
import { Vector3 } from "babylonjs";

export type CameraType = "arcRotate" | "free" | "universal";

export interface CameraConfig {
  type?: CameraType;
  position?: BABYLON.Vector3;
  target?: BABYLON.Vector3;
  alpha?: number;
  beta?: number;
  radius?: number;
  fov?: number;
  minZ?: number;
  maxZ?: number;
}

export class CameraManager {
  private sceneEngine: SceneEngine;
  private activeCamera: BABYLON.Camera | null = null;

  constructor(sceneEngine: SceneEngine) {
    this.sceneEngine = sceneEngine;
  }

  /**
   * 创建并激活相机
   */
  createCamera(config: CameraConfig = {}): BABYLON.Camera {
    const scene = this.sceneEngine.getScene();
    const canvas = this.sceneEngine.getEngine()?.getRenderingCanvas();

    if (!scene || !canvas) {
      throw new Error("[CameraManager] Scene or canvas not initialized");
    }

    let camera: BABYLON.Camera;

    switch (config.type || "arcRotate") {
      case "arcRotate":
        camera = this.createArcRotateCamera(scene, canvas, config);
        break;
      case "free":
        camera = this.createFreeCamera(scene, canvas, config);
        break;
      case "universal":
        camera = this.createUniversalCamera(scene, canvas, config);
        break;
      default:
        camera = this.createArcRotateCamera(scene, canvas, config);
    }

    // 设置为活动相机
    scene.activeCamera = camera;
    this.activeCamera = camera;

    console.log(
      `[CameraManager] Camera created: ${config.type || "arcRotate"}`
    );
    return camera;
  }

  /**
   * 获取活动相机
   */
  getActiveCamera(): BABYLON.Camera | null {
    return this.activeCamera;
  }

  /**
   * 获取活动相机 (ArcRotateCamera 类型)
   */
  getActiveArcRotateCamera(): BABYLON.ArcRotateCamera | null {
    if (this.activeCamera instanceof BABYLON.ArcRotateCamera) {
      return this.activeCamera;
    }
    return null;
  }

  /**
   * 聚焦到目标
   */
  focusOnTarget(target: BABYLON.Vector3, radius = 10): void {
    if (!this.activeCamera) return;

    if (this.activeCamera instanceof BABYLON.ArcRotateCamera) {
      this.activeCamera.setTarget(target);
      this.activeCamera.radius = radius;
    } else if (this.activeCamera instanceof BABYLON.TargetCamera) {
      this.activeCamera.setTarget(target);
    }
  }

  /**
   * 设置相机位置
   */
  setPosition(position: BABYLON.Vector3): void {
    if (this.activeCamera) {
      this.activeCamera.position = position;
    }
  }

  /**
   * 销毁相机
   */
  dispose(): void {
    if (this.activeCamera) {
      this.activeCamera.dispose();
      this.activeCamera = null;
    }
  }

  // ========== 私有方法 ==========

  private createArcRotateCamera(
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    config: CameraConfig
  ): BABYLON.ArcRotateCamera {
    const camera = new BABYLON.ArcRotateCamera(
      "arcRotateCamera",
      config.alpha || Math.PI / 2,
      config.beta || Math.PI / 2.5,
      config.radius || 10,
      config.target || BABYLON.Vector3.Zero(),
      scene
    );

    // 配置相机参数
    if (config.fov) {
      camera.fov = config.fov;
    }

    camera.inertia = 0.8; //定义相机的默认惯性

    camera.wheelDeltaPercentage = 0.02;
    camera.angularSensibilityX = 1000; // 转动灵敏度
    camera.angularSensibilityY = 1000; // 转动灵敏度
    camera.panningSensibility = 50; // 平移速度
    // camera.panningDistanceLimit =40 //平移距离限制
    camera.panningInertia = 0; //0 表示停止惯性，1 表示完全没有减速。
    camera.panningAxis = new Vector3(2, 0, 0); // 定义允许相机平移的轴向

    //
    camera.wheelPrecision = 10; // 缩放速度
    camera.minZ = 0.3; // 可查看最小距离,防止提前穿透模型
    //
    // camera.upperBetaLimit = 1.4 //转动到水平1.57
    camera.lowerBetaLimit = 0; //最顶端

    camera.lowerRadiusLimit = 2; // 控制可缩放的级别限制s
    // camera.upperRadiusLimit = 1500; // 控制可缩放的级别限制
    camera.useBouncingBehavior = true; // 缩放达到limit,回弹到默认尺寸
    camera.checkCollisions = true; // 相机添加碰撞检测
    camera.useBouncingBehavior = true;
    camera.attachControl(canvas, true);
    return camera;
  }

  private createFreeCamera(
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    config: CameraConfig
  ): BABYLON.FreeCamera {
    const camera = new BABYLON.FreeCamera(
      "freeCamera",
      config.position || new BABYLON.Vector3(0, 5, -10),
      scene
    );

    camera.attachControl(canvas, true);
    camera.minZ = config.minZ || 0.1;
    camera.maxZ = config.maxZ || 10000;

    if (config.target) {
      camera.setTarget(config.target);
    }

    return camera;
  }

  private createUniversalCamera(
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    config: CameraConfig
  ): BABYLON.UniversalCamera {
    const camera = new BABYLON.UniversalCamera(
      "universalCamera",
      config.position || new BABYLON.Vector3(0, 5, -10),
      scene
    );

    camera.attachControl(canvas, true);
    camera.minZ = config.minZ || 0.1;
    camera.maxZ = config.maxZ || 10000;

    if (config.target) {
      camera.setTarget(config.target);
    }

    return camera;
  }
}
