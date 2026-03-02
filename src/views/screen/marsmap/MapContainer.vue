<template>
  <div class="map-container-view">
    <!-- 地图主体（使用 MapView 组件） -->
    <div id="mars3d-map" class="mars3d-map">
      <MapView />
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar-top">
      <div class="toolbar-content">
        <router-link to="/" class="home-link">
          <el-icon><ArrowLeft /></el-icon>
          <span>首页</span>
        </router-link>
        <span class="app-title">地图应用 - Mars3D GIS</span>
        <div class="toolbar-actions">
          <el-button type="primary" size="small" @click="toggleSidebar">
            <el-icon><DocumentCopy /></el-icon>
            功能面板
          </el-button>
          <el-button size="small">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button size="small">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 左侧功能面板 -->
    <Transition name="slide-fade">
      <div v-show="sidebarOpen" class="sidebar-panel">
        <div class="panel-header">
          <span>功能面板</span>
          <el-icon class="close-btn" @click="toggleSidebar">
            <Close />
          </el-icon>
        </div>

        <el-tabs>
          <!-- 图层管理选项卡 -->
          <el-tab-pane label="图层管理" name="layers">
            <div class="panel-content">
              <el-tree
                :data="layerTree"
                node-key="id"
                :props="{ children: 'children', label: 'label' }"
                :default-checked-keys="['windmills', 'windfield', 'cables']"
                show-checkbox
                @check="handleLayerCheck"
              />
            </div>
          </el-tab-pane>

          <!-- 风机列表选项卡 -->
          <el-tab-pane label="风机列表" name="windmills">
            <div class="panel-content">
              <el-input
                v-model="windmillSearch"
                placeholder="搜索风机..."
                clearable
                size="small"
              />
              <div class="data-list">
                <div
                  v-for="windmill in filteredWindmills"
                  :key="windmill.id"
                  :data-id="windmill.id"
                  class="data-item"
                  :class="{
                    active: businessStore.selectedWindmillId === windmill.id,
                  }"
                  @click="selectWindmill(windmill)"
                >
                  <div class="item-info">
                    <h4>{{ windmill.name }}</h4>
                    <p class="meta">ID: {{ windmill.id }}</p>
                  </div>
                  <el-button type="primary" size="small" text>定位</el-button>
                </div>
                <el-empty
                  v-if="filteredWindmills.length === 0"
                  description="暂无数据"
                />
              </div>
            </div>
          </el-tab-pane>

          <!-- 海缆列表选项卡 -->
          <el-tab-pane label="海缆列表" name="cables">
            <div class="panel-content">
              <div class="filter-row">
                <el-input
                  v-model="cableSearch"
                  placeholder="搜索海缆..."
                  clearable
                  size="small"
                  style="flex: 1"
                />
                <el-select
                  v-model="cableTypeFilter"
                  placeholder="类型"
                  clearable
                  size="small"
                  style="width: 100px; margin-left: 8px"
                  @change="toggleCableTypeFilter"
                >
                  <el-option label="掩埋" :value="1" />
                  <el-option label="裸露" :value="2" />
                </el-select>
              </div>
              <div class="data-list">
                <div
                  v-for="cable in filteredCables"
                  :key="cable.id"
                  :data-id="cable.id"
                  class="data-item"
                  :class="{
                    active: businessStore.selectedCableId === cable.id,
                  }"
                  @click="selectCable(cable)"
                >
                  <div class="item-info">
                    <h4>{{ cable.name }}</h4>
                    <p class="meta">
                      <el-tag
                        :type="cable.type === 1 ? 'success' : 'warning'"
                        size="small"
                      >
                        {{ cable.type === 1 ? "掩埋" : "裸露" }}
                      </el-tag>
                      <span style="margin-left: 8px"
                        >{{ cable.points?.length || 0 }} 点</span
                      >
                    </p>
                  </div>
                  <div class="item-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      text
                      @click.stop="selectCableAndShowChart(cable)"
                    >
                      <el-icon><TrendCharts /></el-icon>
                    </el-button>
                    <el-button type="primary" size="small" text>查看</el-button>
                  </div>
                </div>
                <el-empty
                  v-if="filteredCables.length === 0"
                  description="暂无数据"
                />
              </div>
            </div>
          </el-tab-pane>

          <!-- 统计信息选项卡 -->
          <el-tab-pane label="统计信息" name="statistics">
            <div class="panel-content statistics-content">
              <el-statistic
                title="风机总数"
                :value="statistics.totalWindmills"
              />
              <el-statistic title="海缆总数" :value="statistics.totalCables" />
              <el-statistic title="掩埋海缆" :value="statistics.buriedCables" />
              <el-statistic
                title="裸露海缆"
                :value="statistics.exposedCables"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </Transition>

    <!-- 右侧信息面板 -->
    <Transition name="slide-fade-right">
      <div v-show="infoOpen" class="info-panel">
        <div class="panel-header">
          <span>信息面板</span>
          <el-icon class="close-btn" @click="infoOpen = false">
            <Close />
          </el-icon>
        </div>
        <div class="panel-content">
          <!-- 风机详情 -->
          <el-card v-if="businessStore.selectedWindmill" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ businessStore.selectedWindmill.name }}</span>
                <el-tag type="info" size="small">风机</el-tag>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="ID">
                {{ businessStore.selectedWindmill.id }}
              </el-descriptions-item>
              <el-descriptions-item label="图层">
                {{ businessStore.selectedWindmill.layer }}
              </el-descriptions-item>
              <el-descriptions-item label="经度">
                {{ businessStore.selectedWindmill.points?.[0]?.lon.toFixed(6) }}
              </el-descriptions-item>
              <el-descriptions-item label="纬度">
                {{ businessStore.selectedWindmill.points?.[0]?.lat.toFixed(6) }}
              </el-descriptions-item>
            </el-descriptions>
            <!-- 3D模型操作按钮 -->
            <div class="model-actions">
              <el-button
                type="primary"
                :loading="loadingGLBModel"
                :disabled="!hasGLBModel(businessStore.selectedWindmill)"
                @click="toggleGLBModel(businessStore.selectedWindmill.id)"
              >
                <el-icon><View /></el-icon>
                {{
                  isGLBModelVisible(businessStore.selectedWindmill.id)
                    ? "隐藏水下GLB模型"
                    : "显示水下GLB模型"
                }}
              </el-button>
              <el-button
                v-if="loadedGLBModels.has(businessStore.selectedWindmill.id)"
                type="info"
                plain
                size="small"
                @click="flyToGLBModel(businessStore.selectedWindmill.id)"
              >
                <el-icon><Position /></el-icon>
                定位GLB模型
              </el-button>
              <el-button
                type="warning"
                :loading="loadingTilesetModel"
                :disabled="!hasTilesetModel(businessStore.selectedWindmill)"
                @click="toggleTilesetModel(businessStore.selectedWindmill.id)"
              >
                <el-icon><View /></el-icon>
                {{
                  isTilesetModelVisible(businessStore.selectedWindmill.id)
                    ? "隐藏点云模型"
                    : "显示点云模型"
                }}
              </el-button>
              <el-button
                type="success"
                plain
                @click="viewModelInNewTab(businessStore.selectedWindmill.id)"
              >
                <el-icon><FullScreen /></el-icon>
                新窗口查看
              </el-button>
            </div>
            <!-- 模型信息提示 -->
            <el-alert
              v-if="
                !hasGLBModel(businessStore.selectedWindmill) &&
                !hasTilesetModel(businessStore.selectedWindmill)
              "
              title="暂无水下模型数据"
              type="info"
              :closable="false"
              style="margin-top: 10px"
            />
            <el-alert
              v-else-if="!hasGLBModel(businessStore.selectedWindmill)"
              title="暂无GLB模型数据（仅支持点云）"
              type="info"
              :closable="false"
              style="margin-top: 10px"
            />
            <el-alert
              v-else-if="!hasTilesetModel(businessStore.selectedWindmill)"
              title="暂无点云数据（仅支持GLB模型）"
              type="info"
              :closable="false"
              style="margin-top: 10px"
            />
          </el-card>

          <!-- 海缆详情 -->
          <el-card v-else-if="businessStore.selectedCable" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ businessStore.selectedCable.name }}</span>
                <el-tag
                  :type="
                    businessStore.selectedCable.type === 1
                      ? 'success'
                      : 'warning'
                  "
                  size="small"
                >
                  {{ businessStore.selectedCable.type === 1 ? "掩埋" : "裸露" }}
                </el-tag>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="ID">
                {{ businessStore.selectedCable.id }}
              </el-descriptions-item>
              <el-descriptions-item label="图层">
                {{ businessStore.selectedCable.layer }}
              </el-descriptions-item>
              <el-descriptions-item label="点数">
                {{ businessStore.selectedCable.points?.length || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="类型">
                <el-tag
                  :type="
                    businessStore.selectedCable.type === 1
                      ? 'success'
                      : 'warning'
                  "
                >
                  {{ businessStore.selectedCable.type === 1 ? "掩埋" : "裸露" }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <!-- 高程分析操作按钮 -->
            <div class="cable-actions">
              <el-button
                type="primary"
                @click="showElevationChart"
              >
                <el-icon><TrendCharts /></el-icon>
                高程分析
              </el-button>
              <!-- <el-button
                type="info"
                plain
                @click="flyToCable(businessStore.selectedCable.id)"
              >
                <el-icon><Position /></el-icon>
                定位海缆
              </el-button> -->
            </div>
          </el-card>

          <el-empty v-else description="选择风机或海缆查看详情" />
        </div>
      </div>
    </Transition>

    <!-- 底部状态栏 -->
    <!-- <div class="statusbar-bottom">
      <span>已选中: {{ selectedWindmill?.name || '无' }}</span>
      <span class="spacer"></span>
      <span>© 2025 Mars3D GIS Platform</span>
    </div> -->

    <!-- 海缆高程分析图表 -->
    <CableElevationChart
      v-model:visible="elevationChartVisible"
      :cable-data="businessStore.selectedCable"
      :all-cables-data="businessStore.cables"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  DocumentCopy,
  Search,
  Setting,
  Close,
  ArrowLeft,
  View,
  FullScreen,
  Position,
  TrendCharts,
} from "@element-plus/icons-vue";
import { useMars3dStore } from "@/stores";
import { useBusinessStore } from "@/stores/modules/business";
import { bus } from "@/utils/busUtil";
import MapView from "./MapView.vue";
import CableElevationChart from "./components/CableElevationChart.vue";
import layerManageData from "./data/layerManage.data";
import { toggleLayersBySelection } from "./utils/layerManageUtils";
import type { LayerGroup, LayerManageData } from "./data/layerManage.data";
import { CableType } from "./business/cable/CableLayerManager";

const router = useRouter();
const mapStore = useMars3dStore();
const businessStore = useBusinessStore();

// ======================== 地图和图层状态 ========================
const sidebarOpen = ref(true);
const infoOpen = ref(true);
const selectedLayers = ref<string[]>([...layerManageData.checkList]);

// ======================== 3D模型加载状态 ========================
const loadingGLBModel = ref(false);
const loadingTilesetModel = ref(false);
const loadedGLBModels = ref<Set<string>>(new Set());
const loadedTilesetModels = ref<Set<string>>(new Set());
// 追踪模型的可见性状态（响应式）
const glbModelVisibility = ref<Map<string, boolean>>(new Map());
const tilesetModelVisibility = ref<Map<string, boolean>>(new Map());

// ======================== 业务数据状态 ========================
const windmillSearch = ref("");
const cableSearch = ref("");
const cableTypeFilter = ref<CableType | null>(null);
const elevationChartVisible = ref(false);

// 列表容器引用（用于滚动）
const windmillListRef = ref<HTMLElement | null>(null);
const cableListRef = ref<HTMLElement | null>(null);

// 生成图层树形结构供显示
const layerTree = computed(() => {
  return [
    {
      id: "data",
      label: "数据图层",
      children: layerManageData.layerList
        .filter((group: LayerGroup) => group.isDisplay)
        .map((group: LayerGroup) => ({
          id: group.label,
          label: group.label,
        })),
    },
  ];
});

// 使用 businessStore 的真实数据
const filteredWindmills = computed(() => {
  const list = businessStore.windmills;
  if (!windmillSearch.value) return list;
  return list.filter(
    (wm) =>
      wm.name.includes(windmillSearch.value) ||
      wm.id.includes(windmillSearch.value)
  );
});

// 海缆数据（支持搜索和类型筛选）
const filteredCables = computed(() => {
  let list = businessStore.cables;

  // 类型筛选
  if (cableTypeFilter.value !== null) {
    list = list.filter((c) => c.type === cableTypeFilter.value);
  }

  // 搜索筛选
  if (cableSearch.value) {
    list = list.filter(
      (c) =>
        c.name.includes(cableSearch.value) || c.id.includes(cableSearch.value)
    );
  }

  return list;
});

// 统计信息
const statistics = computed(() => businessStore.statistics);

// ======================== 核心方法 ========================

/**
 * 切换侧边栏显隐
 */
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

/**
 * 处理图层勾选事件
 * 当图层选择改变时，通知地图更新显隐状态
 */
const handleLayerCheck = (data: any, node: any) => {
  // 获取所有选中的节点ID
  const checkedKeys = (node.$parent?.checkedKeys || []) as string[];

  // 过滤出有效的图层标签（排除分组ID）
  const layerLabels = checkedKeys.filter((key: string) =>
    layerManageData.layerList.some((group: LayerGroup) => group.label === key)
  );

  // 更新选中的图层
  selectedLayers.value = layerLabels;

  console.log("[MapContainer] Selected layers:", layerLabels);

  // 同步到地图显隐
  if (mapStore.mapInstance) {
    toggleLayersBySelection(mapStore.mapInstance, layerManageData, layerLabels);
  }
};

/**
 * 选择风机（联动：高亮 + 飞行定位）
 */
const selectWindmill = (windmill: any) => {
  businessStore.selectWindmill(windmill.id);
  infoOpen.value = true;
  console.log("[MapContainer] Selected windmill:", windmill.id);
};

/**
 * 选择海缆（联动：高亮）
 */
const selectCable = (cable: any) => {
  businessStore.selectCable(cable.id);
  infoOpen.value = true;
  console.log("[MapContainer] Selected cable:", cable.id);
};

/**
 * 选择海缆并显示高程图表
 */
const selectCableAndShowChart = (cable: any) => {
  businessStore.selectCable(cable.id);
  elevationChartVisible.value = true;
  console.log("[MapContainer] Selected cable and showing chart:", cable.id);
};

/**
 * 切换海缆类型筛选
 */
const toggleCableTypeFilter = (type: CableType | null) => {
  cableTypeFilter.value = type;
  businessStore.filterCablesByType(type);
};

/**
 * 显示海缆高程分析图表
 */
const showElevationChart = () => {
  if (!businessStore.selectedCable) {
    ElMessage.warning('请先选择海缆');
    return;
  }
  elevationChartVisible.value = true;
};

/**
 * 飞行到海缆
 */
const flyToCable = (cableId: string) => {
  try {
    const cableManager = businessStore.businessManager?.cableManager;
    if (cableManager && typeof cableManager.flyTo === 'function') {
      cableManager.flyTo(cableId);
      ElMessage.success('正在飞往海缆位置');
    } else {
      console.warn('[MapContainer] Cable manager not found or flyTo not available');
      ElMessage.warning('定位功能暂不可用');
    }
  } catch (error) {
    console.error('[MapContainer] Fly to cable error:', error);
    ElMessage.error('定位失败');
  }
};

/**
 * 查看3D模型（原有方法，新窗口打开）
 */
const viewModel = (windmillId: string) => {
  ElMessage.success("正在加载模型...");
  //路由加载
  // router.push(`/model/${windmillId}`)
  //新开标签
  window.open(`${window.location.origin}/model/${windmillId}`, "_blank");
  //弹窗弹出
};

/**
 * 新窗口查看模型
 */
const viewModelInNewTab = (windmillId: string) => {
  viewModel(windmillId);
};

/**
 * 切换GLB模型显示
 */
const toggleGLBModel = async (windmillId: string) => {
  try {
    loadingGLBModel.value = true;

    const underwaterManager =
      businessStore.businessManager?.underwaterManager?.value;

    if (!underwaterManager) {
      console.error("[MapContainer] Underwater manager not found");
      ElMessage.error("水下模型管理器未初始化");
      return;
    }

    // 检查是否已加载
    const isLoaded = underwaterManager.isGLBModelLoaded(windmillId);

    if (!isLoaded) {
      // 未加载，先加载
      console.log("[MapContainer] Loading GLB model for:", windmillId);
      const result = await underwaterManager.loadUnderwaterModels(windmillId, {
        glbOptions: {
          scale: 1,
          offsetAlt: -9,
          show: true,
        },
        loadGLB: true,
        loadTileset: false,
      });

      if (result.success && result.glbResult?.success) {
        loadedGLBModels.value.add(windmillId);
        glbModelVisibility.value.set(windmillId, true);
        ElMessage.success("GLB模型加载成功");
      } else {
        ElMessage.error(`GLB模型加载失败: ${result.message || result.glbResult?.message}`);
      }
    } else {
      // 已加载，切换显隐
      const currentVisibility = glbModelVisibility.value.get(windmillId) ?? true;
      if (currentVisibility) {
        underwaterManager.hideModel(windmillId);
        glbModelVisibility.value.set(windmillId, false);
        ElMessage.success("GLB模型已隐藏");
      } else {
        underwaterManager.showModel(windmillId);
        glbModelVisibility.value.set(windmillId, true);
        ElMessage.success("GLB模型已显示");
      }
    }
  } catch (error) {
    console.error("[MapContainer] Toggle GLB model error:", error);
    ElMessage.error("操作失败");
  } finally {
    loadingGLBModel.value = false;
  }
};

/**
 * 切换点云模型显示
 */
const toggleTilesetModel = async (windmillId: string) => {
  try {
    loadingTilesetModel.value = true;

    const underwaterManager =
      businessStore.businessManager?.underwaterManager?.value;

    if (!underwaterManager) {
      console.error("[MapContainer] Underwater manager not found");
      ElMessage.error("水下模型管理器未初始化");
      return;
    }

    // 检查是否已加载
    const isLoaded = underwaterManager.isTilesetModelLoaded(windmillId);

    if (!isLoaded) {
      // 未加载，先加载
      console.log("[MapContainer] Loading Tileset model for:", windmillId);
      const result = await underwaterManager.loadUnderwaterModels(windmillId, {
        tilesetOptions: {
          scale: 1,
          offsetAlt: 0,
          show: true,
          maximumScreenSpaceError: 16,
        },
        loadGLB: false,
        loadTileset: true,
      });

      if (result.success && result.tilesetResult?.success) {
        loadedTilesetModels.value.add(windmillId);
        tilesetModelVisibility.value.set(windmillId, true);
        ElMessage.success("点云模型加载成功");
      } else {
        ElMessage.error(`点云模型加载失败: ${result.message || result.tilesetResult?.message}`);
      }
    } else {
      // 已加载，切换显隐
      const currentVisibility = tilesetModelVisibility.value.get(windmillId) ?? true;
      if (currentVisibility) {
        underwaterManager.hideModel(windmillId);
        tilesetModelVisibility.value.set(windmillId, false);
        ElMessage.success("点云模型已隐藏");
      } else {
        underwaterManager.showModel(windmillId);
        tilesetModelVisibility.value.set(windmillId, true);
        ElMessage.success("点云模型已显示");
      }
    }
  } catch (error) {
    console.error("[MapContainer] Toggle Tileset model error:", error);
    ElMessage.error("操作失败");
  } finally {
    loadingTilesetModel.value = false;
  }
};

/**
 * 检查是否有GLB模型数据
 */
const hasGLBModel = (windmill: any): boolean => {
  if (!windmill) return false;
  return !!(windmill.underwater_model_url || windmill.underwaterModelUrl);
};

/**
 * 检查是否有点云模型数据
 */
const hasTilesetModel = (windmill: any): boolean => {
  if (!windmill) return false;
  return !!(windmill.underwater_tileset_url || windmill.underwaterTilesetUrl);
};

/**
 * 检查GLB模型是否可见
 */
const isGLBModelVisible = (windmillId: string): boolean => {
  return glbModelVisibility.value.get(windmillId) ?? false;
};

/**
 * 检查点云模型是否可见
 */
const isTilesetModelVisible = (windmillId: string): boolean => {
  return tilesetModelVisibility.value.get(windmillId) ?? false;
};

/**
 * 飞行到GLB模型位置
 */
const flyToGLBModel = (windmillId: string) => {
  const underwaterManager =
    businessStore.businessManager?.underwaterManager?.value;
  if (underwaterManager) {
    console.log("[MapContainer] 飞行到GLB模型:", windmillId);
    underwaterManager.flyToModel(windmillId, {
      radius: 500,
      duration: 2,
    });
  }
};

/**
 * 飞行到点云模型位置
 */
const flyToTilesetModel = (windmillId: string) => {
  const underwaterManager =
    businessStore.businessManager?.underwaterManager?.value;
  if (underwaterManager) {
    console.log("[MapContainer] 飞行到点云模型:", windmillId);
    underwaterManager.flyToModel(windmillId, {
      radius: 800,
      duration: 2,
    });
  }
};

// ======================== 生命周期 ========================

/**
 * 监听地图实例变化，自动同步图层状态
 * 注意：不使用 immediate: true 避免 layers 未初始化导致的错误
 */
watch(
  () => mapStore.mapInstance,
  (newMap) => {
    if (
      newMap &&
      mapStore.isMapLoaded &&
      newMap.layers &&
      newMap.layers.length > 0
    ) {
      console.log(
        "[MapContainer] Map instance fully loaded, syncing layer state..."
      );
      // 同步当前的图层选择状态到地图
      toggleLayersBySelection(newMap, layerManageData, selectedLayers.value);
    }
  }
  // 移除 immediate: true，避免地图未完全初始化就调用
);

/**
 * 组件挂载
 */
onMounted(() => {
  console.log("[MapContainer] Component mounted");

  // 初始化事件总线监听（地图 → 面板联动）
  initBusListeners();
});

/**
 * 组件卸载
 */
onUnmounted(() => {
  // 清理事件总线监听
  destroyBusListeners();
});

// ======================== 事件总线联动 ========================

/**
 * 初始化事件总线监听
 * 接收来自 GIS 图层的点击事件，联动面板
 */
const initBusListeners = () => {
  // 监听风机选中事件（来自地图点击）
  bus.on("selectWindmill", (params) => {
    console.log("[MapContainer] Bus: selectWindmill", params);
    // 打开信息面板
    infoOpen.value = true;
    // 滚动到选中项
    nextTick(() => {
      scrollToSelectedItem("windmill", params.id);
    });
  });

  // 监听海缆选中事件（来自地图点击）
  bus.on("selectCable", (params) => {
    console.log("[MapContainer] Bus: selectCable", params);
    // 打开信息面板
    infoOpen.value = true;
    // 滚动到选中项
    nextTick(() => {
      scrollToSelectedItem("cable", params.id);
    });
  });

  // 监听弹窗事件
  bus.on("openPoupBill", (params) => {
    console.log("[MapContainer] Bus: openPoupBill", params);
    // 可以在这里处理弹窗逻辑，或者打开信息面板
    infoOpen.value = true;
  });
};

/**
 * 销毁事件总线监听
 */
const destroyBusListeners = () => {
  bus.off("selectWindmill");
  bus.off("selectCable");
  bus.off("openPoupBill");
};

/**
 * 滚动到选中的列表项
 */
const scrollToSelectedItem = (type: "windmill" | "cable", id: string) => {
  const selector = `.data-item[data-id="${id}"]`;
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};
</script>

<style scoped lang="less">
.map-container-view {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;

  .mars3d-map {
    flex: 1;
    width: 100%;
    height: 100%;
  }

  // 顶部工具栏
  .toolbar-top {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    height: 50px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    padding: 0 15px;

    .toolbar-content {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;

      .home-link {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #409eff;
        text-decoration: none;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          color: #66b1ff;
        }
      }

      .app-title {
        flex: 1;
        font-weight: bold;
        font-size: 16px;
        color: #333;
      }

      .toolbar-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  // 左侧面板
  .sidebar-panel {
    position: absolute;
    top: 65px;
    left: 10px;
    width: 300px;
    max-height: calc(100vh - 125px);
    background: rgba(255, 255, 255, 0.98);
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 50;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .panel-header {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;

      .close-btn {
        cursor: pointer;
        color: #666;

        &:hover {
          color: #333;
        }
      }
    }

    :deep(.el-tabs) {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-tabs__content {
        flex: 1;
        overflow-y: auto;
      }
    }

    .panel-content {
      padding: 15px;
      overflow-y: auto;

      .filter-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .data-list {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 400px;
        overflow-y: auto;

        .data-item {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          justify-content: space-between;
          align-items: center;

          &:hover {
            background: #f5f7fa;
            border-color: #409eff;
          }

          &.active {
            background: #ecf5ff;
            border-color: #409eff;
          }

          .item-info {
            flex: 1;

            h4 {
              margin: 0;
              font-size: 13px;
              color: #333;
            }

            .meta {
              margin: 4px 0 0;
              font-size: 12px;
              color: #999;
              display: flex;
              align-items: center;
            }
          }

          .item-actions {
            display: flex;
            gap: 4px;
            align-items: center;
          }
        }
      }

      &.statistics-content {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }

      .windmill-list {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .windmill-item {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          justify-content: space-between;
          align-items: center;

          &:hover {
            background: #f5f7fa;
            border-color: #409eff;
          }

          .windmill-info {
            flex: 1;

            h4 {
              margin: 0;
              font-size: 14px;
            }

            .status {
              margin: 4px 0 0;
              font-size: 12px;
              color: #666;

              &.running {
                color: #67c23a;
              }

              &.maintenance {
                color: #e6a23c;
              }
            }
          }
        }
      }
    }
  }

  // 右侧信息面板
  .info-panel {
    position: absolute;
    top: 65px;
    right: 10px;
    width: 320px;
    max-height: calc(100vh - 125px);
    background: rgba(255, 255, 255, 0.98);
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 50;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .panel-header {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;

      .close-btn {
        cursor: pointer;
        color: #666;

        &:hover {
          color: #333;
        }
      }
    }

    .panel-content {
      flex: 1;
      padding: 15px;
      overflow-y: auto;

      .model-actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }

      .cable-actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }

      .view-model-btn {
        width: 100%;
        margin-top: 15px;
      }
    }
  }

  // 底部状态栏
  .statusbar-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    display: flex;
    align-items: center;
    padding: 0 15px;
    font-size: 13px;
    z-index: 40;

    .spacer {
      flex: 1;
    }
  }
}

// 动画
:deep(.slide-fade-enter-active),
:deep(.slide-fade-leave-active) {
  transition: all 0.3s ease;
}

:deep(.slide-fade-enter-from) {
  transform: translateX(-30px);
  opacity: 0;
}

:deep(.slide-fade-leave-to) {
  transform: translateX(-30px);
  opacity: 0;
}

:deep(.slide-fade-right-enter-active),
:deep(.slide-fade-right-leave-active) {
  transition: all 0.3s ease;
}

:deep(.slide-fade-right-enter-from) {
  transform: translateX(30px);
  opacity: 0;
}

:deep(.slide-fade-right-leave-to) {
  transform: translateX(30px);
  opacity: 0;
}
</style>
