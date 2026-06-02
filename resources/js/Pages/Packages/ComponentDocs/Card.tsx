import type { ComponentDoc } from "./types";
import { Button, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";

export const cardDoc: ComponentDoc = {
    intro: (
        <p>
            The workhorse container. <code>Card</code> alone gets you a bordered surface; the
            compound parts (<code>Card.Header</code>, <code>Card.Body</code>, <code>Card.Footer</code>)
            give the standard "titlebar / content / actions" layout used across the showcase.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A bare Card is a bordered surface — content goes anywhere you want.",
            render: () => (
                <Card className="w-full max-w-md">
                    <div className="p-4">
                        <Heading size="md">Card</Heading>
                        <Text size="sm" className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                            Drop arbitrary content directly into <code>Card</code> if you don't need header/body/footer.
                        </Text>
                    </div>
                </Card>
            ),
            code: `<Card className="max-w-md">
    <div className="p-4">
        <Heading size="md">Card</Heading>
        <Text size="sm">Arbitrary content.</Text>
    </div>
</Card>`,
        },
        {
            name: "Variants",
            description: "outlined (default) for most UI, elevated for hero/feature surfaces, flat for inside other containers.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-3">
                    <Card variant="outlined" padding="md">
                        <Text size="sm" weight="semibold">outlined</Text>
                        <Text size="xs" className="mt-1 !text-zinc-500">Bordered, no shadow.</Text>
                    </Card>
                    <Card variant="elevated" padding="md">
                        <Text size="sm" weight="semibold">elevated</Text>
                        <Text size="xs" className="mt-1 !text-zinc-500">Drop shadow.</Text>
                    </Card>
                    <Card variant="flat" padding="md">
                        <Text size="sm" weight="semibold">flat</Text>
                        <Text size="xs" className="mt-1 !text-zinc-500">No border, no shadow.</Text>
                    </Card>
                </div>
            ),
            code: `<Card variant="outlined" padding="md">…</Card>
<Card variant="elevated" padding="md">…</Card>
<Card variant="flat" padding="md">…</Card>`,
        },
        {
            name: "Padding presets",
            description: "Apply uniform padding without writing utility classes.",
            render: () => (
                <div className="grid w-full gap-2 sm:grid-cols-4">
                    <Card padding="none"><Text size="xs">none</Text></Card>
                    <Card padding="sm"><Text size="xs">sm</Text></Card>
                    <Card padding="md"><Text size="xs">md</Text></Card>
                    <Card padding="lg"><Text size="xs">lg</Text></Card>
                </div>
            ),
            code: `<Card padding="none">…</Card>
<Card padding="sm">…</Card>
<Card padding="md">…</Card>
<Card padding="lg">…</Card>`,
        },
        {
            name: "Header + Body",
            description: "Use Card.Header for a titlebar — it has the right divider and padding baked in.",
            render: () => (
                <Card className="w-full max-w-md">
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Heading size="md">Recent activity</Heading>
                            <Badge color="violet" size="sm">live</Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Text size="sm">3 agents proposed edits in the last 5 minutes. Review and approve below.</Text>
                    </Card.Body>
                </Card>
            ),
            code: `<Card>
    <Card.Header>
        <Heading size="md">Recent activity</Heading>
    </Card.Header>
    <Card.Body>
        <Text size="sm">…</Text>
    </Card.Body>
</Card>`,
        },
        {
            name: "Full layout (Header + Body + Footer)",
            description: "Footer is great for primary actions — keeps them anchored at the bottom.",
            render: () => (
                <Card className="w-full max-w-md">
                    <Card.Header>
                        <Heading size="md">Delete project?</Heading>
                    </Card.Header>
                    <Card.Body>
                        <Text size="sm">This will permanently remove the project and all associated data. This action cannot be undone.</Text>
                    </Card.Body>
                    <Card.Footer>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost">Cancel</Button>
                            <Button color="red">Delete</Button>
                        </div>
                    </Card.Footer>
                </Card>
            ),
            code: `<Card>
    <Card.Header>
        <Heading size="md">Delete project?</Heading>
    </Card.Header>
    <Card.Body>
        <Text size="sm">This will permanently remove the project…</Text>
    </Card.Body>
    <Card.Footer>
        <div className="flex justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button color="red">Delete</Button>
        </div>
    </Card.Footer>
</Card>`,
        },
    ],
    props: [
        { name: "variant", type: `"outlined" | "elevated" | "flat"`, default: `"outlined"`, description: "Surface treatment. `outlined` has a border, `elevated` adds a drop shadow, `flat` removes both." },
        { name: "padding", type: `"none" | "sm" | "md" | "lg"`, default: `"none"`, description: "Uniform padding on the Card root. Skip this when using `Card.Header` / `Card.Body` / `Card.Footer` since each part owns its own padding." },
        { name: "children", type: `ReactNode`, default: "—", description: "Card content. Usually `Card.Header` + `Card.Body` + `Card.Footer`, but free-form is fine." },
        { name: "...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes." },
    ],
    notes: (
        <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
                <strong>Compound parts:</strong> <code>Card.Header</code>, <code>Card.Body</code>,
                and <code>Card.Footer</code> are exposed off the root. Each owns its own padding
                and (for Header/Footer) a top/bottom divider. You can also import them as
                <code>CardHeader</code>, <code>CardBody</code>, <code>CardFooter</code> if you prefer.
            </p>
        </div>
    ),
};
