import React from "react";
import { EChart3D } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

function generateScatter3DData(count: number): number[][] {
  return Array.from({ length: count }, () => [
    +(Math.random() * 100).toFixed(1),
    +(Math.random() * 100).toFixed(1),
    +(Math.random() * 100).toFixed(1),
  ]);
}

export function Scatter3DDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Scatter 3D</h1>

      <DemoSection title="Basic 3D Scatter" description="3D scatter plot with rotation." code={`<EChart3D
  option={{
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    grid3D: { viewControl: { autoRotate: true } },
    series: [{
      type: "scatter3D",
      data: [[x, y, z], ...],
      symbolSize: 5,
    }],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart3D
          option={{
            tooltip: {},
            xAxis3D: { type: "value" },
            yAxis3D: { type: "value" },
            zAxis3D: { type: "value" },
            grid3D: { viewControl: { autoRotate: true } },
            series: [{
              type: "scatter3D",
              data: generateScatter3DData(200),
              symbolSize: 5,
              itemStyle: { opacity: 0.8 },
            }],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>

      <DemoSection title="Multi-Group Scatter" description="3D scatter with multiple colored groups." code={`<EChart3D
  option={{
    legend: {},
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    series: [
      { name: "Group A", type: "scatter3D", data: [...] },
      { name: "Group B", type: "scatter3D", data: [...] },
    ],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart3D
          option={{
            tooltip: {},
            legend: {},
            xAxis3D: { type: "value" },
            yAxis3D: { type: "value" },
            zAxis3D: { type: "value" },
            grid3D: { viewControl: { distance: 200 } },
            series: [
              { name: "Group A", type: "scatter3D", data: generateScatter3DData(80), symbolSize: 6 },
              { name: "Group B", type: "scatter3D", data: generateScatter3DData(80).map(d => [d[0] + 30, d[1] + 30, d[2]]), symbolSize: 6 },
            ],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
