import { useEffect, useRef } from "react";
// GRANULAR, never the `@babylonjs/core` barrel — and the barrel is what this
// file used to import.
//
// The cost is not what ships. Tree-shaking kept the emitted chunk small either
// way, so the bundle looked fine and the vite config even said Babylon was
// "already handled". The cost is what the BUILD has to hold: the barrel pulled
// 3,063 modules and 19.2MB of source into the graph — 49% of every byte the
// whole app transforms — and rolldown parses and retains all of it in order to
// tree-shake it. That is paid at build time whatever the output looks like,
// which is why it was invisible in the bundle report and fatal on the deploy
// box.
//
// Six symbols. Import each from its own module and none of the rest arrives.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { Stage, useStage } from "@particle-academy/fancy-3d-babylon/react";
import type { SceneObject, SceneState } from "@particle-academy/agent-integrations";

/**
 * A real 3D viewport for the playground's `scene` kind.
 *
 * The bridge's `SceneState` is a flat list of primitive solids — box / sphere /
 * cylinder / plane / screen at an xyz, with a colour. fancy-3d's own `Scene` is
 * a different model (widget nodes and edges), which is why this kind shipped as
 * a placeholder list: no renderer took this shape.
 *
 * There is one now, because `<Stage>` hands over the Babylon scene through
 * `useStage()` and lets this file own the mapping. That mapping is the whole of
 * the work; everything else was already wired.
 */

function color3(hex: string | undefined, fallback = "#a855f7"): Color3 {
    try {
        return Color3.FromHexString(hex ?? fallback);
    } catch {
        // An agent can put anything in `color`. A bad value should tint the
        // object wrong, not throw inside a render effect and blank the viewport.
        return Color3.FromHexString(fallback);
    }
}

function applyTransform(mesh: AbstractMesh, o: SceneObject): void {
    const [px, py, pz] = o.position ?? [0, 0, 0];
    const [rx, ry, rz] = o.rotation ?? [0, 0, 0];
    const [sx, sy, sz] = o.scale ?? [1, 1, 1];

    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    mesh.scaling.set(sx, sy, sz);
}

/** `SceneObject.kind` → a mesh. `group` is a transform, so it has none. */
function build(scene: BabylonScene, o: SceneObject): AbstractMesh | null {
    switch (o.kind) {
        case "sphere":
            return MeshBuilder.CreateSphere(o.id, { diameter: 1 }, scene);
        case "cylinder":
            return MeshBuilder.CreateCylinder(o.id, { height: 1, diameter: 1 }, scene);
        case "plane":
            return MeshBuilder.CreateGround(o.id, { width: 1, height: 1 }, scene);
        case "screen":
            // A screen stands up, and is double-sided so it does not vanish
            // when the camera swings behind it.
            return MeshBuilder.CreatePlane(o.id, { size: 1, sideOrientation: Mesh.DOUBLESIDE }, scene);
        case "group":
            return null;
        default:
            // Unknown kinds render as a box rather than disappearing: an agent
            // inventing a kind should see something land, not nothing.
            return MeshBuilder.CreateBox(o.id, { size: 1 }, scene);
    }
}

/** Depth-first, so a group's children render too. */
function flatten(objects: SceneObject[], out: SceneObject[] = []): SceneObject[] {
    for (const o of objects) {
        out.push(o);
        if (o.children?.length) flatten(o.children, out);
    }
    return out;
}

/**
 * Syncs the descriptor into the Babylon scene.
 *
 * Separate from `SceneViewport` because `useStage()` only resolves inside the
 * provider that `<Stage>` mounts.
 *
 * Meshes are DIFFED by object id rather than rebuilt. An agent driving `scene_*`
 * emits a mutation per call, so the state changes many times a second while it
 * works; disposing and recreating everything on each change would flicker the
 * scene and throw away the camera angle the human just set — the opposite of
 * watching the agent build something.
 */
function SceneMeshes({ scene: state }: { scene: SceneState }) {
    const { scene } = useStage();
    const meshes = useRef(new Map<string, AbstractMesh>());

    useEffect(() => {
        const live = meshes.current;
        const seen = new Set<string>();

        for (const o of flatten(state.objects ?? [])) {
            seen.add(o.id);

            let mesh = live.get(o.id);
            if (!mesh) {
                const created = build(scene, o);
                if (!created) continue;

                const mat = new StandardMaterial(`${o.id}-mat`, scene);
                mat.specularColor = Color3.Black();
                created.material = mat;

                live.set(o.id, created);
                mesh = created;
            }

            applyTransform(mesh, o);

            const mat = mesh.material;
            if (mat instanceof StandardMaterial) {
                mat.diffuseColor = color3(o.color);
                // A little emissive so an object still reads when it faces away
                // from the single default light.
                mat.emissiveColor = color3(o.color).scale(0.25);
            }
        }

        for (const [id, mesh] of live) {
            if (!seen.has(id)) {
                mesh.dispose();
                live.delete(id);
            }
        }
    }, [state, scene]);

    // Dispose on unmount only — not on every state change, which is what the
    // diff above exists to avoid.
    useEffect(() => {
        const live = meshes.current;
        return () => {
            for (const mesh of live.values()) mesh.dispose();
            live.clear();
        };
    }, []);

    return null;
}

export function SceneViewport({ scene }: { scene: SceneState }) {
    const target = scene.camera?.target ?? [0, 0, 0];
    const pos = scene.camera?.position ?? [4, 4, 8];
    // Babylon's ArcRotate camera takes a radius, not an eye position, so derive
    // one from the descriptor — otherwise `scene_set_camera` would move nothing.
    const radius = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]) || 10;

    return (
        <Stage
            className="h-[480px] w-full overflow-hidden rounded-lg"
            clearColor={scene.background ?? "#0b1020"}
            cameraTarget={target}
            cameraRadius={radius}
        >
            <SceneMeshes scene={scene} />
        </Stage>
    );
}
