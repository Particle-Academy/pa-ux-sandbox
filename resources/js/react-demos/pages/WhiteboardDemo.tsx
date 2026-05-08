import { useState } from "react";
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
} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { DemoSection } from "../components/DemoSection";

const initialNotes: StickyNoteItem[] = [
  { id: "n1", kind: "sticky", x: 80, y: 60, width: 180, height: 140, text: "Drag me!", color: "#fde68a" },
  { id: "n2", kind: "sticky", x: 320, y: 100, width: 180, height: 140, text: "I'm editable.", color: "#bbf7d0" },
  { id: "n3", kind: "sticky", x: 200, y: 280, width: 180, height: 140, text: "Alt+drag pans.\nCtrl+wheel zooms.", color: "#bfdbfe" },
];

const initialShapes: ShapeItem[] = [
  { id: "s1", kind: "shape", shape: "rect", x: 60, y: 60, width: 180, height: 100, text: "Idea" },
  { id: "s2", kind: "shape", shape: "ellipse", x: 320, y: 80, width: 160, height: 100 },
  { id: "s3", kind: "shape", shape: "rect", x: 540, y: 60, width: 180, height: 100, text: "Done" },
];

const fakeCursors: RemoteCursor[] = [
  { userId: "u1", name: "Ada", color: "#ec4899", x: 220, y: 90 },
  { userId: "u2", name: "Linus", color: "#10b981", x: 410, y: 220 },
];

export function WhiteboardDemo() {
  const [notes, setNotes] = useState<StickyNoteItem[]>(initialNotes);
  const [shapes, setShapes] = useState<ShapeItem[]>(initialShapes);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  const updateNote = (next: StickyNoteItem) =>
    setNotes((all) => all.map((x) => (x.id === next.id ? next : x)));
  const updateShape = (next: ShapeItem) =>
    setShapes((all) => all.map((x) => (x.id === next.id ? next : x)));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Whiteboard</h1>
        <p className="mt-2 text-zinc-500">
          Collaborative whiteboard primitives — Board, StickyNote, Drawing, Connector, Shape, Cursor.
          Transport-agnostic: components are controlled, host app owns state and realtime sync.
        </p>
      </header>

      <DemoSection
        title="Board with sticky notes"
        description="Drag notes, edit text inline, alt-drag the empty canvas to pan, ctrl+wheel to zoom."
        flush
      >
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950" style={{ height: 420 }}>
          <Board
            viewport={viewport}
            onViewportChange={setViewport}
            style={{ width: "100%", height: "100%" }}
          >
            {notes.map((n) => (
              <StickyNote key={n.id} item={n} onChange={updateNote} />
            ))}
          </Board>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          zoom: {viewport.zoom.toFixed(2)} · x: {viewport.x.toFixed(0)} · y: {viewport.y.toFixed(0)}
        </p>
      </DemoSection>

      <DemoSection
        title="Drawing layer"
        description="Freeform pen layer. Strokes stream via onStrokePoint so apps can broadcast in-progress drawing."
        flush
      >
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ height: 320 }}>
          <Drawing
            strokes={strokes}
            onStrokeEnd={(s) => setStrokes((all) => [...all, s])}
            color="#ef4444"
            size={3}
            width={800}
            height={320}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>{strokes.length} stroke{strokes.length === 1 ? "" : "s"}</span>
          <button
            onClick={() => setStrokes([])}
            className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Clear
          </button>
        </div>
      </DemoSection>

      <DemoSection
        title="Shapes & connectors"
        description="Drag shapes; connectors automatically follow them via simple host-side resolution."
        flush
      >
        <div className="relative rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ height: 280 }}>
          <Board defaultViewport={{ x: 0, y: 0, zoom: 1 }} style={{ width: "100%", height: "100%" }}>
            {shapes.map((s) => (
              <Shape key={s.id} item={s} onChange={updateShape} />
            ))}
            {connectorPairs(shapes).map(([from, to], i) => (
              <Connector key={i} from={from} to={to} />
            ))}
          </Board>
        </div>
      </DemoSection>

      <DemoSection
        title="Remote cursors"
        description="Static example; in a real app pipe pointer-move events through your transport at ~30Hz."
        flush
      >
        <div className="relative rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ height: 260 }}>
          <Board defaultViewport={{ x: 0, y: 0, zoom: 1 }} style={{ width: "100%", height: "100%" }}>
            <StickyNote
              item={{ id: "demo", kind: "sticky", x: 100, y: 80, width: 200, height: 120, text: "Imagine teammates editing this together.", color: "#fde68a" }}
              readOnly
            />
            <CursorLayer cursors={fakeCursors} />
          </Board>
        </div>
      </DemoSection>
    </div>
  );
}

function connectorPairs(shapes: ShapeItem[]) {
  const center = (s: ShapeItem) => ({ x: s.x + s.width / 2, y: s.y + s.height / 2 });
  const out: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
  for (let i = 0; i < shapes.length - 1; i++) {
    out.push([center(shapes[i]), center(shapes[i + 1])]);
  }
  return out;
}
