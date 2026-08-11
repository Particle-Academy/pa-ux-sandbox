import { useState } from "react";
import { type ExecutorRegistry, type FlowGraph } from "@particle-academy/fancy-flow";
import { FlowEditor } from "../../../components/FlowEditor";
import "@xyflow/react/dist/style.css";
import "@particle-academy/fancy-flow/styles.css";

/**
 * Workflow Studio — the real @particle-academy/fancy-flow <FlowEditor>: a
 * schema-driven node canvas with a palette, config panel, and a live run feed.
 * Drag a node from the palette, wire it up, hit Run. The `executors` registry
 * makes the graph actually execute; swap the stubs below for real provider /
 * HTTP calls and it's a production workflow editor.
 */

const SEED: FlowGraph = {
    nodes: [
        { id: "trigger-1", type: "manual_trigger", position: { x: 0, y: 80 }, data: { kind: "manual_trigger", label: "Manual run", config: {} } as any },
        { id: "user-1", type: "user_input", position: { x: 260, y: 80 }, data: { kind: "user_input", label: "Ask user", config: { title: "What can I help with?" } } as any },
        { id: "llm-1", type: "llm_call", position: { x: 520, y: 80 }, data: { kind: "llm_call", label: "LLM Call", config: { provider: "anthropic", model: "claude-sonnet-4-5" } } as any },
        { id: "out-1", type: "output", position: { x: 780, y: 80 }, data: { kind: "output", label: "Result", config: {} } as any },
    ],
    edges: [
        { id: "e1", source: "trigger-1", target: "user-1" },
        { id: "e2", source: "user-1", target: "llm-1" },
        { id: "e3", source: "llm-1", target: "out-1" },
    ],
};

/** Demo executors for the seed's node kinds. Wire your own real ones here. */
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
        return { reply: `(demo) you said: ${JSON.stringify(inputs)}` };
    },
    output: ({ inputs }) => (inputs as any).in,
};

export function WorkflowStudioKit() {
    const [graph, setGraph] = useState<FlowGraph>(SEED);
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <FlowEditor
                value={graph}
                onChange={setGraph}
                executors={EXECUTORS}
                metadata={{ id: "workflow-studio", name: "Quote-resolution agent" }}
                height={460}
            />
        </div>
    );
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
