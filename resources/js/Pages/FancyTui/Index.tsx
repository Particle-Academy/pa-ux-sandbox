import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Badge, Button } from "@particle-academy/react-fancy";
import { Check, Code2, Copy, LayoutPanelTop, Monitor, TerminalSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { clientOnly } from "../../lib/clientOnly";
import { ComponentGallery } from "./ComponentGallery";
import { Layout } from "../Layout";
import "./fancy-tui.css";

type Surface = "html" | "console";
type Demo = {
    id: string;
    group: "Start here" | "Components" | "Human+";
    title: string;
    summary: string;
    source: string;
    console: string;
};

const ConsoleSurface = clientOnly(
    () => import("./ConsoleSurface"),
    ({ label }: { output: string; label: string }) => <div className="ftui-terminal ftui-terminal--loading">Loading {label} console…</div>,
);

const demos: Demo[] = [
    {
        id: "quick-start",
        group: "Start here",
        title: "Quick start",
        summary: "Compose an Ink app with Fancy spacing, theme, and stable surface handles.",
        source: `import { render } from "ink";
import { FancyTuiProvider, Header, Panel, Text } from "@particle-academy/fancy-tui";

render(
  <FancyTuiProvider>
    <Header title="Deploy agent" status="connected" />
    <Panel title="Run"><Text>Ready for instructions.</Text></Panel>
  </FancyTuiProvider>
);`,
        console: `\x1b[1;35mFancy TUI\x1b[0m  Human+ terminal components                         \x1b[32m● connected\x1b[0m\r\n\r\n\x1b[2m╭─\x1b[0m \x1b[1mDeploy agent\x1b[0m \x1b[2m──────────────────────────────────────────────────────────────╮\x1b[0m\r\n\x1b[2m│\x1b[0m  Ready for instructions.                                                   \x1b[2m│\x1b[0m\r\n\x1b[2m╰───────────────────────────────────────────────────────────────────────────╯\x1b[0m\r\n\r\n\x1b[2m[Tab] focus   [Enter] submit   [Alt+Enter] newline\x1b[0m`,
    },
    {
        id: "conversation",
        group: "Components",
        title: "Agent conversation",
        summary: "Committed messages remain scrollback-safe while live agent and tool activity updates below.",
        source: `<MessageList messages={messages} />
<LiveRegion>
  <ToolCall call={activeTool} />
  <Spinner label="thinking…" />
</LiveRegion>
<Composer id="prompt" value={prompt} onChange={setPrompt} onSubmit={send} />`,
        console: `\x1b[1;36mYOU\x1b[0m\r\nSummarize the failing build and suggest a fix.\r\n\r\n\x1b[1;35mAGENT\x1b[0m\r\nThe failure is caused by a missing baseUrl for the configured TypeScript paths.\r\n\r\n\x1b[33m◐ running tool\x1b[0m  inspect_config  \x1b[2mtsconfig.json\x1b[0m\r\n\r\n\x1b[2m┌───────────────────────────────────────────────────────────────────────────┐\x1b[0m\r\n\x1b[2m│\x1b[0m Ask a follow-up…                                                         \x1b[2m│\x1b[0m\r\n\x1b[2m└───────────────────────────────────────────────────────────────────────────┘\x1b[0m`,
    },
    {
        id: "layout",
        group: "Components",
        title: "Responsive dashboard",
        summary: "The same stack, row, card, table, and status primitives reflow when the terminal resizes.",
        source: `<Responsive narrow={<Stack>{panels}</Stack>} wide={<Row>{panels}</Row>} />
<Table id="jobs" rows={jobs} columns={columns} />
<StatusBar left="3 workers" right="queue healthy" />`,
        console: `\x1b[1mPipeline overview\x1b[0m                                      \x1b[32mqueue healthy\x1b[0m\r\n\r\n╭─ Workers ─────────────────────╮  ╭─ Context ───────────────────────────────╮\r\n│ \x1b[32m●\x1b[0m build      active            │  │ ███████████████░░░░░  72%           │\r\n│ \x1b[32m●\x1b[0m test       active            │  │ 18.4k / 25.6k tokens                │\r\n╰───────────────────────────────╯  ╰─────────────────────────────────────────╯\r\n\r\nJOB              STATE       ELAPSED\r\ncompile          \x1b[32msuccess\x1b[0m     12.4s\r\nintegration      \x1b[33mrunning\x1b[0m      8.1s\r\n\r\n\x1b[2m3 workers                                                     Ctrl+R refresh\x1b[0m`,
    },
    {
        id: "mcp-inbox",
        group: "Human+",
        title: "Push + inbox MCP",
        summary: "Events are persisted before notification, so agents can react live or recover through a durable inbox.",
        source: `registerTuiBridge(server, { registry, eventStore });

// pushed: notifications/human_plus/event
// pulled: human_plus_events_list
// acknowledged per consumer: human_plus_events_ack`,
        console: `\x1b[1mHuman+ event delivery\x1b[0m\r\n\r\n\x1b[32m✓\x1b[0m persisted     evt_01KX  action.requested\r\n\x1b[32m✓\x1b[0m pushed        agent:codex  notifications/human_plus/event\r\n\x1b[36m↓\x1b[0m inbox         consumer:reviewer  1 unread\r\n\r\nPOLICY           ACTION                 STATE\r\nproposed         deploy.production      \x1b[33mawaiting confirmation\x1b[0m\r\nimmediate        panel.inspect          \x1b[32mcomplete\x1b[0m\r\n\r\n\x1b[2mEvery mutation emits AgentActivity and retains a recoverable event.\x1b[0m`,
    },
];

export default function FancyTuiIndex() {
    const [surface, setSurface] = useState<Surface>("console");
    const [selectedId, setSelectedId] = useState(demos[0].id);
    const [copied, setCopied] = useState(false);
    const selected = useMemo(() => demos.find((demo) => demo.id === selectedId) ?? demos[0], [selectedId]);
    const groups = ["Start here", "Components", "Human+"] as const;

    const copySource = async () => {
        await navigator.clipboard.writeText(selected.source);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1_500);
    };

    return (
        <Layout bleed>
            <Seo title="Fancy TUI — terminal UI components for Human+ apps" description="Browse Fancy TUI documentation and examples as equivalent HTML and terminal surfaces." />
            <main className="ftui-page">
                <header className="ftui-hero">
                    <div>
                        <div className="ftui-eyebrow"><TerminalSquare size={15} /> @particle-academy/fancy-tui <Badge color="violet">v0.2</Badge></div>
                        <h1>One component vocabulary.<br /><span>Browser and terminal.</span></h1>
                        <p>Browse the same layouts, agent workflows, and Human+ patterns as semantic HTML or a real ANSI console inside Fancy Term.</p>
                    </div>
                    <code>npm i @particle-academy/fancy-tui ink</code>
                </header>

                <section className="ftui-workbench">
                    <aside className="ftui-sidebar" aria-label="Fancy TUI examples">
                        <div className="ftui-sidebar__brand"><span>F</span><div><b>Fancy TUI</b><small>docs + sandbox</small></div></div>
                        {groups.map((group) => <div className="ftui-nav-group" key={group}>
                            <strong>{group}</strong>
                            {demos.filter((demo) => demo.group === group).map((demo) => <button key={demo.id} className={selected.id === demo.id ? "is-active" : ""} onClick={() => setSelectedId(demo.id)}>{demo.title}</button>)}
                        </div>)}
                        <div className="ftui-sidebar__meta"><Badge color="green">MCP ready</Badge><span>Ink 7 · React 19</span></div>
                    </aside>

                    <div className="ftui-content">
                        <div className="ftui-toolbar">
                            <div><span className="ftui-dot" /><b>{selected.title}</b><span className="ftui-path">examples/{selected.id}.tsx</span></div>
                            <div className="ftui-switch" role="group" aria-label="Preview surface">
                                <button className={surface === "html" ? "is-active" : ""} onClick={() => setSurface("html")}><Monitor size={14} /> View as HTML</button>
                                <button className={surface === "console" ? "is-active" : ""} onClick={() => setSurface("console")}><TerminalSquare size={14} /> View as console</button>
                            </div>
                        </div>

                        <div className="ftui-doc-heading"><div><Badge color={selected.group === "Human+" ? "violet" : "blue"}>{selected.group}</Badge><h2>{selected.title}</h2><p>{selected.summary}</p></div><Button variant="outline" onClick={() => void copySource()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy example"}</Button></div>

                        <div className={`ftui-preview ftui-preview--${surface}`}>
                            <div className="ftui-preview__bar"><span /><span /><span /><b>{surface === "console" ? "fancy-tui — 100×28" : "HTML preview"}</b></div>
                            {surface === "console" ? <ConsoleSurface output={selected.console} label={selected.title} /> : <HtmlSurface demo={selected} />}
                        </div>

                        <div className="ftui-source"><div><Code2 size={15} /><b>React / Ink</b><button onClick={() => void copySource()}>{copied ? "Copied" : "Copy"}</button></div><pre><code>{selected.source}</code></pre></div>
                    </div>
                </section>

                <ComponentGallery />
            </main>
        </Layout>
    );
}

function HtmlSurface({ demo }: { demo: Demo }) {
    if (demo.id === "conversation") return <div className="html-demo"><div className="html-message"><b>YOU</b><p>Summarize the failing build and suggest a fix.</p></div><div className="html-message agent"><b>AGENT</b><p>The failure is caused by a missing <code>baseUrl</code> for the configured TypeScript paths.</p></div><div className="html-tool">◐ running tool <strong>inspect_config</strong><span>tsconfig.json</span></div><div className="html-input">Ask a follow-up…</div></div>;
    if (demo.id === "layout") return <div className="html-demo"><div className="html-title"><b>Pipeline overview</b><Badge color="green">queue healthy</Badge></div><div className="html-grid"><article><small>WORKERS</small><p>● build <span>active</span></p><p>● test <span>active</span></p></article><article><small>CONTEXT</small><div className="html-progress"><i /></div><p>18.4k / 25.6k tokens</p></article></div><div className="html-table"><b>JOB <span>STATE</span></b><p>compile <em>success</em></p><p>integration <mark>running</mark></p></div></div>;
    if (demo.id === "mcp-inbox") return <div className="html-demo"><div className="html-title"><b>Human+ event delivery</b><Badge color="violet">live</Badge></div>{["persisted · evt_01KX · action.requested", "pushed · agent:codex", "inbox · consumer:reviewer · 1 unread"].map((item, i) => <div className="html-event" key={item}><Check size={15} /><span>{item}</span><small>{i < 2 ? "complete" : "durable"}</small></div>)}<div className="html-callout">Destructive actions wait for human confirmation.</div></div>;
    return <div className="html-demo"><div className="html-title"><div><LayoutPanelTop size={18} /><b>Deploy agent</b></div><Badge color="green">connected</Badge></div><article className="html-panel"><small>RUN</small><p>Ready for instructions.</p></article><div className="html-keys"><kbd>Tab</kbd> focus <kbd>Enter</kbd> submit <kbd>Alt+Enter</kbd> newline</div></div>;
}
