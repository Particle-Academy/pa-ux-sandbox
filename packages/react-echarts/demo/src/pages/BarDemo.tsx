import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BarDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        Bar Chart
      </h1>

      <DemoSection title="Basic Bar" description="Simple vertical bar chart.">
        <EChart
          option={{
            xAxis: { type: "category", data: days },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [{ type: "bar", data: [120, 200, 150, 80, 70, 110, 130] }],
          }}
        />
      </DemoSection>

      <DemoSection title="Horizontal Bar" description="Horizontal bar chart with inverted axes.">
        <EChart
          option={{
            yAxis: { type: "category", data: ["Brazil", "Indonesia", "USA", "India", "China"] },
            xAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [{ type: "bar", data: [18203, 23489, 29034, 104970, 131744] }],
          }}
        />
      </DemoSection>

      <DemoSection title="Stacked Bar" description="Stacked bar chart with multiple series.">
        <EChart
          option={{
            xAxis: { type: "category", data: days },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            legend: {},
            series: [
              { name: "Direct", type: "bar", stack: "total", data: [320, 302, 301, 334, 390, 330, 320] },
              { name: "Email", type: "bar", stack: "total", data: [120, 132, 101, 134, 90, 230, 210] },
              { name: "Ads", type: "bar", stack: "total", data: [220, 182, 191, 234, 290, 330, 310] },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="With DataZoom" description="Bar chart with interactive data zoom slider.">
        <EChart
          option={{
            xAxis: { type: "category", data: Array.from({ length: 40 }, (_, i) => `Item ${i + 1}`) },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            dataZoom: [{ type: "slider", start: 0, end: 50 }],
            series: [{ type: "bar", data: Array.from({ length: 40 }, () => Math.round(Math.random() * 200 + 50)) }],
          }}
        />
      </DemoSection>
    </div>
  );
}
