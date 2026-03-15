import React from "react";
import { EChart3D } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

export function GlobeDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Globe</h1>

      <DemoSection title="Basic Globe" description="3D globe with atmosphere effect. Requires echarts-gl." code={`<EChart3D
  option={{
    globe: {
      baseColor: "#1a3b5c",
      shading: "color",
      atmosphere: { show: true, color: "#4682b4" },
      viewControl: { autoRotate: true },
    },
  }}
  style={{ height: 500 }}
/>`}>
        <EChart3D
          option={{
            globe: {
              baseColor: "#1a3b5c",
              shading: "color",
              atmosphere: { show: true, color: "#4682b4", glowPower: 6, innerGlowPower: 2 },
              viewControl: { autoRotate: true, autoRotateSpeed: 3, distance: 200 },
            },
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>

      <DemoSection title="Globe with Points" description="Globe with scatter points for cities." code={`<EChart3D
  option={{
    globe: {
      baseColor: "#264653",
      shading: "lambert",
      atmosphere: { show: true },
      viewControl: { autoRotate: true },
    },
    series: [{
      type: "scatter3D",
      coordinateSystem: "globe",
      data: [
        { name: "New York", value: [-74, 40.7, 100] },
        { name: "London", value: [-0.1, 51.5, 100] },
        ...
      ],
    }],
  }}
  style={{ height: 500 }}
/>`}>
        <EChart3D
          option={{
            globe: {
              baseColor: "#264653",
              shading: "lambert",
              atmosphere: { show: true },
              viewControl: { autoRotate: true, autoRotateSpeed: 2 },
              light: { ambient: { intensity: 0.4 }, main: { intensity: 1.2 } },
            },
            series: [{
              type: "scatter3D",
              coordinateSystem: "globe",
              symbolSize: 12,
              data: [
                { name: "New York", value: [-74.006, 40.7128, 100] },
                { name: "London", value: [-0.1276, 51.5074, 100] },
                { name: "Tokyo", value: [139.6917, 35.6895, 100] },
                { name: "Sydney", value: [151.2093, -33.8688, 100] },
                { name: "São Paulo", value: [-46.6333, -23.5505, 100] },
                { name: "Mumbai", value: [72.8777, 19.076, 100] },
              ],
              label: { show: true, formatter: "{b}", position: "right", textStyle: { color: "#fff", fontSize: 11 } },
              itemStyle: { color: "#fac858" },
            }],
          } as any}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
