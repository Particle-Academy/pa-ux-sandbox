import React from "react";
import { EChart } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

export function GraphicDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Graphic Layer</h1>

      <DemoSection title="Basic Shapes" description="Drawing shapes with the ECharts graphic layer." code={`<EChart
  option={{
    graphic: {
      elements: [{
        type: "group", left: "center", top: "center",
        children: [
          { type: "rect", shape: { width: 200, height: 80, r: 10 },
            style: { fill: "#5470c6" } },
          { type: "text", style: { text: "Hello", fill: "#fff",
            textAlign: "center", textVerticalAlign: "middle" } },
        ],
      }],
    },
  }}
/>`}>
        <EChart
          option={{
            graphic: {
              elements: [
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
              ],
            },
          }}
        />
      </DemoSection>

      <DemoSection title="Circles & Text" description="Composing circles and text labels." code={`<EChart
  option={{
    graphic: {
      elements: [
        { type: "circle", shape: { cx: 150, cy: 150, r: 60 },
          style: { fill: "#91cc75", opacity: 0.8 } },
        { type: "text", style: { text: "Label", fill: "#666" } },
      ],
    },
  }}
/>`}>
        <EChart
          option={{
            graphic: {
              elements: [
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
              ],
            },
          }}
          style={{ height: 350 }}
        />
      </DemoSection>

      <DemoSection title="Stroke Animation" description="Animated stroke drawing using keyframeAnimation with lineDash." code={`<EChart
  option={{
    graphic: {
      elements: [{
        type: "circle",
        shape: { cx: 200, cy: 120, r: 60 },
        style: { fill: "none", stroke: "#5470c6",
          lineWidth: 3, lineDash: [377], lineDashOffset: 377 },
        keyframeAnimation: {
          duration: 2000, loop: true,
          keyframes: [
            { percent: 0.5, style: { lineDashOffset: 0 } },
            { percent: 1, style: { lineDashOffset: -377 } },
          ],
        },
      }],
    },
  }}
/>`}>
        <EChart
          option={{
            graphic: {
              elements: [
                {
                  type: "circle",
                  shape: { cx: 120, cy: 120, r: 60 },
                  style: {
                    fill: "none",
                    stroke: "#5470c6",
                    lineWidth: 3,
                    lineDash: [377],
                    lineDashOffset: 377,
                  },
                  keyframeAnimation: {
                    duration: 2000,
                    loop: true,
                    keyframes: [
                      { percent: 0.5, style: { lineDashOffset: 0 }, easing: "cubicOut" },
                      { percent: 1, style: { lineDashOffset: -377 }, easing: "cubicOut" },
                    ],
                  },
                },
                {
                  type: "polygon",
                  shape: {
                    points: [
                      [370, 60],
                      [310, 180],
                      [430, 180],
                    ],
                  },
                  style: {
                    fill: "none",
                    stroke: "#91cc75",
                    lineWidth: 3,
                    lineDash: [360],
                    lineDashOffset: 360,
                  },
                  keyframeAnimation: {
                    duration: 2500,
                    delay: 300,
                    loop: true,
                    keyframes: [
                      { percent: 0.5, style: { lineDashOffset: 0 }, easing: "cubicOut" },
                      { percent: 1, style: { lineDashOffset: -360 }, easing: "cubicOut" },
                    ],
                  },
                },
                {
                  type: "rect",
                  shape: { x: 530, y: 60, width: 120, height: 120 },
                  style: {
                    fill: "none",
                    stroke: "#fac858",
                    lineWidth: 3,
                    lineDash: [480],
                    lineDashOffset: 480,
                  },
                  keyframeAnimation: {
                    duration: 2000,
                    delay: 600,
                    loop: true,
                    keyframes: [
                      { percent: 0.5, style: { lineDashOffset: 0 }, easing: "cubicOut" },
                      { percent: 1, style: { lineDashOffset: -480 }, easing: "cubicOut" },
                    ],
                  },
                },
                {
                  type: "polyline",
                  shape: {
                    points: [
                      [780, 65], [795, 110], [840, 110], [803, 137], [816, 180],
                      [780, 155], [744, 180], [757, 137], [720, 110], [765, 110], [780, 65],
                    ],
                  },
                  style: {
                    fill: "none",
                    stroke: "#ee6666",
                    lineWidth: 3,
                    lineDash: [400],
                    lineDashOffset: 400,
                  },
                  keyframeAnimation: {
                    duration: 2500,
                    delay: 900,
                    loop: true,
                    keyframes: [
                      { percent: 0.5, style: { lineDashOffset: 0 }, easing: "cubicOut" },
                      { percent: 1, style: { lineDashOffset: -400 }, easing: "cubicOut" },
                    ],
                  },
                },
                // Labels
                {
                  type: "text",
                  left: 90,
                  top: 200,
                  style: { text: "Circle", fill: "#5470c6", fontSize: 12 },
                },
                {
                  type: "text",
                  left: 345,
                  top: 200,
                  style: { text: "Triangle", fill: "#91cc75", fontSize: 12 },
                },
                {
                  type: "text",
                  left: 560,
                  top: 200,
                  style: { text: "Square", fill: "#fac858", fontSize: 12 },
                },
                {
                  type: "text",
                  left: 762,
                  top: 200,
                  style: { text: "Star", fill: "#ee6666", fontSize: 12 },
                },
              ],
            },
          }}
          style={{ height: 260 }}
        />
      </DemoSection>

      <DemoSection title="Interactive Graphic" description="Click the shapes — messages appear below." code={`<EChart
  option={{
    graphic: {
      elements: [{
        type: "rect",
        shape: { width: 120, height: 50 },
        style: { fill: "#5470c6", text: "Click Me" },
        onclick: () => { /* handle click */ },
      }],
    },
  }}
  onEvents={{ click: (params) => console.log(params) }}
/>`}>
        <InteractiveGraphicDemo />
      </DemoSection>
    </div>
  );
}

function InteractiveGraphicDemo() {
  const [message, setMessage] = React.useState("Click a shape above...");

  return (
    <div>
      <EChart
        option={{
          graphic: {
            elements: [
              {
                type: "rect",
                left: 50,
                top: 30,
                shape: { width: 140, height: 50, r: 8 },
                style: { fill: "#5470c6", text: "Click Me", fontSize: 14, textFill: "#fff" },
                cursor: "pointer",
                onclick: () => setMessage("Rectangle clicked!"),
              },
              {
                type: "circle",
                left: 280,
                top: 55,
                shape: { r: 30 },
                style: { fill: "#91cc75" },
                cursor: "pointer",
                onclick: () => setMessage("Green circle clicked!"),
              },
              {
                type: "circle",
                left: 400,
                top: 55,
                shape: { r: 30 },
                style: { fill: "#ee6666" },
                cursor: "pointer",
                onclick: () => setMessage("Red circle clicked!"),
              },
              {
                type: "rect",
                left: 500,
                top: 30,
                shape: { width: 140, height: 50, r: 25 },
                style: { fill: "#fac858", text: "Pill Button", fontSize: 14, textFill: "#333" },
                cursor: "pointer",
                onclick: () => setMessage("Pill button clicked!"),
              },
            ],
          },
        }}
        style={{ height: 120 }}
      />
      <p style={{ padding: "8px 16px", fontSize: 14, color: "#6b7280" }}>{message}</p>
    </div>
  );
}
