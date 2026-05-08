import { useEffect, useMemo, useRef, useState } from "react";
import {
  Board,
  StickyNote,
  Drawing,
  Connector,
  Shape,
  CursorLayer,
  type StickyNoteItem,
  type ShapeItem,
  type Stroke,
  type RemoteCursor,
  type Viewport,
  type ItemId,
} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { Action, Badge, Card } from "@particle-academy/react-fancy";

type Tool = "select" | "sticky" | "pen" | "rect" | "ellipse" | "connector";

const STICKY_COLORS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff"];

const teammates: RemoteCursor[] = [
  { userId: "u1", name: "Ada", color: "#ec4899", x: 240, y: 180 },
  { userId: "u2", name: "Linus", color: "#10b981", x: 520, y: 320 },
  { userId: "u3", name: "Grace", color: "#8b5cf6", x: 780, y: 200 },
];

const seedNotes: StickyNoteItem[] = [
  { id: "n_kickoff", kind: "sticky", x: 80, y: 80, width: 200, height: 140, text: "Q3 design sprint\n— Goals & blockers", color: "#fde68a", authorId: "u1" },
  { id: "n_idea1", kind: "sticky", x: 360, y: 60, width: 180, height: 130, text: "Faster onboarding flow", color: "#bbf7d0", authorId: "u2" },
  { id: "n_idea2", kind: "sticky", x: 360, y: 220, width: 180, height: 130, text: "Mobile parity for analytics", color: "#bfdbfe", authorId: "u3" },
  { id: "n_idea3", kind: "sticky", x: 620, y: 140, width: 180, height: 130, text: "Cut perceived load time in half", color: "#fbcfe8", authorId: "u1" },
];

const seedShapes: ShapeItem[] = [
  { id: "sh_phase1", kind: "shape", shape: "rect", x: 80, y: 460, width: 180, height: 80, text: "Discover" },
  { id: "sh_phase2", kind: "shape", shape: "rect", x: 320, y: 460, width: 180, height: 80, text: "Prototype" },
  { id: "sh_phase3", kind: "shape", shape: "rect", x: 560, y: 460, width: 180, height: 80, text: "Test" },
  { id: "sh_phase4", kind: "shape", shape: "ellipse", x: 800, y: 460, width: 180, height: 80, text: "Ship" },
];

type Edge = { id: string; fromId: ItemId; toId: ItemId };
const seedEdges: Edge[] = [
  { id: "e1", fromId: "sh_phase1", toId: "sh_phase2" },
  { id: "e2", fromId: "sh_phase2", toId: "sh_phase3" },
  { id: "e3", fromId: "sh_phase3", toId: "sh_phase4" },
];

