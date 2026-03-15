import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const treemapData = [
  {
    name: "Technology",
    value: 100,
    children: [
      { name: "Frontend", value: 40, children: [{ name: "React", value: 25 }, { name: "Vue", value: 15 }] },
      { name: "Backend", value: 35, children: [{ name: "Node", value: 20 }, { name: "Python", value: 15 }] },
      { name: "DevOps", value: 25 },
    ],
  },
  {
    name: "Design",
    value: 60,
    children: [
      { name: "UI", value: 35 },
      { name: "UX", value: 25 },
    ],
  },
  { name: "Marketing", value: 40 },
];

export function TreemapDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Treemap</h1>

      <DemoSection title="Basic Treemap" description="Hierarchical data as nested rectangles." code={`<EChart
  option={{
    series: [{
      type: "treemap",
      data: [
        { name: "Technology", value: 100, children: [...] },
        { name: "Design", value: 60, children: [...] },
      ],
      label: { show: true, formatter: "{b}" },
      breadcrumb: { show: true },
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: {},
            series: [{
              type: "treemap",
              data: treemapData,
              label: { show: true, formatter: "{b}" },
              breadcrumb: { show: true },
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Styled Treemap" description="Treemap with custom colors and levels." code={`<EChart
  option={{
    series: [{
      type: "treemap",
      data: [...],
      levels: [
        { itemStyle: { borderColor: "#555", borderWidth: 4 } },
        { colorSaturation: [0.3, 0.6] },
      ],
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { formatter: "{b}: {c}" },
            series: [{
              type: "treemap",
              data: treemapData,
              levels: [
                { itemStyle: { borderColor: "#555", borderWidth: 4, gapWidth: 4 } },
                { colorSaturation: [0.3, 0.6], itemStyle: { borderColorSaturation: 0.7, gapWidth: 2, borderWidth: 2 } },
                { colorSaturation: [0.3, 0.5], itemStyle: { borderColorSaturation: 0.6, gapWidth: 1 } },
              ],
            }],
          }}
        />
      </DemoSection>
    </div>
  );
}
