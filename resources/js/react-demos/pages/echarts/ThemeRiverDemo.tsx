import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

const themeRiverData: [string, number, string][] = [
  ["2015/01", 10, "DL"], ["2015/01", 15, "ML"], ["2015/01", 20, "Stats"],
  ["2015/04", 25, "DL"], ["2015/04", 18, "ML"], ["2015/04", 22, "Stats"],
  ["2015/07", 40, "DL"], ["2015/07", 20, "ML"], ["2015/07", 18, "Stats"],
  ["2015/10", 55, "DL"], ["2015/10", 22, "ML"], ["2015/10", 16, "Stats"],
  ["2016/01", 70, "DL"], ["2016/01", 25, "ML"], ["2016/01", 15, "Stats"],
  ["2016/04", 85, "DL"], ["2016/04", 30, "ML"], ["2016/04", 14, "Stats"],
  ["2016/07", 100, "DL"], ["2016/07", 35, "ML"], ["2016/07", 13, "Stats"],
  ["2016/10", 90, "DL"], ["2016/10", 40, "ML"], ["2016/10", 12, "Stats"],
];

export function ThemeRiverDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Theme River</h1>

      <DemoSection title="Basic Theme River" description="Streamgraph showing topic trends over time." code={`<EChart
  option={{
    tooltip: { trigger: "axis" },
    legend: {},
    singleAxis: { type: "time", bottom: 30 },
    series: [{
      type: "themeRiver",
      data: [
        ["2015/01", 10, "DL"],
        ["2015/01", 15, "ML"],
        ...
      ],
      emphasis: { focus: "self" },
    }],
  }}
  style={{ height: 400 }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "axis" },
            legend: {},
            singleAxis: { type: "time", bottom: 30 },
            series: [{
              type: "themeRiver",
              data: themeRiverData,
              emphasis: { focus: "self" },
              label: { show: false },
            }],
          }}
          style={{ height: 400 }}
        />
      </DemoSection>

      <DemoSection title="Styled Theme River" description="Theme river with custom colors." code={`<EChart
  option={{
    color: ["#5470c6", "#91cc75", "#fac858"],
    singleAxis: { type: "time", bottom: 30 },
    series: [{
      type: "themeRiver",
      data: [...],
      emphasis: { focus: "self" },
    }],
  }}
  style={{ height: 400 }}
/>`}>
        <EChart
          option={{
            color: ["#5470c6", "#91cc75", "#fac858"],
            tooltip: { trigger: "axis" },
            legend: {},
            singleAxis: { type: "time", bottom: 30 },
            series: [{
              type: "themeRiver",
              data: themeRiverData,
              emphasis: { focus: "self" },
            }],
          }}
          style={{ height: 400 }}
        />
      </DemoSection>
    </div>
  );
}
