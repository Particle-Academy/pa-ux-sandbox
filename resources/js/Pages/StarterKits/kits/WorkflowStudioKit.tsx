import { useState } from "react";
import { Action, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";

type Status = "idle" | "running" | "ok" | "error";

type Node = { id: string; kind: string; label: string; status: Status; x: number; y: number };
type Edge = { from: string; to: string };

const SEED_NODES: Node[] = [
    { id: "n1", kind: "manual_trigger", label: "Manual trigger", status: "idle", x: 40, y: 80 },
    { id: "n2", kind: "user_input", label: "Ask user", status: "idle", x: 260, y: 80 },
    { id: "n3", kind: "llm_call", label: "LLM (Claude)", status: "idle", x: 480, y: 80 },
    { id: "n4", kind: "branch", label: "Branch on intent", status: "idle", x: 700, y: 80 },
    { id: "n5", kind: "tool_call", label: "Fetch records", status: "idle", x: 700, y: 200 },
    { id: "n6", kind: "output", label: "Reply", status: "idle", x: 920, y: 80 },
];

const EDGES: Edge[] = [
    { from: "n1", to: "n2" }, { from: "n2", to: "n3" }, { from: "n3", to: "n4" },
    { from: "n4", to: "n5" }, { from: "n4", to: "n6" }, { from: "n5", to: "n6" },
];

const KIND_COLOR: Record<string, string> = {
    manual_trigger: "bg-violet-50 border-violet-300 text-violet-900 dark:bg-violet-500/15 dark:border-violet-700 dark:text-violet-200",
    user_input: "bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-500/15 dark:border-sky-700 dark:text-sky-200",
    llm_call: "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-700 dark:text-emerald-200",
    branch: "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/15 dark:border-amber-700 dark:text-amber-200",
    tool_call: "bg-indigo-50 border-indigo-300 text-indigo-900 dark:bg-indigo-500/15 dark:border-indigo-700 dark:text-indigo-200",
    output: "bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100",
};

const STATUS_BADGE: Record<Status, { color: "zinc" | "amber" | "emerald" | "red"; label: string }> = {
    idle: { color: "zinc", label: "idle" },
    running: { color: "amber", label: "running" },
    ok: { color: "emerald", label: "ok" },
    error: { color: "red", label: "error" },
};

export function WorkflowStudioKit() {
    const [nodes, setNodes] = useState(SEED_NODES);
    const [log, setLog] = useState<string[]>([]);
    const [running, setRunning] = useState(false);

    const run = async () => {
        if (running) return;
        setRunning(true);
        setLog([]);
        const reset = SEED_NODES.map((n) => ({ ...n, status: "idle" as Status }));
        setNodes(reset);

        const order = ["n1", "n2", "n3", "n4", "n5", "n6"];
        for (const id of order) {
            setNodes((arr) => arr.map((n) => (n.id === id ? { ...n, status: "running" as Status } : n)));
            setLog((l) => [...l, `▸ ${id} — ${reset.find((n) => n.id === id)?.label}`]);
            await new Promise((r) => setTimeout(r, 320));
            setNodes((arr) => arr.map((n) => (n.id === id ? { ...n, status: "ok" as Status } : n)));
        }
        setLog((l) => [...l, "✓ flow complete"]);
        setRunning(false);
    };

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                    <Heading level={3} size="sm">Quote-resolution agent</Heading>
                    <Action color="violet" size="sm" onClick={run} disabled={running}>
                        {running ? "Running…" : "Run flow"}
                    </Action>
                </div>
                <div className="relative h-[320px] overflow-auto bg-zinc-50 dark:bg-zinc-950">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle, rgba(120,120,120,0.18) 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <svg className="pointer-events-none absolute inset-0 h-full w-full">
                        {EDGES.map((e, i) => {
                            const from = nodes.find((n) => n.id === e.from);
                            const to = nodes.find((n) => n.id === e.to);
                            if (!from || !to) return null;
                            const x1 = from.x + 160;
                            const y1 = from.y + 30;
                            const x2 = to.x;
                            const y2 = to.y + 30;
                            const mx = (x1 + x2) / 2;
                            return (
                                <path
                                    key={i}
                                    d={`M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                                    stroke="rgba(124,58,237,0.45)"
                                    strokeWidth={1.5}
                                    fill="none"
                                />
                            );
                        })}
                    </svg>
                    {nodes.map((n) => (
                        <div
                            key={n.id}
                            className={`absolute w-[160px] rounded-lg border p-2 shadow-sm ${KIND_COLOR[n.kind]}`}
                            style={{ left: n.x, top: n.y }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider opacity-60">{n.kind}</span>
                                <Badge color={STATUS_BADGE[n.status].color} size="sm">{STATUS_BADGE[n.status].label}</Badge>
                            </div>
                            <div className="mt-1 text-xs font-medium">{n.label}</div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <Card.Body>
                    <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">Run feed</Text>
                    <div className="mt-2 max-h-32 space-y-0.5 overflow-y-auto font-mono text-xs text-zinc-600 dark:text-zinc-300">
                        {log.length === 0 ? (
                            <Text size="xs" className="italic !text-zinc-400">Click "Run flow" to start the executor.</Text>
                        ) : (
                            log.map((l, i) => <div key={i}>{l}</div>)
                        )}
                    </div>
                </Card.Body>
            </Card>

            <Text size="xs" className="!text-zinc-500">
                Mock of <code className="font-mono">@particle-academy/fancy-flow</code> with seed nodes + a stubbed
                topological executor that emits per-node status events.
            </Text>
        </div>
    );
}
