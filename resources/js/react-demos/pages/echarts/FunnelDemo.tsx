import React from "react";
import { EChart } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

const funnelData = [
  { value: 100, name: "Visits" },
  { value: 80, name: "Inquiries" },
  { value: 60, name: "Orders" },
  { value: 40, name: "Payments" },
  { value: 20, name: "Completed" },
];

export function FunnelDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Funnel Chart</h1>

      <DemoSection title="Basic Funnel" description="Conversion funnel showing stages." code={`<EChart
  option={{
    tooltip: { trigger: "item" },
    series: [{
      type: "funnel",
      data: [
        { value: 100, name: "Visits" },
        { value: 80, name: "Inquiries" },
        { value: 60, name: "Orders" },
      ],
      label: { position: "inside" },
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item", formatter: "{b}: {c}%" },
            legend: {},
            series: [{ type: "funnel", data: funnelData, label: { position: "inside" } }],
          }}
        />
      </DemoSection>

      <DemoSection title="Ascending Funnel" description="Inverted funnel with sort ascending." code={`<EChart
  option={{
    series: [{
      type: "funnel",
      sort: "ascending",
      data: [...],
      gap: 4,
      itemStyle: { borderColor: "#fff", borderWidth: 2 },
    }],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item" },
            legend: {},
            series: [{
              type: "funnel",
              sort: "ascending",
              data: funnelData,
              label: { position: "inside" },
              gap: 4,
              itemStyle: { borderColor: "#fff", borderWidth: 2 },
            }],
          }}
        />
      </DemoSection>

      <DemoSection title="Comparison Funnel" description="Side-by-side funnels for comparison." code={`<EChart
  option={{
    series: [
      { type: "funnel", left: "5%", width: "40%", data: [...] },
      { type: "funnel", left: "55%", width: "40%", data: [...] },
    ],
  }}
/>`}>
        <EChart
          option={{
            tooltip: { trigger: "item" },
            legend: {},
            series: [
              {
                type: "funnel",
                left: "5%",
                width: "40%",
                data: funnelData,
                label: { position: "inside" },
                funnelAlign: "left",
              },
              {
                type: "funnel",
                left: "55%",
                width: "40%",
                data: [
                  { value: 95, name: "Visits" },
                  { value: 60, name: "Inquiries" },
                  { value: 45, name: "Orders" },
                  { value: 30, name: "Payments" },
                  { value: 15, name: "Completed" },
                ],
                label: { position: "inside" },
              },
            ],
          }}
        />
      </DemoSection>
    </div>
  );
}
