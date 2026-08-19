import type { ComponentDoc } from "./types";
import { AgentCursor } from "@particle-academy/agent-integrations";
import "@particle-academy/agent-integrations/styles.css";

export const agentCursorDoc: ComponentDoc = {
    intro: (
        <p>
            On-canvas presence marker for the agent. Drop it inside (or alongside) a
            <code>fancy-whiteboard</code> <code>Board</code> at the screen coordinates the
            agent reports. Distinct from the whiteboard <code>CursorLayer</code> (which is for
            human collaborators) — this version also supports a status caption under the
            name (e.g. the current tool being run).
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    <AgentCursor x={80} y={40} name="Researcher" />
                </div>
            ),
            code: `<AgentCursor x={agentX} y={agentY} name="Researcher" />`,
        },
        {
            name: "With status",
            description: "Show the current tool the agent is using.",
            render: () => (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    <AgentCursor x={80} y={40} name="Researcher" status="whiteboard_add_sticky" />
                </div>
            ),
            code: `<AgentCursor
    x={agentX}
    y={agentY}
    name="Researcher"
    status={activeToolName}
/>`,
        },
        {
            name: "Custom color",
            description: "Match the cursor color to the agent's brand color.",
            render: () => (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    <AgentCursor x={40} y={40} name="Researcher" color="#10b981" />
                    <AgentCursor x={200} y={70} name="Coder" color="#3b82f6" />
                </div>
            ),
            code: `<AgentCursor x={x1} y={y1} name="Researcher" color="#10b981" />
<AgentCursor x={x2} y={y2} name="Coder" color="#3b82f6" />`,
        },
    ],
    props: [
        { name: "x", type: `number`, default: "—", description: "Screen X coordinate (px). Required." },
        { name: "y", type: `number`, default: "—", description: "Screen Y coordinate (px). Required." },
        { name: "name", type: `string`, default: "—", description: "Agent name shown as a tag next to the pointer." },
        { name: "color", type: `string`, default: `"#a855f7"`, description: "Pointer + tag accent color." },
        { name: "status", type: `string`, default: "—", description: "Optional caption shown under the name — typically the current tool." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapper." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the wrapper." },
    ],
};
