import { lazy, Suspense } from "react";
import type { ComponentDoc } from "./types";
import type { Fancy3DCanvasExample } from "./Fancy3DCanvas.demo";

// Lazy-load the live Canvas demos. The Canvas component re-exports
// `babylonEngine`, which transitively pulls @babylonjs/core (~13MB).
// Keeping the import dynamic means Babylon only loads when a user
// actually visits this docs page — not when they hit any other
// /packages/* component page in the showcase.
const Fancy3DCanvasDemo = lazy(() => import("./Fancy3DCanvas.demo"));

function DemoFrame({ example, height }: { example: Fancy3DCanvasExample; height: number }) {
    return (
        <Suspense
            fallback={
                <div
                    className="grid w-full place-items-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                    style={{ height }}
                >
                    Loading Babylon engine…
                </div>
            }
        >
            <Fancy3DCanvasDemo example={example} />
        </Suspense>
    );
}

export const fancy3dCanvasDoc: ComponentDoc = {
    intro: (
        <p>
            Engine-pluggable 2D pan-zoom canvas. Default <code>engine=&quot;dom&quot;</code>{" "}
            (no extra runtime), opt into Babylon via{" "}
            <code>engine=&quot;babylon&quot;</code>, or pass any{" "}
            <code>CanvasEngine</code> to embed three.js, native canvas, WebXR. The 2D node
            graph and the active 3D scene live alongside each other — the foundation for
            hybrid 2D-in-3D and mixed-reality experiences.
        </p>
    ),
    examples: [
        {
            name: "DOM canvas",
            description: "Pan + zoom + drag nodes. No 3D engine — just a pan-zoom DOM canvas.",
            render: () => <DemoFrame example="dom" height={288} />,
            code: `import { Canvas } from "@particle-academy/fancy-3d/canvas";

<Canvas defaultViewport={{ x: 0, y: 0, zoom: 1 }} showGrid gridStyle="dots">
    <Canvas.Node id="a" x={80} y={60} draggable>
        <Card>Node A</Card>
    </Canvas.Node>
    <Canvas.Node id="b" x={320} y={120} draggable>
        <Card>Node B</Card>
    </Canvas.Node>
    <Canvas.Edge from="a" to="b" curve="bezier" />
    <Canvas.Controls />
    <Canvas.Minimap />
</Canvas>`,
        },
        {
            name: "Babylon engine",
            description: "Same canvas + a live Babylon `Scene` mounted alongside. Access via `useCanvas().engine`.",
            render: () => <DemoFrame example="babylon" height={256} />,
            code: `import { Canvas, useCanvas } from "@particle-academy/fancy-3d/canvas";

<Canvas engine="babylon">
    <Canvas.Node id="hud" x={0} y={0}>
        <Card>DOM HUD over a Babylon scene</Card>
    </Canvas.Node>
</Canvas>

function MyScene() {
    const { engine } = useCanvas();
    if (engine?.kind !== "babylon") return null;
    // engine.scene is a Babylon Scene — add meshes, lights, etc.
    return null;
}`,
        },
        {
            name: "Grid + snap",
            description: "Snap dragged nodes to a configurable grid.",
            render: () => <DemoFrame example="grid" height={224} />,
            code: `<Canvas showGrid gridSize={32} snapToGrid>
    <Canvas.Node id="a" x={64} y={64} draggable>
        <Card>snap me</Card>
    </Canvas.Node>
</Canvas>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "`Canvas.Node`, `Canvas.Edge`, `Canvas.Controls`, `Canvas.Minimap`, or any positioned content." },
        { name: "viewport", type: `ViewportState`, default: "—", description: "Controlled `{ x, y, zoom }`. Use with `onViewportChange`." },
        { name: "defaultViewport", type: `ViewportState`, default: "—", description: "Initial viewport (uncontrolled)." },
        { name: "onViewportChange", type: `(viewport) => void`, default: "—", description: "Called on every pan / zoom." },
        { name: "minZoom", type: `number`, default: `0.1`, description: "Smallest allowed scale." },
        { name: "maxZoom", type: `number`, default: `4`, description: "Largest allowed scale." },
        { name: "pannable", type: `boolean`, default: `true`, description: "Allow pan." },
        { name: "zoomable", type: `boolean`, default: `true`, description: "Allow wheel-zoom." },
        { name: "gridSize", type: `number`, default: `20`, description: "Grid spacing in canvas-space pixels." },
        { name: "showGrid", type: `boolean`, default: `false`, description: "Show the canvas grid." },
        { name: "gridStyle", type: `"dots" | "lines" | "none"`, default: `"dots"`, description: "Grid pattern when shown." },
        { name: "gridColor", type: `string`, default: "faint zinc", description: "Grid line color." },
        { name: "snapToGrid", type: `boolean`, default: `false`, description: "Snap dragged nodes to the grid." },
        { name: "fitOnMount", type: `boolean`, default: `false`, description: "Auto-fit all nodes into view on initial mount." },
        { name: "engine", type: `CanvasEngineSpec`, default: `"dom"`, description: "3D engine to mount alongside the 2D canvas. `\"dom\"`, `\"babylon\"`, or a custom `CanvasEngine`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Active engine:</strong> reach for{" "}
            <code>useCanvas().engine</code> from any descendant — it's null while the engine
            is mounting or when <code>engine=&quot;dom&quot;</code>.
        </p>
    ),
};
