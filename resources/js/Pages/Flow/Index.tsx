import { Link } from "@inertiajs/react";
import {
    Bot,
    Copy,
    GitMerge,
    Rows3,
    ServerCog,
    ShieldCheck,
    Spline,
    StickyNote,
    Undo2,
    Wand2,
} from "lucide-react";
import type { ReactNode } from "react";
import { clientOnly } from "../../lib/clientOnly";
// The cohort demo runs on fancy-flow/engine — zero React Flow, zero DOM — so it
// renders on the server like the rest of the page.
import TriggerCohortDemo from "./TriggerCohortDemo";

// The editor mounts React Flow (xyflow), which is browser-only — defer it to the
// client like every other live canvas surface on the showcase.
const FlowStudio = clientOnly(
    () => import("./FlowStudio"),
    () => (
        <div className="grid h-[540px] place-items-center rounded-xl border border-zinc-200 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Loading the Fancy Flow editor…
        </div>
    ),
);

type Highlight = { icon: ReactNode; title: string; body: string };

const HIGHLIGHTS: Highlight[] = [
    {
        icon: <StickyNote size={18} />,
        title: "Notes on the canvas",
        body: "Document a flow with sticky notes — a first-class note kind (title, text, color). Notes are visual-only: the engine skips them, so their text never reaches a runner — it's there for the people and agents reading the graph.",
    },
    {
        icon: <Rows3 size={18} />,
        title: "True swimlanes",
        body: "Resizable lanes group your graph — drop a node in to file it (it moves and clamps with the lane). Lanes never execute; edges cross them freely.",
    },
    {
        icon: <Undo2 size={18} />,
        title: "Undo / redo + staged deletes",
        body: "Every committing edit is one reversible step (Ctrl+Z / Ctrl+Shift+Z). Destructive actions can require a human confirm — agents propose, humans approve.",
    },
    {
        icon: <Wand2 size={18} />,
        title: "Auto-layout",
        body: "One-click “⤢ Tidy” arranges the whole graph — or just one lane's children — into a readable DAG with dagre (bundled, lazy-loaded).",
    },
    {
        icon: <Copy size={18} />,
        title: "Copy / paste + bulk ops",
        body: "Copy a subgraph with the wiring between its nodes intact (Ctrl+C/V), duplicate, align and distribute a multi-selection.",
    },
    {
        icon: <Spline size={18} />,
        title: "Validated, reconnectable edges",
        body: "Drag an endpoint to rewire a connection; a type-incompatible port pairing is refused — the same rule an agent's flow_connect obeys, so they never drift.",
    },
    {
        icon: <GitMerge size={18} />,
        title: "Trigger cohorts",
        body: "When one event fires several workflows, runCohort orders them, runs them one at a time, and re-checks a guard before each — so a flow that deletes the record leaves the rest skipped with a reason, not silently succeeding.",
    },
    {
        icon: <ServerCog size={18} />,
        title: "Headless engine",
        body: "fancy-flow/engine runs a graph with zero React — server, worker, or CLI. A PHP runtime twin (fancy-flow-php) executes the same WorkflowSchema JSON.",
    },
    {
        icon: <Bot size={18} />,
        title: "Human+ by construction",
        body: "The editor is fully controlled state, so an agent drives this exact surface over MCP via registerFlowBridge — an authoring surface AND an inhabited one.",
    },
    {
        icon: <ShieldCheck size={18} />,
        title: "Reactive data + theming",
        body: "Opt a kind into live output on its card, drive light/dark with a first-class colorMode, and snap nodes into alignment with drag helper lines.",
    },
];

/**
 * The Flow showcase content: the live editor, the trigger-cohort demo, the
 * highlights and the next steps. It renders inside the Flow Feature
 * micro-site (`Pages/Features/Flow/Index.tsx`, at /features/flow), which owns
 * the shell, the hero and the head. /flow 301s there.
 *
 * Phase B redesigns the micro-site and grows from this.
 */
export function FlowShowcase() {
    return (
            <div className="pkg-page">
                {/* The live editor — the whole point. */}
                <section>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Try it live</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Pick an example · each is a real, fully-configured flow you can run, edit, and read. Every canvas is documented with sticky notes.
                        </p>
                    </div>
                    <FlowStudio />
                </section>

                {/* Trigger collision — the failure you can only see by running it. */}
                <section className="mt-10">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            One trigger, three workflows
                        </h2>
                        <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                            Fan one event out and something has to decide what happens when they collide.
                            Run it unguarded first — the interesting part is that nothing breaks.
                        </p>
                    </div>
                    <TriggerCohortDemo />
                </section>

                {/* What makes it powerful. */}
                <section className="mt-10">
                    <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Why fancy-flow</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {HIGHLIGHTS.map((h) => (
                            <div
                                key={h.title}
                                className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
                            >
                                <div className="mb-2 flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                    {h.icon}
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{h.title}</h3>
                                </div>
                                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{h.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Where to go next. */}
                <section className="mt-10 flex flex-wrap gap-3">
                    <Link
                        href="/packages/fancy-flow"
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                        Package & components →
                    </Link>
                    <Link
                        href="/starter-kits/fancy-flow"
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                        Workflow Studio starter kit →
                    </Link>
                    <Link
                        href="/agent-playground"
                        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                        Drive it with an agent →
                    </Link>
                </section>
            </div>
    );
}
