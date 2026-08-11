/**
 * flow kind — fancy-flow <FlowEditor> driven by registerFlowBridge.
 */
import { type FlowGraph } from "@particle-academy/fancy-flow";
import { FlowEditor } from "../../../components/FlowEditor";
import "@xyflow/react/dist/style.css";
import "@particle-academy/fancy-flow/styles.css";
import { registerFlowBridge } from "@particle-academy/agent-integrations/bridges/flow";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type FlowState = { graph: FlowGraph };

const seed = (): FlowState => ({
  graph: {
    nodes: [
      { id: "trigger-1", type: "manual_trigger", position: { x: 0, y: 80 }, data: { kind: "manual_trigger", label: "Manual run", config: {} } } as never,
      { id: "out-1", type: "output", position: { x: 320, y: 80 }, data: { kind: "output", label: "Result", config: {} } } as never,
    ],
    edges: [{ id: "e1", source: "trigger-1", target: "out-1" } as never],
  },
});

function FlowSurface({ state, onChange }: SurfaceProps) {
  const s = state as FlowState;
  return (
    <FlowEditor
      value={s.graph}
      metadata={{ id: "playground-flow", name: "Playground flow" }}
      height={480}
      onChange={(graph) => onChange({ graph })}
    />
  );
}

export const flowKind: KindModule = {
  kind: "flow",
  label: "Flow",
  description: "A node-based workflow editor. Drive it with flow_* tools (add_node / connect / run).",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as FlowState) ?? seed();
    const apply = (patch: Partial<FlowGraph>) => ctx.setActiveState({ graph: { ...read().graph, ...patch } });
    return registerFlowBridge(server, {
      adapter: {
        getNodes: () => read().graph.nodes as never,
        setNodes: (next) => {
          const cur = read().graph.nodes as unknown[];
          const resolved = typeof next === "function" ? (next as unknown as (p: unknown[]) => unknown[])(cur) : next;
          apply({ nodes: resolved as never });
        },
        getEdges: () => read().graph.edges as never,
        setEdges: (next) => {
          const cur = read().graph.edges as unknown[];
          const resolved = typeof next === "function" ? (next as unknown as (p: unknown[]) => unknown[])(cur) : next;
          apply({ edges: resolved as never });
        },
      },
      agent: ctx.agent,
    });
  },
  Surface: FlowSurface,
};
