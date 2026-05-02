import { Flowchart } from "@particle-academy/fancy-echarts";
import { DemoSection } from "../../components/DemoSection";

export function FlowchartDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Flowchart</h1>

      <DemoSection
        title="Basic flowchart"
        description="Boxes-and-arrows. Pass a friendly { nodes, edges } schema; missing positions auto-grid."
        code={`<Flowchart
  nodes={[
    { id: "start", label: "Start" },
    { id: "review", label: "Review" },
    { id: "ship", label: "Ship" },
  ]}
  edges={[
    { from: "start",  to: "review" },
    { from: "review", to: "ship", label: "approve" },
  ]}
/>`}
      >
        <div style={{ height: 360 }}>
          <Flowchart
            nodes={[
              { id: "start",  label: "Start",   x: 60,  y: 60 },
              { id: "review", label: "Review",  x: 320, y: 60 },
              { id: "ship",   label: "Ship",    x: 580, y: 60 },
              { id: "ops",    label: "Ops",     x: 320, y: 220 },
            ]}
            edges={[
              { from: "start",  to: "review" },
              { from: "review", to: "ship",  label: "approve" },
              { from: "review", to: "ops",   label: "fail",     type: "dependency" },
              { from: "ops",    to: "review" },
            ]}
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Auto-layout"
        description="Omit x/y on any node and Flowchart drops it onto a wrap-around grid based on the total node count."
        code={`<Flowchart
  nodes={Array.from({ length: 9 }, (_, i) => ({ id: \`n\${i}\`, label: \`Node \${i + 1}\` }))}
  edges={[
    { from: "n0", to: "n1" }, { from: "n1", to: "n2" },
    { from: "n2", to: "n5" }, { from: "n3", to: "n4" },
  ]}
/>`}
      >
        <div style={{ height: 380 }}>
          <Flowchart
            nodes={Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, label: `Node ${i + 1}` }))}
            edges={[
              { from: "n0", to: "n1" },
              { from: "n1", to: "n2" },
              { from: "n2", to: "n5" },
              { from: "n3", to: "n4" },
              { from: "n4", to: "n5" },
              { from: "n5", to: "n8", label: "merge" },
              { from: "n6", to: "n7" },
              { from: "n7", to: "n8" },
            ]}
          />
        </div>
      </DemoSection>
    </div>
  );
}
