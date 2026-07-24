import { useState } from "react";
import { FlowEditor, type ExecutorRegistry, type FlowGraph } from "@particle-academy/fancy-flow";
import "@xyflow/react/dist/style.css";
import "@particle-academy/fancy-flow/styles.css";

/**
 * The real @particle-academy/fancy-flow <FlowEditor> at v0.24 — drag from the
 * palette, drop a node INTO the swimlane, wire it up, hit Run. The toolbar ships
 * Undo/Redo, "▤ Lane" (add a swimlane), and "⤢ Tidy" (auto-layout) out of the
 * box; drag guides snap nodes into alignment. Everything here is controlled
 * state (`value`/`onChange`), so an agent can drive the exact same surface over
 * MCP — Human+ by construction.
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

/** Demo executors — swap the stubs for real provider / HTTP calls and it runs for real. */
const EXECUTORS: ExecutorRegistry = {
    manual_trigger: () => ({ startedAt: Date.now() }),
    user_input: async ({ emit, node }) => {
        emit({ type: "log", level: "info", message: `Would prompt: ${(node.data as any).config?.title ?? "input"}`, nodeId: node.id });
        await delay(400);
        return { answer: "demo answer (wire a real form here)" };
    },
    llm_call: async ({ inputs, emit, node }) => {
        emit({ type: "log", level: "info", message: "Stub LLM call (wire a real provider here)", nodeId: node.id });
        await delay(700);
        return { reply: `(demo) input was ${JSON.stringify(inputs)}` };
    },
    transform: ({ inputs }) => ({ result: inputs }),
    output: ({ inputs }) => (inputs as any).in,
};

export default function FlowStudio() {
    const [graph, setGraph] = useState<FlowGraph>(SEED);
    return (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <FlowEditor
                value={graph}
                onChange={setGraph}
                executors={EXECUTORS}
                metadata={{ id: "fancy-flow-showcase", name: "Agentic content pipeline" }}
                height={540}
                canvasProps={{ showHelperLines: true }}
            />
        </div>
    );
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
