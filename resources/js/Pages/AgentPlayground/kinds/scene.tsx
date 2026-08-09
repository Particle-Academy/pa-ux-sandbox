/**
 * scene kind — registerSceneBridge over a fancy-3d SceneState.
 *
 * STATUS: fully wired — a real 3D viewport, not a placeholder.
 *
 * The surface was a list for a while, because the bridge's `SceneState` is a
 * flat descriptor of primitive solids (box / sphere / screen at an xyz) and
 * fancy-3d's own `Scene` is a different model — widget nodes and edges — so no
 * renderer took this shape. `<Stage>` from the Babylon adapter does hand over
 * its scene, so `SceneViewport` owns the SceneObject → mesh mapping and the
 * human now watches the agent build in 3D.
 *
 * The object list stays, beneath the viewport: it is the readable record of
 * what the agent did, and a mesh you are looking at from the wrong angle is
 * not one.
 */
import { lazy, Suspense } from "react";
import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { registerSceneBridge, type SceneState } from "@particle-academy/agent-integrations";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

/**
 * LAZY on purpose. `scene-viewport` statically imports @babylonjs/core, and the
 * playground bundles every kind into one chunk — so a static import here pulled
 * a WebGL engine into the page for anyone opening the form or grid kind, and
 * the chunk got heavy enough that the whole playground failed to render.
 *
 * Loading it only when the scene kind is on screen is both the fix and the
 * correct shape: nobody should pay for Babylon to look at a form.
 */
const SceneViewport = lazy(() =>
  import("./scene-viewport").then((m) => ({ default: m.SceneViewport })),
);

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
        <Heading as="h3" size="md">Scene</Heading>
        <Badge color="violet">live 3D · {s.scene.objects.length} object{s.scene.objects.length === 1 ? "" : "s"}</Badge>
      </div>

      <Suspense
        fallback={
          <div className="grid h-[480px] w-full place-items-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
            Loading the 3D viewport…
          </div>
        }
      >
        <SceneViewport scene={s.scene} />
      </Suspense>

      <Text className="mb-3 mt-4 block text-sm text-zinc-500">
        Every scene_* mutation lands in the viewport above. The list below is the same scene as data — drag to orbit.
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
  description: "An engine-agnostic 3D scene (boxes / spheres / screens) rendered in a live Babylon viewport. Drive it with scene_* tools and watch it build.",
  status: "wired",
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
