import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const cities = [
  { name: "San Francisco", coord: [122, 38], value: 90 },
  { name: "New York", coord: [300, 40], value: 80 },
  { name: "London", coord: [480, 52], value: 60 },
  { name: "Tokyo", coord: [720, 36], value: 50 },
  { name: "Sydney", coord: [760, 80], value: 35 },
];

export function EffectScatterDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        Effect Scatter Chart
      </h1>

      <DemoSection
        title="Basic Effect Scatter"
        description="Scatter points with a rippling highlight animation — useful for emphasising hotspots."
        code={`<EChart
  option={{
    xAxis: { type: "value" },
    yAxis: { type: "value" },
    series: [{
      type: "effectScatter",
      symbolSize: 14,
      rippleEffect: { period: 3, scale: 3, brushType: "stroke" },
      data: [[10, 20], [30, 40], [50, 60], [70, 80]],
    }],
  }}
/>`}
      >
        <EChart
          option={{
            tooltip: { trigger: "item" },
            xAxis: { type: "value" },
            yAxis: { type: "value" },
            series: [
              {
                type: "effectScatter",
                symbolSize: 14,
                rippleEffect: { period: 3, scale: 3, brushType: "stroke" },
                data: [
                  [10, 20],
                  [30, 40],
                  [50, 60],
                  [70, 80],
                  [90, 50],
                ],
              },
            ],
          }}
        />
      </DemoSection>

      <DemoSection
        title="Highlighted Hotspots"
        description="Mix a regular scatter layer with an effectScatter layer to draw attention to specific points."
        code={`<EChart
  option={{
    xAxis: { type: "value" },
    yAxis: { type: "value" },
    series: [
      { type: "scatter", data: regularPoints, symbolSize: 8 },
      {
        type: "effectScatter",
        symbolSize: 20,
        rippleEffect: { period: 4, scale: 4, brushType: "fill" },
        data: hotspots,
      },
    ],
  }}
/>`}
      >
        <EChart
          option={{
            tooltip: { trigger: "item" },
            xAxis: { type: "value" },
            yAxis: { type: "value" },
            series: [
              {
                type: "scatter",
                symbolSize: 8,
                itemStyle: { color: "#94a3b8" },
                data: Array.from({ length: 40 }, () => [
                  +(Math.random() * 100).toFixed(1),
                  +(Math.random() * 100).toFixed(1),
                ]),
              },
              {
                type: "effectScatter",
                symbolSize: 20,
                rippleEffect: { period: 4, scale: 4, brushType: "fill" },
                itemStyle: { color: "#ef4444" },
                data: [
                  [25, 80],
                  [55, 45],
                  [85, 20],
                ],
              },
            ],
          }}
        />
      </DemoSection>

      <DemoSection
        title="With Labels"
        description="Label each rippling point with a name."
        code={`<EChart
  option={{
    xAxis: { type: "value" },
    yAxis: { type: "value" },
    series: [{
      type: "effectScatter",
      symbolSize: 16,
      label: {
        show: true,
        position: "right",
        formatter: "{b}",
      },
      data: [
        { name: "San Francisco", value: [122, 38] },
        { name: "New York", value: [300, 40] },
        { name: "London", value: [480, 52] },
        { name: "Tokyo", value: [720, 36] },
      ],
    }],
  }}
/>`}
      >
        <EChart
          option={{
            tooltip: { trigger: "item" },
            xAxis: { type: "value", max: 800 },
            yAxis: { type: "value", max: 100, inverse: true },
            series: [
              {
                type: "effectScatter",
                symbolSize: 16,
                rippleEffect: { period: 3, scale: 3, brushType: "stroke" },
                label: {
                  show: true,
                  position: "right",
                  formatter: "{b}",
                  color: "#64748b",
                },
                itemStyle: { color: "#3b82f6" },
                data: cities.map((c) => ({ name: c.name, value: c.coord })),
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
