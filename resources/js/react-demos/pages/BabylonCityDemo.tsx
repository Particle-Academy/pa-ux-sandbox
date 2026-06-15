import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
// Granular @babylonjs/core imports (not the barrel) so the lazy 3D chunk only
// includes the engine subsystems these demos use — the bare "@babylonjs/core"
// barrel pulls the whole ~6MB engine (GUI, physics, loaders, XR, …).
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Scene as BJScene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Button, Badge, Callout, Card } from "@particle-academy/react-fancy";
import {
  createBillboard,
  createBuilding,
  createPanel,
  type SurfaceContent,
} from "@particle-academy/fancy-3d-babylon";
import { demosScene } from "../canvas-studio/demosScene";
import type { DemoPageSpec } from "@particle-academy/fancy-3d";

const STREET_LENGTH = 80;
const STREET_WIDTH = 8;
const BLOCK_SPACING = 7;

interface DemoTile {
  id: string;
  spec: DemoPageSpec;
}

function paintWindowFacade(color: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // Window grid
    const cols = 4;
    const rows = Math.max(2, Math.floor(h / 28));
    const wMargin = 14;
    const hMargin = 14;
    const cellW = (w - wMargin * 2) / cols - 6;
    const cellH = 18;
    ctx.fillStyle = "#0b1220";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = wMargin + c * (cellW + 6);
        const y = hMargin + r * (cellH + 8);
        if (y + cellH > h - hMargin) break;
        ctx.fillRect(x, y, cellW, cellH);
        // ~30% windows lit
        if ((r * 7 + c * 3 + Math.round(x + y)) % 4 === 0) {
          ctx.fillStyle = "#fcd34d";
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          ctx.fillStyle = "#0b1220";
        }
      }
    }
  };
}

function paintRoof(color: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // AC unit
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.4);
    ctx.fillStyle = "#374151";
    ctx.fillRect(w * 0.35, h * 0.35, w * 0.3, h * 0.3);
  };
}

