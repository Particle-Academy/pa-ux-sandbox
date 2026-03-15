import React from "react";
import { EChart3D } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

export function SurfaceDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Surface Chart</h1>

      <DemoSection title="Mathematical Surface" description="3D surface plot of a mathematical function." code={`<EChart3D
  option={{
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    grid3D: { viewControl: { autoRotate: true } },
    series: [{
      type: "surface",
      parametric: true,
      wireframe: { show: true },
      parametricEquation: {
        u: { min: -Math.PI, max: Math.PI, step: Math.PI / 20 },
        v: { min: -Math.PI, max: Math.PI, step: Math.PI / 20 },
        x: (u, v) => Math.sin(u) * Math.cos(v),
        y: (u, v) => Math.sin(u) * Math.sin(v),
        z: (u) => Math.cos(u),
      },
    }],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart3D
          option={{
            tooltip: {},
            xAxis3D: { type: "value", min: -3, max: 3 },
            yAxis3D: { type: "value", min: -3, max: 3 },
            zAxis3D: { type: "value" },
            grid3D: { viewControl: { autoRotate: true, autoRotateSpeed: 5 } },
            visualMap: { show: false, min: -1, max: 1, inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#fee090", "#fdae61", "#f46d43", "#d73027"] } },
            series: [{
              type: "surface",
              parametric: true,
              wireframe: { show: true },
              parametricEquation: {
                u: { min: -Math.PI, max: Math.PI, step: Math.PI / 20 },
                v: { min: -Math.PI, max: Math.PI, step: Math.PI / 20 },
                x: (u: number, v: number) => Math.sin(u) * Math.cos(v),
                y: (u: number, v: number) => Math.sin(u) * Math.sin(v),
                z: (u: number, _v: number) => Math.cos(u),
              },
            }],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>

      <DemoSection title="Wavy Surface" description="Surface with wave-like pattern." code={`<EChart3D
  option={{
    xAxis3D: { type: "value" },
    yAxis3D: { type: "value" },
    zAxis3D: { type: "value" },
    series: [{
      type: "surface",
      equation: {
        x: { min: -3, max: 3, step: 0.1 },
        y: { min: -3, max: 3, step: 0.1 },
        z: (x, y) => Math.sin(x * x + y * y),
      },
      shading: "realistic",
    }],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart3D
          option={{
            tooltip: {},
            xAxis3D: { type: "value" },
            yAxis3D: { type: "value" },
            zAxis3D: { type: "value" },
            grid3D: { viewControl: { distance: 200 } },
            visualMap: { show: false, min: -1, max: 1, inRange: { color: ["#006edd", "#e0ffff"] } },
            series: [{
              type: "surface",
              equation: {
                x: { min: -3, max: 3, step: 0.1 },
                y: { min: -3, max: 3, step: 0.1 },
                z: (x: number, y: number) => Math.sin(x * x + y * y) * Math.exp(-0.1 * (x * x + y * y)),
              },
              wireframe: { show: false },
              shading: "realistic",
            }],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
