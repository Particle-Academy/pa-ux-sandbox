/**
 * slides kind — fancy-slides <DeckEditor> driven by registerSlidesBridge.
 *
 * The slides bridge funnels every agent mutation through `apply(op)`, which
 * we implement as `setDeck(reduceDeck(deck, op))` — the same reducer the
 * editor uses, so human + agent edits take identical paths.
 *
 * NOTE: @particle-academy/fancy-slides ships without .d.ts declarations, so
 * its imports are untyped here (same as the existing SlidesDemo). The bridge
 * still type-checks because registerSlidesBridge declares its own DeckOp type.
 */
import { DeckEditor, defaultTheme, reduceDeck, type Deck, type DeckOp } from "@particle-academy/fancy-slides";
import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";
import "@particle-academy/fancy-slides/styles.css";
import { registerSlidesBridge } from "@particle-academy/agent-integrations/bridges/slides";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type SlidesState = { deck: Deck };

const seed = (): SlidesState => ({
  deck: {
    id: "playground-deck",
    title: "Playground deck",
    theme: defaultTheme,
    slides: [
      {
        id: "s-intro",
        layout: "title",
        elements: [
          {
            id: "e-title",
            type: "text",
            x: 0.08,
            y: 0.4,
            w: 0.84,
            h: 0.18,
            content: "Agent-authored deck",
            format: "plain",
            style: { fontSize: 72, weight: "bold", align: "center", color: "#0f172a" },
          },
        ],
        notes: "Ask the agent to add slides + elements via deck_* / slide_* / element_* tools.",
      },
    ],
  } as Deck,
});

function SlidesSurface({ state, onChange }: SurfaceProps) {
  const s = state as SlidesState;
  return (
    <div style={{ height: 480 }} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <DeckEditor
        value={s.deck}
        onChange={(deck: Deck) => onChange({ deck })}
        renderElement={defaultElementRegistry}
      />
    </div>
  );
}

export const slidesKind: KindModule = {
  kind: "slides",
  label: "Slides",
  description: "A presentation deck editor. Drive it with deck_* / slide_* / element_* tools.",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as SlidesState) ?? seed();
    return registerSlidesBridge(server, {
      adapter: {
        getDeck: () => read().deck,
        apply: (op: DeckOp) => ctx.setActiveState({ deck: reduceDeck(read().deck, op) }),
      },
      agent: ctx.agent,
    });
  },
  Surface: SlidesSurface,
};
