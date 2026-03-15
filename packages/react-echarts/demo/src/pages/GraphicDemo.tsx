import React from "react";
import { EChartGraphic } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

export function GraphicDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Graphic Layer</h1>

      <DemoSection title="Basic Shapes" description="Drawing shapes with the ECharts graphic layer.">
        <EChartGraphic
          elements={[
            {
              type: "group",
              left: "center",
              top: "center",
              children: [
                {
                  type: "rect",
                  shape: { x: -100, y: -40, width: 200, height: 80, r: 10 },
                  style: { fill: "#5470c6", stroke: "#333", lineWidth: 2 },
                },
                {
                  type: "text",
                  style: {
                    text: "ECharts Graphic",
                    x: 0,
                    y: 0,
                    fill: "#fff",
                    fontSize: 18,
                    fontWeight: "bold",
                    textAlign: "center",
                    textVerticalAlign: "middle",
                  },
                },
              ],
            },
          ]}
        />
      </DemoSection>

      <DemoSection title="Circles & Text" description="Composing circles and text labels.">
        <EChartGraphic
          elements={[
            {
              type: "circle",
              shape: { cx: 150, cy: 150, r: 60 },
              style: { fill: "#91cc75", opacity: 0.8 },
            },
            {
              type: "circle",
              shape: { cx: 250, cy: 180, r: 45 },
              style: { fill: "#fac858", opacity: 0.8 },
            },
            {
              type: "circle",
              shape: { cx: 200, cy: 100, r: 35 },
              style: { fill: "#ee6666", opacity: 0.8 },
            },
            {
              type: "text",
              left: "center",
              bottom: 30,
              style: {
                text: "Overlapping circles with transparency",
                fill: "#666",
                fontSize: 14,
              },
            },
          ]}
          style={{ height: 350 }}
        />
      </DemoSection>

      <DemoSection title="Interactive Graphic" description="Graphics with event handlers (check console on click).">
        <EChartGraphic
          elements={[
            {
              type: "rect",
              left: 50,
              top: 50,
              shape: { width: 120, height: 50, r: 8 },
              style: { fill: "#5470c6", text: "Click Me", fontSize: 14, textFill: "#fff" },
              onclick: () => console.log("Rectangle clicked!"),
            },
            {
              type: "circle",
              left: 250,
              top: 50,
              shape: { r: 30 },
              style: { fill: "#ee6666" },
              onclick: () => console.log("Circle clicked!"),
            },
            {
              type: "text",
              left: 50,
              top: 140,
              style: { text: "Click shapes above and check the console", fill: "#999", fontSize: 13 },
            },
          ]}
          style={{ height: 250 }}
        />
      </DemoSection>
    </div>
  );
}
