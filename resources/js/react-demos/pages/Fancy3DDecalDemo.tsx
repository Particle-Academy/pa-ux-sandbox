import { useEffect, useState } from "react";
// Granular @babylonjs/core imports (not the barrel) — keeps the lazy 3D chunk small.
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createDecal, createPanel } from "@particle-academy/fancy-3d-babylon";
import { Stage, useStage } from "@particle-academy/fancy-3d-babylon/react";
import { Badge, Card } from "@particle-academy/react-fancy";

function paintLogo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = `700 ${h * 0.22}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FANCY", w / 2, h / 2);
}

function DecalScene() {
  const { scene } = useStage();
  const [pickedAt, setPickedAt] = useState<{ x: number; y: number; z: number } | null>(null);

  useEffect(() => {
    // Target — a slightly tessellated sphere so decals can conform to curvature.
    const target = MeshBuilder.CreateSphere("target", { diameter: 4, segments: 32 }, scene);
    const mat = new StandardMaterial("target-mat", scene);
    mat.diffuseColor = new Color3(0.18, 0.2, 0.28);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    target.material = mat;

    // Floor
    const floor = createPanel({ scene, name: "floor", width: 10, height: 10, surface: { type: "color", color: "#0b1220" } });
    floor.position.y = -2;
    floor.rotation.x = Math.PI / 2;

    const decals: Mesh[] = [];

    // Pre-place a few decals on the sphere — logo, sticker, paint widget.
    const presetDecal = (position: Vector3, normal: Vector3, surface: Parameters<typeof createDecal>[0]["surface"]) => {
      const d = createDecal({
        scene,
        target,
        position,
        normal,
        size: { width: 1.6, height: 1.0, depth: 1.2 },
        surface,
      });
      decals.push(d);
    };

    // Front-of-sphere logo
    presetDecal(
      new Vector3(0, 0.4, -2),
      new Vector3(0, 0, -1),
      { type: "paint", paint: paintLogo, transparent: true }
    );

    // Top-right widget — a real fancy widget projected onto the curve
    presetDecal(
      new Vector3(1.4, 1.4, -1.2),
      new Vector3(0.7, 0.7, -1),
      { type: "widget", widget: { kind: "demoPage", name: "Decal", description: "Projected from a virtual camera onto the underlying mesh.", path: "/decal", accent: "#22d3ee", category: "Primitive" } }
    );

    // Click-to-stamp: pick the sphere, drop a decal at the hit point.
    const sub = scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERPICK) return;
      const info = pi.pickInfo;
      if (!info?.hit || info.pickedMesh !== target) return;
      const point = info.pickedPoint;
      const normal = info.getNormal(true);
      if (!point || !normal) return;
      const d = createDecal({
        scene,
        target,
        position: point,
        normal,
        size: { width: 0.8, height: 0.8, depth: 0.8 },
        surface: { type: "paint", paint: paintLogo, transparent: true },
      });
      decals.push(d);
      setPickedAt({ x: +point.x.toFixed(2), y: +point.y.toFixed(2), z: +point.z.toFixed(2) });
    });

    return () => {
      scene.onPointerObservable.remove(sub);
      decals.forEach((d) => d.dispose());
      target.dispose();
      floor.dispose();
    };
  }, [scene]);

  return null;
}

export function Fancy3DDecalDemo() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold">createDecal</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          Project any <code className="text-xs">SurfaceContent</code> onto an arbitrary 3D mesh.
          The decal conforms to the underlying geometry, so a flat 2D pattern (logo, sticker, widget) wraps
          around curves and irregular surfaces. <strong>Click anywhere on the sphere</strong> to stamp another decal.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge color="indigo" size="sm">click to stamp</Badge>
        <Badge color="zinc" size="sm">2 preset decals</Badge>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 280px" }}>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 560 }}>
          <Stage cameraRadius={6} cameraTarget={[0, 0, 0]} cameraAlpha={Math.PI / 2} cameraBeta={Math.PI / 2.3} className="h-full w-full">
            <DecalScene />
          </Stage>
        </div>

        <Card>
          <Card.Header>
            <div className="text-sm font-semibold">How it works</div>
          </Card.Header>
          <Card.Body className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              <code>createDecal</code> wraps Babylon's <code>MeshBuilder.CreateDecal</code>: given a target
              mesh, a hit point, and a normal direction, it generates a sub-mesh that conforms to the
              target's surface and applies a material from your <code>SurfaceContent</code>.
            </p>
            <p className="mt-3">
              On click we read the picked-point + normal and call createDecal with a paint callback. Each
              click adds a new decal mesh — they accumulate.
            </p>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
