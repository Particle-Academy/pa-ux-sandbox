import { useCallback, useEffect, useRef, useState } from "react";
import {
  Color3,
  MeshBuilder,
  PointerEventTypes,
  StandardMaterial,
  Vector3,
  type Mesh,
  type Scene as BJScene,
} from "@babylonjs/core";
import { Stage, useStage } from "@particle-academy/fancy-3d/react";
import { Action, Badge, Card } from "@particle-academy/react-fancy";

/* ------------------------------------------------------------------ */
/* Block 1 — playable arcade: Cube Crusher                              */
/* ------------------------------------------------------------------ */

const COLORS = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#22d3ee", "#a855f7", "#84cc16", "#ec4899", "#0ea5e9"];
const ROUND_SECONDS = 60;
const SPAWN_EVERY_MS = 700; // a little faster than once per second
const CUBE_LIFETIME_MS = 5000;
const MAX_CUBES = 12;

interface CrusherState {
  score: number;
  timeLeft: number;
  status: "idle" | "playing" | "over";
}

function CrusherScene({
  status,
  onScore,
  resetTick,
}: {
  status: CrusherState["status"];
  onScore: (points: number) => void;
  resetTick: number;
}) {
  const { scene } = useStage();
  const cubesRef = useRef<{ mesh: Mesh; bornAt: number }[]>([]);
  const statusRef = useRef(status);

  // Keep the status ref in sync without re-running the heavy effect.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Build the static parts once per round (or scene change). The animation
  // loop and pick handler use refs to read the latest status without re-running.
  useEffect(() => {
    const floor = MeshBuilder.CreateGround("crusher-floor", { width: 8, height: 8 }, scene);
    const floorMat = new StandardMaterial("crusher-floor-mat", scene);
    floorMat.diffuseColor = new Color3(0.06, 0.07, 0.11);
    floorMat.specularColor = new Color3(0, 0, 0);
    floor.material = floorMat;
    floor.position.y = -1;

    cubesRef.current.forEach((c) => c.mesh.dispose());
    cubesRef.current = [];

    const startedAt = performance.now();
    let lastSpawn = startedAt;

    // Animation loop — plain rAF, fully decoupled from Babylon's render loop.
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      if (statusRef.current === "playing") {
        if (now - lastSpawn > SPAWN_EVERY_MS && cubesRef.current.length < MAX_CUBES) {
          // Spawn
          const id = Math.random().toString(36).slice(2, 7);
          const cube = MeshBuilder.CreateBox(`crush-${id}`, { size: 0.6 }, scene);
          const angle = Math.random() * Math.PI * 2;
          const radius = 1.6 + Math.random() * 1.0;
          const height = -0.4 + Math.random() * 1.4;
          cube.position = new Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          const mat = new StandardMaterial(`crush-mat-${id}`, scene);
          mat.diffuseColor = Color3.FromHexString(color);
          mat.emissiveColor = Color3.FromHexString(color).scale(0.4);
          cube.material = mat;
          cube.metadata = { crusher: true };
          cubesRef.current.push({ mesh: cube, bornAt: now });
          lastSpawn = now;
        }
      }
      // Animate every frame (even when not playing — keeps the scene lively)
      for (let i = cubesRef.current.length - 1; i >= 0; i--) {
        const c = cubesRef.current[i];
        const age = now - c.bornAt;
        if (age > CUBE_LIFETIME_MS) {
          c.mesh.dispose();
          cubesRef.current.splice(i, 1);
          continue;
        }
        c.mesh.rotation.x += 0.02;
        c.mesh.rotation.y += 0.03;
        const remain = CUBE_LIFETIME_MS - age;
        if (remain < 1000) c.mesh.scaling.setAll(0.5 + 0.5 * (remain / 1000));
      }
    };
    raf = requestAnimationFrame(tick);

    const pickObs = scene.onPointerObservable.add((pi) => {
      if (statusRef.current !== "playing") return;
      if (pi.type !== PointerEventTypes.POINTERPICK) return;
      const m = pi.pickInfo?.pickedMesh as Mesh | null | undefined;
      if (!m || !(m.metadata as { crusher?: boolean })?.crusher) return;
      const mat = m.material as StandardMaterial;
      mat.emissiveColor = new Color3(1, 1, 1);
      const idx = cubesRef.current.findIndex((c) => c.mesh === m);
      if (idx >= 0) cubesRef.current.splice(idx, 1);
      // Brief flash, then dispose
      setTimeout(() => m.dispose(), 100);
      onScore(10);
    });

    return () => {
      cancelAnimationFrame(raf);
      scene.onPointerObservable.remove(pickObs);
      cubesRef.current.forEach((c) => c.mesh.dispose());
      cubesRef.current = [];
      floor.dispose();
      floorMat.dispose();
    };
  }, [scene, onScore, resetTick]);

  return null;
}

