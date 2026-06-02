import { useMemo, useState } from "react";
import { Button, Badge, Callout, Card } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import { Canvas } from "@particle-academy/fancy-3d/canvas";
import { domAdapter } from "@particle-academy/fancy-3d/dom";
import {
  nextId,
  type Scene,
  type SceneNode,
  type WidgetSpec,
} from "@particle-academy/fancy-3d";
import { initialScene } from "../canvas-studio/initialScene";

type EngineMode = "dom" | "babylon";

const PALETTE: { kind: WidgetSpec["kind"]; label: string; build: () => WidgetSpec; size: { w: number; h: number } }[] = [
  {
    kind: "kpi",
    label: "KPI",
    size: { w: 220, h: 110 },
    build: () => ({ kind: "kpi", label: "New KPI", value: "0", delta: "+0%", trend: "up" }),
  },
  {
    kind: "chart",
    label: "Chart",
    size: { w: 320, h: 200 },
    build: () => ({
      kind: "chart",
      title: "New chart",
      variant: "line",
      series: Array.from({ length: 10 }, () => Math.round(Math.random() * 40 + 10)),
      color: "#6366f1",
    }),
  },
  {
    kind: "callout",
    label: "Callout",
    size: { w: 280, h: 110 },
    build: () => ({ kind: "callout", tone: "info", title: "Heads up", body: "Add details here." }),
  },
  {
    kind: "form",
    label: "Form",
    size: { w: 280, h: 200 },
    build: () => ({
      kind: "form",
      title: "Form",
      fields: [
        { id: "a", label: "Name", type: "text" },
        { id: "b", label: "Active", type: "switch" },
      ],
    }),
  },
  {
    kind: "action",
    label: "Actions",
    size: { w: 240, h: 110 },
    build: () => ({
      kind: "action",
      title: "Actions",
      buttons: [
        { label: "Run", variant: "primary" },
        { label: "Cancel", variant: "ghost" },
      ],
    }),
  },
  {
    kind: "table",
    label: "Table",
    size: { w: 320, h: 220 },
    build: () => ({
      kind: "table",
      title: "Rows",
      columns: ["A", "B"],
      rows: [
        ["one", 1],
        ["two", 2],
      ],
    }),
  },
  {
    kind: "text",
    label: "Note",
    size: { w: 220, h: 110 },
    build: () => ({ kind: "text", heading: "Note", body: "Free-form text." }),
  },
];

