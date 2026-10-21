import { useState } from "react";
import { Button, Text, useToast } from "@particle-academy/react-fancy";
import {
    WhatsNew,
    type WhatsNewGroup,
    type WhatsNewProps,
    type WhatsNewStorage,
} from "@particle-academy/fancy-whats-new";
import type { ComponentDoc } from "./types";

/**
 * fancy-whats-new's WhatsNew, rendered INLINE so it is visible on the page.
 * Each example gets its own in-memory store, created fresh when you press
 * "Show again", so "seen" never sticks to this browser here. In an app the
 * store is localStorage by default, or the account (fancy-inertia's `seenUrl`).
 */

/** A store that remembers nothing past this example: `seen` is where it starts. */
function memory(seen: string | null): WhatsNewStorage {
    let cursor = seen;
    return {
        load: () => cursor,
        save: (next) => {
            cursor = next;
        },
    };
}

/** A welcome: one group, one card, shown on a first visit. */
export const WELCOME: WhatsNewGroup[] = [
    {
        id: "welcome",
        cards: [
            {
                title: "Welcome to the kit",
                description: "Components for the surfaces where humans and agents work together.",
                action: { label: "Browse the packages", href: "/packages" },
            },
        ],
    },
];

/** Three releases, newest first. Someone who saw 1.3.0 is shown 1.5.0 and 1.4.0, stacked. */
export const RELEASES: WhatsNewGroup[] = [
    {
        id: "1.5.0",
        label: "v1.5.0",
        date: "2026-10-21",
        cards: [
            {
                title: "Spreadsheets, in the page",
                description: "Multi-sheet workbooks with formulas, editable by people and agents.",
                image: "/showcase-shots/fancy-sheets.png",
                imageDark: "/showcase-shots/fancy-sheets-dark.png",
                imageAlt: "A fancy-sheets workbook",
            },
            { title: "Faster search", description: "Results as you type, across every page." },
        ],
    },
    {
        id: "1.4.0",
        label: "v1.4.0",
        date: "2026-10-14",
        cards: [{ title: "Charts that follow your theme", description: "ECharts picks up the active palette." }],
    },
    {
        id: "1.3.0",
        label: "v1.3.0",
        date: "2026-10-07",
        cards: [{ title: "Exports to PDF", description: "Any page, one click." }],
    },
];

type ExampleProps = Omit<WhatsNewProps, "load" | "storage"> & {
    groups: WhatsNewGroup[];
    /** The cursor this example's person last saw. */
    seen?: string | null;
};

/** One notice, remounted with a fresh store by "Show again". */
export function WhatsNewExample({ groups, seen = null, ...props }: ExampleProps) {
    const [run, setRun] = useState(0);
    const [store, setStore] = useState(() => memory(seen));

    return (
        <div className="w-full max-w-sm space-y-3" data-demo="whats-new">
            <WhatsNew key={run} load={() => groups} storage={store} position="inline" {...props} />
            <Button
                size="sm"
                variant="ghost"
                icon="refresh-cw"
                onClick={() => {
                    setStore(memory(seen));
                    setRun((n) => n + 1);
                }}
            >
                Show again
            </Button>
        </div>
    );
}

/** A button that shows the current cards on demand. Nothing new, so nothing shows until pressed. */
export function WhatsNewButtonExample() {
    const [open, setOpen] = useState(false);
    const [store] = useState(() => memory("1.5.0"));

    return (
        <div className="w-full max-w-sm space-y-3" data-demo="whats-new-open">
            <Button size="sm" variant="ghost" icon="sparkles" onClick={() => setOpen(true)} disabled={open}>
                What&apos;s new
            </Button>
            <WhatsNew
                load={() => RELEASES}
                storage={store}
                open={open}
                onOpenChange={setOpen}
                position="inline"
            />
        </div>
    );
}

function YoursExample() {
    const { toast } = useToast();

    return (
        <WhatsNewExample
            groups={RELEASES}
            seen="1.3.0"
            missed="latest"
            labels={{ dismiss: "thanks", close: "Hide", previous: "back", next: "onward", notice: "Release notes" }}
            scrollHint="scroll to browse"
            color="emerald"
            depth={1}
            offset={10}
            className="shadow-xl"
            cardClassName="rounded-2xl"
            style={{ maxWidth: 360 }}
            onSeen={(cursor) => toast({ title: "Seen", description: `Recorded ${cursor}.`, variant: "success" })}
            onClose={() => toast({ title: "Closed" })}
        />
    );
}