export function WhiteboardFullDemo() {
  const [tool, setTool] = useState<Tool>("select");
  const [colorIdx, setColorIdx] = useState(0);
  const [notes, setNotes] = useState<StickyNoteItem[]>(seedNotes);
  const [shapes, setShapes] = useState<ShapeItem[]>(seedShapes);
  const [edges, setEdges] = useState<Edge[]>(seedEdges);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 0.85 });
  const [pendingFrom, setPendingFrom] = useState<ItemId | null>(null);
  const [cursors, setCursors] = useState<RemoteCursor[]>(teammates);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Animate fake teammate cursors so the page feels alive.
  const tRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      tRef.current += 1;
      const t = tRef.current;
      setCursors((cs) =>
        cs.map((c, i) => ({
          ...c,
          x: 200 + i * 240 + Math.sin(t * 0.03 + i) * 80,
          y: 200 + Math.cos(t * 0.04 + i * 1.7) * 90,
        })),
      );
    }, 60);
    return () => clearInterval(id);
  }, []);

  const updateNote = (next: StickyNoteItem) =>
    setNotes((all) => all.map((x) => (x.id === next.id ? next : x)));
  const updateShape = (next: ShapeItem) =>
    setShapes((all) => all.map((x) => (x.id === next.id ? next : x)));

  const itemCenter = (id: ItemId): { x: number; y: number } | null => {
    const s = shapes.find((x) => x.id === id);
    if (s) return { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    const n = notes.find((x) => x.id === id);
    if (n) return { x: n.x + n.width / 2, y: n.y + n.height / 2 };
    return null;
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "select" || tool === "pen" || tool === "connector") return;
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const wx = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const wy = (e.clientY - rect.top - viewport.y) / viewport.zoom;
    const id = `it_${Date.now().toString(36)}`;
    if (tool === "sticky") {
      setNotes((all) => [
        ...all,
        { id, kind: "sticky", x: wx - 90, y: wy - 70, width: 180, height: 140, text: "", color: STICKY_COLORS[colorIdx] },
      ]);
    } else if (tool === "rect" || tool === "ellipse") {
      setShapes((all) => [
        ...all,
        { id, kind: "shape", shape: tool, x: wx - 80, y: wy - 40, width: 160, height: 80 },
      ]);
    }
  };

  const handleSelect = (id: string) => {
    if (tool !== "connector") {
      setSelectedId(id);
      return;
    }
    if (pendingFrom == null) {
      setPendingFrom(id);
    } else if (pendingFrom !== id) {
      setEdges((all) => [...all, { id: `e_${Date.now().toString(36)}`, fromId: pendingFrom, toId: id }]);
      setPendingFrom(null);
    } else {
      setPendingFrom(null);
    }
  };

  const exportJson = () => {
    const payload = { viewport, notes, shapes, edges, strokes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const stickyCount = notes.length;
  const shapeCount = shapes.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Whiteboard — Full Demo
          </h1>
          <p className="text-sm text-zinc-500">
            A design-sprint board built from <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">fancy-whiteboard</code> +{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">react-fancy</code> primitives.
            Pure controlled state — pipe these props through Reverb / Echo / Yjs to make it collaborative.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PresenceStrip cursors={cursors} />
          <Action onClick={exportJson} icon="download">Export JSON</Action>
        </div>
      </header>

      <Toolbar
        tool={tool}
        setTool={(t) => { setTool(t); setPendingFrom(null); }}
        colorIdx={colorIdx}
        setColorIdx={setColorIdx}
      />

      <div className="mt-3 grid grid-cols-[1fr_240px] gap-4">
        <div
          className="relative overflow-hidden rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_1px_1px,_#d4d4d8_1px,_transparent_0)] [background-size:20px_20px] dark:border-zinc-700 dark:bg-[radial-gradient(circle_at_1px_1px,_#3f3f46_1px,_transparent_0)]"
          style={{ height: 640 }}
        >
          <Board
            viewport={viewport}
            onViewportChange={setViewport}
            style={{ width: "100%", height: "100%" }}
          >
            <div onClick={handleBoardClick} style={{ position: "absolute", inset: -10000, cursor: cursorForTool(tool) }} />

            {edges.map((e) => {
              const a = itemCenter(e.fromId);
              const b = itemCenter(e.toId);
              if (!a || !b) return null;
              return <Connector key={e.id} from={a} to={b} color="#64748b" width={2} />;
            })}

            {pendingFrom && (
              <PendingConnectorHint center={itemCenter(pendingFrom)} />
            )}

            {shapes.map((s) => (
              <Shape
                key={s.id}
                item={s}
                onChange={updateShape}
                onSelect={handleSelect}
                selected={selectedId === s.id || pendingFrom === s.id}
              />
            ))}

            {notes.map((n) => (
              <StickyNote
                key={n.id}
                item={n}
                onChange={updateNote}
                onSelect={handleSelect}
                selected={selectedId === n.id}
              />
            ))}

            {tool === "pen" && (
              <Drawing
                strokes={strokes}
                onStrokeEnd={(s) => setStrokes((all) => [...all, s])}
                color="#0f172a"
                size={2.5}
                width={4000}
                height={4000}
                style={{ position: "absolute", left: -2000, top: -2000 }}
              />
            )}

            <CursorLayer cursors={cursors} />
          </Board>
        </div>

        <SidePanel
          stickyCount={stickyCount}
          shapeCount={shapeCount}
          edgeCount={edges.length}
          strokeCount={strokes.length}
          tool={tool}
          pendingFrom={pendingFrom}
          onClearStrokes={() => setStrokes([])}
          onResetView={() => setViewport({ x: 0, y: 0, zoom: 0.85 })}
        />
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Tip: pick a tool above, then click empty canvas. Alt+drag (or middle-click drag) the canvas to pan; Ctrl+wheel to zoom.
        Connector tool: click two items to link them.
      </p>
    </div>
  );
}

