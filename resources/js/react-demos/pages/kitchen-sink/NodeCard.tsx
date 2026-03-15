import { Card, Badge, Progress, Tooltip } from "@particle-academy/react-fancy";
import type { AgentNode } from "./types";
import { NODE_TYPES } from "./data";

const STATUS_CONFIG: Record<AgentNode["status"], { color: "zinc" | "blue" | "green" | "red"; label: string }> = {
  idle: { color: "zinc", label: "Idle" },
  running: { color: "blue", label: "Running" },
  complete: { color: "green", label: "Complete" },
  error: { color: "red", label: "Error" },
};

function NodeIcon({ type }: { type: AgentNode["type"] }) {
  const nodeType = NODE_TYPES.find((n) => n.type === type);
  const color = nodeType?.color ?? "#71717a";

  const paths: Record<AgentNode["type"], string> = {
    input: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    llm: "M12 2a9 9 0 019 9c0 3.9-3.1 7.1-7 7.9V22h-4v-3.1c-3.9-.8-7-4-7-7.9a9 9 0 019-9z",
    tool: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
    router: "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
    output: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[type]} />
    </svg>
  );
}

interface NodeCardProps {
  node: AgentNode;
  onRemove: (id: string) => void;
}

export function NodeCard({ node, onRemove }: NodeCardProps) {
  const statusCfg = STATUS_CONFIG[node.status];
  const nodeType = NODE_TYPES.find((n) => n.type === node.type);
  const borderColor = nodeType?.color ?? "#71717a";

  return (
    <Card
      variant="outlined"
      className="w-44 select-none"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <NodeIcon type={node.type} />
            <Tooltip content={node.label}>
              <span className="text-xs font-semibold truncate">{node.label}</span>
            </Tooltip>
          </div>
          <button
            onClick={() => onRemove(node.id)}
            className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Remove node"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="flex flex-col gap-2">
          <Badge
            size="sm"
            color={statusCfg.color}
            variant="soft"
            dot={node.status === "running"}
          >
            {statusCfg.label}
          </Badge>
          {node.status === "running" && (
            <Progress value={65} size="sm" color="blue" />
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
