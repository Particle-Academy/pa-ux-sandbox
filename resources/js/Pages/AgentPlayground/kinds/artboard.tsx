/**
 * artboard kind — fancy-artboard <ArtBoard> driven by registerArtboardBridge.
 */
import { ArtBoard, type ArtBoardValue } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { registerArtboardBridge } from "@particle-academy/agent-integrations/bridges/artboard";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

type Viewport = { x: number; y: number; zoom: number };

export type ArtboardState = {
  value: ArtBoardValue;
  viewport: Viewport;
  focus: string | null;
};

const SEED: ArtboardState = {
  value: {
    sections: [
      {
        id: "intro",
        title: "Concepts",
        subtitle: "Agent drops design frames here",
        pieces: [
          {
            id: "p1",
            label: "Hero",
            width: 320,
            height: 200,
            content: { kind: "html", html: "<div style='padding:16px;font:14px sans-serif'>Ask the agent to add image / html frames via artboard_* tools.</div>" },
          },
        ],
      },
    ],
  },
  viewport: { x: 0, y: 0, zoom: 1 },
  focus: null,
};

function ArtboardSurface({ state, onChange }: SurfaceProps) {
  const s = state as ArtboardState;
  return (
    <div style={{ height: 480 }}>
      <ArtBoard
        value={s.value}
        onChange={(value) => onChange({ ...s, value })}
        viewport={s.viewport}
        onViewportChange={(viewport) => onChange({ ...s, viewport })}
        focus={s.focus}
        onFocusChange={(focus) => onChange({ ...s, focus })}
        className="h-full w-full"
      />
    </div>
  );
}

export const artboardKind: KindModule = {
  kind: "artboard",
  label: "Artboard",
  description: "A Figma-style design canvas of image/html frames grouped in sections. Drive it with artboard_* tools.",
  status: "wired",
  createState: (): ArtboardState => structuredClone(SEED),
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as ArtboardState) ?? SEED;
    return registerArtboardBridge(server, {
      adapter: {
        getValue: () => read().value,
        setValue: (next) => {
          const cur = read();
          const value = typeof next === "function" ? (next as (p: ArtBoardValue) => ArtBoardValue)(cur.value) : next;
          ctx.setActiveState({ ...cur, value });
        },
        getViewport: () => read().viewport,
        setViewport: (viewport) => ctx.setActiveState({ ...read(), viewport }),
        getFocus: () => read().focus,
        setFocus: (focus) => ctx.setActiveState({ ...read(), focus }),
      },
      agent: ctx.agent,
    });
  },
  Surface: ArtboardSurface,
};
