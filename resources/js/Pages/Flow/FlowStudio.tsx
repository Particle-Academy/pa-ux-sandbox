import { useMemo, useRef, useState } from "react";
import { FlowEditor, type ExecutorRegistry, type FlowGraph } from "@particle-academy/fancy-flow";
import "@xyflow/react/dist/style.css";
import "@particle-academy/fancy-flow/styles.css";

/**
 * The real @particle-academy/fancy-flow <FlowEditor> at v0.24 — drag from the
 * palette, drop a node INTO the swimlane, wire it up, hit Run. Undo/Redo, "▤
 * Lane", and "⤢ Tidy" ship in the toolbar; drag guides snap nodes into place.
 *
 * Human-in-the-loop is REAL here: the "Ask user" step consumes whatever you type
 * in the box below — nothing about your input is faked. Only the parts that need
 * a real backend — the LLM call (and, in your own flows, data stores / files /
 * datastores) — are stubbed.
 */

const SEED: FlowGraph = {
    nodes: [
        { id: "trigger", type: "manual_trigger", position: { x: 0, y: 0 }, data: { kind: "manual_trigger", label: "Manual run", config: {} } as any },
        // A swimlane — a resizable container. Its children carry parentId + extent,
        // so they move (and stay clamped) with the lane. Edges cross it freely.
        { id: "lane-ai", type: "lane", position: { x: -40, y: 120 }, width: 880, height: 190, data: { kind: "lane", label: "AI pipeline", config: { title: "AI pipeline", orientation: "horizontal" } } as any },
        { id: "ask", type: "user_input", parentId: "lane-ai", extent: "parent", position: { x: 40, y: 66 }, data: { kind: "user_input", label: "Ask user", config: { title: "What can I help with?" } } as any },
        { id: "llm", type: "llm_call", parentId: "lane-ai", extent: "parent", position: { x: 330, y: 66 }, data: { kind: "llm_call", label: "LLM call", config: { provider: "anthropic", model: "claude-sonnet-4-5" } } as any },
        { id: "shape", type: "transform", parentId: "lane-ai", extent: "parent", position: { x: 620, y: 66 }, data: { kind: "transform", label: "Shape result", config: {} } as any },
        { id: "out", type: "output", position: { x: 330, y: 360 }, data: { kind: "output", label: "Result", config: {} } as any },
    ],
    edges: [
        { id: "e1", source: "trigger", target: "ask" },
        { id: "e2", source: "ask", target: "llm" },
        { id: "e3", source: "llm", target: "shape" },
        { id: "e4", source: "shape", target: "out" },
    ],
};

export default function FlowStudio() {
    const [graph, setGraph] = useState<FlowGraph>(SEED);
    const [userMessage, setUserMessage] = useState("");
    // Executors read the latest typed message via a ref (they're built once).
    const msgRef = useRef(userMessage);
    msgRef.current = userMessage;

    const executors = useMemo<ExecutorRegistry>(
        () => ({
            manual_trigger: () => ({ startedAt: Date.now() }),
            // REAL human input — whatever you typed above, never fabricated.
            user_input: ({ emit, node }) => {
                const answer = msgRef.current.trim();
                emit({
                    type: "log",
                    level: answer ? "info" : "warn",
                    message: answer ? `You said: ${answer}` : "No input yet — type a message above, then Run.",
                    nodeId: node.id,
                });
                return { answer };
            },
            // Stubbed — needs a real provider. Swap for anthropic()/openai()/etc.
            llm_call: async ({ inputs, emit, node }) => {
                emit({ type: "log", level: "info", message: "Stub LLM call — wire a real provider here.", nodeId: node.id });
                await delay(700);
                const said = (inputs as any)?.in?.answer ?? "(nothing)";
                return { reply: `(demo reply) You asked: "${said}"` };
            },
            // A genuine reshape — no backend needed, so it runs for real.
            transform: ({ inputs }) => ({ result: (inputs as any)?.in ?? inputs }),
            output: ({ inputs }) => (inputs as any).in,
        }),
        [],
    );

    return (
        <div className="space-y-3">
            <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Your message to the agent <span className="font-normal text-zinc-400">— the “Ask user” step uses this (nothing is auto-filled)</span>
                </span>
                <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="e.g. Summarize today's support tickets…"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
            </label>
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <FlowEditor
                    value={graph}
                    onChange={setGraph}
                    executors={executors}
                    metadata={{ id: "fancy-flow-showcase", name: "Agentic content pipeline" }}
                    height={540}
                    canvasProps={{ showHelperLines: true }}
                />
            </div>
        </div>
    );
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
