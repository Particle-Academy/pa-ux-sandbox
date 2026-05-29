/**
 * scene kind — registerSceneBridge over a fancy-3d SceneState.
 *
 * STATUS: STUB (bridge fully wired, surface is a placeholder visualizer).
 *
 * Why a stub: the scene bridge's `SceneState` is the engine-agnostic 3D
 * descriptor (boxes / spheres / screens at xyz). fancy-3d's actual renderers
 * (`Canvas` from /canvas, the Babylon adapter) are heavier mounts that don't
 * accept this SceneState shape directly, so a faithful live 3D viewport is
 * out of scope for this pass. The bridge is real — an agent can fully
 * read/write the scene via scene_* tools — and the surface renders the live
 * object list so the human sees every mutation land. Swap this Surface for a
 * fancy-3d/canvas or babylon mount to make it a fully-wired kind.
 */
import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { registerSceneBridge, type SceneState } from "@particle-academy/agent-integrations";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type SceneKindState = { scene: SceneState };

const seed = (): SceneKindState => ({
  scene: {
    background: "#0b1020",
    camera: { position: [4, 4, 8], target: [0, 0, 0], fov: 50 },
    objects: [
      { id: "ground", kind: "plane", position: [0, 0, 0], scale: [10, 1, 10], color: "#1e293b" },
      { id: "box-1", kind: "box", position: [0, 0.5, 0], color: "#a855f7" },
    ],
  },
});

function SceneSurface({ state }: SurfaceProps) {
  const s = state as SceneKindState;
  return (
    <div style={{ minHeight: 480 }} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-3 flex items-center gap-2">
        <Heading as="h3" size="md">Scene (placeholder visualizer)</Heading>
        <Badge color="amber">stub surface · live bridge</Badge>
      </div>
      <Text className="mb-4 block text-sm text-zinc-500">
        The scene_* bridge is fully wired — every agent mutation updates the object list below. Swap this for a
        fancy-3d/canvas or Babylon mount to render a real 3D viewport.
      </Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {s.scene.objects.map((o) => (
          <Card key={o.id}>
            <Card.Body>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ background: o.color ?? "#888" }}
                  aria-hidden
                />
                <span className="font-mono text-xs">{o.kind}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-zinc-500">{o.id}</div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">
                pos {JSON.stringify(o.position ?? [0, 0, 0])}
              </div>
            </Card.Body>
          </Card>
        ))}
        {s.scene.objects.length === 0 && (
          <Text className="text-sm text-zinc-500">Empty scene — agent adds objects via scene_add_object.</Text>
        )}
      </div>
    </div>
  );
}

export const sceneKind: KindModule = {
  kind: "scene",
  label: "Scene (3D)",
  description: "An engine-agnostic 3D scene (boxes / spheres / screens). Drive it with scene_* tools. Surface is a placeholder list.",
  status: "stub",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as SceneKindState) ?? seed();
    return registerSceneBridge(server, {
      adapter: {
        id: "playground-scene",
        title: "Scene",
        getScene: () => read().scene,
        setScene: (scene) => ctx.setActiveState({ scene }),
        setCamera: (camera) => ctx.setActiveState({ scene: { ...read().scene, camera } }),
      },
      agent: ctx.agent,
    });
  },
  Surface: SceneSurface,
};
