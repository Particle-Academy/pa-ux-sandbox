/**
 * whiteboard kind — fancy-whiteboard <Board> driven by registerWhiteboardBridge.
 */
import {
  Board,
  StickyNote,
  CursorLayer,
  type StickyNoteItem,
  type RemoteCursor,
  type Viewport,
} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { AgentCursor } from "@particle-academy/agent-integrations";
import "@particle-academy/agent-integrations/styles.css";
import { registerWhiteboardBridge } from "@particle-academy/agent-integrations/bridges/whiteboard";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type WhiteboardState = {
  notes: StickyNoteItem[];
  strokes: unknown[];
  viewport: Viewport;
  agentCursor: RemoteCursor | null;
};

const seed = (): WhiteboardState => ({
  notes: [
    { id: "seed", kind: "sticky", x: 60, y: 60, width: 220, height: 100, text: "Agent can add notes here via whiteboard_* tools.", color: "#fde68a" },
  ],
  strokes: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  agentCursor: null,
});

function WhiteboardSurface({ state, onChange }: SurfaceProps) {
  const s = state as WhiteboardState;
  const cursors: RemoteCursor[] = s.agentCursor ? [s.agentCursor] : [];
  return (
    <div
      style={{ height: 480, position: "relative" }}
      className="rounded-lg bg-[radial-gradient(circle_at_1px_1px,_#d4d4d8_1px,_transparent_0)] [background-size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,_#3f3f46_1px,_transparent_0)]"
    >
      <Board
        viewport={s.viewport}
        onViewportChange={(viewport) => onChange({ ...s, viewport })}
        style={{ width: "100%", height: "100%" }}
      >
        {s.notes.map((n) => (
          <StickyNote
            key={n.id}
            item={n}
            onChange={(next) => onChange({ ...s, notes: s.notes.map((x) => (x.id === next.id ? next : x)) })}
          />
        ))}
        <CursorLayer cursors={cursors} />
        {s.agentCursor && (
          <AgentCursor x={s.agentCursor.x} y={s.agentCursor.y} name={s.agentCursor.name} color={s.agentCursor.color} />
        )}
      </Board>
    </div>
  );
}

export const whiteboardKind: KindModule = {
  kind: "whiteboard",
  label: "Whiteboard",
  description: "A collaborative whiteboard of sticky notes + strokes. Drive it with whiteboard_* tools.",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as WhiteboardState) ?? seed();
    const apply = (patch: Partial<WhiteboardState>) => ctx.setActiveState({ ...read(), ...patch });
    return registerWhiteboardBridge(server, {
      adapter: {
        getNotes: () => read().notes,
        setNotes: (n) => apply({ notes: typeof n === "function" ? (n as (p: StickyNoteItem[]) => StickyNoteItem[])(read().notes) : (n as StickyNoteItem[]) }),
        getShapes: () => [],
        setShapes: () => {},
        getConnectors: () => [],
        setConnectors: () => {},
        getStrokes: () => read().strokes as never[],
        setStrokes: (s) => apply({ strokes: typeof s === "function" ? (s as (p: unknown[]) => unknown[])(read().strokes) : (s as unknown[]) }),
        getViewport: () => read().viewport,
        setViewport: (viewport) => apply({ viewport }),
        setAgentCursor: (agentCursor) => apply({ agentCursor: agentCursor as RemoteCursor | null }),
      },
      agent: ctx.agent,
    });
  },
  Surface: WhiteboardSurface,
};
