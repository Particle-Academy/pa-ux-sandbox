import { Link } from "@inertiajs/react";
import { Badge, Button, Text } from "@particle-academy/react-fancy";
import { clientOnly } from "../../../lib/clientOnly";
// The cohort demo runs on fancy-flow/engine (zero React Flow, zero DOM), so it
// renders on the server like the rest of the page.
import TriggerCohortDemo from "../../Flow/TriggerCohortDemo";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour, type FeatureTourItem } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeatureMember, FeaturePageProps } from "../shared/types";
import { NodeMarketplace } from "./NodeMarketplace";

// The editor mounts React Flow (xyflow), which is browser-only: defer it to the
// client like every other live canvas surface on the showcase.
const FlowStudio = clientOnly(
    () => import("../../Flow/FlowStudio"),
    () => (
        <div className="flow-studio__loading" role="status">
            Loading the Fancy Flow editor…
        </div>
    ),
);

/**
 * The platform: what the engine is and where it runs. Every claim is checked
 * against the package READMEs: fancy-flow (engine, `./llm/*`, runCohort,
 * pauseForHuman), fancy-flow-php, fancy-flow-py, fancy-flow-mcp, fancy-ui-cli
 * (`add node`) and agent-integrations (`registerFlowBridge`).
 */
const PLATFORM: FeatureTourItem[] = [
    {
        icon: "server-cog",
        title: "A zero-React engine",
        body: (
            <>
                <code className="feature-code">@particle-academy/fancy-flow/engine</code> runs a graph with no React,
                no DOM and no React Flow, on a server, a queue worker or a CLI. The editor is only for designing. The
                cohort demo above runs on it.
            </>
        ),
    },
    {
        icon: "layers",
        title: "PHP and Python twins",
        body: (
            <>
                <code className="feature-code">fancy-flow-php</code> and <code className="feature-code">fancy-flow-py</code>{" "}
                run the same WorkflowSchema v1 JSON with the same outputs, and refuse a document without{" "}
                <code className="feature-code">version: 1</code> the same way. The PHP twin adds queued, durable runs
                that resume from a checkpoint.
            </>
        ),
    },
    {
        icon: "store",
        title: "A node marketplace, vendored",
        body: (
            <>
                A marketplace node is source, not a package:{" "}
                <code className="feature-code">npx fancy-cli@latest add node &lt;kind&gt;</code> copies its editor kind
                and its JS and PHP backends into your project, so adding one adds no dependency.
            </>
        ),
    },
    {
        icon: "plug",
        title: "A shuttle for AI, not an engine",
        body: (
            <>
                Core declares a <code className="feature-code">registerLlmClient</code> contract and never imports a
                provider SDK. Opt-in adapters live on their own subpaths:{" "}
                <code className="feature-code">./llm/vercel-ai</code> and <code className="feature-code">./llm/prism</code>.
            </>
        ),
    },
    {
        icon: "hand",
        title: "Cohorts and human pauses",
        body: (
            <>
                <code className="feature-code">runCohort</code> re-checks a guard before each flow one trigger fires.
                A node waits for a person through the public <code className="feature-code">pauseForHuman</code> /{" "}
                <code className="feature-code">decodePause</code> contract, the same way the built-in approval and
                input nodes do.
            </>
        ),
    },
    {
        icon: "bot",
        title: "Agents build on the same graph",
        body: (
            <>
                The editor is controlled state, so <code className="feature-code">registerFlowBridge</code> lets an
                agent add, wire and run nodes on the canvas you see. On Laravel,{" "}
                <code className="feature-code">fancy-flow-mcp</code> builds workflows headlessly with deterministic,
                port-validated tools.
            </>
        ),
    },
];

/** The editor, as the live demo above shows it. Checked against FlowEditor.tsx. */
const EDITOR: FeatureTourItem[] = [
    {
        icon: "sticky-note",
        title: "Notes on the canvas",
        body: "A first-class note kind documents a flow in place. The engine skips notes, so their text never reaches a runner.",
    },
    {
        icon: "rows-3",
        title: "Swimlanes",
        body: "Resizable lanes group the graph; drop a node in to file it. Lanes never execute, and edges cross them freely.",
    },
    {
        icon: "undo-2",
        title: "Undo, redo and staged deletes",
        body: "Every committing edit is one reversible step (Ctrl+Z, Ctrl+Shift+Z). A confirmDelete hook lets a person approve what an agent removes.",
    },
    {
        icon: "wand-sparkles",
        title: "Auto-layout",
        body: "One click arranges the graph, or one lane's children, into a readable DAG with dagre, bundled and lazy-loaded.",
    },
    {
        icon: "copy",
        title: "Copy and paste subgraphs",
        body: "Ctrl+C and Ctrl+V keep the wiring between the copied nodes intact; duplicate, align and distribute a selection.",
    },
    {
        icon: "spline",
        title: "Validated wiring",
        body: "Drag an endpoint to rewire. A type-incompatible port pairing is refused by the same rule an agent's flow_connect obeys.",
    },
];

