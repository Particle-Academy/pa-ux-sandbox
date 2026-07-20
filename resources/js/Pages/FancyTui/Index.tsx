import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Badge, Breadcrumbs, Button } from "@particle-academy/react-fancy";
import { Check, Code2, Copy, LayoutPanelTop, Monitor, TerminalSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { clientOnly } from "../../lib/clientOnly";
import { ComponentGallery } from "./ComponentGallery";
import { Layout } from "../Layout";

type Surface = "html" | "console";
type Demo = {
    id: string;
    group: "Start here" | "Components" | "Human+";
    title: string;
    summary: string;
    source: string;
};

/**
 * "View as console" doesn't swap a preview pane — it hands the whole viewport
 * to a terminal application. xterm is browser-only, so the TUI is deferred to
 * the client the same way every other terminal surface on this page is.
 */
const DocsTui = clientOnly(
    () => import("./DocsTui"),
    () => <div className="ftui-takeover ftui-takeover--loading">Starting the Fancy Docs TUI…</div>,
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
    },
    {
        id: "layout",
        group: "Components",
        title: "Responsive dashboard",
        summary: "The same stack, row, card, table, and status primitives reflow when the terminal resizes.",
        source: `<Responsive narrow={<Stack>{panels}</Stack>} wide={<Row>{panels}</Row>} />
<Table id="jobs" rows={jobs} columns={columns} />
<StatusBar left="3 workers" right="queue healthy" />`,
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
    },
];

export default function FancyTuiIndex() {
    const [surface, setSurface] = useState<Surface>("html");
    const [selectedId, setSelectedId] = useState(demos[0].id);
    const [copied, setCopied] = useState(false);
    const selected = useMemo(() => demos.find((demo) => demo.id === selectedId) ?? demos[0], [selectedId]);
    const groups = ["Start here", "Components", "Human+"] as const;

    const copySource = async () => {
        await navigator.clipboard.writeText(selected.source);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1_500);
    };

    // The console surface takes the whole screen — no site chrome, no Layout —
    // so it reads as a terminal application rather than an embedded widget.
    // `q` (or Escape at the root) inside the TUI brings the HTML view back.
    if (surface === "console") {
        return (
            <>
                <Seo title="Fancy Docs TUI — the Fancy registry by keyboard" description="Browse every Fancy UI package, component, and prop from a terminal." />
                <DocsTui onExit={() => setSurface("html")} />
            </>
        );
    }

    return (
        <Layout>
            <Seo title="Fancy TUI — terminal UI components for Human+ apps" description="Browse Fancy TUI documentation and examples as equivalent HTML and terminal surfaces." />
            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>fancy-tui</Breadcrumbs.Item>
            </Breadcrumbs>

            <main className="ftui-page">
                {/* Same hero the package pages use, so this reads as part of the
                    showcase rather than a separate microsite. */}
                <header className="pkg-hero">
                    <span className="pkg-glyph pkg-hero__glyph"><TerminalSquare size={22} /></span>
                    <div className="pkg-hero__main">
                        <h1 className="pkg-hero__name">fancy-tui</h1>
                        <div className="pkg-hero__id">@particle-academy/fancy-tui</div>
                        <p className="pkg-hero__tagline">
                            One component vocabulary, browser and terminal. Browse the same layouts, agent
                            workflows, and Human+ patterns as semantic HTML or a real ANSI console.
                        </p>
                        <div className="pkg-hero__meta">
                            <span className="pkg-eco" data-eco="ts">TypeScript</span>
                            <span className="pkg-kind">Terminal UI</span>
                            <Badge color="green">MCP ready</Badge>
                        </div>
                    </div>
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
                                <button title="Browse the whole Fancy registry as a full-screen terminal app" onClick={() => setSurface("console")}><TerminalSquare size={14} /> View as console</button>
                            </div>
                        </div>

                        <div className="ftui-doc-heading"><div><Badge color={selected.group === "Human+" ? "violet" : "blue"}>{selected.group}</Badge><h2>{selected.title}</h2><p>{selected.summary}</p></div><Button variant="outline" onClick={() => void copySource()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy example"}</Button></div>

                        <div className="ftui-preview ftui-preview--html">
                            <div className="ftui-preview__bar"><span /><span /><span /><b>HTML preview</b></div>
                            <HtmlSurface demo={selected} />
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
