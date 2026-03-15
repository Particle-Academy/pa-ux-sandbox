import { forwardRef, useMemo, useRef, useState, useEffect, useSyncExternalStore } from 'react';
import * as echarts from 'echarts';
import { jsx, Fragment } from 'react/jsx-runtime';
import { use } from 'echarts/core';
import { LineChart, BarChart, PieChart, ScatterChart, RadarChart, HeatmapChart, GaugeChart, FunnelChart, TreemapChart, SunburstChart, SankeyChart, GraphChart, CandlestickChart, BoxplotChart, ParallelChart, ThemeRiverChart, MapChart, CustomChart, EffectScatterChart, PictorialBarChart } from 'echarts/charts';
export { BarChart, BoxplotChart, CandlestickChart, CustomChart, EffectScatterChart, FunnelChart, GaugeChart, GraphChart, HeatmapChart, LineChart, MapChart, ParallelChart, PictorialBarChart, PieChart, RadarChart, SankeyChart, ScatterChart, SunburstChart, ThemeRiverChart, TreemapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, DataZoomComponent, ToolboxComponent, VisualMapComponent, GeoComponent, ParallelComponent, CalendarComponent, GraphicComponent, PolarComponent, RadarComponent, DatasetComponent, MarkLineComponent, MarkPointComponent, MarkAreaComponent, TimelineComponent, BrushComponent } from 'echarts/components';
export { CalendarComponent, DataZoomComponent, DatasetComponent, GeoComponent, GraphicComponent, GridComponent, LegendComponent, PolarComponent, TitleComponent, ToolboxComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
export { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

// src/components/EChart.tsx
function useResizeObserver(ref, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      callbackRef.current();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
}

// src/hooks/use-echarts.ts
function useDarkMode() {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  );
}
function useECharts(options) {
  const {
    option,
    theme,
    renderer = "canvas",
    notMerge = false,
    lazyUpdate = false,
    showLoading = false,
    loadingOption,
    onEvents,
    autoResize = true
  } = options;
  const isDark = useDarkMode();
  const autoDark = theme === void 0 && isDark;
  const resolvedTheme = theme !== void 0 ? theme : isDark ? "dark" : void 0;
  const chartRef = useRef(null);
  const instanceRef = useRef(null);
  const [instance, setInstance] = useState(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const existing = echarts.getInstanceByDom(chartRef.current);
    if (existing) {
      existing.dispose();
    }
    const chart = echarts.init(chartRef.current, resolvedTheme, { renderer });
    instanceRef.current = chart;
    setInstance(chart);
    return () => {
      chart.dispose();
      instanceRef.current = null;
      setInstance(null);
    };
  }, [resolvedTheme, renderer]);
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || !option) return;
    const finalOption = autoDark ? { backgroundColor: "transparent", ...option } : option;
    chart.setOption(finalOption, { notMerge, lazyUpdate });
  }, [option, notMerge, lazyUpdate, autoDark]);
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    if (showLoading) {
      chart.showLoading("default", loadingOption);
    } else {
      chart.hideLoading();
    }
  }, [showLoading, loadingOption]);
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || !onEvents) return;
    const entries = Object.entries(onEvents);
    for (const [event, handler] of entries) {
      chart.on(event, handler);
    }
    return () => {
      for (const [event, handler] of entries) {
        chart.off(event, handler);
      }
    };
  }, [onEvents]);
  useResizeObserver(chartRef, () => {
    if (autoResize && instanceRef.current) {
      instanceRef.current.resize();
    }
  });
  return { chartRef, instance };
}
var DEFAULT_STYLE = { width: "100%", height: 400 };
var EChartBase = forwardRef(
  ({
    option,
    theme,
    renderer,
    notMerge,
    lazyUpdate,
    showLoading,
    loadingOption,
    onEvents,
    autoResize = true,
    style,
    className,
    ...rest
  }, _ref) => {
    const { chartRef } = useECharts({
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize
    });
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: chartRef,
        style: { ...DEFAULT_STYLE, ...style },
        className,
        ...rest
      }
    );
  }
);
EChartBase.displayName = "EChart";
function createSeriesComponent(seriesType, displayName) {
  const Component = ({
    data,
    title,
    xAxis,
    yAxis,
    tooltip = true,
    legend = false,
    grid,
    seriesOptions = {},
    option: extraOption = {},
    style,
    className,
    ...rest
  }) => {
    const option = useMemo(() => {
      const base = {};
      if (title) {
        base.title = { text: title };
      }
      if (tooltip === true) {
        base.tooltip = { trigger: "axis" };
      } else if (tooltip && typeof tooltip === "object") {
        base.tooltip = tooltip;
      }
      if (legend === true) {
        base.legend = {};
      } else if (legend && typeof legend === "object") {
        base.legend = legend;
      }
      if (grid) {
        base.grid = grid;
      }
      const axisCharts = [
        "line",
        "bar",
        "scatter",
        "candlestick",
        "boxplot",
        "heatmap",
        "effectScatter",
        "pictorialBar"
      ];
      if (axisCharts.includes(seriesType)) {
        base.xAxis = xAxis ?? { type: "category" };
        base.yAxis = yAxis ?? { type: "value" };
      }
      if (Array.isArray(data)) {
        base.series = [{ type: seriesType, data, ...seriesOptions }];
      } else if (data && typeof data === "object" && "series" in data) {
        const multiData = data;
        if (multiData.categories && axisCharts.includes(seriesType)) {
          base.xAxis = xAxis ?? {
            type: "category",
            data: multiData.categories
          };
        }
        base.series = multiData.series.map((s) => ({
          type: seriesType,
          ...seriesOptions,
          ...s
        }));
      } else {
        base.series = [{ type: seriesType, data, ...seriesOptions }];
      }
      return { ...base, ...extraOption };
    }, [
      data,
      title,
      xAxis,
      yAxis,
      tooltip,
      legend,
      grid,
      seriesOptions,
      extraOption
    ]);
    return /* @__PURE__ */ jsx(
      EChartBase,
      {
        option,
        style,
        className,
        ...rest
      }
    );
  };
  Component.displayName = displayName;
  return Component;
}
var EChart = Object.assign(EChartBase, {
  Line: createSeriesComponent("line", "EChart.Line"),
  Bar: createSeriesComponent("bar", "EChart.Bar"),
  Pie: createSeriesComponent("pie", "EChart.Pie"),
  Scatter: createSeriesComponent("scatter", "EChart.Scatter"),
  Radar: createSeriesComponent("radar", "EChart.Radar"),
  Heatmap: createSeriesComponent("heatmap", "EChart.Heatmap"),
  Gauge: createSeriesComponent("gauge", "EChart.Gauge"),
  Funnel: createSeriesComponent("funnel", "EChart.Funnel"),
  Treemap: createSeriesComponent("treemap", "EChart.Treemap"),
  Sunburst: createSeriesComponent("sunburst", "EChart.Sunburst"),
  Sankey: createSeriesComponent("sankey", "EChart.Sankey"),
  Graph: createSeriesComponent("graph", "EChart.Graph"),
  Candlestick: createSeriesComponent("candlestick", "EChart.Candlestick"),
  Boxplot: createSeriesComponent("boxplot", "EChart.Boxplot"),
  Parallel: createSeriesComponent("parallel", "EChart.Parallel"),
  ThemeRiver: createSeriesComponent("themeRiver", "EChart.ThemeRiver"),
  Map: createSeriesComponent("map", "EChart.Map"),
  Custom: createSeriesComponent("custom", "EChart.Custom"),
  EffectScatter: createSeriesComponent(
    "effectScatter",
    "EChart.EffectScatter"
  ),
  PictorialBar: createSeriesComponent("pictorialBar", "EChart.PictorialBar")
});
var DEFAULT_STYLE2 = { width: "100%", height: 500 };
var glLoaded = false;
var glPromise = null;
function loadEChartsGL() {
  if (glLoaded) return Promise.resolve();
  if (!glPromise) {
    glPromise = import('echarts-gl').then(() => {
      glLoaded = true;
    }).catch(() => {
      console.warn(
        "echarts-gl is required for 3D charts. Install it with: npm install echarts-gl"
      );
    });
  }
  return glPromise;
}
function WithGL({ children, style, className }) {
  const [ready, setReady] = useState(glLoaded);
  useEffect(() => {
    if (glLoaded) {
      setReady(true);
      return;
    }
    loadEChartsGL().then(() => setReady(true));
  }, []);
  if (!ready) {
    return /* @__PURE__ */ jsx("div", { style: { ...DEFAULT_STYLE2, ...style, display: "flex", alignItems: "center", justifyContent: "center" }, className, children: /* @__PURE__ */ jsx("span", { style: { color: "#9ca3af", fontSize: 14 }, children: "Loading 3D engine..." }) });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
var EChart3DInner = forwardRef(
  ({
    option,
    theme,
    renderer,
    notMerge,
    lazyUpdate,
    showLoading,
    loadingOption,
    onEvents,
    autoResize = true,
    style,
    className,
    ...rest
  }, _ref) => {
    const { chartRef } = useECharts({
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize
    });
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: chartRef,
        style: { ...DEFAULT_STYLE2, ...style },
        className,
        ...rest
      }
    );
  }
);
EChart3DInner.displayName = "EChart3DInner";
var EChart3DBase = forwardRef(
  (props, ref) => {
    const { style, className, ...rest } = props;
    return /* @__PURE__ */ jsx(WithGL, { style, className, children: /* @__PURE__ */ jsx(EChart3DInner, { ref, style, className, ...rest }) });
  }
);
EChart3DBase.displayName = "EChart3D";
function create3DSeriesComponent(seriesType, displayName) {
  const Component = ({
    data,
    title,
    tooltip = true,
    seriesOptions = {},
    option: extraOption = {},
    style,
    className,
    ...rest
  }) => {
    const option = useMemo(() => {
      const base = {};
      if (title) {
        base.title = { text: title };
      }
      if (tooltip === true) {
        base.tooltip = {};
      } else if (tooltip && typeof tooltip === "object") {
        base.tooltip = tooltip;
      }
      if (["bar3D", "scatter3D", "line3D", "surface"].includes(seriesType)) {
        base.xAxis3D = { type: "value" };
        base.yAxis3D = { type: "value" };
        base.zAxis3D = { type: "value" };
        base.grid3D = {};
      }
      base.series = [{ type: seriesType, data, ...seriesOptions }];
      return { ...base, ...extraOption };
    }, [data, title, tooltip, seriesOptions, extraOption]);
    return /* @__PURE__ */ jsx(
      EChart3DBase,
      {
        option,
        style,
        className,
        ...rest
      }
    );
  };
  Component.displayName = displayName;
  return Component;
}
function createGlobeComponent() {
  const Component = ({
    title,
    globe,
    series = [],
    option: extraOption = {},
    style,
    className,
    ...rest
  }) => {
    const option = useMemo(() => {
      const base = {};
      if (title) {
        base.title = { text: title };
      }
      base.globe = globe ?? {
        baseTexture: "",
        shading: "lambert",
        atmosphere: { show: true }
      };
      if (series.length > 0) {
        base.series = series;
      }
      return { ...base, ...extraOption };
    }, [title, globe, series, extraOption]);
    return /* @__PURE__ */ jsx(
      EChart3DBase,
      {
        option,
        style,
        className,
        ...rest
      }
    );
  };
  Component.displayName = "EChart3D.Globe";
  return Component;
}
var EChart3D = Object.assign(EChart3DBase, {
  Bar: create3DSeriesComponent("bar3D", "EChart3D.Bar"),
  Scatter: create3DSeriesComponent("scatter3D", "EChart3D.Scatter"),
  Line: create3DSeriesComponent("line3D", "EChart3D.Line"),
  Surface: create3DSeriesComponent("surface", "EChart3D.Surface"),
  Globe: createGlobeComponent()
});
var DEFAULT_STYLE3 = { width: "100%", height: 400 };
var EChartGraphic = forwardRef(
  ({
    elements,
    option: extraOption = {},
    theme,
    renderer,
    notMerge,
    lazyUpdate,
    showLoading,
    loadingOption,
    onEvents,
    autoResize = true,
    style,
    className,
    ...rest
  }, _ref) => {
    const option = useMemo(() => {
      return {
        graphic: {
          elements
        },
        ...extraOption
      };
    }, [elements, extraOption]);
    const { chartRef } = useECharts({
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize
    });
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: chartRef,
        style: { ...DEFAULT_STYLE3, ...style },
        className,
        ...rest
      }
    );
  }
);
EChartGraphic.displayName = "EChartGraphic";
var allCharts = [
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  HeatmapChart,
  GaugeChart,
  FunnelChart,
  TreemapChart,
  SunburstChart,
  SankeyChart,
  GraphChart,
  CandlestickChart,
  BoxplotChart,
  ParallelChart,
  ThemeRiverChart,
  MapChart,
  CustomChart,
  EffectScatterChart,
  PictorialBarChart
];
var allComponents = [
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  GeoComponent,
  ParallelComponent,
  CalendarComponent,
  GraphicComponent,
  PolarComponent,
  RadarComponent,
  DatasetComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  TimelineComponent,
  BrushComponent
];
var allRenderers = [CanvasRenderer, SVGRenderer];
var registered = false;
function registerAll() {
  if (registered) return;
  use([...allCharts, ...allComponents, ...allRenderers]);
  registered = true;
}
function registerCharts(...chartTypes) {
  use(chartTypes);
}
function registerComponents(...components) {
  use(components);
}
var darkTheme = {
  backgroundColor: "#1a1a2e",
  textStyle: { color: "#e0e0e0" },
  title: { textStyle: { color: "#ffffff" } },
  legend: { textStyle: { color: "#cccccc" } },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#444" } },
    splitLine: { lineStyle: { color: "#333" } },
    axisLabel: { color: "#aaa" }
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#444" } },
    splitLine: { lineStyle: { color: "#333" } },
    axisLabel: { color: "#aaa" }
  },
  color: [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc"
  ]
};
var vintageTheme = {
  color: [
    "#d87c7c",
    "#919e8b",
    "#d7ab82",
    "#6e7074",
    "#61a0a8",
    "#efa18d",
    "#787464",
    "#cc7e63",
    "#724e58",
    "#4b565b"
  ],
  backgroundColor: "#fef8ef",
  textStyle: {},
  title: { textStyle: { color: "#333333" } },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#ccc" } },
    splitLine: { lineStyle: { color: "#eee" } }
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#ccc" } },
    splitLine: { lineStyle: { color: "#eee" } }
  }
};
var pastelTheme = {
  color: [
    "#c4b5fd",
    "#a5f3fc",
    "#fca5a5",
    "#fde68a",
    "#a7f3d0",
    "#fbcfe8",
    "#c7d2fe",
    "#fed7aa"
  ],
  backgroundColor: "#fafafa",
  textStyle: { color: "#555" },
  title: { textStyle: { color: "#333" } }
};
function registerTheme2(name, theme) {
  echarts.registerTheme(name, theme);
}
function registerBuiltinThemes() {
  registerTheme2("dark-preset", darkTheme);
  registerTheme2("vintage", vintageTheme);
  registerTheme2("pastel", pastelTheme);
}

export { EChart, EChart3D, EChartGraphic, darkTheme, pastelTheme, registerAll, registerBuiltinThemes, registerCharts, registerComponents, registerTheme2 as registerTheme, useECharts, useResizeObserver, vintageTheme };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map