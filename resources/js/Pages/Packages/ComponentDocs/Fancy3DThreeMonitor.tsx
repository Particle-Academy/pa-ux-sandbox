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

export const fancy3dThreeMonitorDoc: ComponentDoc = {
    intro: (
        <p>
            A flat screen surface inside a three.js scene that renders React UI as if it
            were a real monitor — the three.js mirror of{" "}
            <code>fancy-3d-babylon</code>'s <code>Monitor</code>. Mounts a plane in the
            parent <code>Stage</code> and projects the React children onto it via a CSS{" "}
            <code>matrix3d</code> homography. From the user's perspective: a{" "}
            <code>Card</code>, <code>Chart</code>, or full dashboard living on a 3D screen —
            real, clickable DOM, not a texture snapshot.
        </p>
    ),
    examples: [
        {
            name: "Live monitor — drag to orbit",
            description: "A single `Monitor` carrying a live interactive react-fancy `Card` (the counter buttons actually work). Drag to orbit the three.js scene.",
            render: () => <Live example="monitor" />,
            code: `import { Stage, Monitor } from "@particle-academy/fancy-3d-three/react";
import { Card, Heading, Chart } from "@particle-academy/react-fancy";

<Stage>
    <Monitor position={[0, 1.5, 0]} width={3} height={1.8} rotationY={0}>
        <Card padding="md">
            <Heading>Sales dashboard</Heading>
            <Chart.Bar data={[…]} height={120} />
        </Card>
    </Monitor>
</Stage>`,
        },
        {
            name: "Rotated panel",
            description: "Set `rotationY` for screens facing other directions in the scene.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pair multiple monitors in a row for a kiosk wall.
                </Text>
            ),
            code: `<Stage>
    <Monitor position={[-3, 1.5, 0]} width={2} height={1.4} rotationY={Math.PI / 6}>
        <Card>Left screen</Card>
    </Monitor>
    <Monitor position={[0, 1.5, 0]} width={2} height={1.4}>
        <Card>Center screen</Card>
    </Monitor>
    <Monitor position={[3, 1.5, 0]} width={2} height={1.4} rotationY={-Math.PI / 6}>
        <Card>Right screen</Card>
    </Monitor>
</Stage>`,
        },
        {
            name: "Custom pixel resolution",
            description: "Override the design-time resolution — useful when the screen represents a non-standard aspect ratio.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Higher pixel resolution = more readable text at the cost of more layout work.
                </Text>
            ),
            code: `<Monitor
    position={[0, 1.5, 0]}
    width={3}
    height={1.8}
    pixelWidth={1280}
    pixelHeight={720}
>
    <Card>720p screen</Card>
</Monitor>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "React content to mount on the screen." },
        { name: "position", type: `[x, y, z]`, default: "—", description: "World-space center of the screen. Required." },
        { name: "width", type: `number`, default: "—", description: "Mesh width in world units. Required." },
        { name: "height", type: `number`, default: "—", description: "Mesh height in world units. Required." },
        { name: "rotationY", type: `number`, default: `0`, description: "Y-axis rotation in radians." },
        { name: "bezel", type: `string`, default: `"#0b0f17"`, description: "Bezel color framing the screen." },
        { name: "bezelThickness", type: `number`, default: `0.06`, description: "Bezel thickness in world units." },
        { name: "background", type: `string`, default: `"#0b1220"`, description: "Background color visible behind the React content." },
        { name: "pixelWidth", type: `number`, default: `width * 360`, description: "Design-time pixel width for the children." },
        { name: "pixelHeight", type: `number`, default: `height * 360`, description: "Design-time pixel height for the children." },
        { name: "name", type: `string`, default: `"screen"`, description: "Optional name on the three.js mesh." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Same API as</strong> <code>fancy-3d-babylon</code>'s <code>Monitor</code>
            — swap the import path to switch engines. The overlay projection uses a CSS{" "}
            <code>matrix3d</code> homography computed from the projected mesh corners, so the
            DOM stays crisp and interactive at any orbit angle.
        </p>
    ),
};
