import { Canvas } from "@particle-academy/fancy-3d/canvas";
import { babylonEngine } from "@particle-academy/fancy-3d-babylon/engine";
import { Card, Heading } from "@particle-academy/react-fancy";

/**
 * Live Canvas demos used by the Fancy3DCanvas docs page.
 *
 * Pulled into its own module so the showcase entry doesn't statically
 * depend on `fancy-3d/canvas` — that package's eager `babylonEngine`
 * export drags @babylonjs/core (~13MB) into the initial graph. This
 * file is React.lazy()'d from the docs registry, so Babylon only loads
 * when a user actually visits /packages/fancy-3d/canvas.
 */

export type Fancy3DCanvasExample = "dom" | "babylon" | "grid";

export default function Fancy3DCanvasDemo({ example }: { example: Fancy3DCanvasExample }) {
    if (example === "dom") {
        return (
            <div className="h-72 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Canvas defaultViewport={{ panX: 0, panY: 0, zoom: 1 }} showGrid gridStyle="dots">
                    <Canvas.Node id="a" x={80} y={60} draggable>
                        <Card padding="sm"><Heading size="xs">Node A</Heading></Card>
                    </Canvas.Node>
                    <Canvas.Node id="b" x={320} y={120} draggable>
                        <Card padding="sm"><Heading size="xs">Node B</Heading></Card>
                    </Canvas.Node>
                    <Canvas.Edge from="a" to="b" curve="bezier" />
                    <Canvas.Controls />
                    <Canvas.Minimap />
                </Canvas>
            </div>
        );
    }

    if (example === "babylon") {
        return (
            <div className="h-64 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Canvas engine={babylonEngine} defaultViewport={{ panX: 0, panY: 0, zoom: 1 }}>
                    <Canvas.Node id="overlay" x={40} y={40}>
                        <Card padding="sm"><Heading size="xs">DOM node over Babylon</Heading></Card>
                    </Canvas.Node>
                </Canvas>
            </div>
        );
    }

    return (
        <div className="h-56 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Canvas defaultViewport={{ panX: 0, panY: 0, zoom: 1 }} showGrid gridSize={32} snapToGrid>
                <Canvas.Node id="a" x={64} y={64} draggable>
                    <Card padding="sm">snap me</Card>
                </Canvas.Node>
            </Canvas>
        </div>
    );
}