function CubeCrusher() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [status, setStatus] = useState<CrusherState["status"]>("idle");
  const [resetTick, setResetTick] = useState(0);
  const [best, setBest] = useState(0);
  const scoreRef = useRef(0);

  // Stable onScore — without this, the timer's per-second re-render passes a
  // fresh function reference and tears down the whole Babylon scene.
  const onScore = useCallback((p: number) => {
    scoreRef.current += p;
    setScore(scoreRef.current);
  }, []);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setStatus("over");
          setBest((b) => Math.max(b, scoreRef.current));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setStatus("playing");
    setResetTick((t) => t + 1);
  };

  return (
    <Card className="mb-6">
      <div className="relative" style={{ height: 420 }}>
        <Stage
          cameraRadius={4.5}
          cameraTarget={[0, 0, 0]}
          cameraAlpha={Math.PI / 2}
          cameraBeta={Math.PI / 2.5}
          className="h-full w-full"
        >
          <CrusherScene status={status} onScore={onScore} resetTick={resetTick} />
        </Stage>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
            <span className="text-xs text-zinc-400">Score</span>
            <span className="font-mono text-base font-bold">{score}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
            <span className="text-xs text-zinc-400">Time</span>
            <span className={`font-mono text-base font-bold ${timeLeft <= 10 && status === "playing" ? "text-rose-400" : ""}`}>
              {String(timeLeft).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Idle / game-over overlay */}
        {status !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            {status === "idle" ? (
              <>
                <h3 className="text-2xl font-bold text-white">Cube Crusher</h3>
                <p className="max-w-md text-center text-sm text-zinc-300">
                  Click cubes to crush them for 10 points each. Cubes vanish on their own after 5 seconds.
                  60 seconds, no second chances.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white">Time!</h3>
                <p className="text-sm text-zinc-300">
                  Final score: <span className="font-mono text-lg text-emerald-400">{score}</span>
                  {best > 0 && (
                    <>
                      {" · "}
                      Best: <span className="font-mono text-lg text-indigo-400">{best}</span>
                    </>
                  )}
                </p>
              </>
            )}
            <Action color="indigo" size="lg" onClick={start}>
              {status === "idle" ? "Start" : "Play again"}
            </Action>
          </div>
        )}
      </div>
      <Card.Body className="text-xs text-zinc-500">
        Built with <code>@particle-academy/fancy-3d/react</code>'s{" "}
        <code>&lt;Stage&gt;</code> + <code>useStage()</code>: spawn loop, pick
        handler, score state, all in ~150 lines. Drag to orbit, scroll to
        zoom while playing.
      </Card.Body>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Block 2 — playable Babylon links (browser-playable only)            */
/* ------------------------------------------------------------------ */

interface DemoLink {
  title: string;
  url: string;
  blurb: string;
  category: "Editor" | "Game" | "Showcase";
}

const LINKS: DemoLink[] = [
  { title: "Babylon Playground", url: "https://playground.babylonjs.com/", category: "Editor", blurb: "Live editor with hundreds of built-in scenes. Pick from the Scene Selector to play immediately." },
  { title: "Feature Demos", url: "https://www.babylonjs.com/featureDemos/", category: "Showcase", blurb: "Clustered lighting, node particle editor, area lights — every page is its own playable scene." },
  { title: "Community Demos", url: "https://www.babylonjs.com/community/", category: "Showcase", blurb: "Curated showcase page with embedded interactive demos." },
  { title: "RedBull F1 Demo", url: "https://forum.babylonjs.com/t/redbull-f1-demo/21463", category: "Game", blurb: "Drive an F1 car with WASD/arrows on a procedural track. Live link inside the post." },
  { title: "Car Demo 2.0", url: "https://forum.babylonjs.com/t/car-demo-2-0-with-a-mini-game-and-tyre-marks/16361", category: "Game", blurb: "Ammo physics, tire marks, breakable glass. Forum post links to a hosted playable build." },
  { title: "Babylon Toolkit Speedway", url: "https://forum.babylonjs.com/t/babylon-toolkit-speedway/8244", category: "Game", blurb: "Racing demo built on the Babylon Toolkit. Browser-playable from the linked demo." },
];

const ACCENT: Record<DemoLink["category"], "indigo" | "emerald" | "amber"> = {
  Editor: "indigo",
  Game: "emerald",
  Showcase: "amber",
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function BabylonSmokeTestDemo() {
  const [embedPlayground, setEmbedPlayground] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold">Babylon — 60-second smoke test</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          A real playable demo built on <code className="text-xs">@particle-academy/fancy-3d/react</code>{" "}
          first, then the official Babylon Playground embedded inline, then a
          curated set of browser-playable Babylon games and showcases.
        </p>
      </div>

      <h2 className="mt-2 mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
        1. Play — Cube Crusher
      </h2>
      <CubeCrusher />

      <h2 className="mt-8 mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
        2. Babylon Playground (live editor)
      </h2>
      <Card className="mb-6">
        <Card.Body>
          {embedPlayground ? (
            <iframe
              title="Babylon Playground"
              src="https://playground.babylonjs.com/"
              className="h-[600px] w-full rounded border border-zinc-200 dark:border-zinc-800"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Loads ~6 MB on first run. Embed it inline or open in a new
                tab.
              </p>
              <div className="flex gap-2">
                <Action color="indigo" size="sm" onClick={() => setEmbedPlayground(true)}>
                  Embed inline
                </Action>
                <Action variant="ghost" size="sm" onClick={() => window.open("https://playground.babylonjs.com/", "_blank")}>
                  Open in new tab →
                </Action>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <h2 className="mt-8 mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
        3. Browser-playable Babylon games & showcases
      </h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{link.title}</h3>
              <Badge size="sm" color={ACCENT[link.category]}>
                {link.category}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{link.blurb}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
