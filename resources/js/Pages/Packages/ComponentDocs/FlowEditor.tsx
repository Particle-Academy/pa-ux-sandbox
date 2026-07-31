import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const flowEditorDoc: ComponentDoc = {
    intro: (
        <p>
            The full workflow-editor surface — palette sidebar, pan-zoom canvas, config
            panel, and a live run feed below. Controlled (<code>value</code> +
            <code>onChange</code>) or uncontrolled (<code>initial</code>). Pass an
            <code>executors</code> registry to make the canvas runnable.
        </p>
    ),
    examples: [
        {
            name: "Concept",
            description: "FlowEditor is heavyweight — see the workflow-agent demo for a working integration. Sketch below.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                </Text>
            ),
            code: `import { FlowEditor } from "@particle-academy/fancy-flow";

const executors = {
    "http.fetch": async ({ url }) => ({ body: await (await fetch(url)).text() }),
    "string.upper": ({ text }) => ({ text: text.toUpperCase() }),
};

const initial = {
    nodes: [
        { id: "1", kind: "http.fetch", position: { x: 100, y: 60 }, data: { url: "https://…" } },
        { id: "2", kind: "string.upper", position: { x: 360, y: 60 }, data: {} },
    ],
    edges: [{ id: "e1", source: "1", target: "2" }],
};

<FlowEditor
    initial={initial}
    executors={executors}
    height={720}
/>`,
        },
        {
            name: "Controlled with metadata",
            description: "Bind `value` + `onChange` and persist the workflow + metadata.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pair with <code>useFlowState</code> for full control over the graph state.
                </Text>
            ),
            code: `const [graph, setGraph] = useState(initial);

<FlowEditor
    value={graph}
    onChange={setGraph}
    metadata={{ name: "Onboarding workflow", description: "Builds the welcome email" }}
    executors={executors}
/>`,
        },
        {
            name: "Hide chrome",
            description: "Trim the editor surface — hide the palette, config panel, or run feed.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Useful for embedding a read-only flow in an audit / inspector view.
                </Text>
            ),
            code: `<FlowEditor
    initial={graph}
    showPalette={false}
    showPanel={false}
    showFeed={false}
    height={400}
/>`,
        },
    ],
    props: [
        { name: "initial", type: `FlowGraph`, default: "—", description: "Initial graph (uncontrolled). `{ nodes, edges }`." },
        { name: "value", type: `FlowGraph`, default: "—", description: "Controlled graph. Pair with `onChange`. Takes precedence over `initial`." },
        { name: "onChange", type: `(graph: FlowGraph) => void`, default: "—", description: "Called on every edit." },
        { name: "executors", type: `ExecutorRegistry`, default: "—", description: "Map from node `kind` to an executor function. Required for running." },
        { name: "metadata", type: `WorkflowMetadata`, default: "—", description: "Workflow metadata (name, description, …) — surfaces in the export bundle." },
        { name: "showPalette", type: `boolean`, default: `true`, description: "Show the left-side node palette." },
        { name: "showPanel", type: `boolean`, default: `true`, description: "Show the right-side config panel." },
        { name: "showFeed", type: `boolean`, default: `true`, description: "Show the run feed below the canvas." },
        { name: "height", type: `number`, default: `720`, description: "Total editor height in px." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Built on React Flow:</strong> fancy-flow bundles <code>@xyflow/react</code>
            so you don't have to wire it yourself. Define custom node kinds via
            <code>defineNode</code> + <code>NodePort</code> — see the package docs.
        </p>
    ),
};
