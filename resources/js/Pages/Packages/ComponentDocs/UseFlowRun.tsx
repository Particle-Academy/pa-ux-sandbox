import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const useFlowRunDoc: ComponentDoc = {
    intro: (
        <p>
            Drives <code>runFlow</code> and maintains observability state — per-node statuses,
            an event feed, and the last run result. Pair it with{" "}
            <code>applyStatusesToNodes</code> before passing nodes to{" "}
            <code>FlowCanvas</code> so the per-node status badge renders.
        </p>
    ),
    examples: [
        {
            name: "Run + observability",
            description: "Kick off a run and use the returned status map to drive UI badges.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    See the FlowEditor source for a complete integration with palette, panel, feed.
                </Text>
            ),
            code: `import {
    FlowCanvas,
    useFlowState,
    useFlowRun,
    applyStatusesToNodes,
    FlowRunControls,
    FlowRunFeed,
} from "@particle-academy/fancy-flow";

const flow = useFlowState(initial);
const run = useFlowRun({ maxFeed: 200 });

const decorated = applyStatusesToNodes(flow.nodes, run.statuses, run.statusText);

<FlowRunControls
    running={run.running}
    onRun={() => run.run(flow.toGraph(), executors)}
    onCancel={run.cancel}
    onReset={run.reset}
/>

<FlowCanvas nodes={decorated} edges={flow.edges} … />

<FlowRunFeed feed={run.feed} />`,
        },
    ],
    props: [
        { name: "options.maxFeed", type: `number`, default: `200`, description: "Cap the in-memory event feed to this many entries." },
        { name: "→ statuses", type: `Record<nodeId, NodeRunStatus>`, default: "—", description: "Status keyed by node id. Drive UI badges / overlays from this." },
        { name: "→ statusText", type: `Record<nodeId, string?>`, default: "—", description: "Per-node status text (e.g. error messages)." },
        { name: "→ feed", type: `FlowRunFeedEntry[]`, default: "—", description: "Live event log (capped to `maxFeed`). Render via `FlowRunFeed`." },
        { name: "→ running", type: `boolean`, default: "—", description: "Whether a run is currently in progress." },
        { name: "→ lastResult", type: `RunResult | null`, default: "—", description: "The last run's full result, or null." },
        { name: "→ run", type: `(graph, executors, options?) => Promise<RunResult>`, default: "—", description: "Kick off a run with the provided graph + executors." },
        { name: "→ cancel", type: `() => void`, default: "—", description: "Cancel the current run." },
        { name: "→ reset", type: `() => void`, default: "—", description: "Reset all runtime state (statuses, feed, lastResult)." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>applyStatusesToNodes:</strong> exported alongside the hook — pass it
            <code>flow.nodes</code>, <code>run.statuses</code>, and <code>run.statusText</code>
            to get nodes with per-node status data ready for <code>FlowCanvas</code>.
        </p>
    ),
};
