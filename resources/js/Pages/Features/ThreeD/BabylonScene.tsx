import { useEffect, useMemo } from "react";
import { Monitor, Stage, useStage } from "@particle-academy/fancy-3d-babylon/react";
import { createCard3D } from "@particle-academy/fancy-3d-babylon";
import { domAdapter } from "@particle-academy/fancy-3d/dom";
import type { Scene } from "@particle-academy/fancy-3d";
import { toWorld, type WorldPlacement } from "./sceneModel";
import type { EngineSceneProps } from "./engineProps";

/**
 * The demo scene on Babylon.js, through fancy-3d-babylon.
 *
 * Both of the adapter's ways of putting UI in 3D, side by side: the KPI node is
 * a `<Monitor>` (Mount mode: live React DOM projected onto the mesh, so it
 * stays selectable and accessible), and every other node is a `createCard3D`
 * mesh with the widget painted onto its face (Texture mode).
 *
 * Loaded on demand, so @babylonjs/core is only fetched by a visitor who picks
 * this engine.
 */
export default function BabylonScene({ scene, cameraAlpha }: EngineSceneProps) {
    // Babylon.js is left-handed: seen from the adapter's default camera (+Z),
    // +X is on the viewer's LEFT. Mirror X so the scene reads as it does in
    // the DOM, and turn the Monitor to face that camera.
    const placements = useMemo(() => toWorld(scene).map((p) => ({ ...p, x: -p.x })), [scene]);
    const monitorNode = scene.nodes.find((n) => n.widget.kind === "kpi");
    const monitorAt = placements.find((p) => p.id === monitorNode?.id);

    return (
        <Stage cameraRadius={8} cameraTarget={[0, 1.5, 0]} cameraAlpha={cameraAlpha} clearColor="#0d0a1a" className="threed-stage">
            {monitorNode && monitorAt && (
                <Monitor position={[monitorAt.x, monitorAt.y, monitorAt.z]} rotationY={Math.PI} width={monitorAt.width} height={monitorAt.height} pixelWidth={monitorAt.width * 110} pixelHeight={monitorAt.height * 110} bezel="#0b0f17">
                    {domAdapter.render(monitorNode.widget, { nodeId: monitorNode.id, selected: false })}
                </Monitor>
            )}
            <PaintedCards scene={scene} placements={placements} skip={monitorNode?.id} />
        </Stage>
    );
}

function PaintedCards({ scene, placements, skip }: { scene: Scene; placements: WorldPlacement[]; skip?: string }) {
    const { scene: babylon } = useStage();
    // Rebuild only when a painted node's data changes, not on every render.
    const key = JSON.stringify(scene.nodes.filter((n) => n.id !== skip));

    useEffect(() => {
        const meshes = scene.nodes
            .filter((n) => n.id !== skip)
            .map((node) => {
                const at = placements.find((p) => p.id === node.id);
                if (!at) return null;
                const mesh = createCard3D({ scene: babylon, name: node.id, width: at.width, height: at.height, depth: 0.08, front: { type: "widget", widget: node.widget } });
                mesh.position.set(at.x, at.y, at.z);
                return mesh;
            });
        return () => meshes.forEach((mesh) => mesh?.dispose(false, true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [babylon, key]);

    return null;
}
