import { Badge, Button, Heading, Text } from "@particle-academy/react-fancy";
import { Check, LayoutPanelTop } from "lucide-react";
import { useMemo, useState } from "react";
import { clientOnly } from "../../lib/clientOnly";

type Demo = {
    id: string;
    group: "Start here" | "Components" | "Human+";
    title: string;
    summary: string;
    source: string;
};

/**
 * The live console. It does not swap a preview pane: it hands the whole
 * viewport to a terminal application, outside the site shell. xterm is
 * browser-only, so the TUI is deferred to the client the same way every other
 * terminal surface on the page is.
 */
export const DocsTuiLive = clientOnly(
    () => import("./DocsTui"),
    () => (
        <div className="ftui-takeover ftui-takeover--loading" role="status">
            Starting the Fancy Docs TUI…
        </div>
    ),
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

const GROUPS = ["Start here", "Components", "Human+"] as const;

/**
 * The fancy-tui workbench: pick an example, read it as semantic HTML beside
 * its React / Ink source, or hand the screen to the live console. It renders
 * inside the TUI Feature micro-site (`Pages/Features/Tui/Index.tsx`, at
 * /features/tui), which owns the shell and the full-screen console switch.
 */
export function TuiWorkbench({ onOpenConsole }: { onOpenConsole: () => void }) {
    const [selectedId, setSelectedId] = useState(demos[0].id);
    const [copied, setCopied] = useState(false);
    const selected = useMemo(() => demos.find((demo) => demo.id === selectedId) ?? demos[0], [selectedId]);

    const copySource = async () => {
        await navigator.clipboard.writeText(selected.source);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1_500);
    };

    return (
        <div className="ftui-workbench tui-workbench">
            <nav className="ftui-sidebar tui-workbench__nav" aria-label="Fancy TUI examples">
                {GROUPS.map((group) => (
                    <div className="tui-workbench__group" key={group}>
                        <Text as="div" size="sm" weight="bold" className="tui-workbench__group-label">
                            {group}
                        </Text>
                        {demos
                            .filter((demo) => demo.group === group)
                            .map((demo) => (
                                <Button
                                    key={demo.id}
                                    variant="ghost"
                                    active={selected.id === demo.id}
                                    aria-current={selected.id === demo.id ? "true" : undefined}
                                    data-demo={demo.id}
                                    className="tui-workbench__item"
                                    onClick={() => setSelectedId(demo.id)}
                                >
                                    {demo.title}
                                </Button>
                            ))}
                    </div>
                ))}
            </nav>

            <div className="ftui-content tui-workbench__main">
                <div className="tui-workbench__toolbar">
                    <code className="tui-workbench__path">
                        <span aria-hidden className="tui-workbench__caret">
                            ❯
                        </span>{" "}
                        examples/{selected.id}.tsx
                    </code>
                    <Button color="green" icon="square-terminal" onClick={onOpenConsole} data-action="open-console">
                        View as console
                    </Button>
                </div>

                <div className="tui-workbench__heading">
                    <div>
                        <Badge color={selected.group === "Human+" ? "violet" : "green"} variant="soft" size="md">
                            {selected.group}
                        </Badge>
                        <Heading as="h2" size="md" weight="semibold">
                            {selected.title}
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            {selected.summary}
                        </Text>
                    </div>
                </div>

                <div className="ftui-preview ftui-preview--html">
                    <div className="ftui-preview__bar">
                        <span />
                        <span />
                        <span />
                        <b>HTML preview</b>
                    </div>
                    <HtmlSurface demo={selected} />
                </div>

                <div className="tui-workbench__source">
                    <div className="tui-workbench__source-bar">
                        <Text as="span" size="sm" weight="semibold">
                            React / Ink
                        </Text>
                        <Button variant="ghost" icon={copied ? "check" : "copy"} onClick={() => void copySource()}>
                            {copied ? "Copied" : "Copy example"}
                        </Button>
                    </div>
                    <pre>
                        <code>{selected.source}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}

function HtmlSurface({ demo }: { demo: Demo }) {
    if (demo.id === "conversation") return <div className="html-demo"><div className="html-message"><b>YOU</b><p>Summarize the failing build and suggest a fix.</p></div><div className="html-message agent"><b>AGENT</b><p>The failure is caused by a missing <code>baseUrl</code> for the configured TypeScript paths.</p></div><div className="html-tool">◐ running tool <strong>inspect_config</strong><span>tsconfig.json</span></div><div className="html-input">Ask a follow-up…</div></div>;
    if (demo.id === "layout") return <div className="html-demo"><div className="html-title"><b>Pipeline overview</b><Badge color="green">queue healthy</Badge></div><div className="html-grid"><article><small>WORKERS</small><p>● build <span>active</span></p><p>● test <span>active</span></p></article><article><small>CONTEXT</small><div className="html-progress"><i /></div><p>18.4k / 25.6k tokens</p></article></div><div className="html-table"><b>JOB <span>STATE</span></b><p>compile <em>success</em></p><p>integration <mark>running</mark></p></div></div>;
    if (demo.id === "mcp-inbox") return <div className="html-demo"><div className="html-title"><b>Human+ event delivery</b><Badge color="violet">live</Badge></div>{["persisted · evt_01KX · action.requested", "pushed · agent:codex", "inbox · consumer:reviewer · 1 unread"].map((item, i) => <div className="html-event" key={item}><Check size={15} /><span>{item}</span><small>{i < 2 ? "complete" : "durable"}</small></div>)}<div className="html-callout">Destructive actions wait for human confirmation.</div></div>;
    return <div className="html-demo"><div className="html-title"><div><LayoutPanelTop size={18} /><b>Deploy agent</b></div><Badge color="green">connected</Badge></div><article className="html-panel"><small>RUN</small><p>Ready for instructions.</p></article><div className="html-keys"><kbd>Tab</kbd> focus <kbd>Enter</kbd> submit <kbd>Alt+Enter</kbd> newline</div></div>;
}
