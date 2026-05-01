import { useEffect } from "react";
import { Color3, Vector3 } from "@babylonjs/core";
import {
  createBillboard,
  createBuilding,
  createCard3D,
  createCurvedPanel,
  createCylinder,
  createDisc,
  createPanel,
  createPillar,
  createSphere,
} from "@particle-academy/fancy-3d/babylon";
import { Stage, useStage } from "@particle-academy/fancy-3d/react";
import { Card } from "@particle-academy/react-fancy";

function PrimitivesScene() {
  const { scene } = useStage();
  useEffect(() => {
    const meshes = [
      // createPanel — flat, single-faced
      (() => {
        const m = createPanel({
          scene, name: "demo-panel", width: 1.6, height: 1.0,
          surface: { type: "widget", widget: { kind: "kpi", label: "Panel", value: "$48k", delta: "+12%", trend: "up" } },
        });
        m.position = new Vector3(-4.5, 1.4, 0);
        return m;
      })(),

      // createBillboard — face-camera plane
      (() => {
        const m = createBillboard({
          scene, name: "demo-billboard", width: 1.6, height: 1.0, faceCamera: true,
          surface: { type: "widget", widget: { kind: "callout", tone: "warning", title: "Billboard", body: "I always face the camera." } },
        });
        m.position = new Vector3(-2.5, 1.4, 0);
        return m;
      })(),

      // createCard3D — extruded panel with depth
      (() => {
        const m = createCard3D({
          scene, name: "demo-card3d", width: 1.6, height: 1.0, depth: 0.18,
          front: { type: "widget", widget: { kind: "kpi", label: "Card3D", value: "1,420", delta: "+3%", trend: "up" } },
        });
        m.position = new Vector3(-0.5, 1.4, 0);
        return m;
      })(),

      // createBuilding — box with per-face surfaces
      (() => {
        const wall = (color: string) => ({
          type: "paint" as const,
          paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#0b1220";
            for (let r = 0; r < 4; r++) {
              for (let c = 0; c < 3; c++) {
                ctx.fillRect(20 + c * 70, 20 + r * 50, 50, 30);
              }
            }
          },
        });
        const m = createBuilding({
          scene, name: "demo-building",
          width: 1.4, height: 2.4, depth: 1.4,
          faces: { front: wall("#1e293b"), back: wall("#27272a"), left: wall("#1f2937"), right: wall("#1c1f33"), top: { type: "color", color: "#1f2937" } },
        });
        m.position = new Vector3(1.5, 1.2, 0);
        return m;
      })(),

      // createPillar — narrow tall building
      (() => {
        const m = createPillar({ scene, name: "demo-pillar", thickness: 0.3, height: 2.2, surface: { type: "color", color: "#312e81" } });
        m.position = new Vector3(3.2, 1.1, 0);
        return m;
      })(),

      // createCylinder — capped cylinder
      (() => {
        const m = createCylinder({ scene, name: "demo-cyl", radius: 0.5, height: 1.8, surface: { type: "color", color: "#0e7490" } });
        m.position = new Vector3(4.5, 0.9, 0);
        return m;
      })(),

      // createCurvedPanel — partial cylinder section
      (() => {
        const m = createCurvedPanel({
          scene, name: "demo-curved", width: 2.6, height: 1.2, arc: Math.PI / 1.4,
          surface: { type: "widget", widget: { kind: "demoPage", name: "Curved", description: "A curved billboard wrap. Same painter, bent geometry.", path: "/curved", accent: "#22d3ee", category: "Primitive" } },
        });
        m.position = new Vector3(-3.5, -0.4, 1.5);
        return m;
      })(),

      // createSphere
      (() => {
        const m = createSphere({ scene, name: "demo-sphere", diameter: 1.2, surface: { type: "color", color: "#a855f7" } });
        m.position = new Vector3(-1.0, -0.2, 1.5);
        return m;
      })(),

      // createDisc — flat disc
      (() => {
        const m = createDisc({ scene, name: "demo-disc", radius: 0.6, surface: { type: "color", color: "#facc15" } });
        m.position = new Vector3(0.6, -0.2, 1.5);
        m.rotation.x = Math.PI / 2; // lay it flat
        return m;
      })(),
    ];
    return () => meshes.forEach((m) => m.dispose());
  }, [scene]);
  return null;
}

export function Fancy3DPrimitivesDemo() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold">fancy-3d primitives</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          Every shape primitive shipped today, in one Babylon scene. Each accepts a{" "}
          <code className="text-xs">SurfaceContent</code> — color, paint callback, or any{" "}
          <code className="text-xs">WidgetSpec</code>. Drag to orbit, scroll to zoom.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 520 }}>
        <Stage cameraRadius={9} cameraTarget={[0, 0.8, 0]} cameraAlpha={Math.PI / 2} cameraBeta={Math.PI / 2.4} className="h-full w-full">
          <PrimitivesScene />
        </Stage>
      </div>

      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {PRIMITIVE_DOCS.map((p) => (
          <Card key={p.name}>
            <Card.Body>
              <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</div>
              <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}

const PRIMITIVE_DOCS = [
  { name: "createPanel", description: "Flat single-sided plane. The simplest surface — a quad with one material." },
  { name: "createBillboard", description: "Plane that optionally always faces the camera (billboardMode = ALL). Same surface API as panel." },
  { name: "createCard3D", description: "Extruded panel — a thin box with a face surface and edge color. Adds physical depth to UI cards." },
  { name: "createBuilding", description: "Rectangular box with per-face surfaces. Composes a UV atlas so each face can carry its own widget or paint." },
  { name: "createPillar", description: "Convenience for a tall narrow building — same thickness on width and depth." },
  { name: "createCylinder", description: "Capped cylinder. Surface wraps around the side." },
  { name: "createCurvedPanel", description: "Partial cylinder section — a curved wraparound panel. Width is the arc length." },
  { name: "createSphere", description: "Full sphere with equirectangular surface mapping." },
  { name: "createDisc", description: "Flat disc / circle, single-faced." },
  { name: "createSign", description: "Panel mounted on a post — returned as a parented group (root + panel + post)." },
  { name: "createMonitor", description: "3D display: extruded bezel + recessed screen face + optional kickstand. Returned as a parented group." },
  { name: "createDecal", description: "Project a 2D pattern onto another mesh's surface. Conforms to the underlying geometry." },
];
