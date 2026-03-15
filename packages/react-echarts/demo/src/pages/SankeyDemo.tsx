import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

const sankeyData = {
  nodes: [
    { name: "Source A" },
    { name: "Source B" },
    { name: "Source C" },
    { name: "Process 1" },
    { name: "Process 2" },
    { name: "Output X" },
    { name: "Output Y" },
  ],
  links: [
    { source: "Source A", target: "Process 1", value: 30 },
    { source: "Source A", target: "Process 2", value: 20 },
    { source: "Source B", target: "Process 1", value: 25 },
    { source: "Source B", target: "Process 2", value: 15 },
    { source: "Source C", target: "Process 2", value: 10 },
    { source: "Process 1", target: "Output X", value: 40 },
    { source: "Process 1", target: "Output Y", value: 15 },
    { source: "Process 2", target: "Output X", value: 20 },
    { source: "Process 2", target: "Output Y", value: 25 },
  ],
};

export function SankeyDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Sankey Diagram</h1>

      <DemoSection title="Basic Sankey" description="Flow diagram showing resource allocation.">
        <EChart
          option={{
            tooltip: { trigger: "item" },
            series: [{
              type: "sankey",
              data: sankeyData.nodes,
              links: sankeyData.links,
              emphasis: { focus: "adjacency" },
              lineStyle: { color: "gradient", curveness: 0.5 },
            }],
          }}
          style={{ height: 450 }}
        />
      </DemoSection>

      <DemoSection title="Vertical Sankey" description="Sankey with vertical orientation.">
        <EChart
          option={{
            tooltip: { trigger: "item" },
            series: [{
              type: "sankey",
              orient: "vertical",
              data: sankeyData.nodes,
              links: sankeyData.links,
              emphasis: { focus: "adjacency" },
              lineStyle: { color: "source", curveness: 0.5 },
              label: { position: "top" },
            }],
          }}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
