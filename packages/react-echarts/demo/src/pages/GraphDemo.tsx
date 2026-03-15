import React from "react";
import { EChart } from "@particle-academy/react-echarts";
import { DemoSection } from "../components/DemoSection";

const graphNodes = [
  { id: "0", name: "Node 0", symbolSize: 40, category: 0 },
  { id: "1", name: "Node 1", symbolSize: 30, category: 0 },
  { id: "2", name: "Node 2", symbolSize: 25, category: 1 },
  { id: "3", name: "Node 3", symbolSize: 35, category: 1 },
  { id: "4", name: "Node 4", symbolSize: 20, category: 2 },
  { id: "5", name: "Node 5", symbolSize: 28, category: 2 },
  { id: "6", name: "Node 6", symbolSize: 22, category: 0 },
  { id: "7", name: "Node 7", symbolSize: 32, category: 1 },
];

const graphLinks = [
  { source: "0", target: "1" },
  { source: "0", target: "2" },
  { source: "0", target: "3" },
  { source: "1", target: "4" },
  { source: "2", target: "5" },
  { source: "3", target: "6" },
  { source: "3", target: "7" },
  { source: "4", target: "5" },
  { source: "6", target: "7" },
];

const categories = [{ name: "Group A" }, { name: "Group B" }, { name: "Group C" }];

export function GraphDemo(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Graph (Network)</h1>

      <DemoSection title="Force Layout" description="Network graph with force-directed layout.">
        <EChart
          option={{
            tooltip: {},
            legend: { data: categories.map((c) => c.name) },
            series: [{
              type: "graph",
              layout: "force",
              data: graphNodes,
              links: graphLinks,
              categories,
              roam: true,
              label: { show: true, position: "right" },
              force: { repulsion: 200, edgeLength: 100 },
              lineStyle: { color: "source", curveness: 0.1 },
              emphasis: { focus: "adjacency" },
            }],
          }}
          style={{ height: 500 }}
        />
      </DemoSection>

      <DemoSection title="Circular Layout" description="Network arranged in a circle.">
        <EChart
          option={{
            tooltip: {},
            legend: { data: categories.map((c) => c.name) },
            series: [{
              type: "graph",
              layout: "circular",
              data: graphNodes,
              links: graphLinks,
              categories,
              roam: true,
              label: { show: true },
              circular: { rotateLabel: true },
              lineStyle: { color: "source", curveness: 0.3 },
            }],
          }}
          style={{ height: 500 }}
        />
      </DemoSection>
    </div>
  );
}
