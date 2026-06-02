import { useEffect, useState } from "react";
import { Vector3 } from "@babylonjs/core";
import {
  createBillboard,
  sceneBounds,
  placeOnArc,
  placeOnGrid,
  placeOnPath,
  placeOnSphere,
  placeOnWall,
} from "@particle-academy/fancy-3d-babylon";
import { Stage, useStage } from "@particle-academy/fancy-3d-babylon/react";
import { Button, Badge } from "@particle-academy/react-fancy";
import type { Scene as SceneSpec } from "@particle-academy/fancy-3d";

type LayoutKind = "grid" | "wall" | "arc" | "sphere" | "path";

const ACCENTS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#22d3ee", "#a855f7", "#84cc16", "#ec4899", "#0ea5e9", "#fb923c", "#facc15", "#7c3aed"];

function makeScene(): SceneSpec {
  const nodes = ACCENTS.map((accent, i) => ({
    id: `node-${i}`,
    position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 140 },
    size: { w: 200, h: 120 },
    widget: {
      kind: "demoPage" as const,
      name: `Tile ${i + 1}`,
      description: "Same scene, swappable layout.",
      path: `/tile-${i + 1}`,
      accent,
      category: "Layout",
    },
  }));
  return { nodes, edges: [] };
}

const SCENE = makeScene();

function LayoutScene({ kind }: { kind: LayoutKind }) {
  const { scene } = useStage();
  useEffect(() => {
    const bounds = sceneBounds(SCENE);
    const meshes = SCENE.nodes.map((node) => {
      const mesh = createBillboard({
        scene,
        name: `${kind}-${node.id}`,
        width: 1.6,
        height: 1.0,
        surface: { type: "widget", widget: node.widget },
      });
      switch (kind) {
        case "grid":
          placeOnGrid(node, mesh, bounds, { scale: 1 / 90 });
          break;
        case "wall":
          placeOnWall(node, mesh, bounds, { spreadX: 9, spreadY: 4, centerY: 0.5, z: 0 });
          break;
        case "arc":
          placeOnArc(node, mesh, bounds, { radius: 5, arc: Math.PI * 1.1, height: 4, baseY: -1 });
          break;
        case "sphere":
          placeOnSphere(node, mesh, bounds, { radius: 4.5, latSpan: Math.PI * 0.55, lonSpan: Math.PI * 1.4, center: new Vector3(0, 0, 0) });
          break;
        case "path":
          placeOnPath(node, mesh, bounds, {
            waypoints: [
              new Vector3(-6, -1, 2),
              new Vector3(-3, 0.5, -1),
              new Vector3(0, 1.5, 0),
              new Vector3(3, 0.5, -1),
              new Vector3(6, -1, 2),
            ],
            faceForward: true,
          });
          break;
      }
      return mesh;
    });
    return () => meshes.forEach((m) => m.dispose());
  }, [scene, kind]);
  return null;
}

export function Fancy3DLayoutsDemo() {
  const [kind, setKind] = useState<LayoutKind>("arc");

  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold">Layout helpers</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          The same 12-node <code className="text-xs">Scene</code> rendered through five
          different layout helpers. Each helper takes the node's 2D position +
          scene bounds and writes a 3D world position (and rotation) onto the
          mesh. Drag to orbit, scroll to zoom.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["arc", "wall", "grid", "sphere", "path"] as const).map((k) => (
          <Button
            key={k}
            variant="default"
            color={kind === k ? "indigo" : undefined}
            size="sm"
            onClick={() => setKind(k)}
          >
            placeOn{k.charAt(0).toUpperCase() + k.slice(1)}
          </Button>
        ))}
        <Badge size="sm" color="indigo">{kind}</Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 580 }}>
        <Stage
          key={kind}
          cameraRadius={kind === "wall" ? 9 : 11}
          cameraTarget={[0, 0.8, 0]}
          cameraAlpha={Math.PI / 2}
          cameraBeta={Math.PI / 2.3}
          className="h-full w-full"
        >
          <LayoutScene kind={kind} />
        </Stage>
      </div>
    </div>
  );
}
