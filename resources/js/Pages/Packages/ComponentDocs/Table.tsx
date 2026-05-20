import type { ComponentDoc } from "./types";
import { Badge, Table, Text } from "@particle-academy/react-fancy";

const rows = [
    { id: 1, name: "Liftoff briefing", owner: "Glenn", status: "active" as const, value: 2400 },
    { id: 2, name: "Booster recovery", owner: "Amy", status: "active" as const, value: 8800 },
    { id: 3, name: "Payload doc", owner: "Tomas", status: "draft" as const, value: 0 },
    { id: 4, name: "Mission report", owner: "Liz", status: "archived" as const, value: 0 },
];

const statusColor: Record<typeof rows[0]["status"], "green" | "amber" | "zinc"> = {
    active: "green",
    draft: "amber",
    archived: "zinc",
};

export const tableDoc: ComponentDoc = {
    intro: (
        <p>
            A data table built from compound parts — <code>Table.Head</code>,
            <code>Table.Body</code>, <code>Table.Row</code>, <code>Table.Cell</code>.
            Rows can carry a trailing expandable tray, an <code>onClick</code> handler, or
            arbitrary custom rendering per cell.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Hand-write rows and cells — most flexibility, most control.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Cell header>Name</Table.Cell>
                            <Table.Cell header>Owner</Table.Cell>
                            <Table.Cell header>Status</Table.Cell>
                            <Table.Cell header>Value</Table.Cell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.name}</Table.Cell>
                                <Table.Cell>{row.owner}</Table.Cell>
                                <Table.Cell><Badge color={statusColor[row.status]} size="sm">{row.status}</Badge></Table.Cell>
                                <Table.Cell>${row.value.toLocaleString()}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ),
            code: `<Table>
    <Table.Head>
        <Table.Row>
            <Table.Cell header>Name</Table.Cell>
            <Table.Cell header>Owner</Table.Cell>
            <Table.Cell header>Status</Table.Cell>
            <Table.Cell header>Value</Table.Cell>
        </Table.Row>
    </Table.Head>
    <Table.Body>
        {rows.map((row) => (
            <Table.Row key={row.id}>
                <Table.Cell>{row.name}</Table.Cell>
                <Table.Cell>{row.owner}</Table.Cell>
                <Table.Cell><Badge color={statusColor[row.status]}>{row.status}</Badge></Table.Cell>
                <Table.Cell>\${row.value.toLocaleString()}</Table.Cell>
            </Table.Row>
        ))}
    </Table.Body>
</Table>`,
        },
        {
            name: "Clickable rows",
            description: "Pass `onClick` on a `Table.Row` — the cursor changes and the row becomes a button.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Cell header>Name</Table.Cell>
                            <Table.Cell header>Owner</Table.Cell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.slice(0, 3).map((row) => (
                            <Table.Row key={row.id} onClick={() => {}}>
                                <Table.Cell>{row.name}</Table.Cell>
                                <Table.Cell>{row.owner}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ),
            code: `<Table.Row onClick={() => router.visit(\`/projects/\${row.id}\`)}>
    <Table.Cell>{row.name}</Table.Cell>
    <Table.Cell>{row.owner}</Table.Cell>
</Table.Row>`,
        },
        {
            name: "Expandable tray row",
            description: "Pass `tray` to a `Table.Row` to add an expandable drawer beneath that row.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Cell header>Name</Table.Cell>
                            <Table.Cell header>Owner</Table.Cell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        <Table.Row
                            defaultExpanded
                            tray={
                                <div className="p-3">
                                    <Text size="sm" weight="semibold">Details</Text>
                                    <Text size="xs" className="mt-1">Click the chevron to collapse.</Text>
                                </div>
                            }
                        >
                            <Table.Cell>{rows[0].name}</Table.Cell>
                            <Table.Cell>{rows[0].owner}</Table.Cell>
                        </Table.Row>
                        <Table.Row tray={<div className="p-3"><Text size="xs">Drawer for {rows[1].name}.</Text></div>}>
                            <Table.Cell>{rows[1].name}</Table.Cell>
                            <Table.Cell>{rows[1].owner}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            ),
            code: `<Table.Row
    defaultExpanded
    tray={
        <div className="p-3">
            <Text weight="semibold">Details</Text>
            <Text size="xs">Drawer content for this row.</Text>
        </div>
    }
>
    <Table.Cell>Liftoff briefing</Table.Cell>
    <Table.Cell>Glenn</Table.Cell>
</Table.Row>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Table.Head` and a `Table.Body`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root table element." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Row props:</strong> <code>onClick</code>, <code>tray</code>, <code>trayTriggerPosition</code> (`"start"` | `"end"` | `"hidden"`), <code>expanded</code> / <code>defaultExpanded</code> / <code>onExpandedChange</code>.</p>
            <p><strong>Cell props:</strong> <code>header</code> turns a cell into a <code>th</code>.</p>
        </div>
    ),
};
