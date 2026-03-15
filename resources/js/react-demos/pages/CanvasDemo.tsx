import { Canvas, Card } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function CanvasDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Canvas</h1>

      <DemoSection title="Basic Canvas" description="A simple node graph with Card nodes and bezier edges. Grid and controls are enabled." code={`<Canvas showGrid>
  <Canvas.Node id="1" x={50} y={50}>
    <Card><Card.Body>Authentication</Card.Body></Card>
  </Canvas.Node>
  <Canvas.Node id="2" x={300} y={50}>
    <Card><Card.Body>Dashboard</Card.Body></Card>
  </Canvas.Node>
  <Canvas.Node id="3" x={175} y={200}>
    <Card><Card.Body>API Gateway</Card.Body></Card>
  </Canvas.Node>
  <Canvas.Edge from="1" to="3" curve="bezier" />
  <Canvas.Edge from="2" to="3" curve="bezier" />
  <Canvas.Controls />
</Canvas>`}>
        <div style={{ height: 350 }}>
          <Canvas showGrid className="h-full w-full">
            <Canvas.Node id="1" x={50} y={50}>
              <Card><Card.Body>Authentication</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="2" x={300} y={50}>
              <Card><Card.Body>Dashboard</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="3" x={175} y={200}>
              <Card><Card.Body>API Gateway</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Edge from="1" to="3" curve="bezier" />
            <Canvas.Edge from="2" to="3" curve="bezier" />
            <Canvas.Controls />
          </Canvas>
        </div>
      </DemoSection>

      <DemoSection title="Edge Types" description="Demonstrating bezier, step, and straight edge curve types between nodes." code={`<Canvas showGrid>
  <Canvas.Edge from="a" to="d" curve="bezier" label="bezier" />
  <Canvas.Edge from="b" to="e" curve="step" label="step" />
  <Canvas.Edge from="c" to="f" curve="straight" label="straight" />
</Canvas>`}>
        <div style={{ height: 350 }}>
          <Canvas showGrid className="h-full w-full">
            <Canvas.Node id="a" x={50} y={50}>
              <Card><Card.Body>Source A</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="b" x={300} y={50}>
              <Card><Card.Body>Source B</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="c" x={550} y={50}>
              <Card><Card.Body>Source C</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="d" x={50} y={200}>
              <Card><Card.Body>Target A</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="e" x={300} y={200}>
              <Card><Card.Body>Target B</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="f" x={550} y={200}>
              <Card><Card.Body>Target C</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Edge from="a" to="d" curve="bezier" label="bezier" />
            <Canvas.Edge from="b" to="e" curve="step" label="step" />
            <Canvas.Edge from="c" to="f" curve="straight" label="straight" />
            <Canvas.Controls />
          </Canvas>
        </div>
      </DemoSection>

      <DemoSection title="Pan & Zoom" description="Use scroll to zoom and drag to pan across a larger canvas. The minimap provides an overview of all nodes." code={`<Canvas showGrid>
  <Canvas.Node id="p1" x={0} y={0}>...</Canvas.Node>
  <Canvas.Edge from="p1" to="p2" curve="bezier" />
  <Canvas.Controls />
  <Canvas.Minimap />
</Canvas>`}>
        <p className="mb-3 text-sm text-zinc-500">
          Scroll to zoom in/out. Click and drag on the background to pan. The minimap in the corner shows your current viewport.
        </p>
        <div style={{ height: 400 }}>
          <Canvas showGrid className="h-full w-full">
            <Canvas.Node id="p1" x={0} y={0}>
              <Card><Card.Body>Entry Point</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p2" x={250} y={0}>
              <Card><Card.Body>Router</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p3" x={500} y={0}>
              <Card><Card.Body>Middleware</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p4" x={0} y={150}>
              <Card><Card.Body>Auth Service</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p5" x={250} y={150}>
              <Card><Card.Body>User Service</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p6" x={500} y={150}>
              <Card><Card.Body>Cache Layer</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p7" x={0} y={300}>
              <Card><Card.Body>Database</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p8" x={250} y={300}>
              <Card><Card.Body>Event Bus</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p9" x={500} y={300}>
              <Card><Card.Body>Logger</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Node id="p10" x={750} y={150}>
              <Card><Card.Body>CDN</Card.Body></Card>
            </Canvas.Node>
            <Canvas.Edge from="p1" to="p2" curve="bezier" />
            <Canvas.Edge from="p2" to="p3" curve="bezier" />
            <Canvas.Edge from="p2" to="p5" curve="bezier" />
            <Canvas.Edge from="p3" to="p6" curve="bezier" />
            <Canvas.Edge from="p4" to="p7" curve="bezier" />
            <Canvas.Edge from="p5" to="p8" curve="bezier" />
            <Canvas.Edge from="p6" to="p9" curve="bezier" />
            <Canvas.Edge from="p6" to="p10" curve="bezier" />
            <Canvas.Edge from="p1" to="p4" curve="bezier" />
            <Canvas.Controls />
            <Canvas.Minimap />
          </Canvas>
        </div>
      </DemoSection>
    </div>
  );
}
