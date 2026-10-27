import { useEffect, useMemo } from "react";
import { Monitor, Stage, useStage } from "@particle-academy/fancy-3d-three/react";
import { createCard3D } from "@particle-academy/fancy-3d-three";
import { domAdapter } from "@particle-academy/fancy-3d/dom";
import type { Scene } from "@particle-academy/fancy-3d";
import { toWorld, type WorldPlacement } from "./sceneModel";
import type { EngineSceneProps } from "./engineProps";

/**
 * The same demo scene on three.js, through fancy-3d-three. The adapter mirrors
 * fancy-3d-babylon's API, so this file is BabylonScene.tsx with the imports
 * swapped and three's own disposal.
 *
 * Loaded on demand, so `three` is only fetched by a visitor who picks it.
 */
export default function ThreeScene({ scene, cameraAlpha }: EngineSceneProps) {
    const placements = useMemo(() => toWorld(scene), [scene]);
    const monitorNode = scene.nodes.find((n) => n.widget.kind === "kpi");
    const monitorAt = placements.find((p) => p.id === monitorNode?.id);

    return (
        <Stage cameraRadius={8} cameraTarget={[0, 1.5, 0]} cameraAlpha={cameraAlpha} clearColor="#0d0a1a" className="threed-stage">
            {monitorNode && monitorAt && (
                <Monitor position={[monitorAt.x, monitorAt.y, monitorAt.z]} width={monitorAt.width} height={monitorAt.height} pixelWidth={monitorAt.width * 110} pixelHeight={monitorAt.height * 110} bezel="#0b0f17">
                    {domAdapter.render(monitorNode.widget, { nodeId: monitorNode.id, selected: false })}
                </Monitor>
            )}
            <PaintedCards scene={scene} placements={placements} skip={monitorNode?.id} />
        </Stage>
    );
}

/**
 * The slice of three's Mesh this file touches. `three` ships no types of its
 * own and the showcase does not install @types/three, so name only what is used.
 */
type Disposable = { dispose(): void };
type CardMesh = {
    removeFromParent(): unknown;
    geometry: Disposable;
    material: (Disposable & { map?: Disposable | null }) | (Disposable & { map?: Disposable | null })[];
};

function dispose(mesh: CardMesh) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
        material.map?.dispose();
        material.dispose();
    }
}

function PaintedCards({ scene, placements, skip }: { scene: Scene; placements: WorldPlacement[]; skip?: string }) {
    const { scene: three } = useStage();
    const key = JSON.stringify(scene.nodes.filter((n) => n.id !== skip));

    useEffect(() => {
        const meshes = scene.nodes
            .filter((n) => n.id !== skip)
            .map((node) => {
                const at = placements.find((p) => p.id === node.id);
                if (!at) return null;
                const mesh = createCard3D({ scene: three, name: node.id, width: at.width, height: at.height, depth: 0.08, front: { type: "widget", widget: node.widget } });
                mesh.position.set(at.x, at.y, at.z);
                return mesh;
            });
        return () => meshes.forEach((mesh) => mesh && dispose(mesh as unknown as CardMesh));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [three, key]);

    return null;
}
