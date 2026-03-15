import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

export function LineDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        Line Chart
      </h1>

      <DemoSection title="Basic Line" description="Simple line chart with category axis." code={`<EChart
  option={{
    xAxis: { type: "category", data: ["Jan", "Feb", ...] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [150, 230, 224, ...] }],
  }}
/>`}>
        <EChart
          option={{
            xAxis: { type: "category", data: months },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [{ type: "line", data: [150, 230, 224, 218, 135, 147, 260] }],
          }}
        />
      </DemoSection>

      <DemoSection title="Smooth Line" description="Line chart with smooth curves and area fill." code={`<EChart
  option={{
    xAxis: { type: "category", data: [...] },
    yAxis: { type: "value" },
    series: [{
      type: "line",
      data: [...],
      smooth: true,
      areaStyle: { opacity: 0.3 },
    }],
  }}
/>`}>
        <EChart
          option={{
            xAxis: { type: "category", data: months },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [
              {
                type: "line",
                data: [820, 932, 901, 934, 1290, 1330, 1320],
                smooth: true,
                areaStyle: { opacity: 0.3 },
              },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="Multi-Series" description="Multiple lines with legend." code={`<EChart
  option={{
    xAxis: { type: "category", data: [...] },
    yAxis: { type: "value" },
    legend: {},
    series: [
      { name: "Email", type: "line", data: [...] },
      { name: "Search", type: "line", data: [...] },
    ],
  }}
/>`}>
        <EChart
          option={{
            xAxis: { type: "category", data: months },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            legend: {},
            series: [
              { name: "Email", type: "line", data: [120, 132, 101, 134, 90, 230, 210] },
              { name: "Search", type: "line", data: [220, 182, 191, 234, 290, 330, 310] },
              { name: "Direct", type: "line", data: [150, 232, 201, 154, 190, 330, 410] },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="Stacked Area" description="Stacked area chart with gradient fill." code={`<EChart
  option={{
    xAxis: { type: "category", data: [...], boundaryGap: false },
    yAxis: { type: "value" },
    legend: {},
    series: [
      { name: "A", type: "line", stack: "total", areaStyle: {}, data: [...] },
      { name: "B", type: "line", stack: "total", areaStyle: {}, data: [...] },
    ],
  }}
/>`}>
        <EChart
          option={{
            xAxis: { type: "category", data: months, boundaryGap: false },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            legend: {},
            series: [
              { name: "A", type: "line", stack: "total", areaStyle: {}, data: [120, 132, 101, 134, 90, 230, 210] },
              { name: "B", type: "line", stack: "total", areaStyle: {}, data: [220, 182, 191, 234, 290, 330, 310] },
              { name: "C", type: "line", stack: "total", areaStyle: {}, data: [150, 232, 201, 154, 190, 330, 410] },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