/** The runtimes the hero's schematic draws, in order, from the Feature's own members. */
const RUNTIME_LANGUAGES = ["Node / TypeScript", "PHP", "Python"];

/**
 * /features/flow: the Flow micro-site. Its identity is the canvas itself: a
 * blueprint grid, sky wiring, and one graph fanned out to the three runtimes
 * that execute it. Everything about the packages comes from the `feature`
 * prop (App\Support\FeatureSites), never typed here.
 */
export default function FlowFeature({ feature, versions }: FeaturePageProps) {
    const runtimes = RUNTIME_LANGUAGES.map((language) => ({
        language,
        member: feature.members.find((member) => member.language === language && member.slug !== "fancy-flow-mcp"),
    })).filter((runtime): runtime is { language: string; member: FeatureMember } => runtime.member !== undefined);

    const docs = feature.members.find((member) => member.slug === "fancy-flow");

    return (
        <FeatureShell feature={feature}>
            <div className="flow-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Workflow engine"
                    lede="Design a workflow on a canvas a person and an agent share, then run that same graph in the browser, on Node, in PHP or in Python. One JSON document, one set of outputs, wherever it runs."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#flow-editor" color="sky" icon="mouse-pointer-click">
                                Try the editor
                            </Button>
                            <Button href="#flow-marketplace" variant="ghost" icon="store">
                                Browse nodes
                            </Button>
                        </>
                    }
                >
                    <div className="flow-hero__meta">
                        <Badge color="green" variant="soft">
                            MCP ready
                        </Badge>
                        {/* The installed version, from vite.config.js: never typed. */}
                        <Badge color="sky" variant="soft">
                            fancy-flow v{__FANCY_FLOW_VERSION__}
                        </Badge>
                    </div>
                    <figure className="flow-schematic" aria-label="One WorkflowSchema, run by each runtime">
                        <div className="flow-schematic__source">
                            <Text as="span" size="sm" weight="semibold">
                                WorkflowSchema v1
                            </Text>
                            <Text as="span" size="sm" color="muted">
                                one JSON graph
                            </Text>
                        </div>
                        <ul className="flow-schematic__targets">
                            {runtimes.map(({ language, member }) => (
                                <li key={member.slug} className="flow-schematic__target">
                                    <Link href={member.href} className="flow-schematic__node">
                                        <Text as="span" size="sm" weight="semibold">
                                            {member.name}
                                        </Text>
                                        <Text as="span" size="sm" color="muted">
                                            {language}
                                        </Text>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </figure>
                </FeatureHero>

                <div id="flow-editor" className="flow-anchor">
                    <DemoFrame
                        id="flow-editor"
                        label="The Flow editor"
                        caption="Pick an example and press Run. A User Input node opens a real form and waits for you; only the model and data calls are stubbed. Every canvas is documented with sticky notes."
                    >
                        <FlowStudio />
                    </DemoFrame>
                </div>

                <DemoFrame
                    id="flow-cohort"
                    label="One trigger, three workflows"
                    status="Live engine"
                    caption="This is the real runCohort from @particle-academy/fancy-flow/engine, running in your browser over three real graphs. Fire it unguarded first: the interesting part is that nothing breaks."
                >
                    <TriggerCohortDemo />
                </DemoFrame>

                <FeatureTour
                    title="One graph, run anywhere"
                    intro="The editor is where a graph is designed. Everything else is about where it runs, and who else can work on it."
                    items={PLATFORM}
                />

                <div id="flow-marketplace" className="flow-anchor">
                    <DemoFrame
                        id="flow-marketplace"
                        label="The node marketplace"
                        status="Live registry"
                        caption="Read live from /r/nodes/index.json, the index the CLI installs from. The 27 core kinds ship inside fancy-flow and are not listed: there is nothing to install."
                    >
                        <NodeMarketplace />
                    </DemoFrame>
                </div>

                <FeatureTour title="In the editor" items={EDITOR} />

                <HowItFits
                    members={feature.members}
                    bridges={feature.bridges}
                    intro="The React package is the editor and the TypeScript engine; PHP and Python are runtime twins of that engine, and fancy-flow-mcp is a Laravel MCP server for building graphs without a canvas."
                />
                <InstallSteps
                    members={feature.members}
                    versions={versions}
                    intro="Install the runtime you need. Nodes from the marketplace are added with the CLI, never installed as a package."
                />
                <PackagesGrid members={feature.members} versions={versions} />

                <FeatureCta
                    title="Build your first flow"
                    body="Start from the Workflow Studio starter kit, or read the fancy-flow docs for the editor, the engine and the node contract."
                    primary={{ label: "Workflow Studio starter kit", href: "/starter-kits/fancy-flow" }}
                    secondary={{ label: "fancy-flow docs", href: docs?.href ?? "/packages/fancy-flow" }}
                />
            </div>
        </FeatureShell>
    );
}
