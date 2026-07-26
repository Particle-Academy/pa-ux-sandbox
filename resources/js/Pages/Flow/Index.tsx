import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Badge, Breadcrumbs } from "@particle-academy/react-fancy";
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
    Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { clientOnly } from "../../lib/clientOnly";
import { Layout } from "../Layout";
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

export default function FlowIndex() {
    return (
        <Layout>
            <Seo
                title="Fancy Flow — the Human+ workflow editor + engine"
                description="Build agentic workflows on a live node canvas: swimlanes, undo/redo, auto-layout, validated edges, a headless engine, and an MCP bridge so agents drive the same surface."
            />
            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>fancy-flow</Breadcrumbs.Item>
            </Breadcrumbs>

            <main className="pkg-page">
                {/* Same hero the package pages use, so this reads as part of the showcase. */}
                <header className="pkg-hero">
                    <span className="pkg-glyph pkg-hero__glyph"><Workflow size={22} /></span>
                    <div className="pkg-hero__main">
                        <h1 className="pkg-hero__name">fancy-flow</h1>
                        <div className="pkg-hero__id">@particle-academy/fancy-flow</div>
                        <p className="pkg-hero__tagline">
                            A schema-driven workflow editor + runner where humans and agents build on the
                            same canvas. Swimlanes, undo/redo, auto-layout, validated wiring, a zero-React
                            engine — and an MCP bridge so an agent drives the exact surface you see.
                        </p>
                        <div className="pkg-hero__meta">
                            <span className="pkg-eco" data-eco="ts">TypeScript</span>
                            <span className="pkg-kind">Workflow canvas</span>
                            <Badge color="green">MCP ready</Badge>
                            <Badge color="blue">v0.29</Badge>
                        </div>
                    </div>
                </header>

                {/* The live editor — the whole point. */}
                <section className="mt-8">
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
            </main>
        </Layout>
    );
}
