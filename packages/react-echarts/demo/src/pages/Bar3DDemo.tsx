import React from "react";
import { EChart3D } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

function generate3DBarData(): number[][] {
  const data: number[][] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      data.push([i, j, Math.round(Math.random() * 20 + 5)]);
    }
  }
  return data;
}

export function Bar3DDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Bar 3D</h1>

      <DemoSection title="Basic 3D Bar" description="3D bar chart with grid.">
        <EChart3D
          option={{
            tooltip: {},
            xAxis3D: { type: "category", data: ["A", "B", "C", "D", "E"] },
            yAxis3D: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
            zAxis3D: { type: "value" },
            grid3D: { boxWidth: 100, boxDepth: 80, viewControl: { distance: 200 } },
            series: [{
              type: "bar3D",
              data: generate3DBarData().map((d) => ({
                value: d,
                itemStyle: { opacity: 0.8 },
              })),
              shading: "lambert",
              label: { show: false },
            }],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>

      <DemoSection title="Styled 3D Bar" description="3D bar with custom colors and lighting.">
        <EChart3D
          option={{
            tooltip: {},
            xAxis3D: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
            yAxis3D: { type: "category", data: ["2022", "2023", "2024"] },
            zAxis3D: { type: "value" },
            grid3D: { boxWidth: 120, boxDepth: 60, light: { main: { intensity: 1.2, shadow: true } } },
            visualMap: { min: 0, max: 30, inRange: { color: ["#313695", "#74add1", "#fee090", "#f46d43", "#a50026"] } },
            series: [{
              type: "bar3D",
              data: Array.from({ length: 12 }, (_, i) => [i % 4, Math.floor(i / 4), Math.round(Math.random() * 25 + 5)]),
              shading: "realistic",
              bevelSize: 1,
            }],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
