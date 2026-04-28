import React from "react";
import { EChart } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

const indicators = [
  { name: "Sales", max: 6500 },
  { name: "Admin", max: 16000 },
  { name: "IT", max: 30000 },
  { name: "Support", max: 38000 },
  { name: "Dev", max: 52000 },
  { name: "Marketing", max: 25000 },
];

export function RadarDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Radar Chart</h1>

      <DemoSection title="Basic Radar" description="Single-series radar chart." code={`<EChart
  option={{
    radar: { indicator: [{ name: "Sales", max: 6500 }, ...] },
    series: [{
      type: "radar",
      data: [{ value: [4200, 3000, ...], name: "Budget" }],
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: {},
            radar: { indicator: indicators },
            series: [{
              type: "radar",
              data: [{ value: [4200, 3000, 20000, 35000, 50000, 18000], name: "Budget" }],
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Multi-Series Radar" description="Comparing two data series on a radar." code={`<EChart
  option={{
    legend: {},
    radar: { indicator: [...] },
    series: [{
      type: "radar",
      data: [
        { value: [...], name: "Budget" },
        { value: [...], name: "Spending" },
      ],
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: {},
            legend: {},
            radar: { indicator: indicators },
            series: [{
              type: "radar",
              data: [
                { value: [4200, 3000, 20000, 35000, 50000, 18000], name: "Budget" },
                { value: [5000, 14000, 28000, 26000, 42000, 21000], name: "Spending" },
              ],
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Filled Radar" description="Radar with area fill and custom colors." code={`<EChart
  option={{
    radar: { indicator: [...], shape: "circle" },
    series: [{
      type: "radar",
      areaStyle: { opacity: 0.3 },
      data: [
        { value: [...], name: "Allocated" },
        { value: [...], name: "Actual" },
      ],
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: {},
            radar: { indicator: indicators, shape: "circle" },
            series: [{
              type: "radar",
              areaStyle: { opacity: 0.3 },
              data: [
                { value: [4200, 3000, 20000, 35000, 50000, 18000], name: "Allocated" },
                { value: [5000, 14000, 28000, 26000, 42000, 21000], name: "Actual" },
              ],
            }],
          }}
        />
      </DemoSection>
    </div>
  );
}
