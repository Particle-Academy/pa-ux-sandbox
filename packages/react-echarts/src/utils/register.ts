import { use } from "echarts/core";
import {
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
  PictorialBarChart,
} from "echarts/charts";
import {
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
  RadarComponent as RadarComp,
  DatasetComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  TimelineComponent,
  BrushComponent,
} from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";

const allCharts = [
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
  PictorialBarChart,
] as const;

const allComponents = [
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
  RadarComp,
  DatasetComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  TimelineComponent,
  BrushComponent,
] as const;

const allRenderers = [CanvasRenderer, SVGRenderer] as const;

let registered = false;

/** Register all ECharts chart types, components, and renderers. Convenient for demos/quick starts. */
export function registerAll(): void {
  if (registered) return;
  use([...allCharts, ...allComponents, ...allRenderers] as any);
  registered = true;
}

/** Register specific chart types by name for tree-shaking optimization. */
export function registerCharts(
  ...chartTypes: Array<(typeof allCharts)[number]>
): void {
  use(chartTypes as any);
}

/** Register specific components by reference. */
export function registerComponents(
  ...components: Array<(typeof allComponents)[number]>
): void {
  use(components as any);
}

// Re-export individual charts and components for manual registration
export {
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
  PictorialBarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  GeoComponent,
  CalendarComponent,
  GraphicComponent,
  PolarComponent,
  DatasetComponent,
  CanvasRenderer,
  SVGRenderer,
};
