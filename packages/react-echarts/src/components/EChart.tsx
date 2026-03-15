import React, { forwardRef, useMemo } from "react";
import type { EChartsOption } from "echarts";
import { useECharts } from "../hooks/use-echarts";
import type {
  EChartComponentProps,
  SeriesComponentProps,
  ChartDivProps,
} from "../types";

const DEFAULT_STYLE: React.CSSProperties = { width: "100%", height: 400 };

/** Base EChart component — accepts any ECharts option. */
const EChartBase = forwardRef<HTMLDivElement, EChartComponentProps>(
  (
    {
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
    },
    _ref
  ) => {
    const { chartRef } = useECharts({
      option,
      theme,
      renderer,
      notMerge,
      lazyUpdate,
      showLoading,
      loadingOption,
      onEvents,
      autoResize,
    });

    return (
      <div
        ref={chartRef}
        style={{ ...DEFAULT_STYLE, ...style }}
        className={className}
        {...rest}
      />
    );
  }
);

EChartBase.displayName = "EChart";

// --- Helper to create typed series sub-components ---

function createSeriesComponent(
  seriesType: string,
  displayName: string
): React.FC<SeriesComponentProps & ChartDivProps> {
  const Component: React.FC<SeriesComponentProps & ChartDivProps> = ({
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
    const option = useMemo((): EChartsOption => {
      const base: EChartsOption = {};

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

      // Handle axis-based charts
      const axisCharts = [
        "line",
        "bar",
        "scatter",
        "candlestick",
        "boxplot",
        "heatmap",
        "effectScatter",
        "pictorialBar",
      ];
      if (axisCharts.includes(seriesType)) {
        base.xAxis = xAxis ?? { type: "category" };
        base.yAxis = yAxis ?? { type: "value" };
      }

      // Handle data format
      if (Array.isArray(data)) {
        base.series = [{ type: seriesType, data, ...seriesOptions }] as any;
      } else if (data && typeof data === "object" && "series" in data) {
        // Multi-series: { categories: [...], series: [{ name, data }, ...] }
        const multiData = data as {
          categories?: string[];
          series: Array<{ name?: string; data: any[]; [k: string]: any }>;
        };
        if (multiData.categories && axisCharts.includes(seriesType)) {
          base.xAxis = xAxis ?? {
            type: "category",
            data: multiData.categories,
          };
        }
        base.series = multiData.series.map((s) => ({
          type: seriesType,
          ...seriesOptions,
          ...s,
        })) as any;
      } else {
        base.series = [{ type: seriesType, data, ...seriesOptions }] as any;
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
      extraOption,
    ]);

    return (
      <EChartBase
        option={option}
        style={style}
        className={className}
        {...rest}
      />
    );
  };

  Component.displayName = displayName;
  return Component;
}

// --- Compound component with all chart type sub-components ---

export const EChart = Object.assign(EChartBase, {
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
  PictorialBar: createSeriesComponent("pictorialBar", "EChart.PictorialBar"),
});
