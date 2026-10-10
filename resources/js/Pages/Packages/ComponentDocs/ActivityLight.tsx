import type { ComponentDoc } from "./types";
import { ActivityLight, type ActivityLevel, type ActivityDirection } from "@particle-academy/react-fancy";

/** One row per edge. Typed explicitly so the rows that legitimately omit
 *  `direction` do not narrow the array into a union that lacks the field. */
type DemoEdge = {
    peer: string;
    level: ActivityLevel | null;
    direction?: ActivityDirection;
    count: number | null;
};


const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-1.5 last:border-b-0 dark:border-zinc-800">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
        {children}
    </div>
);

export const activityLightDoc: ComponentDoc = {
    intro: (
        <p>
            Activity on an <strong>edge</strong> — a relationship between two parties — with a
            recency ramp and an optional volume. It is <strong>not</strong> a presence dot and
            does not replace <code>Avatar status</code>: that one belongs to a single party and
            says whether <em>they</em> are online, while this belongs to a pair and says when{" "}
            <em>the link between them</em> last moved. Built for a comms column and for
            collaborator lanes, where the subject is the relationship rather than the
            participant.
        </p>
    ),
    examples: [
        {
            name: "The recency ramp — level",
            description:
                "level is the only required state. Four values, each visually distinct: live, recent, quiet, unseen. The ramp reads at a glance without being read word by word, which is the point of a light rather than a timestamp.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Row label="live">
                        <ActivityLight level="live" label="Genie and Tynn" />
                    </Row>
                    <Row label="recent">
                        <ActivityLight level="recent" label="Genie and Weaver" />
                    </Row>
                    <Row label="quiet">
                        <ActivityLight level="quiet" label="Genie and Prism" />
                    </Row>
                    <Row label="unseen">
                        <ActivityLight level="unseen" label="Genie and Civi" />
                    </Row>
                </div>
            ),
            code: `<ActivityLight level="live" label="Genie and Tynn" />
<ActivityLight level="recent" label="Genie and Weaver" />
<ActivityLight level="quiet" label="Genie and Prism" />
<ActivityLight level="unseen" label="Genie and Civi" />`,
        },
        {
            name: "level={null} renders NOTHING",
            description:
                "A real edge whose recency cannot be observed. It renders no element at all — not a grey dot, not a dash, not a placeholder that still takes space in the lane. A grey dot would assert “this edge is quiet”, and that is a claim we cannot make. The row below has an ActivityLight in it; you cannot see it, which is correct.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Row label="quiet — a claim we CAN make">
                        <ActivityLight level="quiet" label="Genie and Prism" />
                    </Row>
                    <Row label="null — undatable, renders nothing">
                        <ActivityLight level={null} label="Genie and an unknown peer" />
                    </Row>
                </div>
            ),
            code: `// The edge is real, its recency is not observable.
<ActivityLight level={null} label="Genie and an unknown peer" />
// -> renders nothing at all`,
        },
        {
            name: "count — and the zero that must survive",
            description:
                "count is the volume on the edge. The two kinds of nothing are the whole discipline here: count={null} (or omitted) means NOT COUNTED and renders no number, while a measured count={0} DOES render, because “we looked and it was none” is a fact. Suppressing a real zero would be indistinguishable from never having looked — and a zero that should have read “unknown” tells the reader an agent works alone.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Row label="count={12} — measured">
                        <ActivityLight level="live" count={12} label="Genie and Tynn" />
                    </Row>
                    <Row label="count={0} — measured none, renders 0">
                        <ActivityLight level="quiet" count={0} label="Genie and Prism" />
                    </Row>
                    <Row label="count={null} — not counted, renders no number">
                        <ActivityLight level="live" count={null} label="Genie and Civi" />
                    </Row>
                    <Row label="count omitted — same as null">
                        <ActivityLight level="live" label="Genie and Impactium" />
                    </Row>
                </div>
            ),
            code: `<ActivityLight level="live" count={12} label="Genie and Tynn" />
<ActivityLight level="quiet" count={0} label="Genie and Prism" />     // renders "0"
<ActivityLight level="live" count={null} label="Genie and Civi" />    // renders no number`,
        },
        {
            name: "direction",
            description:
                "Which way the traffic went: in, out or both. Leave it off when the direction is unknown or not meaningful — absent means UNDIRECTED, not “both”. Defaulting to both would assert traffic in two directions nobody observed, which is the same class of false claim as a grey dot.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Row label='direction="in"'>
                        <ActivityLight level="live" direction="in" count={4} label="Weaver to Genie" />
                    </Row>
                    <Row label='direction="out"'>
                        <ActivityLight level="live" direction="out" count={9} label="Genie to Weaver" />
                    </Row>
                    <Row label='direction="both"'>
                        <ActivityLight level="live" direction="both" count={13} label="Genie and Weaver" />
                    </Row>
                    <Row label="omitted — undirected">
                        <ActivityLight level="live" count={13} label="Genie and Weaver" />
                    </Row>
                </div>
            ),
            code: `<ActivityLight level="live" direction="in" count={4} label="Weaver to Genie" />
<ActivityLight level="live" direction="out" count={9} label="Genie to Weaver" />
<ActivityLight level="live" direction="both" count={13} label="Genie and Weaver" />`,
        },
        {
            name: "label — the accessible name",
            description:
                "label is required, and it names the EDGE. A colour conveys nothing without sight, so the accessible name carries both the edge and its state: “Genie and Tynn: live, 12”. When the count is unknown it is left out of the name rather than read as zero.",
            render: () => (
                <div className="w-full max-w-sm">
                    <Row label='aria-label="Genie and Tynn: live, 12"'>
                        <ActivityLight level="live" count={12} label="Genie and Tynn" />
                    </Row>
                    <Row label='aria-label="Genie and Civi: unseen"'>
                        <ActivityLight level="unseen" count={null} label="Genie and Civi" />
                    </Row>
                </div>
            ),
            code: `// The accessible name is "<label>: <level>" or "<label>: <level>, <count>".
<ActivityLight level="live" count={12} label="Genie and Tynn" />`,
        },
        {
            name: "A collaborator lane",
            description:
                "What it is for. One row per edge, mixed states including both kinds of nothing — which is what a real board looks like.",
            render: () => (
                <div className="w-full max-w-sm rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    {(
                        [
                            { peer: "tynn", level: "live", direction: "both", count: 12 },
                            { peer: "weaver", level: "recent", direction: "out", count: 3 },
                            { peer: "prism", level: "quiet", direction: "in", count: 0 },
                            { peer: "civi", level: "unseen", count: null },
                            { peer: "impactium", level: null, count: null },
                        ] satisfies DemoEdge[]
                    ).map((edge) => (
                        <Row key={edge.peer} label={`claude · ${edge.peer}`}>
                            <ActivityLight
                                level={edge.level}
                                direction={edge.direction}
                                count={edge.count}
                                label={`Genie and ${edge.peer}`}
                            />
                        </Row>
                    ))}
                </div>
            ),
            code: `{edges.map((edge) => (
    <div key={edge.peer} className="flex items-center justify-between">
        <span>{edge.peer}</span>
        <ActivityLight
            level={edge.level}          // null for an undatable edge
            direction={edge.direction}
            count={edge.count}          // null for "not counted"
            label={\`Genie and \${edge.peer}\`}
        />
    </div>
))}`,
        },
    ],
    props: [
        {
            name: "level",
            type: `"live" | "recent" | "quiet" | "unseen" | null`,
            default: "—",
            description:
                "Recency of the edge. `null` means the edge is real but undatable and **renders nothing**.",
            required: true,
        },
        {
            name: "label",
            type: "string",
            default: "—",
            description: "Accessible name for the edge — `\"Genie and Tynn\"`.",
            required: true,
        },
        {
            name: "count",
            type: "number | null",
            default: "null",
            description:
                "Volume on the edge. `null` renders no number; a measured `0` **does** render.",
        },
        {
            name: "direction",
            type: `"in" | "out" | "both"`,
            default: "—",
            description: "Which way the traffic went. Absent means undirected, not `\"both\"`.",
        },
        {
            name: "...rest",
            type: `Omit<HTMLAttributes<HTMLSpanElement>, "children">`,
            default: "—",
            description:
                "All standard span attributes. `children` is omitted — the content is derived from the props.",
        },
    ],
    notes: (
        <ul>
            <li>
                <strong>Two kinds of nothing, and they must not look alike.</strong>{" "}
                <code>level={"{null}"}</code> renders no element; <code>count={"{null}"}</code>{" "}
                renders the light with no number; <code>count={"{0}"}</code> renders{" "}
                <code>0</code>. The distinction reads as pedantic until a count is wrong in the
                direction that flatters.
            </li>
            <li>
                Not a presence indicator. If you want “is this person online”, that is{" "}
                <code>Avatar status</code> — one party, not a pair.
            </li>
            <li>
                The level is on the root as{" "}
                <code>data-react-fancy-activity-light="&lt;level&gt;"</code>, so an agent reads
                the state off the DOM without inspecting classes.
            </li>
            <li>
                The dot animates only at <code>live</code>. Everything else is still, so motion
                in a lane means something is happening right now.
            </li>
        </ul>
    ),
};