function Inspector({ node, onChange, onDelete }: { node: SceneNode | null; onChange: (n: SceneNode) => void; onDelete: () => void }) {
  if (!node) {
    return (
      <div className="text-xs text-zinc-500">
        Click a widget on the canvas to inspect its scene-data. The same JSON
        is what a Babylon, three.js, or native-canvas adapter would receive.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Selected</div>
        <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{node.id}</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Position</div>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <input
            type="number"
            value={Math.round(node.position.x)}
            onChange={(e) => onChange({ ...node, position: { ...node.position, x: Number(e.target.value) } })}
            className="rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="number"
            value={Math.round(node.position.y)}
            onChange={(e) => onChange({ ...node, position: { ...node.position, y: Number(e.target.value) } })}
            className="rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Widget JSON</div>
        <div className="mt-1 overflow-hidden rounded">
          <CodeEditor
            value={JSON.stringify(node.widget, null, 2)}
            language="json"
            theme="dark"
            readOnly
            lineNumbers={false}
            minHeight={80}
            maxHeight={288}
          >
            <CodeEditor.Panel />
          </CodeEditor>
        </div>
      </div>
      <Button variant="default" color="red" size="sm" onClick={onDelete}>
        Delete node
      </Button>
    </div>
  );
}

function EngineToggle({ mode, onChange }: { mode: EngineMode; onChange: (m: EngineMode) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800">
      {(["dom", "babylon"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={
            mode === m
              ? "rounded-md bg-white px-3 py-1 font-medium text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "rounded-md px-3 py-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }
        >
          {m === "dom" ? "DOM (react-fancy)" : "BabylonJS (preview)"}
        </button>
      ))}
    </div>
  );
}

function BabylonPreview({ scene }: { scene: Scene }) {
  // Static SVG that visualises how a BabylonJS adapter would lay out the same
  // scene as textured planes on a 3D plane. The Scene data is identical to
  // the DOM mode — only the renderer changes.
  const minX = Math.min(...scene.nodes.map((n) => n.position.x));
  const minY = Math.min(...scene.nodes.map((n) => n.position.y));
  const maxX = Math.max(...scene.nodes.map((n) => n.position.x + (n.size?.w ?? 200)));
  const maxY = Math.max(...scene.nodes.map((n) => n.position.y + (n.size?.h ?? 120)));
  const w = maxX - minX + 100;
  const h = maxY - minY + 100;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
      <svg viewBox={`${minX - 50} ${minY - 50} ${w} ${h}`} className="h-full w-full" style={{ transform: "perspective(900px) rotateX(28deg) rotateZ(-6deg)", transformOrigin: "50% 60%" }}>
        <defs>
          <pattern id="grid3d" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="plane" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#312e81" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x={minX - 50} y={minY - 50} width={w} height={h} fill="url(#plane)" />
        <rect x={minX - 50} y={minY - 50} width={w} height={h} fill="url(#grid3d)" />
        {scene.edges.map((e) => {
          const a = scene.nodes.find((n) => n.id === e.from);
          const b = scene.nodes.find((n) => n.id === e.to);
          if (!a || !b) return null;
          const ax = a.position.x + (a.size?.w ?? 200) / 2;
          const ay = a.position.y + (a.size?.h ?? 120) / 2;
          const bx = b.position.x + (b.size?.w ?? 200) / 2;
          const by = b.position.y + (b.size?.h ?? 120) / 2;
          return <line key={e.id} x1={ax} y1={ay} x2={bx} y2={by} stroke="#6366f1" strokeWidth={1.5} strokeDasharray={e.animated ? "6 4" : undefined} opacity={0.55} />;
        })}
        {scene.nodes.map((n) => {
          const w = n.size?.w ?? 200;
          const h = n.size?.h ?? 120;
          return (
            <g key={n.id}>
              <rect
                x={n.position.x}
                y={n.position.y}
                width={w}
                height={h}
                rx={8}
                fill="#0f172a"
                stroke="#6366f1"
                strokeOpacity={0.6}
                strokeWidth={1}
              />
              <rect x={n.position.x} y={n.position.y} width={w} height={20} rx={8} fill="#1e1b4b" />
              <text x={n.position.x + 8} y={n.position.y + 14} fontSize="10" fill="#a5b4fc" fontFamily="monospace">
                {n.widget.kind} · {n.id}
              </text>
              <text x={n.position.x + 8} y={n.position.y + 38} fontSize="9" fill="#64748b" fontFamily="monospace">
                Mesh plane {w}×{h}
              </text>
              <text x={n.position.x + 8} y={n.position.y + 52} fontSize="9" fill="#64748b" fontFamily="monospace">
                DynamicTexture
              </text>
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute top-3 left-3 max-w-md rounded-lg border border-indigo-500/30 bg-zinc-900/80 p-3 text-[11px] leading-relaxed text-zinc-300 backdrop-blur">
        <div className="mb-1 font-mono text-[10px] tracking-wider text-indigo-400 uppercase">Babylon adapter · stub preview</div>
        Same <code className="text-indigo-300">Scene</code> data — different renderer. In a real
        BabylonJS implementation, each node would become a <code className="text-indigo-300">MeshBuilder.CreatePlane</code>{" "}
        with the widget painted onto a <code className="text-indigo-300">DynamicTexture</code>; edges become{" "}
        <code className="text-indigo-300">CreateLines</code>. The contract lives in{" "}
        <code className="text-indigo-300">canvas-studio/babylonAdapter.ts</code>.
      </div>
    </div>
  );
}

export function CanvasStudioDemo() {
  const [scene, setScene] = useState<Scene>(initialScene);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EngineMode>("dom");
  const [gridStyle, setGridStyle] = useState<"dots" | "lines" | "none">("dots");
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);

  const selected = useMemo(() => scene.nodes.find((n) => n.id === selectedId) ?? null, [scene, selectedId]);

  const updateNode = (next: SceneNode) => {
    setScene((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === next.id ? next : n)) }));
  };

  const movePosition = (id: string, x: number, y: number) => {
    setScene((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, position: { ...n.position, x, y } } : n)) }));
  };

  const addWidget = (kind: WidgetSpec["kind"]) => {
    const entry = PALETTE.find((p) => p.kind === kind);
    if (!entry) return;
    const id = nextId(kind);
    setScene((s) => ({
      ...s,
      nodes: [
        ...s.nodes,
        {
          id,
          position: { x: 80 + Math.random() * 120, y: 80 + Math.random() * 120 },
          size: entry.size,
          widget: entry.build(),
        },
      ],
    }));
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setScene((s) => ({
      nodes: s.nodes.filter((n) => n.id !== selectedId),
      edges: s.edges.filter((e) => e.from !== selectedId && e.to !== selectedId),
    }));
    setSelectedId(null);
  };

  const resetScene = () => {
    setScene(initialScene);
    setSelectedId(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Canvas Studio</h1>
          <p className="max-w-3xl text-sm text-zinc-500">
            A hardcore showcase for <code className="text-xs">react-fancy</code>'s{" "}
            <code className="text-xs">Canvas</code>: every node is a real,
            interactive UI widget — KPIs, charts, kanban, tables, callouts,
            forms, code. The scene is described as{" "}
            <strong>engine-agnostic JSON</strong>; an adapter renders it for a
            target engine. Toggle the renderer below to see the same scene
            previewed under a BabylonJS adapter contract.
          </p>
        </div>
        <EngineToggle mode={mode} onChange={setMode} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Add widget</span>
        {PALETTE.map((p) => (
          <Button key={p.kind} variant="default" size="sm" onClick={() => addWidget(p.kind)}>
            + {p.label}
          </Button>
        ))}
        <span className="ml-auto flex items-center gap-2">
          <Badge size="sm">{scene.nodes.length} nodes</Badge>
          <Badge size="sm">{scene.edges.length} edges</Badge>
          <Button variant="ghost" size="sm" onClick={resetScene}>
            Reset scene
          </Button>
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Grid</span>
        <div className="flex gap-1 rounded-md bg-zinc-200 p-0.5 text-xs dark:bg-zinc-800">
          {(["dots", "lines", "none"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setGridStyle(s)}
              className={
                gridStyle === s
                  ? "rounded bg-white px-2 py-0.5 font-medium text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "rounded px-2 py-0.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          spacing
          <input
            type="number"
            min={4}
            max={200}
            step={2}
            value={gridSize}
            onChange={(e) => setGridSize(Math.max(4, Number(e.target.value) || 20))}
            className="w-16 rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
          px
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
          />
          snap to grid
        </label>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 720 }}>
          {mode === "dom" ? (
            <Canvas
              showGrid={gridStyle !== "none"}
              gridStyle={gridStyle}
              gridSize={gridSize}
              snapToGrid={snapToGrid}
              fitOnMount
              minZoom={0.25}
              maxZoom={2}
              className="h-full w-full"
            >
              {scene.nodes.map((node) => (
                <Canvas.Node
                  key={node.id}
                  id={node.id}
                  x={node.position.x}
                  y={node.position.y}
                  draggable
                  onPositionChange={(x, y) => movePosition(node.id, x, y)}
                  style={{ width: node.size?.w, height: node.size?.h }}
                >
                  {domAdapter.render(node.widget, {
                    nodeId: node.id,
                    selected: node.id === selectedId,
                    onSelect: setSelectedId,
                  })}
                </Canvas.Node>
              ))}
              {scene.edges.map((edge) => (
                <Canvas.Edge
                  key={edge.id}
                  from={edge.from}
                  to={edge.to}
                  curve={edge.curve}
                  animated={edge.animated}
                  label={edge.label}
                />
              ))}
              <Canvas.Controls />
              <Canvas.Minimap />
            </Canvas>
          ) : (
            <BabylonPreview scene={scene} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <Card.Header>
              <div className="text-sm font-semibold">Inspector</div>
            </Card.Header>
            <Card.Body>
              <Inspector node={selected} onChange={updateNode} onDelete={deleteSelected} />
            </Card.Body>
          </Card>

          <Callout color="blue">
            <div className="text-sm font-semibold">Engine portability</div>
            <div className="mt-1 text-xs leading-relaxed">
              The <code>Scene</code> in <code>canvas-studio/scene.ts</code> is plain
              JSON. <code>domAdapter.tsx</code> renders it as react-fancy
              components inside <code>Canvas.Node</code>;{" "}
              <code>babylonAdapter.ts</code> documents how the same data maps to
              BabylonJS meshes + dynamic textures. Drop in a three.js, PixiJS,
              or native-canvas adapter and the scene description does not change.
            </div>
          </Callout>
        </div>
      </div>
    </div>
  );
}
