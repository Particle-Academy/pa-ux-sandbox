import React from "react";
import { EChart } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

const parallelData = [
  [1, 34, 5, 80, 1.5],
  [2, 56, 8, 65, 2.3],
  [3, 78, 3, 90, 0.8],
  [4, 45, 7, 72, 1.9],
  [5, 23, 9, 55, 3.1],
  [6, 67, 4, 85, 1.2],
  [7, 89, 6, 60, 2.7],
  [8, 12, 2, 95, 0.5],
];

export function ParallelDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Parallel Coordinates</h1>

      <DemoSection title="Basic Parallel" description="Multi-dimensional data visualization." code={`<EChart
  option={{
    parallelAxis: [
      { dim: 0, name: "Index" },
      { dim: 1, name: "Score A" },
      { dim: 2, name: "Score B" },
      ...
    ],
    series: [{
      type: "parallel",
      lineStyle: { width: 2, opacity: 0.6 },
      data: [[1, 34, 5, 80, 1.5], ...],
    }],
  }}
/>`}>
        <EChart
          option={{
            parallelAxis: [
              { dim: 0, name: "Index" },
              { dim: 1, name: "Score A" },
              { dim: 2, name: "Score B" },
              { dim: 3, name: "Score C" },
              { dim: 4, name: "Ratio" },
            ],
            parallel: { left: "5%", right: "13%", bottom: "10%", top: "20%" },
            series: [{
              type: "parallel",
              lineStyle: { width: 2, opacity: 0.6 },
              data: parallelData,
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Interactive Parallel" description="Parallel coordinates with axis brush filtering." code={`<EChart
  option={{
    parallelAxis: [
      { dim: 0, name: "Index", type: "value" },
      ...
    ],
    parallel: {
      parallelAxisDefault: {
        areaSelectStyle: { width: 20 },
      },
    },
    series: [{
      type: "parallel",
      data: [...],
      smooth: true,
    }],
  }}
/>`}>
        <EChart
          option={{
            parallelAxis: [
              { dim: 0, name: "Index", type: "value" },
              { dim: 1, name: "Score A", type: "value" },
              { dim: 2, name: "Score B", type: "value" },
              { dim: 3, name: "Score C", type: "value" },
              { dim: 4, name: "Ratio", type: "value" },
            ],
            parallel: {
              left: "5%",
              right: "13%",
              parallelAxisDefault: {
                type: "value",
                nameLocation: "end",
                nameTextStyle: { fontSize: 12 },
                areaSelectStyle: { width: 20 },
              },
            },
            series: [{
              type: "parallel",
              lineStyle: { width: 1.5, opacity: 0.5 },
              data: parallelData,
              smooth: true,
            }],
          }}
        />
      </DemoSection>
    </div>
  );
}
