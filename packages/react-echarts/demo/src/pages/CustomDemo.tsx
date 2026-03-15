import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

export function CustomDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Custom Series</h1>

      <DemoSection title="Custom Rectangles" description="Custom series rendering rectangles with renderItem.">
        <EChart
          option={{
            xAxis: { type: "category", data: ["A", "B", "C", "D", "E"] },
            yAxis: { type: "value" },
            tooltip: {},
            series: [{
              type: "custom",
              renderItem: (_params: any, api: any) => {
                const xValue = api.value(0);
                const yValue = api.value(1);
                const point = api.coord([xValue, yValue]);
                const size = api.size([1, yValue]);
                return {
                  type: "rect",
                  shape: {
                    x: point[0] - size[0] / 4,
                    y: point[1],
                    width: size[0] / 2,
                    height: size[1],
                  },
                  style: {
                    ...api.style(),
                    fill: api.visual("color"),
                  },
                };
              },
              data: [[0, 50], [1, 80], [2, 60], [3, 90], [4, 70]],
              encode: { x: 0, y: 1 },
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Error Bars" description="Custom series for error bars on a line chart.">
        <EChart
          option={{
            xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [
              { type: "line", data: [120, 200, 150, 80, 100] },
              {
                type: "custom",
                renderItem: (_params: any, api: any) => {
                  const xValue = api.value(0);
                  const high = api.coord([xValue, api.value(1)]);
                  const low = api.coord([xValue, api.value(2)]);
                  const halfWidth = 6;
                  return {
                    type: "group",
                    children: [
                      { type: "line", shape: { x1: high[0], y1: high[1], x2: low[0], y2: low[1] }, style: { stroke: "#333", lineWidth: 1.5 } },
                      { type: "line", shape: { x1: high[0] - halfWidth, y1: high[1], x2: high[0] + halfWidth, y2: high[1] }, style: { stroke: "#333", lineWidth: 1.5 } },
                      { type: "line", shape: { x1: low[0] - halfWidth, y1: low[1], x2: low[0] + halfWidth, y2: low[1] }, style: { stroke: "#333", lineWidth: 1.5 } },
                    ],
                  };
                },
                data: [[0, 140, 100], [1, 230, 170], [2, 180, 120], [3, 100, 60], [4, 130, 70]],
                encode: { x: 0, y: [1, 2] },
                z: 100,
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
