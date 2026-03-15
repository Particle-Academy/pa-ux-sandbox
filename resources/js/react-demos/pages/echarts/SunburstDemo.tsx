import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const sunburstData = [
  {
    name: "Frontend",
    children: [
      { name: "React", value: 25, children: [{ name: "Next.js", value: 12 }, { name: "Remix", value: 8 }] },
      { name: "Vue", value: 15, children: [{ name: "Nuxt", value: 10 }] },
      { name: "Angular", value: 10 },
    ],
  },
  {
    name: "Backend",
    children: [
      { name: "Node", value: 20 },
      { name: "Python", value: 18 },
      { name: "Go", value: 12 },
    ],
  },
  {
    name: "Mobile",
    children: [
      { name: "React Native", value: 15 },
      { name: "Flutter", value: 12 },
    ],
  },
];

export function SunburstDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Sunburst</h1>

      <DemoSection title="Basic Sunburst" description="Hierarchical data displayed as concentric rings." code={`<EChart
  option={{
    series: [{
      type: "sunburst",
      data: [
        { name: "Frontend", children: [
          { name: "React", value: 25 }, ...
        ] },
        { name: "Backend", children: [...] },
      ],
      radius: [0, "90%"],
      label: { rotate: "radial" },
    }],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart
          option={{
            tooltip: {},
            series: [{
              type: "sunburst",
              data: sunburstData,
              radius: [0, "90%"],
              label: { rotate: "radial" },
            }],
          }}
          style={{ height: 500 }}
        />
      </DemoSection>

      <DemoSection title="Styled Sunburst" description="Sunburst with rounded corners and emphasis." code={`<EChart
  option={{
    series: [{
      type: "sunburst",
      data: [...],
      radius: ["15%", "90%"],
      itemStyle: { borderRadius: 4, borderWidth: 2 },
      emphasis: { focus: "ancestor" },
    }],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart
          option={{
            tooltip: {},
            series: [{
              type: "sunburst",
              data: sunburstData,
              radius: ["15%", "90%"],
              label: { rotate: "radial", fontSize: 11 },
              itemStyle: { borderRadius: 4, borderWidth: 2 },
              emphasis: { focus: "ancestor" },
            }],
          }}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
