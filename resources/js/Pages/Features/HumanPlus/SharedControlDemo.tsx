import { useEffect, useRef, useState } from "react";
import { MicroMcpServer, attachInProcess, type InProcessTransport } from "@particle-academy/agent-integrations";
import { registerContentReactionBridge, type ContentReactionConfirmRequest } from "@particle-academy/agent-integrations/bridges/content-reaction";
import { Badge, Button, Callout, Card, ContentReaction, DEFAULT_CONTENT_REACTIONS, Icon, Switch, Text } from "@particle-academy/react-fancy";

/**
 * One control, two operators. A react-fancy ContentReaction is held in this
 * page's state (controlled `value` / `onChange`); the person clicks it, and an
 * agent changes the SAME state through the real `registerContentReactionBridge`
 * on an in-page MCP server, by sending `tools/call`. Nothing scrapes the DOM.
 *
 * "Ask me first" turns on the bridge's `pendingMode` with a `confirm` hook, so
 * an agent's write waits here until the person approves it. `agent_undo` is
 * the per-agent undo stack every bridge installs.
 */

type Pending = { request: ContentReactionConfirmRequest; resolve: (ok: boolean) => void };
type LogLine = { who: "You" | "Agent"; text: string };

const CONTENT_ID = "comment-42";

const AGENT_CALLS: { label: string; tool: string; args: Record<string, unknown> }[] = [
    { label: "reaction_read", tool: "reaction_read", args: {} },
    { label: "reaction_toggle (insightful)", tool: "reaction_toggle", args: { key: "insightful" } },
    { label: "reaction_toggle (love)", tool: "reaction_toggle", args: { key: "love" } },
    { label: "agent_undo", tool: "agent_undo", args: {} },
];

export default function SharedControlDemo() {
    const [value, setValue] = useState<string[]>(["like"]);
    const [askFirst, setAskFirst] = useState(false);
    const [pending, setPending] = useState<Pending | null>(null);
    const [log, setLog] = useState<LogLine[]>([]);
    const [busy, setBusy] = useState(false);

    const valueRef = useRef(value);
    valueRef.current = value;
    const transportRef = useRef<InProcessTransport | null>(null);
    const rpcId = useRef(1);

    const say = (line: LogLine) => setLog((l) => [line, ...l].slice(0, 6));

    // The real bridge. Re-registered when "Ask me first" changes, because
    // pendingMode is a registration option.
    useEffect(() => {
        const server = new MicroMcpServer({ info: { name: "features-human-plus-demo", version: "1.0.0" } });
        const bridge = registerContentReactionBridge(server, {
            agent: { id: "demo-agent", name: "Agent", color: "#0891b2" },
            pendingMode: askFirst,
            confirm: (request) => new Promise<boolean>((resolve) => setPending({ request, resolve })),
            adapter: {
                id: CONTENT_ID,
                title: "Release notes comment",
                getValue: () => valueRef.current,
                setValue: (next) => setValue(next),
                getReactions: () => DEFAULT_CONTENT_REACTIONS,
            },
        });
        transportRef.current = attachInProcess(server);

        return () => {
            bridge.dispose();
            transportRef.current = null;
        };
    }, [askFirst]);

    function rpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
        const tx = transportRef.current;
        if (!tx) {
            return Promise.reject(new Error("The bridge is not mounted yet."));
        }
        const id = rpcId.current++;

        return new Promise<T>((resolve, reject) => {
            const unsubscribe = tx.onServerMessage((message) => {
                const m = message as { id?: number; result?: T; error?: { message?: string } };
                if (m.id !== id) {
                    return;
                }
                unsubscribe();
                if (m.error) {
                    reject(new Error(m.error.message ?? "tool error"));
                } else {
                    resolve(m.result as T);
                }
            });
            tx.deliver({ jsonrpc: "2.0", id, method, params } as never).catch((error: unknown) => {
                unsubscribe();
                reject(error);
            });
        });
    }

    async function callTool(tool: string, args: Record<string, unknown>) {
        setBusy(true);
        try {
            const r = await rpc<{ content?: { text?: string }[]; isError?: boolean }>("tools/call", { name: tool, arguments: args });
            const text = (r.content ?? []).map((c) => c.text ?? "").join(" ").trim();
            say({ who: "Agent", text: `${tool}${r.isError ? " (refused)" : ""}: ${text.slice(0, 160)}` });
        } catch (error) {
            say({ who: "Agent", text: `${tool}: ${error instanceof Error ? error.message : String(error)}` });
        } finally {
            setBusy(false);
        }
    }

    function decide(ok: boolean) {
        pending?.resolve(ok);
        say({ who: "You", text: ok ? `approved ${pending?.request.action}` : `rejected ${pending?.request.action}` });
        setPending(null);
    }

    return (
        <div className="hp-shared" data-hp-demo="shared-control">
            <Card variant="outlined" className="hp-shared__content" data-hp-content={CONTENT_ID}>
                <Card.Body>
                    <Text as="p" size="sm">Shipped the release notes for the kit cut. Review welcome.</Text>
                    <div className="hp-shared__reactions">
                        <ContentReaction
                            value={value}
                            onChange={(next, meta) => {
                                setValue(next);
                                say({ who: "You", text: `${meta.on ? "added" : "removed"} ${meta.key}` });
                            }}
                        />
                        <Badge variant="outline" data-hp-value={value.join(",")}>
                            value: [{value.join(", ")}]
                        </Badge>
                    </div>
                </Card.Body>
            </Card>

            <div className="hp-shared__agent">
                <div className="hp-shared__head">
                    <Icon name="bot" size="sm" />
                    <Text as="span" size="sm" weight="semibold">
                        Agent, over MCP
                    </Text>
                    <Switch label="Ask me first (pendingMode)" checked={askFirst} onCheckedChange={setAskFirst} className="ml-auto" />
                </div>
                <div className="hp-shared__calls">
                    {AGENT_CALLS.map((call) => (
                        <Button key={call.label} size="sm" onClick={() => void callTool(call.tool, call.args)} disabled={busy || pending !== null}>
                            <code>{call.label}</code>
                        </Button>
                    ))}
                </div>

                {pending && (
                    <Callout color="amber" icon={<Icon name="hand" size="sm" />} data-hp-pending={pending.request.action}>
                        <Text as="p" size="sm">
                            The agent wants {pending.request.action} on {pending.request.content}: [{pending.request.value.join(", ")}] becomes [
                            {pending.request.next.join(", ")}].
                        </Text>
                        <div className="hp-shared__decide">
                            <Button size="sm" color="green" onClick={() => decide(true)}>
                                Approve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => decide(false)}>
                                Reject
                            </Button>
                        </div>
                    </Callout>
                )}

                <ol className="hp-shared__log" aria-live="polite">
                    {log.length === 0 && (
                        <li>
                            <Text as="span" size="xs" color="muted">
                                Click a reaction, or send the agent a tool call.
                            </Text>
                        </li>
                    )}
                    {log.map((line, i) => (
                        <li key={i}>
                            <Badge variant="soft" size="sm">{line.who}</Badge>
                            <Text as="span" size="xs">{line.text}</Text>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
