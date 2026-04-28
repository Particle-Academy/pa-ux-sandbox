import React from "react";
import { EChart } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

// [min, Q1, median, Q3, max]
const boxData = [
  [655, 850, 940, 980, 1070],
  [760, 800, 845, 885, 960],
  [780, 840, 855, 880, 940],
  [720, 767.5, 815, 865, 920],
  [740, 807.5, 810, 870, 950],
];

export function BoxplotDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Boxplot</h1>

      <DemoSection title="Basic Boxplot" description="Statistical box-and-whisker plot." code={`<EChart
  option={{
    xAxis: { type: "category", data: ["A", "B", ...] },
    yAxis: { type: "value" },
    series: [{
      type: "boxplot",
      // [min, Q1, median, Q3, max]
      data: [[655, 850, 940, 980, 1070], ...],
    }],
  }}
/>`}>
        <EChart
          option={{
            xAxis: { type: "category", data: ["A", "B", "C", "D", "E"] },
            yAxis: { type: "value" },
            tooltip: { trigger: "item" },
            series: [{ type: "boxplot", data: boxData }],
          }}
        />
      </DemoSection>

      <DemoSection title="Horizontal Boxplot" description="Horizontal orientation with outliers." code={`<EChart
  option={{
    yAxis: { type: "category", data: [...] },
    xAxis: { type: "value" },
    series: [
      { type: "boxplot", data: [...] },
      { type: "scatter", data: [[1100, 0], ...] },
    ],
  }}
/>`}>
        <EChart
          option={{
            yAxis: { type: "category", data: ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"] },
            xAxis: { type: "value" },
            tooltip: { trigger: "item" },
            series: [
              { type: "boxplot", data: boxData },
              {
                type: "scatter",
                data: [[1100, 0], [600, 1], [1000, 3]],
                itemStyle: { color: "#ee6666" },
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
