/**
 * composition kind — a Fancy UI page authored as JSON.
 *
 * The agent emits a `ScreenSchema` (via `screens_update_content`, whose
 * `partial` we treat as `{ schema }`) and fancy-screens' `<Screen schema>`
 * mode renders react-fancy components from the registry in
 * `../schemaComponents.ts`.
 *
 * There's no dedicated bridge here — composition screens are driven entirely
 * through the screens bridge's `updateScreenContent`. We still expose a no-op
 * `register` so the kind contract is uniform.
 */
import { renderSchema, type ScreenSchema } from "@particle-academy/fancy-screens";
import type { KindModule, SurfaceProps } from "./types";

export type CompositionState = { schema: ScreenSchema | null };

const SEED: ScreenSchema = {
  type: "Card",
  children: [
    {
      type: "Card.Body",
      children: [
        { type: "Heading", props: { level: 2 }, children: ["Composition screen"] },
        {
          type: "Text",
          children: [
            "This page is rendered from agent-emitted JSON. Call screens_update_content on this screen with { schema: { type, props, children } } to replace it with any react-fancy layout.",
          ],
        },
        { type: "Separator" },
        { type: "Badge", props: { tone: "info" }, children: ["awaiting agent"] },
      ],
    },
  ],
};

function CompositionSurface({ state }: SurfaceProps) {
  const { schema } = (state as CompositionState) ?? { schema: null };
  if (!schema) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        Empty composition. The agent populates it via screens_update_content.
      </div>
    );
  }
  return <div className="p-4">{renderSchema(schema)}</div>;
}

export const compositionKind: KindModule = {
  kind: "composition",
  label: "Composition",
  description:
    "A Fancy UI page rendered from agent-emitted JSON (ScreenSchema). Drive it with screens_update_content; partial = { schema }.",
  status: "wired",
  createState: (): CompositionState => ({ schema: SEED }),
  // Composition is steered through the screens bridge, not a per-kind bridge.
  register: () => ({ dispose: () => {} }),
  Surface: CompositionSurface,
};
