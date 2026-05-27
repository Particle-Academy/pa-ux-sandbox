import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const fancy3dStageDoc: ComponentDoc = {
    intro: (
        <p>
            A Babylon-backed 3D root. Sets up the scene, an ArcRotateCamera, a default light
            rig, and renders an HTML overlay layer over the canvas — ready for{" "}
            <code>Monitor</code> children that mount React UI inside the 3D scene. Lives
            behind the <code>@particle-academy/fancy-3d-babylon</code> subpath since it
            depends on <code>@babylonjs/core</code>.
        </p>
    ),
    examples: [
        {
            name: "Concept",
            description: "Stage owns the Babylon `Scene` and exposes it via context for children.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Stage needs <code>@babylonjs/core</code> installed. See the fancy-3d demos for a complete setup.
                </Text>
            ),
            code: `import { Stage, Monitor } from "@particle-academy/fancy-3d-babylon";
import { Card } from "@particle-academy/react-fancy";

<Stage cameraRadius={10} cameraTarget={[0, 1.5, 0]} clearColor="#0b1220">
    <Monitor position={[0, 1.5, 0]} width={3} height={1.8}>
        <Card padding="md">
            <Heading>This Card lives inside a 3D scene</Heading>
        </Card>
    </Monitor>
</Stage>`,
        },
        {
            name: "Custom scene setup",
            description: "Use `onReady` to grab the Babylon `Scene` and add custom meshes, lights, cameras.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pair with the babylon primitives (<code>createPanel</code>, <code>createBuilding</code>) for richer environments.
                </Text>
            ),
            code: `<Stage
    onReady={(scene) => {
        const sphere = MeshBuilder.CreateSphere("s", { diameter: 1 }, scene);
        sphere.position.set(2, 1, 0);
    }}
>
    <Monitor position={[0, 1.5, 0]} width={3} height={1.8}>
        <Card>Hello</Card>
    </Monitor>
</Stage>`,
        },
        {
            name: "Bare (no default lights / camera)",
            description: "Skip the defaults when you want to build the scene from scratch.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Use with <code>onReady</code> to install your own lights + camera.
                </Text>
            ),
            code: `<Stage bare onReady={(scene) => setupCustomScene(scene)}>
    <Monitor position={[0, 1.5, 0]} width={3} height={1.8}>
        <DashboardScreen />
    </Monitor>
</Stage>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "`Monitor` children + any other React content (will mount in the HTML overlay)." },
        { name: "cameraRadius", type: `number`, default: `10`, description: "Initial camera distance from the target." },
        { name: "cameraTarget", type: `[x, y, z]`, default: `[0, 1.5, 0]`, description: "Initial camera target point." },
        { name: "cameraAlpha", type: `number`, default: `Math.PI / 2`, description: "Initial horizontal angle (radians)." },
        { name: "cameraBeta", type: `number`, default: `Math.PI / 2.4`, description: "Initial vertical angle (radians)." },
        { name: "clearColor", type: `string`, default: `"#06080f"`, description: "Background clear color." },
        { name: "bare", type: `boolean`, default: `false`, description: "Disable the default lights + camera. Pair with `onReady` to install your own." },
        { name: "onReady", type: `(scene: BJScene) => void`, default: "—", description: "Called after the Babylon Scene is created. Set up cameras, lights, meshes here." },
        { name: "className", type: `string`, default: "—", description: "Extra classes." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Peer dependency:</strong> <code>@babylonjs/core</code> is an optional peer.
            Install it if you use the babylon subpath. The DOM canvas at{" "}
            <code>@particle-academy/fancy-3d/canvas</code> doesn't require it.
        </p>
    ),
};
