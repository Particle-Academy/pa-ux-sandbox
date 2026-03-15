import * as echarts from "echarts";

/** Dark theme preset */
export const darkTheme = {
  backgroundColor: "#1a1a2e",
  textStyle: { color: "#e0e0e0" },
  title: { textStyle: { color: "#ffffff" } },
  legend: { textStyle: { color: "#cccccc" } },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#444" } },
    splitLine: { lineStyle: { color: "#333" } },
    axisLabel: { color: "#aaa" },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#444" } },
    splitLine: { lineStyle: { color: "#333" } },
    axisLabel: { color: "#aaa" },
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
    "#ea7ccc",
  ],
};

/** Vintage theme preset */
export const vintageTheme = {
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
    "#4b565b",
  ],
  backgroundColor: "#fef8ef",
  textStyle: {},
  title: { textStyle: { color: "#333333" } },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#ccc" } },
    splitLine: { lineStyle: { color: "#eee" } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#ccc" } },
    splitLine: { lineStyle: { color: "#eee" } },
  },
};

/** Pastel theme preset */
export const pastelTheme = {
  color: [
    "#c4b5fd",
    "#a5f3fc",
    "#fca5a5",
    "#fde68a",
    "#a7f3d0",
    "#fbcfe8",
    "#c7d2fe",
    "#fed7aa",
  ],
  backgroundColor: "#fafafa",
  textStyle: { color: "#555" },
  title: { textStyle: { color: "#333" } },
};

/** Register a named theme with ECharts */
export function registerTheme(name: string, theme: object): void {
  echarts.registerTheme(name, theme);
}

/** Register all built-in theme presets */
export function registerBuiltinThemes(): void {
  registerTheme("dark-preset", darkTheme);
  registerTheme("vintage", vintageTheme);
  registerTheme("pastel", pastelTheme);
}
