import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../../components/DemoSection";

export function MapDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Map Chart</h1>

      <DemoSection
        title="Scatter on Geo"
        description="Maps require GeoJSON registration. This demo shows scatter points on a cartesian plane as a geo-like visualization."
        code={`<EChart
  option={{
    xAxis: { show: false, min: 0, max: 100 },
    yAxis: { show: false, min: 0, max: 100 },
    series: [{
      type: "effectScatter",
      data: [
        { name: "New York", value: [25, 60, 8.3] },
        { name: "London", value: [45, 75, 9.0] },
        ...
      ],
      symbolSize: (val) => val[2] * 3,
      rippleEffect: { brushType: "stroke" },
    }],
  }}
/>`}
      >
        <EChart
          option={{
            title: { text: "City Populations (simulated positions)", left: "center" },
            tooltip: {
              trigger: "item",
              formatter: (params: any) => `${params.name}: ${params.value[2]}M`,
            },
            xAxis: { show: false, min: 0, max: 100 },
            yAxis: { show: false, min: 0, max: 100 },
            series: [{
              type: "effectScatter",
              coordinateSystem: "cartesian2d",
              symbolSize: (val: number[]) => val[2] * 3,
              data: [
                { name: "New York", value: [25, 60, 8.3] },
                { name: "London", value: [45, 75, 9.0] },
                { name: "Tokyo", value: [80, 65, 13.9] },
                { name: "Sydney", value: [75, 20, 5.3] },
                { name: "São Paulo", value: [30, 30, 12.3] },
                { name: "Cairo", value: [55, 50, 9.5] },
              ],
              label: { show: true, formatter: "{b}", position: "right" },
              rippleEffect: { brushType: "stroke" },
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Note" description="To use actual map charts, register GeoJSON data with echarts.registerMap(). See the ECharts documentation for supported map data sources." code={`// Register map data first:
echarts.registerMap("mapName", geoJSON);

<EChart
  option={{
    series: [{
      type: "map",
      map: "mapName",
      data: [...],
    }],
  }}
/>`}>
        <p style={{ padding: 16, color: "#6b7280" }}>
          Full map support requires GeoJSON data registration. Use{" "}
          <code>echarts.registerMap(&apos;mapName&apos;, geoJSON)</code> before rendering.
          The EChart component supports map series once the map data is registered.
        </p>
      </DemoSection>
    </div>
  );
}
