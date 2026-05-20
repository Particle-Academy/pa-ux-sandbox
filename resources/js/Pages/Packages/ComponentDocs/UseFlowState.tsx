import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const useFlowStateDoc: ComponentDoc = {
    intro: (
        <p>
            Controlled-state hook for fancy-flow's <code>FlowCanvas</code>. Wraps React Flow's
            standard <code>useNodesState</code> / <code>useEdgesState</code> /{" "}
            <code>useConnect</code> plumbing and adds a <code>toGraph()</code> snapshotter for
            serialization.
        </p>
    ),
    examples: [
        {
            name: "Basic usage",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Spread the hook return into <code>FlowCanvas</code> — gives you nodes / edges / change-handlers in one call.
                </Text>
            ),
            code: `import { FlowCanvas, useFlowState } from "@particle-academy/fancy-flow";

const flow = useFlowState({
    nodes: [
        { id: "1", kind: "http.fetch", position: { x: 100, y: 60 }, data: {} },
    ],
    edges: [],
});

<FlowCanvas
    nodes={flow.nodes}
    edges={flow.edges}
    onNodesChange={flow.onNodesChange}
    onEdgesChange={flow.onEdgesChange}
    onConnect={flow.onConnect}
/>

<button onClick={() => save(flow.toGraph())}>Save</button>`,
        },
    ],
    props: [
        { name: "initial", type: `FlowGraph`, default: "—", description: "Starting graph `{ nodes, edges }`. Required." },
        { name: "→ nodes", type: `FlowNode[]`, default: "—", description: "Current nodes array. Spread into `<FlowCanvas nodes>`." },
        { name: "→ edges", type: `FlowEdge[]`, default: "—", description: "Current edges array. Spread into `<FlowCanvas edges>`." },
        { name: "→ setNodes / setEdges", type: `React.Dispatch<…>`, default: "—", description: "Direct setters for programmatic edits." },
        { name: "→ onNodesChange", type: `(changes: NodeChange[]) => void`, default: "—", description: "Wired-up node change handler. Spread into `<FlowCanvas>`." },
        { name: "→ onEdgesChange", type: `(changes: EdgeChange[]) => void`, default: "—", description: "Wired-up edge change handler." },
        { name: "→ onConnect", type: `(c: Connection) => void`, default: "—", description: "Wired-up connect handler." },
        { name: "→ toGraph", type: `() => FlowGraph`, default: "—", description: "Snapshot the current graph. Use to serialize / save / export." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>vs. FlowEditor:</strong> use <code>useFlowState</code> + <code>FlowCanvas</code>
            when you want a minimal canvas without the palette / config / feed chrome. For
            the full editor, just mount <code>FlowEditor</code>.
        </p>
    ),
};
