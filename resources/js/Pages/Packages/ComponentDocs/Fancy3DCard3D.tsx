import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const fancy3dCard3DDoc: ComponentDoc = {
    intro: (
        <p>
            An extruded card mesh — gives a flat panel physical depth. Use it as the base
            mesh for a kiosk, a wall panel, or as a billboard you mount{" "}
            <code>Monitor</code> children onto. Lives behind the babylon subpath since it
            constructs a Babylon <code>Mesh</code>.
        </p>
    ),
    examples: [
        {
            name: "Build a kiosk panel",
            description: "`createCard3D` returns a Babylon Mesh — position it like any other mesh.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    The mesh is just a shape — pair with a <code>Monitor</code> to put React UI on top.
                </Text>
            ),
            code: `import { Stage, Monitor } from "@particle-academy/fancy-3d-babylon";
import { createCard3D } from "@particle-academy/fancy-3d-babylon";

<Stage
    onReady={(scene) => {
        const card = createCard3D({
            scene,
            width: 3,
            height: 1.8,
            depth: 0.08,
            color: "#0b1220",
        });
        card.position.set(0, 1.5, 0);
    }}
>
    <Monitor position={[0, 1.5, 0.05]} width={3} height={1.8}>
        <Card>UI projected onto the extruded panel</Card>
    </Monitor>
</Stage>`,
        },
        {
            name: "Use a primitive directly",
            description: "fancy-3d ships a few primitive builders (`createPanel`, `createBuilding`, `createCard3D`) — handy for prototyping environments.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Look at <code>fancy-3d/src/primitives.ts</code> for the full list of constructors.
                </Text>
            ),
            code: `import {
    createPanel,
    createBuilding,
    createCard3D,
} from "@particle-academy/fancy-3d-babylon";

// Inside Stage.onReady(scene):
const panel = createPanel({ scene, width: 2, height: 1.2 });
const tower = createBuilding({ scene, footprint: 1, height: 4 });
const card = createCard3D({ scene, width: 1, height: 0.6, depth: 0.05 });`,
        },
    ],
    props: [
        { name: "scene", type: `BJScene`, default: "—", description: "Babylon scene the mesh is added to. Required." },
        { name: "width", type: `number`, default: "—", description: "Width in world units. Required." },
        { name: "height", type: `number`, default: "—", description: "Height in world units. Required." },
        { name: "depth", type: `number`, default: `0.08`, description: "Card thickness in world units." },
        { name: "color", type: `string`, default: "Babylon default", description: "Card surface color. Override via Babylon material on the returned mesh for textures, shaders, etc." },
        { name: "→ returns", type: `Mesh`, default: "—", description: "Babylon `Mesh`. Position / rotate / scale it like any other mesh." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>API style:</strong> primitives are factory functions, not React components.
            React components live in <code>fancy-3d/react.tsx</code> (
            <code>Stage</code>, <code>Monitor</code>) and{" "}
            <code>fancy-3d/canvas</code> (<code>Canvas</code>).
        </p>
    ),
};
