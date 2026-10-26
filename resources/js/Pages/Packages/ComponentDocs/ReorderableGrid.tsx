import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Badge, ReorderableGrid, Text } from "@particle-academy/react-fancy";

type Field = { id: string; label: string; value: string; locked?: boolean };

const FIELDS: Field[] = [
    { id: "amount", label: "Amount", value: "$48,000", locked: true },
    { id: "stage", label: "Stage", value: "Proposal" },
    { id: "owner", label: "Owner", value: "R. Alvarez" },
    { id: "close", label: "Close date", value: "Dec 12" },
    { id: "source", label: "Source", value: "Referral" },
    { id: "region", label: "Region", value: "EMEA" },
    { id: "product", label: "Product", value: "Studio" },
    { id: "probability", label: "Probability", value: "60%" },
];

// Bare content: the grid's cell already draws the border, surface, padding and
// the picked-up / drop-target states. Wrapping this in another bordered box
// gives a frame inside a frame.
function Cell({ item }: { item: Field }) {
    return (
        <>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {item.label}
                {item.locked ? " · pinned" : ""}
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.value}</p>
        </>
    );
}

function FieldOrderDemo() {
    const [order, setOrder] = useState<string[]>(FIELDS.map((f) => f.id));
    return (
        <div className="w-full max-w-2xl space-y-3">
            <ReorderableGrid
                items={FIELDS}
                value={order}
                onReorder={setOrder}
                columns={4}
                gap="sm"
                label="Deal field order"
                getItemLabel={(f) => f.label}
                renderItem={(item) => <Cell item={item} />}
            />
            <Text size="sm" className="!text-zinc-500">
                Drag a cell, or focus one and press Space, then the arrow keys, then Space. Escape cancels.
            </Text>
            <Badge color="violet" variant="soft">{order.join(", ")}</Badge>
        </div>
    );
}

export const reorderableGridDoc: ComponentDoc = {
    intro: (
        <p>
            A grid whose cells can be reordered in place, by pointer or keyboard. Built for
            designers where the editor should look exactly like the result, such as choosing the
            order a record's fields appear in a 2-to-4-column details view. The order is a list of
            ids, so it saves and restores as plain JSON and an agent can set it too.
        </p>
    ),
    examples: [
        {
            name: "Field-order designer",
            description:
                "Controlled with `value` + `onReorder`. `onReorder` fires once per committed move, never for the live preview or a cancel. The pinned Amount cell is `locked`: it keeps its slot and other cells flow around it.",
            render: () => <FieldOrderDemo />,
            code: `const [order, setOrder] = useState(fields.map((f) => f.id));

<ReorderableGrid
    items={fields}
    value={order}
    onReorder={setOrder}
    columns={4}
    gap="sm"
    label="Deal field order"
    getItemLabel={(f) => f.label}
    // The cell is already framed: return bare content.
    renderItem={(field) => (
        <>
            <p className="text-xs text-zinc-500">{field.label}</p>
            <p className="font-medium">{field.value}</p>
        </>
    )}
/>`,
        },
        {
            name: "Uncontrolled, with a drag handle",
            description:
                "`defaultValue` starts the order and the grid keeps it. Spread `state.handleProps` on an element to make only that element start a pointer drag; buttons and inputs inside a cell never start one.",
            render: () => (
                <ReorderableGrid
                    items={FIELDS.slice(1, 5)}
                    defaultValue={["close", "stage", "owner", "source"]}
                    unstyled
                    columns={2}
                    renderItem={(item, state) => (
                        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                            <span {...state.handleProps} className="cursor-grab select-none text-zinc-400" aria-hidden>
                                ⋮⋮
                            </span>
                            <span className="text-sm text-zinc-800 dark:text-zinc-100">{item.label}</span>
                        </div>
                    )}
                    className="w-full max-w-sm"
                />
            ),
            code: `<ReorderableGrid
    items={fields}
    defaultValue={savedOrder}
    unstyled // this example draws its own cell
    columns={2}
    renderItem={(field, state) => (
        <div>
            <span {...state.handleProps}>⋮⋮</span>
            {field.label}
        </div>
    )}
/>`,
        },
        {
            name: "For agents: moveItem",
            description:
                "`moveItem(ids, from, to, { locked })` is the same pure move the grid uses, exported so an MCP bridge can reorder without touching the DOM.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    moveItem(["a", "b", "c", "d"], 0, 2) returns ["b", "c", "a", "d"].
                </Text>
            ),
            code: `import { moveItem } from "@particle-academy/react-fancy";

setOrder(moveItem(order, 0, 5));`,
        },
    ],
    props: [
        { name: "items", type: `T[]` , default: "—", description: "Cell data. Each item needs a stable `id`; `locked: true` pins it in place." },
        { name: "value", type: `string[]`, default: "—", description: "Controlled order, as ids. Unknown ids are ignored and new items are appended." },
        { name: "defaultValue", type: `string[]`, default: "items order", description: "Initial order when uncontrolled." },
        { name: "onReorder", type: `(ids: string[]) => void`, default: "—", description: "The full new order, once per committed move." },
        { name: "renderItem", type: `(item, state) => ReactNode`, default: "—", description: "Cell CONTENT. The cell is already framed, so return bare content (no border of your own). `state` has position, row, column, pickedUp, dragging, dropTarget, locked and handleProps." },
        { name: "columns", type: `number`, default: `2`, description: "Columns, 1-12. Placement is row-major, and Up/Down move one row." },
        { name: "gap", type: `"none" | "sm" | "md" | "lg"`, default: `"sm"`, description: "Space between cells." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Turns off pointer and keyboard reordering." },
        { name: "label", type: `string`, default: "—", description: "Accessible name of the grid." },
        { name: "getItemLabel", type: `(item) => string`, default: "the id", description: "The name read out in announcements." },
        { name: "labels", type: `Partial<ReorderableGridLabels>`, default: "English", description: "Override instructions and every aria-live announcement, for i18n." },
        { name: "unstyled", type: `boolean`, default: `false`, description: "Drop the default cell frame (border, surface, padding) when you draw the cell yourself. Drag, keyboard and announcements are unchanged." },
        { name: "cellClassName", type: `string`, default: "—", description: "Classes on every cell wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Keyboard:</strong> Space or Enter picks up, arrows move in two dimensions,
            Space or Enter drops, Escape cancels and restores. Escape goes through the layer stack,
            so inside a Modal or full-screen surface it cancels the pick-up first. Handles:
            <code>data-react-fancy-reorderable-grid</code>, <code>data-reorderable-id</code>,
            <code>data-index</code>.
        </p>
    ),
};