/** The Preview tab: a welcome, two stacked releases, and the button. */
export function WhatsNewDemo() {
    return (
        <div className="space-y-4">
            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                Each notice is shown inline with its own in-memory store. In your app it sits in a corner
                and remembers what each person saw. This site uses it for new releases: the megaphone in the
                header shows the newest again.
            </Text>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wide !text-zinc-500">
                        A welcome, on a first visit
                    </Text>
                    <WhatsNewExample groups={WELCOME} />
                </div>
                <div className="space-y-2">
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wide !text-zinc-500">
                        Two releases they missed
                    </Text>
                    <WhatsNewExample groups={RELEASES} seen="1.3.0" />
                </div>
                <div className="space-y-2">
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wide !text-zinc-500">
                        On demand, from a button
                    </Text>
                    <WhatsNewButtonExample />
                </div>
            </div>
        </div>
    );
}

export const whatsNewDoc: ComponentDoc = {
    intro: (
        <div className="space-y-2">
            <p>
                Show these once, stacked, then remember they were seen. On the first load after a refresh
                or a login, it shows the groups of cards newer than what this person last saw, then
                remembers the newest one shown. A group is whatever you say it is: a release, a welcome, a
                new post.
            </p>
            <p>
                <code>load(since)</code> returns the groups newer than <code>since</code>, newest first.
                &quot;Seen&quot; is recorded as soon as the notice is on screen in a visible tab, so it is
                shown once, not until acknowledged. A button wired to <code>open</code> shows the current
                cards again. There is no history paging and no menu.
            </p>
        </div>
    ),
    examples: [
        {
            name: "A welcome, on a first visit",
            description:
                "One group, one card. `since` is null for someone who has never been shown anything, and `firstVisit=\"latest\"` (the default) shows the newest group once. A card's `action` is a link.",
            render: () => <WhatsNewExample groups={WELCOME} />,
            code: `import { WhatsNew } from "@particle-academy/fancy-whats-new";

<WhatsNew
    load={() => [{
        id: "welcome",
        cards: [{
            title: "Welcome to the kit",
            description: "Components for the surfaces where humans and agents work together.",
            action: { label: "Browse the packages", href: "/packages" },
        }],
    }]}
    firstVisit="latest"   // the default; "none" records a baseline, "all" stacks everything
/>`,
        },
        {
            name: "Two groups they missed, stacked",
            description:
                "Someone who last saw 1.3.0 is shown 1.5.0 and 1.4.0. `missed=\"all\"` (the default) stacks every newer group's cards, each labelled with its group's `label` and `date`; `image` and `imageDark` are the card's header in light and dark mode. Seen is stored by `storage`; the default is localStorage under `storageKey`.",
            render: () => <WhatsNewExample groups={RELEASES} seen="1.3.0" />,
            code: `import { WhatsNew } from "@particle-academy/fancy-whats-new";

<WhatsNew
    load={(since) => fetch(\`/notices?since=\${since ?? ""}\`).then((r) => r.json())}
    missed="all"                         // the default; "latest" shows the newest group only
    storageKey="fancy-whats-new:seen"    // the default localStorage key
    position="bottom-right"              // or top-left | top | top-right | bottom-left | bottom | inline
/>

// load returns, newest first:
[
    { id: "1.5.0", label: "v1.5.0", date: "2026-10-21", cards: [
        { title: "Spreadsheets, in the page", image: "/sheets.png", imageDark: "/sheets-dark.png", imageAlt: "A workbook" },
        { title: "Faster search" },
    ] },
    { id: "1.4.0", label: "v1.4.0", date: "2026-10-14", cards: [{ title: "Charts that follow your theme" }] },
]`,
        },
        {
            name: "A button that shows it again",
            description:
                "`open` shows the current cards on demand: the page-load notice if it is up, otherwise the newest group with cards, whether or not it was seen. Closing calls `onOpenChange(false)`.",
            render: () => <WhatsNewButtonExample />,
            code: `import { useState } from "react";
import { Button } from "@particle-academy/react-fancy";
import { WhatsNew } from "@particle-academy/fancy-whats-new";

function Notices() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button icon="sparkles" onClick={() => setOpen(true)}>What's new</Button>
            <WhatsNew load={load} open={open} onOpenChange={setOpen} />
        </>
    );
}`,
        },
        {
            name: "Your words, colour and stack",
            description:
                "`missed=\"latest\"` shows only the newest group. `labels` renames every control, `scrollHint` the hint over 2+ cards (false turns it off), `color` is the \"got it\" button's react-fancy colour, `depth` and `offset` shape the stack, and `className` / `cardClassName` / `style` style it. `onSeen` fires when a cursor is recorded, `onClose` when it is closed.",
            render: () => <YoursExample />,
            code: `<WhatsNew
    load={load}
    missed="latest"
    labels={{ dismiss: "thanks", close: "Hide", previous: "back", next: "onward", notice: "Release notes" }}
    scrollHint="scroll to browse"
    color="emerald"
    depth={1}
    offset={10}
    className="shadow-xl"
    cardClassName="rounded-2xl"
    style={{ bottom: 72 }}
    onSeen={(cursor) => console.log("seen", cursor)}
    onClose={() => console.log("closed")}
/>`,
        },
        {
            name: "Per account, across devices",
            description:
                "`storage` takes any `{ load, save }` (sync or async). fancy-inertia's `WhatsNew` sets it for you: give it `seenUrl` for a signed-in person and the cursor lives on their account; null for a guest keeps localStorage. This site does exactly that.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    A store that fails to load shows nothing: the person may have seen everything.
                </Text>
            ),
            code: `import { WhatsNew } from "@particle-academy/fancy-inertia/whats-new";

<WhatsNew load={load} seenUrl={user ? "/me/seen-notices" : null} />

// or any store, with the core component:
<WhatsNew
    load={load}
    storage={{
        load: () => fetch("/me/seen").then((r) => r.json()).then((j) => j.seen),
        save: (cursor) => fetch("/me/seen", { method: "PUT", body: JSON.stringify({ seen: cursor }) }),
    }}
/>`,
        },
        {
            name: "Your own card body, or your own notice",
            description:
                "`renderCard` replaces a card's image, title and description (its label line, link, close, \"got it\" and prev / next stay). `render` replaces the whole notice and gets `{ mode, groups, close }`.",
            render: () => (
                <WhatsNewExample
                    groups={RELEASES.slice(0, 1)}
                    renderCard={(card, { index, count }) => (
                        <Text size="sm">
                            {index + 1}/{count}: <strong>{card.title}</strong>
                        </Text>
                    )}
                />
            ),
            code: `<WhatsNew
    load={load}
    renderCard={(card, { group, index, count, isFront }) => <MyCardBody card={card} />}
/>

<WhatsNew
    load={load}
    render={({ mode, groups, close }) => <MyNotice groups={groups} onClose={close} />}
/>`,
        },
    ],
    props: [
        { name: "load", type: "(since: string | null) => WhatsNewGroup[] | Promise<…>", default: "—", required: true, description: "Groups newer than `since`, newest first. `since` is null on a first visit." },
        { name: "missed", type: '"all" | "latest"', default: '"all"', description: "Stack every newer group, or show the newest only." },
        { name: "firstVisit", type: '"latest" | "none" | "all"', default: '"latest"', description: "A first visit: the newest group, nothing (records a baseline), or everything." },
        { name: "storage", type: "{ load, save }", default: "localStorage", description: "Where the last-seen cursor lives. Either half may be async." },
        { name: "storageKey", type: "string", default: '"fancy-whats-new:seen"', description: "The default store's localStorage key." },
        { name: "open", type: "boolean", default: "—", description: "Show the current cards on demand (a button)." },
        { name: "onOpenChange", type: "(open: boolean) => void", default: "—", description: "Called with false when an on-demand notice is closed." },
        { name: "onSeen", type: "(cursor: string) => void", default: "—", description: "Called after a cursor is recorded as seen." },
        { name: "onClose", type: "() => void", default: "—", description: "Called when the person closes the notice." },
        { name: "labels", type: "{ dismiss, close, previous, next, notice, group }", default: '"got it", "Close", "prev", "next", …', description: "Every control's words; `group(g)` writes a card's label line." },
        { name: "scrollHint", type: "boolean | string", default: '"scroll"', description: "The fading hint over two or more cards. A string replaces it; false turns it off." },
        { name: "color", type: "ButtonColor", default: '"violet"', description: "The react-fancy colour of \"got it\"." },
        { name: "position", type: "corner | top | bottom | inline", default: '"bottom-right"', description: "A screen position, or inline where it is placed." },
        { name: "style", type: "CSSProperties", default: "—", description: "Merged over the position's preset." },
        { name: "className", type: "string", default: "—", description: "Classes on the notice." },
        { name: "cardClassName", type: "string", default: "—", description: "Classes on each card." },
        { name: "depth", type: "number", default: "2", description: "How many cards show behind the front one." },
        { name: "offset", type: "number", default: "8", description: "How far each card behind peeks out, in px." },
        { name: "renderCard", type: "(card, { group, index, count, isFront }) => ReactNode", default: "—", description: "Replace a card's image, title and description." },
        { name: "render", type: "({ mode, groups, close }) => ReactNode", default: "—", description: "Replace the whole notice." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Needs react-fancy 5.41.0 or later (its <code>Toast.Stack</code>). The cards are
            fancy-app-update&apos;s <code>FeatureCards</code>. Handles: <code>data-fancy-whats-new-stack</code>{" "}
            (with <code>data-fancy-whats-new-mode</code> = <code>auto</code> | <code>open</code>),{" "}
            <code>data-fancy-whats-new-card</code> + <code>data-fancy-whats-new-group</code>, and{" "}
            <code>data-fancy-whats-new-control</code> (<code>close</code>, <code>dismiss</code>,{" "}
            <code>previous</code>, <code>next</code>, <code>action</code>). Storage and <code>load</code> run
            after mount, never during SSR.
        </p>
    ),
};
