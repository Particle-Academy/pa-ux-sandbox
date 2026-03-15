import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

export function GaugeDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Gauge Chart</h1>

      <DemoSection title="Basic Gauge" description="Simple speed gauge.">
        <EChart
          option={{
            tooltip: { formatter: "{b}: {c}%" },
            series: [{
              type: "gauge",
              data: [{ value: 72, name: "Performance" }],
              detail: { formatter: "{value}%" },
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Multi-Gauge" description="Multiple gauges showing different metrics.">
        <EChart
          option={{
            series: [
              {
                type: "gauge",
                center: ["25%", "55%"],
                radius: "60%",
                min: 0,
                max: 100,
                data: [{ value: 85, name: "CPU" }],
                detail: { formatter: "{value}%", fontSize: 14 },
                title: { fontSize: 12 },
              },
              {
                type: "gauge",
                center: ["75%", "55%"],
                radius: "60%",
                min: 0,
                max: 100,
                data: [{ value: 42, name: "Memory" }],
                detail: { formatter: "{value}%", fontSize: 14 },
                title: { fontSize: 12 },
                itemStyle: { color: "#91cc75" },
              },
            ],
          }}
        />
      </DemoSection>

      <DemoSection title="Gradient Gauge" description="Gauge with color gradient segments.">
        <EChart
          option={{
            series: [{
              type: "gauge",
              axisLine: {
                lineStyle: {
                  width: 20,
                  color: [[0.3, "#67e0e3"], [0.7, "#37a2da"], [1, "#fd666d"]],
                },
              },
              pointer: { itemStyle: { color: "auto" } },
              data: [{ value: 65, name: "Score" }],
              detail: { formatter: "{value}", fontSize: 20 },
            }],
          }}
        />
      </DemoSection>
    </div>
  );
}
