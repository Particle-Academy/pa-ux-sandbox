import type { AgentNode, Connection } from "./types";

interface SvgConnectionsProps {
  nodes: AgentNode[];
  connections: Connection[];
  isRunning: boolean;
}

const NODE_WIDTH = 176;
const NODE_HEIGHT = 100;

export function SvgConnections({ nodes, connections, isRunning }: SvgConnectionsProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#a1a1aa" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const from = nodeMap.get(conn.from);
        const to = nodeMap.get(conn.to);
        if (!from || !to) return null;

        const x1 = from.x + NODE_WIDTH;
        const y1 = from.y + NODE_HEIGHT / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_HEIGHT / 2;
        const cx1 = x1 + (x2 - x1) * 0.4;
        const cx2 = x2 - (x2 - x1) * 0.4;

        return (
          <path
            key={`${conn.from}-${conn.to}`}
            d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="2"
            strokeDasharray={isRunning ? "8 4" : "none"}
            markerEnd="url(#arrowhead)"
            className={isRunning ? "animate-dash" : ""}
          />
        );
      })}
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -24; }
        }
        .animate-dash {
          animation: dash-flow 0.6s linear infinite;
        }
      `}</style>
    </svg>
  );
}