function cursorForTool(tool: Tool): string {
  switch (tool) {
    case "select": return "default";
    case "pen": return "crosshair";
    case "connector": return "alias";
    default: return "copy";
  }
}

function Toolbar({
  tool,
  setTool,
  colorIdx,
  setColorIdx,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  colorIdx: number;
  setColorIdx: (i: number) => void;
}) {
  const Tool = ({ id, icon, label }: { id: Tool; icon: string; label: string }) => (
    <Action
      icon={icon}
      active={tool === id}
      onClick={() => setTool(id)}
      title={label}
    >
      {label}
    </Action>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
      <Tool id="select" icon="mouse-pointer-2" label="Select" />
      <Tool id="sticky" icon="sticky-note" label="Sticky" />
      <Tool id="pen" icon="pencil" label="Pen" />
      <Tool id="rect" icon="square" label="Rect" />
      <Tool id="ellipse" icon="circle" label="Ellipse" />
      <Tool id="connector" icon="git-branch" label="Connect" />
      <span className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
      <span className="text-xs text-zinc-500">Sticky color:</span>
      <div className="flex items-center gap-1">
        {STICKY_COLORS.map((c, i) => (
          <button
            key={c}
            onClick={() => setColorIdx(i)}
            className={`h-6 w-6 rounded-full border-2 transition ${i === colorIdx ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"}`}
            style={{ background: c }}
            aria-label={`color ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function PresenceStrip({ cursors }: { cursors: RemoteCursor[] }) {
  return (
    <div className="flex items-center gap-1">
      {cursors.map((c) => (
        <div
          key={c.userId}
          title={c.name}
          className="-ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white first:ml-0 dark:ring-zinc-900"
          style={{ background: c.color }}
        >
          {(c.name ?? "?").slice(0, 1)}
        </div>
      ))}
      <Badge color="emerald" className="ml-2">{cursors.length} live</Badge>
    </div>
  );
}

function SidePanel({
  stickyCount,
  shapeCount,
  edgeCount,
  strokeCount,
  tool,
  pendingFrom,
  onClearStrokes,
  onResetView,
}: {
  stickyCount: number;
  shapeCount: number;
  edgeCount: number;
  strokeCount: number;
  tool: Tool;
  pendingFrom: string | null;
  onClearStrokes: () => void;
  onResetView: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Board state</h3>
        <p className="text-xs text-zinc-500">Live, controlled, JSON-serializable.</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Sticky notes" value={stickyCount} />
        <Stat label="Shapes" value={shapeCount} />
        <Stat label="Connectors" value={edgeCount} />
        <Stat label="Strokes" value={strokeCount} />
      </dl>
      <div className="rounded-md bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
        <div><span className="font-semibold">Tool:</span> {tool}</div>
        {pendingFrom && (
          <div className="mt-1 text-amber-700 dark:text-amber-400">
            Pick a target item to connect from <code>{pendingFrom}</code>.
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Action onClick={onClearStrokes} icon="eraser" size="sm">Clear drawing</Action>
        <Action onClick={onResetView} icon="maximize" size="sm">Reset view</Action>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function PendingConnectorHint({ center }: { center: { x: number; y: number } | null }) {
  if (!center) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: center.x - 16,
        top: center.y - 16,
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "2px dashed #f59e0b",
        pointerEvents: "none",
      }}
    />
  );
}
