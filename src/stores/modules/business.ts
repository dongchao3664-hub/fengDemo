/**
 * 业务管理 Store
 * 用于共享业务管理器实例和数据
 */

import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import type { WindmillMockData } from "@/views/screen/marsmap/business/windmill/WindmillLayerManager";
import type { CableMockData } from "@/views/screen/marsmap/business/cable/CableLayerManager";
import { CableType } from "@/views/screen/marsmap/business/cable/CableLayerManager";
import { flyToGraphicById, highlightGraphic } from "@/mars3dmap/utils/mapUtils";
import { useMars3dStore } from "@/stores";
import { bus } from "@/utils/busUtil";

export const useBusinessStore = defineStore("business", () => {
  // ======================== 状态 ========================

  // 业务管理器实例引用（使用 shallowRef 避免深层响应式转换导致方法丢失）
  const businessManager = shallowRef<any>(null);

  // 数据
  const windmills = ref<WindmillMockData[]>([]);
  const cables = ref<CableMockData[]>([]);

  // 选中状态
  const selectedWindmillId = ref<string | null>(null);
  const selectedCableId = ref<string | null>(null);

  // 高亮状态
  const highlightedWindmillIds = ref<string[]>([]);
  const highlightedCableIds = ref<string[]>([]);

  // 弹窗状态
  const popupVisible = ref(false);
  const popupData = ref<{ type: string; data: any } | null>(null);

  // ======================== 计算属性 ========================

  // 获取选中的风机
  const selectedWindmill = computed(() => {
    if (!selectedWindmillId.value) return null;
    return (
      windmills.value.find((w) => w.id === selectedWindmillId.value) || null
    );
  });

  // 获取选中的海缆
  const selectedCable = computed(() => {
    if (!selectedCableId.value) return null;
    return cables.value.find((c) => c.id === selectedCableId.value) || null;
  });

  // 掩埋海缆
  const buriedCables = computed(() => {
    return cables.value.filter((c) => c.type === CableType.BURIED);
  });

  // 裸露海缆
  const exposedCables = computed(() => {
    return cables.value.filter((c) => c.type === CableType.EXPOSED);
  });

  // 统计信息
  const statistics = computed(() => ({
    totalWindmills: windmills.value.length,
    totalCables: cables.value.length,
    buriedCables: buriedCables.value.length,
    exposedCables: exposedCables.value.length,
  }));

  // ======================== 方法 ========================

  /**
   * 设置业务管理器
   */
  const setBusinessManager = (manager: any) => {
    businessManager.value = manager;
  };

  /**
   * 设置风机数据
   */
  const setWindmills = (data: WindmillMockData[]) => {
    windmills.value = data;
  };

  /**
   * 设置海缆数据
   */
  const setCables = (data: CableMockData[]) => {
    cables.value = data;
  };

  /**
   * 选中风机（高亮 + 飞行定位）- 使用通用方法
   */
  const selectWindmill = (windmillId: string | null) => {
    console.log("[BusinessStore] selectWindmill:", windmillId);
    selectedWindmillId.value = windmillId;

    if (windmillId) {
      const mapStore = useMars3dStore();
      // mapInstance 是 ref，在 Pinia 内部需要访问 .value 来获取实际地图对象
      const map = mapStore.mapInstance;

      console.log("[BusinessStore] mapStore:", mapStore);
      console.log("[BusinessStore] mapInstance:", map);
      console.log("[BusinessStore] mapInstance type:", typeof map);
      console.log(
        "[BusinessStore] mapInstance.getLayerById:",
        map?.getLayerById
      );

      if (map && map.getLayerById) {
        // 使用通用方法：通过 map 获取 graphic 并飞行定位
        flyToGraphicById(map, windmillId, "windmillLayer",{ isPoint: true });
      } else {
        console.warn("[BusinessStore] map is not a valid Map instance");
      }

      // 高亮（通过业务管理器）
      if (businessManager.value) {
        businessManager.value.highlightWindmills([windmillId]);
      }
    } else if (businessManager.value) {
      businessManager.value.clearWindmillHighlight();
    }
  };

  /**
   * 选中海缆（高亮 + 飞行定位）- 使用通用方法
   */
  const selectCable = (cableId: string | null) => {
    console.log("[BusinessStore] selectCable:", cableId);
    selectedCableId.value = cableId;

    if (cableId) {
      const mapStore = useMars3dStore();
      const map = mapStore.mapInstance;

      console.log("[BusinessStore] selectCable - map:", map);
      console.log(
        "[BusinessStore] selectCable - map.getLayerById:",
        map?.getLayerById
      );

      if (map && map.getLayerById) {
        // 使用通用方法：通过 map 获取 graphic 并飞行定位
        flyToGraphicById(map, cableId, "cableLayer");
      } else {
        console.warn("[BusinessStore] map is not a valid Map instance");
      }

      // 高亮（通过业务管理器）
      if (businessManager.value) {
        businessManager.value.highlightCables([cableId]);
      }
    } else if (businessManager.value) {
      businessManager.value.clearCableHighlight();
    }
  };

  /**
   * 按类型筛选海缆
   */
  const filterCablesByType = (type: CableType | null) => {
    if (businessManager.value) {
      businessManager.value.filterCablesByType(type);
    }
  };

  /**
   * 清空选中
   */
  const clearSelection = () => {
    selectedWindmillId.value = null;
    selectedCableId.value = null;
    if (businessManager.value) {
      businessManager.value.clearWindmillHighlight();
      businessManager.value.clearCableHighlight();
    }
  };

  /**
   * 重置状态
   */
  const reset = () => {
    businessManager.value = null;
    windmills.value = [];
    cables.value = [];
    selectedWindmillId.value = null;
    selectedCableId.value = null;
    highlightedWindmillIds.value = [];
    highlightedCableIds.value = [];
    popupVisible.value = false;
    popupData.value = null;
  };

  // ======================== 事件总线监听 ========================

  /**
   * 初始化事件总线监听
   * 用于接收来自 GIS 图层的点击事件，联动面板等 UI
   */
  const initBusListeners = () => {
    // 监听弹窗事件
    bus.on("openPoupBill", (params) => {
      console.log("[BusinessStore] openPoupBill:", params);
      popupVisible.value = true;
      popupData.value = params;
    });

    // 监听风机选中事件（来自 GIS 点击）
    bus.on("selectWindmill", (params) => {
      console.log("[BusinessStore] selectWindmill from bus:", params);
      selectedWindmillId.value = params.id;
      highlightedWindmillIds.value = [params.id];
    });

    // 监听海缆选中事件（来自 GIS 点击）
    bus.on("selectCable", (params) => {
      console.log("[BusinessStore] selectCable from bus:", params);
      selectedCableId.value = params.id;
      highlightedCableIds.value = [params.id];
    });

    // 监听清除选中事件
    bus.on("clearSelection", () => {
      clearSelection();
    });
  };

  /**
   * 关闭弹窗
   */
  const closePopup = () => {
    popupVisible.value = false;
    popupData.value = null;
  };

  /**
   * 销毁事件总线监听
   */
  const destroyBusListeners = () => {
    bus.off("openPoupBill");
    bus.off("selectWindmill");
    bus.off("selectCable");
    bus.off("clearSelection");
  };

  return {
    // 状态
    businessManager,
    windmills,
    cables,
    selectedWindmillId,
    selectedCableId,
    highlightedWindmillIds,
    highlightedCableIds,
    popupVisible,
    popupData,

    // 计算属性
    selectedWindmill,
    selectedCable,
    buriedCables,
    exposedCables,
    statistics,

    // 方法
    setBusinessManager,
    setWindmills,
    setCables,
    selectWindmill,
    selectCable,
    filterCablesByType,
    clearSelection,
    closePopup,
    reset,
    initBusListeners,
    destroyBusListeners,
  };
});
