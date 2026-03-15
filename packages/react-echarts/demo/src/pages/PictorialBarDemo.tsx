import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

const categories = ["January", "February", "March", "April", "May"];
const values = [120, 200, 150, 80, 70];

export function PictorialBarDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Pictorial Bar</h1>

      <DemoSection title="Basic Pictorial Bar" description="Bar chart with symbolic shapes.">
        <EChart
          option={{
            xAxis: { type: "category", data: categories },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [{
              type: "pictorialBar",
              data: values,
              symbol: "diamond",
              symbolSize: ["80%", 30],
              symbolRepeat: true,
              symbolMargin: 2,
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Rounded Pictorial Bar" description="Pictorial bars with round caps.">
        <EChart
          option={{
            xAxis: { type: "category", data: categories },
            yAxis: { type: "value" },
            tooltip: { trigger: "axis" },
            series: [{
              type: "pictorialBar",
              data: values.map((v, i) => ({
                value: v,
                itemStyle: {
                  color: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"][i],
                },
              })),
              symbol: "roundRect",
              barWidth: 30,
              symbolClip: true,
              symbolRepeat: true,
              symbolSize: [30, 8],
              symbolMargin: 2,
            }],
          }}
        />
      </DemoSection>
    </div>
  );
}
