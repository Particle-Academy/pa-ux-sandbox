import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const fancy3dMonitorDoc: ComponentDoc = {
    intro: (
        <p>
            A flat screen surface inside a 3D scene that renders React UI as if it were a
            real monitor. Mounts a Babylon plane in the parent <code>Stage</code> and uses a
            CSS3D-style matrix transform to project the React children onto it. From the
            user's perspective: a <code>Card</code>, <code>Chart</code>, or full dashboard
            living on a 3D screen.
        </p>
    ),
    examples: [
        {
            name: "Concept",
            description: "Mount React children at a world position + size.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Drop a real fancy primitive (Card, Chart, Composer, …) as children — the same components that work in plain DOM render here too.
                </Text>
            ),
            code: `import { Stage, Monitor } from "@particle-academy/fancy-3d-babylon";
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
        { name: "name", type: `string`, default: `"screen"`, description: "Optional name on the Babylon mesh." },
    ],
};
