import { Link } from "react-router";
import { Badge, Card, Callout } from "@particle-academy/react-fancy";

interface DemoTile {
  to: string;
  name: string;
  description: string;
  badge?: string;
}

const PRIMITIVES: DemoTile[] = [
  { to: "/3d-primitives", name: "Primitives gallery", description: "Every shape primitive in one scene — Panel, Billboard, Building, Pillar, Cylinder, CurvedPanel, Sphere, Disc, Card3D." },
  { to: "/3d-decal", name: "Decals", description: "Project a 2D pattern onto a curved 3D mesh. Click anywhere on the sphere to stamp another decal." },
  { to: "/3d-monitor", name: "Monitor", description: "3D display with bezel, screen face, optional kickstand. Each screen renders a fancy WidgetSpec." },
  { to: "/3d-card3d", name: "Card3D", description: "Extruded panels — UI cards that feel like physical objects in the scene." },
];

const LAYOUT_TILES: DemoTile[] = [
  { to: "/3d-layouts", name: "Layout helpers", description: "Same scene, five layouts — placeOnArc, placeOnWall, placeOnGrid, placeOnSphere, placeOnPath." },
];

const REACT_TILES: DemoTile[] = [
  { to: "/screen-stage", name: "Stage + Screen", description: "Live React components mounted on 3D meshes via matrix3d projection. Buttons that click, switches that toggle — all on a real Babylon mesh." },
];

const SHOWCASE_TILES: DemoTile[] = [
  { to: "/canvas-studio", name: "Canvas Studio", description: "Engine-agnostic Scene + DOM adapter. Live JSON inspector, swap in a Babylon adapter preview." },
  { to: "/babylon-city", name: "Babylon City", description: "A city street built from fancy-3d primitives — every Particle Academy demo as a billboard on a building." },
];

function TileGrid({ tiles }: { tiles: DemoTile[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {tiles.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{t.name}</h3>
            {t.badge && <Badge size="sm" color="indigo">{t.badge}</Badge>}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{t.description}</p>
        </Link>
      ))}
    </div>
  );
}

export function Fancy3DHome() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">@particle-academy/fancy-3d</h1>
      <p className="mb-6 max-w-3xl text-sm text-zinc-500">
        A UI kit designed to make it easy for humans and agents to create rich, data-driven 3D applications. Engine-agnostic Scene types, primitives, layout helpers, and a live React-on-3D-meshes API. Pick a renderer (DOM today, Babylon today; three.js / native canvas pluggable).
      </p>

      <Card className="mb-6">
        <Card.Header>
          <div className="text-sm font-semibold">Three modes for delivering react-fancy in 3D</div>
        </Card.Header>
        <Card.Body>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="pb-2 font-semibold">Mode</th>
                <th className="pb-2 font-semibold">What it does</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">Texture</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">Paint widget into DynamicTexture, apply to any primitive's surface. Static, perfect fidelity.</td>
                <td className="py-2"><Badge color="emerald" size="sm">shipped</Badge></td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">Mount</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">DOM overlay with matrix3d projection. Live React on a 3D mesh — interactive, accessible.</td>
                <td className="py-2"><Badge color="emerald" size="sm">shipped</Badge></td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2 font-mono text-xs">Bump-out</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">Extruded 3D interpretations of 2D components — pickable subregions become real geometry.</td>
                <td className="py-2"><Badge color="amber" size="sm">planned</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card.Body>
      </Card>

      <h2 className="mt-8 mb-3 text-base font-bold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">Primitives</h2>
      <TileGrid tiles={PRIMITIVES} />

      <h2 className="mt-8 mb-3 text-base font-bold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">Layouts</h2>
      <TileGrid tiles={LAYOUT_TILES} />

      <h2 className="mt-8 mb-3 text-base font-bold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">React API (Mount mode)</h2>
      <TileGrid tiles={REACT_TILES} />

      <h2 className="mt-8 mb-3 text-base font-bold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">Showcase</h2>
      <TileGrid tiles={SHOWCASE_TILES} />

      <Callout color="blue" className="mt-8">
        <div className="text-sm font-semibold">npm</div>
        <div className="mt-1 text-xs">
          <code>npm install @particle-academy/fancy-3d</code> · See the <a className="underline" href="https://www.npmjs.com/package/@particle-academy/fancy-3d" target="_blank" rel="noreferrer">npm page</a> for the full README.
        </div>
      </Callout>
    </div>
  );
}
