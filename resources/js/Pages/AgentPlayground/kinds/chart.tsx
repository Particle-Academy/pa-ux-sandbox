/**
 * chart kind — fancy-echarts <EChart> driven by registerChartsBridge.
 */
import { EChart, registerAll as registerAllEcharts } from "@particle-academy/fancy-echarts";
import { registerChartsBridge } from "@particle-academy/agent-integrations/bridges/charts";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

registerAllEcharts();

export type ChartState = { option: Record<string, unknown> };

const seed = (): ChartState => ({
  option: {
    grid: { left: 40, right: 16, top: 30, bottom: 30 },
    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: { type: "value" },
    series: [{ type: "line", smooth: true, data: [12000, 18500, 22000, 0], areaStyle: {} }],
    tooltip: { trigger: "axis" },
  },
});

function ChartSurface({ state }: SurfaceProps) {
  const s = state as ChartState;
  return (
    <div style={{ height: 480, padding: 8 }}>
      <EChart option={s.option as never} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export const chartKind: KindModule = {
  kind: "chart",
  label: "Chart",
  description: "An Apache ECharts chart. Drive it with chart_* tools (set_option / update_data).",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as ChartState) ?? seed();
    return registerChartsBridge(server, {
      adapter: {
        id: "playground-chart",
        title: "Chart",
        getOption: () => read().option,
        setOption: (option) => ctx.setActiveState({ option }),
        updateOption: (partial) => ctx.setActiveState({ option: { ...read().option, ...partial } }),
        getData: () => (read().option as { series?: unknown }).series,
        updateData: (data) => {
          const option = { ...read().option };
          (option as { series: unknown }).series = Array.isArray(data) ? data : [{ type: "line", data }];
          ctx.setActiveState({ option });
        },
      },
      agent: ctx.agent,
    });
  },
  Surface: ChartSurface,
};
