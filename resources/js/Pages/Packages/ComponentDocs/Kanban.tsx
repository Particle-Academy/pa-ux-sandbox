import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Badge, Card, Heading, Kanban, Text } from "@particle-academy/react-fancy";

type Card = { id: string; title: string };
type Column = { id: string; title: string; cards: Card[] };

const initial: Column[] = [
    { id: "todo", title: "To do", cards: [{ id: "c1", title: "Draft launch checklist" }, { id: "c2", title: "Wire deploy hooks" }] },
    { id: "doing", title: "In progress", cards: [{ id: "c3", title: "Build Kanban demo" }] },
    { id: "done", title: "Done", cards: [{ id: "c4", title: "Ship Button docs" }] },
];

function KanbanDemo() {
    const [columns] = useState(initial);
    return (
        <Kanban onCardMove={() => {}} className="flex w-full gap-3 overflow-x-auto p-1">
            {columns.map((col) => (
                <Kanban.Column key={col.id} id={col.id} className="min-w-56 flex-1">
                    <Card padding="sm">
                        <div className="flex items-center justify-between">
                            <Heading size="xs">{col.title}</Heading>
                            <Badge size="sm" color="zinc">{col.cards.length}</Badge>
                        </div>
                        <div className="mt-2 space-y-2">
                            {col.cards.map((card) => (
                                <Kanban.Card key={card.id} id={card.id}>
                                    <Card padding="sm" className="cursor-grab active:cursor-grabbing">
                                        <Text size="xs">{card.title}</Text>
                                    </Card>
                                </Kanban.Card>
                            ))}
                        </div>
                    </Card>
                </Kanban.Column>
            ))}
        </Kanban>
    );
}

