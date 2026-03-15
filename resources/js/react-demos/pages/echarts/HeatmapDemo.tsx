import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const days = ["Sat", "Fri", "Thu", "Wed", "Tue", "Mon", "Sun"];

function generateHeatmapData(): number[][] {
  const data: number[][] = [];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 24; j++) {
      data.push([j, i, Math.round(Math.random() * 10)]);
    }
  }
  return data;
}

export function HeatmapDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Heatmap</h1>

      <DemoSection title="Basic Heatmap" description="Activity heatmap showing hours vs days." code={`<EChart
  option={{
    xAxis: { type: "category", data: ["0:00", "1:00", ...] },
    yAxis: { type: "category", data: ["Mon", "Tue", ...] },
    visualMap: { min: 0, max: 10, calculable: true },
    series: [{
      type: "heatmap",
      data: [[x, y, value], ...],
      label: { show: true },
    }],
  }}
  style={{ height: 350 }}
/>`}>
        <EChart
          option={{
            tooltip: { position: "top" },
            xAxis: { type: "category", data: hours, splitArea: { show: true } },
            yAxis: { type: "category", data: days, splitArea: { show: true } },
            visualMap: { min: 0, max: 10, calculable: true, orient: "horizontal", left: "center", bottom: 0 },
            series: [{
              type: "heatmap",
              data: generateHeatmapData(),
              label: { show: true },
              emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.5)" } },
            }],
          }}
          style={{ height: 350 }}
        />
      </DemoSection>

      <DemoSection title="Large Heatmap" description="Heatmap with more data points and gradient colors." code={`<EChart
  option={{
    xAxis: { type: "category", data: [...] },
    yAxis: { type: "category", data: [...] },
    visualMap: {
      min: 0, max: 10,
      inRange: { color: ["#313695", "#fee090", "#d73027"] },
    },
    series: [{ type: "heatmap", data: [...] }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { position: "top" },
            xAxis: { type: "category", data: hours },
            yAxis: { type: "category", data: days },
            visualMap: {
              min: 0,
              max: 10,
              inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#fee090", "#fdae61", "#f46d43", "#d73027"] },
              orient: "horizontal",
              left: "center",
              bottom: 0,
            },
            series: [{
              type: "heatmap",
              data: generateHeatmapData(),
              emphasis: { itemStyle: { shadowBlur: 10 } },
            }],
          }}
          style={{ height: 350 }}
        />
      </DemoSection>
    </div>
  );
}
