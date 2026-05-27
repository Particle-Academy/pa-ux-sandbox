import { useEffect } from "react";
import { Vector3 } from "@babylonjs/core";
import { createCard3D, createPanel } from "@particle-academy/fancy-3d-babylon";
import { Stage, useStage } from "@particle-academy/fancy-3d-babylon/react";

function Card3DScene() {
  const { scene } = useStage();
  useEffect(() => {
    const cards = [
      { title: "Monthly Revenue", value: "$48.2k", delta: "+12.4%", trend: "up" as const, x: -3.0 },
      { title: "Active Users", value: "12,847", delta: "+3.1%", trend: "up" as const, x: -1.0 },
      { title: "Churn Rate", value: "2.1%", delta: "-0.4%", trend: "down" as const, x: 1.0 },
      { title: "Conversion", value: "4.7%", delta: "+0.3%", trend: "up" as const, x: 3.0 },
    ];

    const meshes = cards.map((c) => {
      const m = createCard3D({
        scene,
        name: `card3d-${c.title}`,
        width: 1.7, height: 1.0, depth: 0.18,
        front: {
          type: "widget",
          widget: { kind: "kpi", label: c.title, value: c.value, delta: c.delta, trend: c.trend },
        },
        edge: { type: "color", color: "#0b0f17" },
      });
      m.position = new Vector3(c.x, 1.0, 0);
      return m;
    });

    // Floor
    const floor = createPanel({ scene, name: "floor", width: 12, height: 6, surface: { type: "color", color: "#0b1220" } });
    floor.rotation.x = Math.PI / 2;
    floor.position.y = 0;

    return () => {
      meshes.forEach((m) => m.dispose());
      floor.dispose();
    };
  }, [scene]);
  return null;
}

export function Fancy3DCard3DDemo() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold">createCard3D</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          An <strong>extruded panel</strong> — a thin box with a face surface and a contrasting edge color.
          Adds physical depth so UI cards feel like real objects in the scene rather than floating paper.
          Foundation for upcoming "bump-out" / puffy primitives. Drag to orbit.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 520 }}>
        <Stage cameraRadius={7} cameraTarget={[0, 0.8, 0]} cameraAlpha={Math.PI / 2} cameraBeta={Math.PI / 2.6} className="h-full w-full">
          <Card3DScene />
        </Stage>
      </div>
    </div>
  );
}
