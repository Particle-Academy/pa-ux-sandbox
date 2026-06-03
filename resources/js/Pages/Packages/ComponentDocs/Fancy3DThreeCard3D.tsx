import { lazy, Suspense } from "react";
import { Text } from "@particle-academy/react-fancy";
import type { ComponentDoc } from "./types";
import type { ThreeExample } from "./Fancy3D.three-demo";

const Demo = lazy(() => import("./Fancy3D.three-demo"));
function Live({ example }: { example: ThreeExample }) {
    return (
        <Suspense fallback={<div className="grid h-[440px] w-full place-items-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700">Loading three.js engine…</div>}>
            <Demo example={example} />
        </Suspense>
    );
}

export const fancy3dThreeCard3DDoc: ComponentDoc = {
    intro: (
        <p>
            An extruded card mesh — the three.js mirror of{" "}
            <code>fancy-3d-babylon</code>'s <code>Card3D</code>. Gives a flat panel physical
            depth, with widget surfaces painted onto its faces. Use it as the base mesh for a
            kiosk, a wall panel, or a billboard you mount <code>Monitor</code> children onto.
            Lives behind the <code>@particle-academy/fancy-3d-three</code> package since it
            constructs a three.js <code>Mesh</code>.
        </p>
    ),
    examples: [
        {
            name: "Live painted cards — drag to orbit",
            description: "Three `Card3D` meshes, each with a painted widget surface (chart / KPI / profile). Painted in `Stage.onReady`. Drag to orbit the three.js scene.",
            render: () => <Live example="card3d" />,
            code: `import { Stage } from "@particle-academy/fancy-3d-three/react";
import { createCard3D } from "@particle-academy/fancy-3d-three";

<Stage
    onReady={(scene) => {
        const card = createCard3D({
            scene,
            width: 2.2,
            height: 1.4,
            depth: 0.08,
            front: { type: "widget", widget: { kind: "kpi", label: "Revenue", value: "$48.2k" } },
        });
        card.position.set(0, 1.2, 0);
    }}
/>`,
        },
        {
            name: "Use a primitive directly",
            description: "fancy-3d-three ships the same primitive builders as the babylon adapter (`createPanel`, `createBuilding`, `createCard3D`, `createSign`).",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Same factory signatures as <code>fancy-3d-babylon</code> — swap the import path to switch engines.
                </Text>
            ),
            code: `import {
    createPanel,
    createBuilding,
    createCard3D,
} from "@particle-academy/fancy-3d-three";

// Inside Stage.onReady(scene):
const panel = createPanel({ scene, width: 2, height: 1.2 });
const tower = createBuilding({ scene, footprint: 1, height: 4 });
const card = createCard3D({ scene, width: 1, height: 0.6, depth: 0.05 });`,
        },
    ],
    props: [
        { name: "scene", type: `THREE.Scene`, default: "—", description: "three.js scene the mesh is added to. Required." },
        { name: "width", type: `number`, default: "—", description: "Width in world units. Required." },
        { name: "height", type: `number`, default: "—", description: "Height in world units. Required." },
        { name: "depth", type: `number`, default: `0.08`, description: "Card thickness in world units." },
        { name: "front", type: `{ type: "widget", widget } | { type: "color", color }`, default: "—", description: "Surface painted on the front face — a widget spec or a solid color." },
        { name: "→ returns", type: `Mesh`, default: "—", description: "three.js `Mesh`. Position / rotate / scale it like any other mesh." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>API style:</strong> primitives are factory functions, not React components.
            React components live in <code>fancy-3d-three/react</code> (
            <code>Stage</code>, <code>Monitor</code>). The widget painter is engine-agnostic
            (canvas-2D), shared verbatim with the babylon adapter.
        </p>
    ),
};
