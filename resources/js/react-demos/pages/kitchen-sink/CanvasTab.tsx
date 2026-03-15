import { useState, useCallback } from "react";
import {
  Action,
  Dropdown,
  ContextMenu,
  Modal,
  Callout,
  Skeleton,
  Tooltip,
  useToast,
} from "@particle-academy/react-fancy";
import type { AgentNode, KitchenSinkState, KitchenSinkAction } from "./types";
import { NODE_TYPES } from "./data";
import { NodeCard } from "./NodeCard";
import { SvgConnections } from "./SvgConnections";

interface CanvasTabProps {
  state: KitchenSinkState;
  dispatch: React.Dispatch<KitchenSinkAction>;
}

export function CanvasTab({ state, dispatch }: CanvasTabProps) {
  const { toast } = useToast();
  const [deployOpen, setDeployOpen] = useState(false);

  const handleAddNode = useCallback(
    (nodeType: AgentNode["type"], label: string) => {
      dispatch({ type: "ADD_NODE", payload: { nodeType, label } });
      toast({ title: "Node added", description: `Added ${label} node`, variant: "success" });
    },
    [dispatch, toast],
  );

  const handleRemoveNode = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_NODE", payload: id });
    },
    [dispatch],
  );

  const handleRunPipeline = useCallback(async () => {
    dispatch({ type: "START_RUN" });

    for (const node of state.nodes) {
      dispatch({ type: "UPDATE_NODE_STATUS", payload: { nodeId: node.id, status: "running" } });
      await new Promise((r) => setTimeout(r, 500));
      const status = Math.random() > 0.9 ? "error" : "complete";
      dispatch({
        type: "UPDATE_NODE_STATUS",
        payload: { nodeId: node.id, status: status as AgentNode["status"] },
      });
    }

    const hasError = state.nodes.some((n) => n.status === "error");
    dispatch({
      type: "COMPLETE_RUN",
      payload: {
        id: `exec-${Date.now()}`,
        timestamp: Date.now(),
        duration: state.nodes.length * 500,
        tokens: Math.floor(Math.random() * 3000) + 500,
        status: hasError ? "error" : "success",
        nodeResults: state.nodes.map((n) => ({
          nodeId: n.id,
          output: `Processed by ${n.label}`,
          latency: Math.floor(Math.random() * 1500) + 50,
        })),
      },
    });

    toast({
      title: "Pipeline complete",
      description: `Executed ${state.nodes.length} nodes`,
      variant: hasError ? "error" : "success",
    });
  }, [dispatch, state.nodes, toast]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Dropdown>
          <Dropdown.Trigger>
            <Action size="sm" icon="plus">
              Add Node
            </Action>
          </Dropdown.Trigger>
          <Dropdown.Items>
            {NODE_TYPES.map((nt) => (
              <Dropdown.Item key={nt.type} onClick={() => handleAddNode(nt.type, nt.label)}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: nt.color }} />
                  {nt.label}
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown.Items>
        </Dropdown>

        <Tooltip content="Execute the full pipeline sequentially">
          <Action size="sm" onClick={handleRunPipeline} disabled={state.isRunning}>
            {state.isRunning ? "Running..." : "Run Pipeline"}
          </Action>
        </Tooltip>

        <Action size="sm" onClick={() => setDeployOpen(true)}>
          Deploy
        </Action>
      </div>

      {/* Callout */}
      {state.nodes.length === 0 && (
        <Callout variant="info">
          Add nodes to build your agent pipeline. Use the dropdown above to get started.
        </Callout>
      )}

      {/* Canvas */}
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="relative min-h-[320px] flex-1 overflow-auto rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/50">
            {state.isRunning && state.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center gap-4 p-8">
                <Skeleton className="h-24 w-44 rounded-lg" />
                <Skeleton className="h-24 w-44 rounded-lg" />
                <Skeleton className="h-24 w-44 rounded-lg" />
              </div>
            )}
            <SvgConnections
              nodes={state.nodes}
              connections={state.connections}
              isRunning={state.isRunning}
            />
            {state.nodes.map((node) => (
              <div
                key={node.id}
                className="absolute"
                style={{ left: node.x, top: node.y }}
              >
                <NodeCard node={node} onRemove={handleRemoveNode} />
              </div>
            ))}
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onClick={() => handleAddNode("llm", "New LLM")}>
            Add LLM Node
          </ContextMenu.Item>
          <ContextMenu.Item onClick={() => handleAddNode("tool", "New Tool")}>
            Add Tool Node
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item onClick={handleRunPipeline}>Run Pipeline</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item danger onClick={() => {}}>
            Clear Canvas
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>

      {/* Deploy Modal */}
      <Modal open={deployOpen} onClose={() => setDeployOpen(false)}>
        <Modal.Header>
          <h2 className="text-lg font-semibold">Deploy Agent</h2>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Deploy &quot;{state.config.name}&quot; with {state.nodes.length} nodes to{" "}
            {state.config.environment} environment?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-end gap-2">
            <Action size="sm" onClick={() => setDeployOpen(false)}>Cancel</Action>
            <Action
              size="sm"
              onClick={() => {
                setDeployOpen(false);
                toast({ title: "Deployed!", description: "Agent is now live.", variant: "success" });
              }}
            >
              Confirm Deploy
            </Action>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