export const kanbanDoc: ComponentDoc = {
    intro: (
        <p>
            Drag-and-drop board. Compound: <code>Kanban.Column</code> for lanes,
            <code>Kanban.Card</code> for items. <code>onCardMove</code> fires when a card lands
            in a column (within-column reorder is the same event with
            <code>fromColumn === toColumn</code>); <code>onColumnMove</code> fires on column
            reorder when columns have <code>Kanban.ColumnHandle</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Three columns + a few cards. Drag cards between columns; `onCardMove` gets called.",
            render: () => <KanbanDemo />,
            code: `<Kanban
    onCardMove={(cardId, fromColumn, toColumn, toIndex) => {
        setColumns(moveCard(columns, cardId, fromColumn, toColumn, toIndex));
    }}
>
    {columns.map((col) => (
        <Kanban.Column key={col.id} id={col.id}>
            <Heading size="xs">{col.title}</Heading>
            {col.cards.map((card) => (
                <Kanban.Card key={card.id} id={card.id}>
                    <Card padding="sm">
                        <Text>{card.title}</Text>
                    </Card>
                </Kanban.Card>
            ))}
        </Kanban.Column>
    ))}
</Kanban>`,
        },
        {
            name: "Column reorder",
            description: "Add `Kanban.ColumnHandle` inside each column to allow column drag-and-drop.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Drop a <code>&lt;Kanban.ColumnHandle&gt;</code> inside each <code>Kanban.Column</code>; users grab the handle to drag the column. Listen on <code>onColumnMove</code>.
                </Text>
            ),
            code: `<Kanban onCardMove={handleCardMove} onColumnMove={handleColumnMove}>
    {columns.map((col) => (
        <Kanban.Column key={col.id} id={col.id}>
            <div className="flex items-center justify-between">
                <Heading size="xs">{col.title}</Heading>
                <Kanban.ColumnHandle aria-label="Reorder column" />
            </div>
            {col.cards.map((card) => (
                <Kanban.Card key={card.id} id={card.id}>…</Kanban.Card>
            ))}
        </Kanban.Column>
    ))}
</Kanban>`,
        },
        {
            name: "wipLimit",
            description:
                "A soft work-in-progress limit, shown in the column header as count/limit and turning red over capacity. Soft is the point: drops are still accepted, because a board that silently refuses a card looks broken. Enforce it for real in onCardMove if you need to.",
            render: () => (
                <Kanban className="w-full">
                    <Kanban.Column id="doing" title="Doing" wipLimit={2}>
                        <Kanban.Card id="a">Rewrite the Card docs</Kanban.Card>
                    </Kanban.Column>
                    <Kanban.Column id="review" title="Review" wipLimit={2}>
                        <Kanban.Card id="b">Starter kit route</Kanban.Card>
                        <Kanban.Card id="c">Hydration fix</Kanban.Card>
                        <Kanban.Card id="d">Coverage ratchet</Kanban.Card>
                    </Kanban.Column>
                </Kanban>
            ),
            code: `<Kanban.Column id="review" title="Review" wipLimit={2}>
    …
</Kanban.Column>

{/* Soft by design. Enforce hard here if you mean it: */}
<Kanban onCardMove={(move) => (atCapacity(move.to) ? false : apply(move))} />`,
        },
        {
            name: "hideWhenEmpty",
            description:
                "A column with no cards renders nothing at all. For filter UIs, where a row of empty placeholders is noise rather than information — the board collapses cleanly instead of showing four empty boxes.",
            render: () => (
                <Kanban className="w-full">
                    <Kanban.Column id="todo" title="To do">
                        <Kanban.Card id="x">Visible</Kanban.Card>
                    </Kanban.Column>
                    <Kanban.Column id="blocked" title="Blocked" hideWhenEmpty>
                        {null}
                    </Kanban.Column>
                    <Kanban.Column id="done" title="Done">
                        <Kanban.Card id="y">Shipped</Kanban.Card>
                    </Kanban.Column>
                </Kanban>
            ),
            code: `{/* "Blocked" disappears entirely while the filter leaves it empty. */}
<Kanban.Column id="blocked" title="Blocked" hideWhenEmpty>
    {cards.map(renderCard)}
</Kanban.Column>`,
        },
        {
            name: "unstyled",
            description:
                "Skips the default visuals — a column loses its background, padding, min-height and fixed width; a card loses its border, padding and shadow. The drag wiring stays in both cases, which is the whole reason the prop exists rather than you rebuilding the board.",
            render: () => (
                <Kanban className="w-full">
                    <Kanban.Column id="plain" title="Unstyled column" unstyled>
                        <Kanban.Card id="p1" unstyled>
                            <Card>
                                <Card.Body>
                                    <Text size="sm">A card of your own, still draggable.</Text>
                                </Card.Body>
                            </Card>
                        </Kanban.Card>
                    </Kanban.Column>
                </Kanban>
            ),
            code: `<Kanban.Column id="plain" unstyled>
    <Kanban.Card id="p1" unstyled>
        <MyOwnCard />   {/* drag handlers and draggable stay */}
    </Kanban.Card>
</Kanban.Column>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "`Kanban.Column` children — one per lane." },
        { name: "onCardMove", type: `(cardId, fromColumn, toColumn, toIndex) => void`, default: "—", description: "Called when a card is dropped. `toIndex` is the destination position within the target column. Within-column reorder uses the same event with `fromColumn === toColumn`." },
        { name: "onColumnMove", type: `(columnId, toIndex) => void`, default: "—", description: "Called when a column is dropped at a new position. Only fires for columns that have a `Kanban.ColumnHandle`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "Kanban.Column — wipLimit", type: `number`, default: "—", description: "Soft WIP limit shown as `count/limit`. Drops are still accepted — enforce hard in `onCardMove`." },
        { name: "Kanban.Column — hideWhenEmpty", type: `boolean`, default: `false`, description: "Render nothing when the column has no cards." },
        { name: "Kanban.Column / Card — unstyled", type: `boolean`, default: `false`, description: "Skip the default visuals. Drag wiring and the drag-over ring stay." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Column props:</strong> <code>id</code> (required), <code>className</code>.</p>
            <p><strong>Card props:</strong> <code>id</code> (required), <code>className</code>.</p>
            <p><strong>State:</strong> Kanban is fully controlled — apply moves to your own data and re-render. The component never owns the card order itself.</p>
        </div>
    ),
};
