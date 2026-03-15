import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

function generateScatterData(count: number, xRange: number, yRange: number): number[][] {
  return Array.from({ length: count }, () => [
    +(Math.random() * xRange).toFixed(2),
    +(Math.random() * yRange).toFixed(2),
  ]);
}

export function ScatterDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        Scatter Chart
      </h1>

      <DemoSection title="Basic Scatter" description="Simple scatter plot.">
        <EChart
          option={{
            xAxis: { type: "value" },
            yAxis: { type: "value" },
            tooltip: { trigger: "item" },
            series: [{ type: "scatter", data: generateScatterData(50, 100, 100) }],
          }}
        />
      </DemoSection>

      <DemoSection title="Multi-Series" description="Scatter with multiple groups.">
        <EChart
          option={{
            xAxis: { type: "value" },
            yAxis: { type: "value" },
            tooltip: { trigger: "item" },
            legend: {},
            series: [
              { name: "Group A", type: "scatter", data: generateScatterData(30, 50, 80) },
              { name: "Group B", type: "scatter", data: generateScatterData(30, 100, 60).map(d => [d[0] + 30, d[1] + 20]) },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="Bubble Chart" description="Scatter with varying symbol sizes.">
        <EChart
          option={{
            xAxis: { type: "value" },
            yAxis: { type: "value" },
            tooltip: {
              trigger: "item",
              formatter: (params: any) => `${params.value[0]}, ${params.value[1]}<br/>Size: ${params.value[2]}`,
            },
            series: [
              {
                type: "scatter",
                symbolSize: (val: number[]) => val[2] * 2,
                data: Array.from({ length: 30 }, () => [
                  +(Math.random() * 100).toFixed(1),
                  +(Math.random() * 100).toFixed(1),
                  +(Math.random() * 20 + 5).toFixed(0),
                ]),
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
