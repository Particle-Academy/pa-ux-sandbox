import { useMemo, useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, VirtualList } from "@particle-academy/react-fancy";

type Event = { id: string; n: number; kind: "event" | "message" };

/** A ledger of mixed-height rows: every seventh row is a wrapping message. */
function ledger(count: number): Event[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `e-${i}`,
        n: i + 1,
        kind: i % 7 === 0 ? "message" : "event",
    }));
}

const SHELL =
    "w-full max-w-xl rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900";

function EventRow({ row }: { row: Event }) {
    if (row.kind === "message") {
        return (
            <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                <div className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                    message #{row.n}
                </div>
                <p className="m-0 text-sm text-zinc-700 dark:text-zinc-200">
                    This row wraps, so it is taller than its neighbours and its height is not
                    knowable in advance — it depends on the container width, the font and where
                    the words break. That is why heights are measured rather than predicted.
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-baseline gap-3 border-b border-zinc-100 px-3 py-1 dark:border-zinc-800">
            <span className="font-mono text-[11px] tabular-nums text-zinc-400">{row.n}</span>
            <span className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                event {row.n} committed
            </span>
        </div>
    );
}

/** Tail-follow is controlled, so the demo owns the state and the pill. */
function TailFollowDemo() {
    const [items, setItems] = useState(() => ledger(200));
    const [following, setFollowing] = useState(true);
    const [unseen, setUnseen] = useState(0);

    const append = () =>
        setItems((prev) => [
            ...prev,
            ...Array.from({ length: 5 }, (_, i) => ({
                id: `e-${prev.length + i}`,
                n: prev.length + i + 1,
                kind: (prev.length + i) % 7 === 0 ? ("message" as const) : ("event" as const),
            })),
        ]);

    return (
        <div className="w-full max-w-xl">
            <div className="mb-2 flex items-center gap-2 text-xs">
                <Button onClick={append}>Append 5 rows</Button>
                <span className="text-zinc-500 dark:text-zinc-400">
                    following: <strong>{String(following)}</strong>
                </span>
                {!following && unseen > 0 && (
                    <Button onClick={() => setFollowing(true)}>{"↓"} {unseen} new</Button>
                )}
            </div>

            <VirtualList
                className={SHELL}
                height={240}
                estimateRowHeight={28}
                items={items}
                renderRow={(row) => <EventRow row={row} />}
                followTail={following}
                onFollowChange={setFollowing}
                onUnseenChange={setUnseen}
            />

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Append rows and it stays pinned. Now scroll up — even a single wheel click, even
                while still at the bottom — and following stops, the pill appears, and nothing
                moves under you until you ask it to.
            </p>
        </div>
    );
}

/** A deep link, resolved and reported. */
function DeepLinkDemo() {
    const items = useMemo(() => ledger(30_000), []);
    const [at, setAt] = useState<string | null>(null);
    const [resolved, setResolved] = useState<string>("nothing requested yet");

    return (
        <div className="w-full max-w-xl">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <Button onClick={() => setAt("e-24999")}>Go to row 25,000</Button>
                <Button onClick={() => setAt("e-7")}>Go to row 8</Button>
                <Button onClick={() => setAt("e-pruned")}>Go to a pruned row</Button>
            </div>

            <VirtualList
                className={SHELL}
                height={240}
                estimateRowHeight={28}
                overscan={8}
                items={items}
                renderRow={(row) => <EventRow row={row} />}
                scrollToId={at}
                onScrollToIdResolved={(id, landed) =>
                    setResolved(landed ? `landed on ${id}` : `${id} is not in the list`)
                }
            />

            <p className="mt-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                onScrollToIdResolved: {resolved}
            </p>
        </div>
    );
}

export const virtualListDoc: ComponentDoc = {
    intro: (
        <p>
            A windowed list for ledgers that run to tens of thousands of rows — only the visible
            slice is ever in the DOM. Built for an agent event stream, where three things are
            true at once: rows are <strong>mixed height</strong> (messages wrap, event rows do
            not), a link carries <code>?at=&lt;rowId&gt;</code> to the exact row under
            discussion, and new rows keep arriving while the human is reading older ones. The
            last of those is why tail-following breaks on <em>intent</em> rather than position:{" "}
            <strong>nothing may ever scroll under the reader</strong>.
        </p>
    ),
    examples: [
        {
            name: "items and renderRow",
            description:
                "The two required props. items is plain JSON-friendly data — each row needs only a stable id — and renderRow draws one row. 30,000 rows here; count the DOM nodes and you will find a few dozen.",
            render: () => {
                const items = ledger(30_000);

                return (
                    <VirtualList
                        className={SHELL}
                        height={240}
                        estimateRowHeight={28}
                        items={items}
                        renderRow={(row) => <EventRow row={row} />}
                    />
                );
            },
            code: `<VirtualList
    items={events}                        // [{ id: "e-1", ... }, ...]
    renderRow={(row) => <EventRow row={row} />}
    height={240}
    estimateRowHeight={28}
/>`,
        },
        {
            name: "Variable row height, measured not predicted",
            description:
                "Every seventh row above is a wrapping message, and the list never had to be told. estimateRowHeight only SEEDS rows that have never been on screen; a row's real height replaces it the moment it renders, and every offset after it moves. There is deliberately no rowHeight(item) callback — that is a prediction about text wrapping, font loading and container width, and when it is wrong the error accumulates down the list until rows draw in the wrong place and scrollToId lands on a neighbour.",
            render: () => {
                const items = ledger(500);

                return (
                    <VirtualList
                        className={SHELL}
                        height={240}
                        estimateRowHeight={28}
                        items={items}
                        renderRow={(row, index) => (
                            <div className="border-b border-zinc-100 px-3 py-1 text-sm dark:border-zinc-800">
                                <span className="mr-2 font-mono text-[11px] text-zinc-400">
                                    {index}
                                </span>
                                {row.kind === "message"
                                    ? "A message row, which wraps onto as many lines as the words need and is therefore taller than its neighbours by an amount nobody can compute in advance."
                                    : `event ${row.n}`}
                            </div>
                        )}
                    />
                );
            },
            code: `// No height callback. estimateRowHeight seeds the unmeasured rows;
// the real height is measured on first render and corrects the offsets.
<VirtualList
    items={events}
    renderRow={(row, index) => <Row row={row} index={index} />}
    estimateRowHeight={28}
/>`,
        },
        {
            name: "followTail, onFollowChange and onUnseenChange",
            description:
                "Tail-following is CONTROLLED: the component only ever asks, via onFollowChange, and you own the state — which is what makes the follow state readable and writable by an agent over a bridge. onUnseenChange gives you the backlog so the pill is yours to render and style.",
            render: () => <TailFollowDemo />,
            code: `const [following, setFollowing] = useState(true);
const [unseen, setUnseen] = useState(0);

<VirtualList
    items={events}
    renderRow={renderRow}
    followTail={following}
    onFollowChange={setFollowing}
    onUnseenChange={setUnseen}
/>

{!following && unseen > 0 && (
    <Button onClick={() => setFollowing(true)}>↓ {unseen} new</Button>
)}`,
        },
        {
            name: "scrollToId and onScrollToIdResolved",
            description:
                "The deep link. scrollToId puts a row at the top of the viewport; for a row far down an unmeasured list the target SETTLES as the rows above it are measured, and onScrollToIdResolved fires once it has stopped moving. landed is false when the id is not in items — a link to a pruned row must be distinguishable from a successful scroll to the top, or the feature is untrustworthy. Try the third button.",
            render: () => <DeepLinkDemo />,
            code: `<VirtualList
    items={events}
    renderRow={renderRow}
    scrollToId={params.at}            // ?at=e-24999
    onScrollToIdResolved={(id, landed) => {
        if (!landed) toast(\`\${id} is no longer in this stream\`);
    }}
/>`,
        },
        {
            name: "height and overscan",
            description:
                "height is the scroll viewport. A number is also used as the viewport height for windowing BEFORE the element has been measured, so prefer one when you know it — \"100%\" works, it just renders a conservative first window. overscan is how many rows to keep beyond each edge: raise it to trade memory for fewer blank frames during a fast flick.",
            render: () => {
                const items = ledger(5_000);

                return (
                    <div className="flex w-full max-w-xl flex-col gap-3">
                        <div>
                            <div className="mb-1 text-xs text-zinc-500">
                                height={"{120}"}, overscan={"{0}"}
                            </div>
                            <VirtualList
                                className={SHELL}
                                height={120}
                                overscan={0}
                                estimateRowHeight={28}
                                items={items}
                                renderRow={(row) => <EventRow row={row} />}
                            />
                        </div>
                        <div>
                            <div className="mb-1 text-xs text-zinc-500">
                                height={"{120}"}, overscan={"{20}"}
                            </div>
                            <VirtualList
                                className={SHELL}
                                height={120}
                                overscan={20}
                                estimateRowHeight={28}
                                items={items}
                                renderRow={(row) => <EventRow row={row} />}
                            />
                        </div>
                    </div>
                );
            },
            code: `<VirtualList items={events} renderRow={renderRow} height={120} overscan={20} />

// Filling a flex parent: pass "100%" and let the element be measured.
<VirtualList items={events} renderRow={renderRow} height="100%" />`,
        },
    ],
    props: [
        {
            name: "items",
            type: "readonly T[]",
            default: "—",
            description: "The full list. `T` needs only a stable `id`. Only the window renders.",
            required: true,
        },
        {
            name: "renderRow",
            type: "(item: T, index: number) => ReactNode",
            default: "—",
            description: "Draws one row. Called only for rows inside the window.",
            required: true,
        },
        {
            name: "height",
            type: "number | string",
            default: `"100%"`,
            description:
                "Scroll viewport height. A number is also the pre-measurement windowing height.",
        },
        {
            name: "estimateRowHeight",
            type: "number",
            default: "32",
            description:
                "Seed height for rows never rendered. Replaced by the real height on first render.",
        },
        {
            name: "overscan",
            type: "number",
            default: "6",
            description: "Rows rendered beyond each edge of the viewport.",
        },
        {
            name: "followTail",
            type: "boolean",
            default: "false",
            description: "Stick to the bottom as rows arrive. **Controlled** — never self-set.",
        },
        {
            name: "onFollowChange",
            type: "(following: boolean) => void",
            default: "—",
            description:
                "The list asking to change `followTail`: `false` on an upward gesture, `true` back at the bottom.",
        },
        {
            name: "onUnseenChange",
            type: "(count: number) => void",
            default: "—",
            description: "Rows arrived since following stopped. Always `0` while following.",
        },
        {
            name: "scrollToId",
            type: "string | null",
            default: "null",
            description: "Put this row at the top of the viewport — the `?at=` deep link.",
        },
        {
            name: "onScrollToIdResolved",
            type: "(id: string, landed: boolean) => void",
            default: "—",
            description:
                "Fires once the scroll has settled. `landed` is `false` when the id is not in `items`.",
        },
        {
            name: "...rest",
            type: `Omit<HTMLAttributes<HTMLDivElement>, "children" | "onScroll">`,
            default: "—",
            description:
                "Standard div attributes on the viewport. `onScroll` is owned by the component.",
        },
    ],
    notes: (
        <ul>
            <li>
                <strong>Tail-follow breaks on intent, not position.</strong> Any upward wheel,
                drag, <code>PageUp</code> or <code>Home</code> stops following immediately —
                even while still pinned to the bottom with <code>scrollTop</code> unchanged.
                Position cannot tell “the human scrolled up” from “content grew downward”, so a
                position-only implementation follows through a wheel-up and yanks the reader
                back on the next append.
            </li>
            <li>
                A pending <code>scrollToId</code> wins over <code>followTail</code> while it
                resolves, otherwise the two fight over the same <code>scrollTop</code> and the
                link loses. Set <code>followTail</code> to <code>false</code> when you deep-link,
                or the list resumes following once the link lands.
            </li>
            <li>
                Rows above the rendered window keep their estimate, so the{" "}
                <strong>total height is approximate</strong> until they have been visited. What
                is exact is the landing: the target row's top is the scroll position.
            </li>
            <li>
                Handles for an agent or a bridge:{" "}
                <code>data-react-fancy-virtual-list</code> on the viewport (plus{" "}
                <code>-following</code> and <code>-rows</code>),{" "}
                <code>data-react-fancy-virtual-list-window</code> on the rendered slice, and{" "}
                <code>data-react-fancy-virtual-row-id="&lt;id&gt;"</code> on every row.
            </li>
            <li>
                <code>ResizeObserver</code> is used when present to catch a row reflowing in
                place. Without it the list still measures on every render — it just will not
                notice a row changing height while it sits still.
            </li>
        </ul>
    ),
};