export function BabylonCityDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<BJScene | null>(null);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { stencil: true, preserveDrawingBuffer: true });
    engineRef.current = engine;

    const bj = new BJScene(engine);
    sceneRef.current = bj;
    bj.clearColor = new Color4(0.04, 0.05, 0.1, 1);

    // Camera at street level, looking down the avenue
    const camera = new ArcRotateCamera("cam", Math.PI / 2, Math.PI / 2 - 0.05, 14, new Vector3(0, 3.5, 0), bj);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 50;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 200;
    camera.upperBetaLimit = Math.PI / 2 - 0.05; // don't go below the ground

    // Lights — moody dusk
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), bj);
    hemi.intensity = 0.5;
    hemi.diffuse = new Color3(0.55, 0.6, 0.85);
    hemi.groundColor = new Color3(0.1, 0.1, 0.18);

    const dir = new DirectionalLight("dir", new Vector3(-0.4, -1, -0.6), bj);
    dir.intensity = 0.7;
    dir.diffuse = new Color3(1, 0.85, 0.7);

    // Sky-ish far backdrop (a giant box centered on origin)
    const sky = MeshBuilder.CreateBox("sky", { size: 200 }, bj);
    const skyMat = new StandardMaterial("sky-mat", bj);
    skyMat.diffuseColor = new Color3(0.04, 0.05, 0.12);
    skyMat.emissiveColor = new Color3(0.04, 0.04, 0.16);
    skyMat.specularColor = new Color3(0, 0, 0);
    skyMat.backFaceCulling = false;
    sky.material = skyMat;
    sky.infiniteDistance = true;

    // Street ground
    const street = CreateGround("street", { width: STREET_WIDTH, height: STREET_LENGTH }, bj);
    const streetMat = new StandardMaterial("street-mat", bj);
    streetMat.diffuseColor = new Color3(0.08, 0.08, 0.1);
    streetMat.specularColor = new Color3(0.05, 0.05, 0.05);
    street.material = streetMat;

    // Street centerline dashes
    for (let z = -STREET_LENGTH / 2 + 1; z < STREET_LENGTH / 2; z += 3) {
      const dash = MeshBuilder.CreateBox(`dash-${z}`, { width: 0.15, height: 0.02, depth: 1.4 }, bj);
      dash.position = new Vector3(0, 0.01, z);
      const dm = new StandardMaterial(`dash-mat-${z}`, bj);
      dm.diffuseColor = new Color3(0.85, 0.78, 0.4);
      dm.emissiveColor = new Color3(0.4, 0.36, 0.18);
      dash.material = dm;
    }

    // Sidewalks
    [-1, 1].forEach((side) => {
      const sw = MeshBuilder.CreateBox(`sidewalk-${side}`, {
        width: 2.2, height: 0.2, depth: STREET_LENGTH,
      }, bj);
      sw.position = new Vector3(side * (STREET_WIDTH / 2 + 1.1), 0.1, 0);
      const swMat = new StandardMaterial(`sw-mat-${side}`, bj);
      swMat.diffuseColor = new Color3(0.45, 0.45, 0.5);
      swMat.specularColor = new Color3(0.05, 0.05, 0.05);
      sw.material = swMat;
    });

    // Build buildings + billboards: one block per demo, alternating sides
    const tiles: DemoTile[] = demosScene.nodes.map((n) => ({ id: n.id, spec: n.widget as DemoPageSpec }));
    const facadePalette = ["#1e293b", "#27272a", "#2c1d2f", "#1f2937", "#1c1f33", "#212135", "#23202b"];

    const meshes: { mesh: Mesh; tile: DemoTile }[] = [];

    tiles.forEach((tile, i) => {
      const side = i % 2 === 0 ? -1 : 1; // alternate left / right
      const indexOnSide = Math.floor(i / 2);
      const totalPerSide = Math.ceil(tiles.length / 2);
      const start = -((totalPerSide - 1) * BLOCK_SPACING) / 2;
      const z = start + indexOnSide * BLOCK_SPACING;
      const x = side * (STREET_WIDTH / 2 + 4); // 4 = half building depth + gap
      const facadeColor = facadePalette[i % facadePalette.length];

      const baseHeight = 5 + ((i * 7) % 5);
      const buildingDepth = 5;
      const buildingWidth = BLOCK_SPACING - 0.6;

      // Building (per-face textures so the front shows windows + the roof shows AC)
      const facingFace = side === -1 ? "right" : "left"; // street-facing side
      const wallSurface: SurfaceContent = { type: "paint", paint: paintWindowFacade(facadeColor), pixelWidth: 256, pixelHeight: 256 };
      const roofSurface: SurfaceContent = { type: "paint", paint: paintRoof(facadeColor), pixelWidth: 256, pixelHeight: 256 };

      const building = createBuilding({
        scene: bj,
        name: `bldg-${tile.id}`,
        width: buildingWidth,
        height: baseHeight,
        depth: buildingDepth,
        faces: {
          front: wallSurface,
          back: wallSurface,
          right: wallSurface,
          left: wallSurface,
          [facingFace]: wallSurface,
          top: roofSurface,
        },
      });
      building.position = new Vector3(x, baseHeight / 2, z);

      // Billboard mounted in front of the street-facing wall.
      // Stand it well off the wall — small offsets cause Z-fighting and the
      // billboard disappears into the building face.
      const standoff = 0.6;
      const billboardWidth = Math.min(buildingWidth - 0.4, 6);
      const billboardHeight = billboardWidth * 0.65;
      const billboard = createBillboard({
        scene: bj,
        name: `bb-${tile.id}`,
        width: billboardWidth,
        height: billboardHeight,
        surface: { type: "widget", widget: tile.spec },
      });
      billboard.position = new Vector3(
        x + (-side) * (buildingWidth / 2 + standoff),
        baseHeight - billboardHeight / 2 - 0.4,
        z
      );
      // Babylon's default plane normal points -Z; rotate so that side faces
      // the street (camera) for both left and right buildings.
      billboard.rotation.y = side === -1 ? -Math.PI / 2 : Math.PI / 2;
      billboard.metadata = { nodeId: tile.id, path: tile.spec.path, kind: "billboard" };

      // Posts holding the billboard up off the roof
      [-1, 1].forEach((dx) => {
        const post = MeshBuilder.CreateBox(`post-${tile.id}-${dx}`, {
          width: 0.14, height: 1.4, depth: 0.14,
        }, bj);
        post.position = new Vector3(
          billboard.position.x,
          baseHeight + 0.7,
          z + dx * (billboardWidth / 2 - 0.2)
        );
        const pmat = new StandardMaterial(`post-mat-${tile.id}-${dx}`, bj);
        pmat.diffuseColor = new Color3(0.15, 0.15, 0.2);
        post.material = pmat;
      });

      meshes.push({ mesh: billboard, tile });
    });

    // Pointer interactions on billboards
    let hoveredMesh: Mesh | null = null;
    bj.onPointerObservable.add((pi) => {
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        const pick = bj.pick(bj.pointerX, bj.pointerY, (m) =>
          (m.metadata as { kind?: string } | undefined)?.kind === "billboard"
        );
        const m = pick?.pickedMesh as Mesh | null | undefined;
        const id = (m?.metadata as { nodeId?: string } | undefined)?.nodeId ?? null;
        if (hoveredMesh && hoveredMesh !== m) {
          hoveredMesh.scaling.setAll(1);
          hoveredMesh.renderOutline = false;
        }
        if (m) {
          m.scaling.setAll(1.04);
          m.renderOutline = true;
          m.outlineColor = new Color3(0.39, 0.4, 0.95);
          m.outlineWidth = 0.04;
          hoveredMesh = m;
          canvas.style.cursor = "pointer";
        } else {
          hoveredMesh = null;
          canvas.style.cursor = "default";
        }
        setHovered(id);
      }
      if (pi.type === PointerEventTypes.POINTERPICK) {
        const pick = bj.pick(bj.pointerX, bj.pointerY, (m) =>
          (m.metadata as { kind?: string } | undefined)?.kind === "billboard"
        );
        const m = pick?.pickedMesh as Mesh | null | undefined;
        const path = (m?.metadata as { path?: string } | undefined)?.path;
        if (path) navigate(path);
      }
    });

    // Slow drift down the street when idle
    let lastInteract = performance.now();
    bj.onPointerObservable.add(() => { lastInteract = performance.now(); });
    bj.onBeforeRenderObservable.add(() => {
      if (performance.now() - lastInteract > 4000) {
        camera.alpha += 0.0003;
      }
    });

    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    engine.runRenderLoop(() => bj.render());

    return () => {
      window.removeEventListener("resize", resize);
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
    };
  }, [navigate]);

  const hoveredNode = hovered ? demosScene.nodes.find((n) => n.id === hovered) ?? null : null;
  const hoveredSpec = hoveredNode?.widget.kind === "demoPage" ? (hoveredNode.widget as DemoPageSpec) : null;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Babylon City</h1>
          <p className="max-w-3xl text-sm text-zinc-500">
            A city street rendered on <code className="text-xs">@particle-academy/fancy-3d</code>:
            buildings line each side, with each demo plastered as a billboard.
            All shapes are built from fancy-3d's primitives — <code>createBuilding</code>,{" "}
            <code>createBillboard</code>, <code>createPanel</code> — each accepting a{" "}
            <code>SurfaceContent</code> (color, paint callback, or any{" "}
            <code>WidgetSpec</code> from the same scene types). Drag to orbit the
            block, scroll to zoom, click a billboard to open the demo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">{demosScene.nodes.length} billboards</Badge>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: 720 }}>
          <canvas ref={canvasRef} className="block h-full w-full outline-none" tabIndex={0} />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <Card.Header><div className="text-sm font-semibold">Hovered billboard</div></Card.Header>
            <Card.Body>
              {hoveredSpec ? (
                <div className="flex flex-col gap-2">
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{hoveredSpec.name}</div>
                  <div className="font-mono text-xs text-zinc-500">{hoveredSpec.path}</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{hoveredSpec.description}</p>
                  <Button variant="default" color="indigo" size="sm" onClick={() => navigate(hoveredSpec.path)}>
                    Open demo →
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-zinc-500">Hover a billboard in the city to preview it here.</div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header><div className="text-sm font-semibold">Jump to demo</div></Card.Header>
            <Card.Body className="flex flex-wrap gap-1.5">
              {demosScene.nodes.map((n) => {
                const w = n.widget as DemoPageSpec;
                return (
                  <Button key={n.id} variant="ghost" size="sm" onClick={() => navigate(w.path)}>
                    {w.name}
                  </Button>
                );
              })}
            </Card.Body>
          </Card>

          <Callout color="blue">
            <div className="text-sm font-semibold">Primitives + scene = 3D UI</div>
            <div className="mt-1 text-xs leading-relaxed">
              The buildings, billboards, sidewalks, and posts are all built
              from <code>@particle-academy/fancy-3d-babylon</code> primitives.
              Each accepts a <code>SurfaceContent</code> — a color, a 2D paint
              callback, or a fancy-3d <code>WidgetSpec</code>. Same painters
              power Canvas Studio in DOM mode and these billboards in 3D.
            </div>
          </Callout>
        </div>
      </div>
    </div>
  );
}
