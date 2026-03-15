import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

const dates = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07", "2024-08"];
// [open, close, low, high]
const stockData = [
  [20, 34, 10, 38],
  [40, 35, 30, 50],
  [31, 38, 33, 44],
  [38, 15, 5, 42],
  [15, 26, 10, 35],
  [26, 40, 22, 45],
  [40, 32, 28, 48],
  [32, 45, 30, 50],
];

export function CandlestickDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Candlestick Chart</h1>

      <DemoSection title="Basic Candlestick" description="OHLC candlestick chart for stock data.">
        <EChart
          option={{
            xAxis: { type: "category", data: dates },
            yAxis: { type: "value", min: 0 },
            tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
            series: [{ type: "candlestick", data: stockData }],
          }}
        />
      </DemoSection>

      <DemoSection title="With Volume" description="Candlestick with volume bars and data zoom.">
        <EChart
          option={{
            xAxis: { type: "category", data: dates },
            yAxis: [
              { type: "value", min: 0, position: "left" },
              { type: "value", position: "right", splitLine: { show: false } },
            ],
            tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
            dataZoom: [{ type: "inside", start: 0, end: 100 }],
            legend: {},
            series: [
              { name: "Price", type: "candlestick", data: stockData },
              {
                name: "Volume",
                type: "bar",
                yAxisIndex: 1,
                data: [1200, 800, 1500, 2000, 900, 1100, 1400, 1600],
                itemStyle: { color: "#91cc75", opacity: 0.5 },
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
