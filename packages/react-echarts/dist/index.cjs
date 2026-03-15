'use strict';

var react = require('react');
var echarts = require('echarts');
var jsxRuntime = require('react/jsx-runtime');
var core = require('echarts/core');
var charts = require('echarts/charts');
var components = require('echarts/components');
var renderers = require('echarts/renderers');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var echarts__namespace = /*#__PURE__*/_interopNamespace(echarts);

// src/components/EChart.tsx
function useResizeObserver(ref, callback) {
  const callbackRef = react.useRef(callback);
  callbackRef.current = callback;
  react.useEffect(() => {
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
  return react.useSyncExternalStore(
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
  const chartRef = react.useRef(null);
  const instanceRef = react.useRef(null);
  const [instance, setInstance] = react.useState(null);
  react.useEffect(() => {
    if (!chartRef.current) return;
    const existing = echarts__namespace.getInstanceByDom(chartRef.current);
    if (existing) {
      existing.dispose();
    }
    const chart = echarts__namespace.init(chartRef.current, resolvedTheme, { renderer });
    instanceRef.current = chart;
    setInstance(chart);
    return () => {
      chart.dispose();
      instanceRef.current = null;
      setInstance(null);
    };
  }, [resolvedTheme, renderer]);
  react.useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || !option) return;
    const finalOption = autoDark ? { backgroundColor: "transparent", ...option } : option;
    chart.setOption(finalOption, { notMerge, lazyUpdate });
  }, [option, notMerge, lazyUpdate, autoDark]);
  react.useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    if (showLoading) {
      chart.showLoading("default", loadingOption);
    } else {
      chart.hideLoading();
    }
  }, [showLoading, loadingOption]);
  react.useEffect(() => {
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
var EChartBase = react.forwardRef(
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
    const option = react.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
  const [ready, setReady] = react.useState(glLoaded);
  react.useEffect(() => {
    if (glLoaded) {
      setReady(true);
      return;
    }
    loadEChartsGL().then(() => setReady(true));
  }, []);
  if (!ready) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...DEFAULT_STYLE2, ...style, display: "flex", alignItems: "center", justifyContent: "center" }, className, children: /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: "#9ca3af", fontSize: 14 }, children: "Loading 3D engine..." }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children });
}
var EChart3DInner = react.forwardRef(
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
var EChart3DBase = react.forwardRef(
  (props, ref) => {
    const { style, className, ...rest } = props;
    return /* @__PURE__ */ jsxRuntime.jsx(WithGL, { style, className, children: /* @__PURE__ */ jsxRuntime.jsx(EChart3DInner, { ref, style, className, ...rest }) });
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
    const option = react.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
    const option = react.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
var EChartGraphic = react.forwardRef(
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
    const option = react.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
  charts.LineChart,
  charts.BarChart,
  charts.PieChart,
  charts.ScatterChart,
  charts.RadarChart,
  charts.HeatmapChart,
  charts.GaugeChart,
  charts.FunnelChart,
  charts.TreemapChart,
  charts.SunburstChart,
  charts.SankeyChart,
  charts.GraphChart,
  charts.CandlestickChart,
  charts.BoxplotChart,
  charts.ParallelChart,
  charts.ThemeRiverChart,
  charts.MapChart,
  charts.CustomChart,
  charts.EffectScatterChart,
  charts.PictorialBarChart
];
var allComponents = [
  components.GridComponent,
  components.TooltipComponent,
  components.TitleComponent,
  components.LegendComponent,
  components.DataZoomComponent,
  components.ToolboxComponent,
  components.VisualMapComponent,
  components.GeoComponent,
  components.ParallelComponent,
  components.CalendarComponent,
  components.GraphicComponent,
  components.PolarComponent,
  components.RadarComponent,
  components.DatasetComponent,
  components.MarkLineComponent,
  components.MarkPointComponent,
  components.MarkAreaComponent,
  components.TimelineComponent,
  components.BrushComponent
];
var allRenderers = [renderers.CanvasRenderer, renderers.SVGRenderer];
var registered = false;
function registerAll() {
  if (registered) return;
  core.use([...allCharts, ...allComponents, ...allRenderers]);
  registered = true;
}
function registerCharts(...chartTypes) {
  core.use(chartTypes);
}
function registerComponents(...components) {
  core.use(components);
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
  echarts__namespace.registerTheme(name, theme);
}
function registerBuiltinThemes() {
  registerTheme2("dark-preset", darkTheme);
  registerTheme2("vintage", vintageTheme);
  registerTheme2("pastel", pastelTheme);
}

Object.defineProperty(exports, "BarChart", {
  enumerable: true,
  get: function () { return charts.BarChart; }
});
Object.defineProperty(exports, "BoxplotChart", {
  enumerable: true,
  get: function () { return charts.BoxplotChart; }
});
Object.defineProperty(exports, "CandlestickChart", {
  enumerable: true,
  get: function () { return charts.CandlestickChart; }
});
Object.defineProperty(exports, "CustomChart", {
  enumerable: true,
  get: function () { return charts.CustomChart; }
});
Object.defineProperty(exports, "EffectScatterChart", {
  enumerable: true,
  get: function () { return charts.EffectScatterChart; }
});
Object.defineProperty(exports, "FunnelChart", {
  enumerable: true,
  get: function () { return charts.FunnelChart; }
});
Object.defineProperty(exports, "GaugeChart", {
  enumerable: true,
  get: function () { return charts.GaugeChart; }
});
Object.defineProperty(exports, "GraphChart", {
  enumerable: true,
  get: function () { return charts.GraphChart; }
});
Object.defineProperty(exports, "HeatmapChart", {
  enumerable: true,
  get: function () { return charts.HeatmapChart; }
});
Object.defineProperty(exports, "LineChart", {
  enumerable: true,
  get: function () { return charts.LineChart; }
});
Object.defineProperty(exports, "MapChart", {
  enumerable: true,
  get: function () { return charts.MapChart; }
});
Object.defineProperty(exports, "ParallelChart", {
  enumerable: true,
  get: function () { return charts.ParallelChart; }
});
Object.defineProperty(exports, "PictorialBarChart", {
  enumerable: true,
  get: function () { return charts.PictorialBarChart; }
});
Object.defineProperty(exports, "PieChart", {
  enumerable: true,
  get: function () { return charts.PieChart; }
});
Object.defineProperty(exports, "RadarChart", {
  enumerable: true,
  get: function () { return charts.RadarChart; }
});
Object.defineProperty(exports, "SankeyChart", {
  enumerable: true,
  get: function () { return charts.SankeyChart; }
});
Object.defineProperty(exports, "ScatterChart", {
  enumerable: true,
  get: function () { return charts.ScatterChart; }
});
Object.defineProperty(exports, "SunburstChart", {
  enumerable: true,
  get: function () { return charts.SunburstChart; }
});
Object.defineProperty(exports, "ThemeRiverChart", {
  enumerable: true,
  get: function () { return charts.ThemeRiverChart; }
});
Object.defineProperty(exports, "TreemapChart", {
  enumerable: true,
  get: function () { return charts.TreemapChart; }
});
Object.defineProperty(exports, "CalendarComponent", {
  enumerable: true,
  get: function () { return components.CalendarComponent; }
});
Object.defineProperty(exports, "DataZoomComponent", {
  enumerable: true,
  get: function () { return components.DataZoomComponent; }
});
Object.defineProperty(exports, "DatasetComponent", {
  enumerable: true,
  get: function () { return components.DatasetComponent; }
});
Object.defineProperty(exports, "GeoComponent", {
  enumerable: true,
  get: function () { return components.GeoComponent; }
});
Object.defineProperty(exports, "GraphicComponent", {
  enumerable: true,
  get: function () { return components.GraphicComponent; }
});
Object.defineProperty(exports, "GridComponent", {
  enumerable: true,
  get: function () { return components.GridComponent; }
});
Object.defineProperty(exports, "LegendComponent", {
  enumerable: true,
  get: function () { return components.LegendComponent; }
});
Object.defineProperty(exports, "PolarComponent", {
  enumerable: true,
  get: function () { return components.PolarComponent; }
});
Object.defineProperty(exports, "TitleComponent", {
  enumerable: true,
  get: function () { return components.TitleComponent; }
});
Object.defineProperty(exports, "ToolboxComponent", {
  enumerable: true,
  get: function () { return components.ToolboxComponent; }
});
Object.defineProperty(exports, "TooltipComponent", {
  enumerable: true,
  get: function () { return components.TooltipComponent; }
});
Object.defineProperty(exports, "VisualMapComponent", {
  enumerable: true,
  get: function () { return components.VisualMapComponent; }
});
Object.defineProperty(exports, "CanvasRenderer", {
  enumerable: true,
  get: function () { return renderers.CanvasRenderer; }
});
Object.defineProperty(exports, "SVGRenderer", {
  enumerable: true,
  get: function () { return renderers.SVGRenderer; }
});
exports.EChart = EChart;
exports.EChart3D = EChart3D;
exports.EChartGraphic = EChartGraphic;
exports.darkTheme = darkTheme;
exports.pastelTheme = pastelTheme;
exports.registerAll = registerAll;
exports.registerBuiltinThemes = registerBuiltinThemes;
exports.registerCharts = registerCharts;
exports.registerComponents = registerComponents;
exports.registerTheme = registerTheme2;
exports.useECharts = useECharts;
exports.useResizeObserver = useResizeObserver;
exports.vintageTheme = vintageTheme;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map