import type { ComponentDoc } from "./types";
import { Badge, Table, Text } from "@particle-academy/react-fancy";

const rows = [
    { id: 1, name: "Liftoff briefing", owner: "Avery", status: "active" as const, value: 2400 },
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
    <Table.Cell>Avery</Table.Cell>
</Table.Row>`,
        },
        {
            name: "Sortable headers with Table.Column",
            description:
                "Table.Column is the header cell that knows how to sort. label is its text; sortKey names the field it orders by, and a column with no sortKey is a plain header that cannot be clicked. It extends the native <th> attributes, so scope, colSpan and data-* reach the element instead of being dropped.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Name" sortKey="name" />
                            <Table.Column label="Owner" sortKey="owner" />
                            <Table.Column label="Status" />
                            <Table.Column label="Value" sortKey="value" scope="col" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.name}</Table.Cell>
                                <Table.Cell>{row.owner}</Table.Cell>
                                <Table.Cell>
                                    <Badge color={statusColor[row.status]} size="sm">{row.status}</Badge>
                                </Table.Cell>
                                <Table.Cell>{"$"}{row.value.toLocaleString()}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ),
            code: `<Table.Head>
    <Table.Row>
        <Table.Column label="Name" sortKey="name" />
        <Table.Column label="Owner" sortKey="owner" />
        {/* No sortKey - a header that is not sortable. */}
        <Table.Column label="Status" />
        <Table.Column label="Value" sortKey="value" />
    </Table.Row>
</Table.Head>`,
        },
        {
            name: "Server-sorted columns",
            description:
                "aria-sort is emitted automatically from the column's own sort state. Pass it explicitly to override that — which is exactly what a server-sorted table needs, because it knows the sort and the component does not.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Name" sortKey="name" aria-sort="ascending" />
                            <Table.Column label="Owner" sortKey="owner" aria-sort="none" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.slice(0, 2).map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.name}</Table.Cell>
                                <Table.Cell>{row.owner}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ),
            code: `{/* The server sorted this; tell assistive tech the truth. */}
<Table.Column
    label="Name"
    sortKey="name"
    aria-sort={dir === "asc" ? "ascending" : "descending"}
/>`,
        },
        {
            name: "Toolbar and search",
            description:
                "Table.Tray is the band above or below the rows — a toolbar slot that lines up with the table rather than floating beside it. Table.Search drops a filter box into it, and placeholder relabels that box, which matters whenever “Search…” is ambiguous about what it searches.",
            render: () => (
                <Table className="w-full">
                    <Table.Tray>
                        <Text size="sm" weight="semibold">Documents</Text>
                        <Table.Search placeholder="Filter by name or owner…" />
                    </Table.Tray>
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Name" sortKey="name" />
                            <Table.Column label="Owner" sortKey="owner" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.name}</Table.Cell>
                                <Table.Cell>{row.owner}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ),
            code: `<Table>
    <Table.Tray>
        <Text weight="semibold">Documents</Text>
        <Table.Search placeholder="Filter by name or owner…" />
    </Table.Tray>

    <Table.Head>…</Table.Head>
    <Table.Body>…</Table.Body>
</Table>`,
        },
        {
            name: "Pagination",
            description:
                "total is the number of rows in the WHOLE result set, not in the page you handed in — that is what lets the control say “1–10 of 240”. pageSize is how many sit on a page. Passing the page length as total is the classic error: the pager then believes it is always on the only page.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Name" sortKey="name" />
                            <Table.Column label="Owner" sortKey="owner" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row) => (
                            <Table.Row key={row.id}>
                                <Table.Cell>{row.name}</Table.Cell>
                                <Table.Cell>{row.owner}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                    <Table.Tray>
                        <Table.Pagination total={240} pageSize={4} />
                    </Table.Tray>
                </Table>
            ),
            code: `{/* total is the size of the whole result set, not of this page. */}
<Table.Tray>
    <Table.Pagination total={results.totalCount} pageSize={25} />
</Table.Tray>`,
        },
        {
            name: "Table.RowTray — a styled drawer body",
            description:
                "A row tray takes any node, so the padding and the top rule are the caller's problem — and twenty callers get them twenty ways. Table.RowTray is that band done once: use it inside tray instead of hand-rolling a div, and every expanded row in the app lines up.",
            render: () => (
                <Table className="w-full">
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Name" sortKey="name" />
                            <Table.Column label="Owner" sortKey="owner" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        <Table.Row
                            defaultExpanded
                            tray={
                                <Table.RowTray>
                                    <Text size="sm" weight="semibold">Revision history</Text>
                                    <Text size="xs" className="mt-1">
                                        Consistent padding and the top rule, from the component rather
                                        than from this caller.
                                    </Text>
                                </Table.RowTray>
                            }
                        >
                            <Table.Cell>{rows[0].name}</Table.Cell>
                            <Table.Cell>{rows[0].owner}</Table.Cell>
                        </Table.Row>
                        <Table.Row
                            tray={
                                <Table.RowTray>
                                    <Text size="xs">Drawer for {rows[1].name}.</Text>
                                </Table.RowTray>
                            }
                        >
                            <Table.Cell>{rows[1].name}</Table.Cell>
                            <Table.Cell>{rows[1].owner}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            ),
            code: `<Table.Row
    tray={
        <Table.RowTray>
            <Text weight="semibold">Revision history</Text>
        </Table.RowTray>
    }
>
    <Table.Cell>Liftoff briefing</Table.Cell>
</Table.Row>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Table.Head` and a `Table.Body`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root table element." },
        { name: "Table.Column — label", type: `string`, default: "—", description: "Header text.", required: true },
        { name: "Table.Column — sortKey", type: `string`, default: "—", description: "Field this column orders by. Omit for a header that cannot be sorted." },
        { name: "Table.Column — ...rest", type: `ThHTMLAttributes<HTMLTableCellElement>`, default: "—", description: "Native `th` attributes — `scope`, `colSpan`, `aria-sort`, `data-*`." },
        { name: "Table.Search — placeholder", type: `string`, default: `"Search..."`, description: "Filter box placeholder." },
        { name: "Table.Pagination — total", type: `number`, default: "—", description: "Rows in the WHOLE result set, not on this page.", required: true },
        { name: "Table.Pagination — pageSize", type: `number`, default: "—", description: "Rows per page." },
        { name: "Table.Tray — children", type: `ReactNode`, default: "—", description: "Toolbar band above or below the rows.", required: true },
        { name: "Table.RowTray — children", type: `ReactNode`, default: "—", description: "Drawer body for an expanded row — the padding and top rule, done once.", required: true },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Row props:</strong> <code>onClick</code>, <code>tray</code>, <code>trayTriggerPosition</code> (`"start"` | `"end"` | `"hidden"`), <code>expanded</code> / <code>defaultExpanded</code> / <code>onExpandedChange</code>.</p>
            <p><strong>Cell props:</strong> <code>header</code> turns a cell into a <code>th</code>.</p>
        </div>
    ),
};
