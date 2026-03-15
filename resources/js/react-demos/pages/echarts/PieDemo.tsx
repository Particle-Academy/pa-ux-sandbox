import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const browserData = [
  { value: 1048, name: "Chrome" },
  { value: 735, name: "Firefox" },
  { value: 580, name: "Safari" },
  { value: 484, name: "Edge" },
  { value: 300, name: "Other" },
];

export function PieDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        Pie Chart
      </h1>

      <DemoSection title="Basic Pie" description="Simple pie chart with labels." code={`<EChart
  option={{
    tooltip: { trigger: "item" },
    legend: { top: "bottom" },
    series: [{ type: "pie", radius: "60%", data: [...] }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item" },
            legend: { top: "bottom" },
            series: [{ type: "pie", radius: "60%", data: browserData }],
          }}
        />
      </DemoSection>

      <DemoSection title="Doughnut" description="Pie chart with inner radius (doughnut style)." code={`<EChart
  option={{
    tooltip: { trigger: "item" },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      data: [...],
      label: { show: true, formatter: "{b}: {d}%" },
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item" },
            legend: { top: "bottom" },
            series: [
              {
                type: "pie",
                radius: ["40%", "70%"],
                data: browserData,
                label: { show: true, formatter: "{b}: {d}%" },
              },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="Rose Chart" description="Nightingale rose chart with varying radius." code={`<EChart
  option={{
    tooltip: { trigger: "item" },
    series: [{
      type: "pie",
      radius: ["20%", "70%"],
      roseType: "area",
      data: [...],
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item" },
            legend: { top: "bottom" },
            series: [
              {
                type: "pie",
                radius: ["20%", "70%"],
                roseType: "area",
                data: browserData,
              },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="Nested Pie" description="Multi-ring nested pie chart." code={`<EChart
  option={{
    tooltip: { trigger: "item" },
    series: [
      { type: "pie", radius: [0, "30%"], data: [...] },
      { type: "pie", radius: ["45%", "65%"], data: [...] },
    ],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item" },
            series: [
              {
                type: "pie",
                radius: [0, "30%"],
                label: { position: "inner", fontSize: 12 },
                data: [
                  { value: 1548, name: "Desktop" },
                  { value: 1300, name: "Mobile" },
                ],
              },
              {
                type: "pie",
                radius: ["45%", "65%"],
                data: browserData,
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
