import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Badge, Card, Heading, Kanban, Text } from "@particle-academy/react-fancy";

type Card = { id: string; title: string };
type Column = { id: string; title: string; cards: Card[] };

const initial: Column[] = [
    { id: "todo", title: "To do", cards: [{ id: "c1", title: "Draft launch checklist" }, { id: "c2", title: "Wire deploy hooks" }] },
    { id: "doing", title: "In progress", cards: [{ id: "c3", title: "Build Kanban demo" }] },
    { id: "done", title: "Done", cards: [{ id: "c4", title: "Ship Action docs" }] },
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
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "`Kanban.Column` children — one per lane." },
        { name: "onCardMove", type: `(cardId, fromColumn, toColumn, toIndex) => void`, default: "—", description: "Called when a card is dropped. `toIndex` is the destination position within the target column. Within-column reorder uses the same event with `fromColumn === toColumn`." },
        { name: "onColumnMove", type: `(columnId, toIndex) => void`, default: "—", description: "Called when a column is dropped at a new position. Only fires for columns that have a `Kanban.ColumnHandle`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Column props:</strong> <code>id</code> (required), <code>className</code>.</p>
            <p><strong>Card props:</strong> <code>id</code> (required), <code>className</code>.</p>
            <p><strong>State:</strong> Kanban is fully controlled — apply moves to your own data and re-render. The component never owns the card order itself.</p>
        </div>
    ),
};
