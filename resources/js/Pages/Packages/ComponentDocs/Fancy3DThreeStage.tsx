import { lazy, Suspense } from "react";
import { Text } from "@particle-academy/react-fancy";
import type { ComponentDoc } from "./types";
import type { ThreeExample } from "./Fancy3D.three-demo";

// Lazy — `three` only loads when this page is opened.
const Demo = lazy(() => import("./Fancy3D.three-demo"));
function Live({ example }: { example: ThreeExample }) {
    return (
        <Suspense fallback={<div className="grid h-[440px] w-full place-items-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700">Loading three.js engine…</div>}>
            <Demo example={example} />
        </Suspense>
    );
}

export const fancy3dThreeStageDoc: ComponentDoc = {
    intro: (
        <p>
            A three.js-backed 3D root — the three.js mirror of{" "}
            <code>fancy-3d-babylon</code>'s <code>Stage</code>. Sets up the scene, a
            PerspectiveCamera + OrbitControls, a default light rig, and renders an HTML
            overlay layer over the canvas — ready for <code>Monitor</code> children that
            mount React UI inside the 3D scene. Lives behind the{" "}
            <code>@particle-academy/fancy-3d-three</code> package since it depends on{" "}
            <code>three</code>.
        </p>
    ),
    examples: [
        {
            name: "Live scene — drag to orbit",
            description: "A Stage with a live interactive `Monitor` (real React you can click) flanked by a painted `Card3D` and a `Sign`. Drag to orbit. three.js underneath.",
            render: () => <Live example="stage" />,
            code: `import { Stage, Monitor } from "@particle-academy/fancy-3d-three/react";
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
            description: "Use `onReady` to grab the three.js `Scene` and add custom meshes, lights, cameras.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pair with the three primitives (<code>createPanel</code>, <code>createBuilding</code>) for richer environments.
                </Text>
            ),
            code: `<Stage
    onReady={(scene) => {
        const geo = new THREE.SphereGeometry(0.5, 32, 32);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial());
        mesh.position.set(2, 1, 0);
        scene.add(mesh);
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
        { name: "onReady", type: `(scene: THREE.Scene) => void`, default: "—", description: "Called after the three.js Scene is created. Set up cameras, lights, meshes here." },
        { name: "className", type: `string`, default: "—", description: "Extra classes." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Peer dependency:</strong> <code>three</code> is a peer of this package.
            Install it alongside <code>@particle-academy/fancy-3d-three</code>. Prefer Babylon?
            The mirror package <code>@particle-academy/fancy-3d-babylon</code> ships the same
            API on Babylon.js. The engine-agnostic DOM canvas at{" "}
            <code>@particle-academy/fancy-3d/canvas</code> needs neither.
        </p>
    ),
};
