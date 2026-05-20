import type { ComponentDoc } from "./types";
import { AgentPanel } from "@particle-academy/agent-integrations";

const sampleActivity = [
    { id: "1", at: Date.now() - 60_000, kind: "info" as const, source: "Researcher", text: "Connected to the workspace." },
    { id: "2", at: Date.now() - 50_000, kind: "tool" as const, source: "whiteboard_add_sticky", text: "Added a sticky at (200, 120)." },
    { id: "3", at: Date.now() - 30_000, kind: "tool" as const, source: "sheet_set_cell", text: "Wrote 1247 to A2." },
    { id: "4", at: Date.now() - 10_000, kind: "message" as const, source: "Agent", text: "Filled in the Q3 forecast based on the previous three quarters." },
];

export const agentPanelDoc: ComponentDoc = {
    intro: (
        <p>
            Sidebar showing the agent's identity, a stream of tool / chat / status activity,
            and an optional input composer. Pure presentational — hosts feed it the activity
            stream from their own state (typically the MCP transport log).
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Identity + activity stream + chat composer.",
            render: () => (
                <div className="w-full max-w-md">
                    <AgentPanel
                        agent={{ name: "Researcher", color: "#a855f7" }}
                        activity={sampleActivity}
                        onSubmit={() => {}}
                    />
                </div>
            ),
            code: `const [activity, setActivity] = useState<AgentActivity[]>([]);

<AgentPanel
    agent={{ name: "Researcher", color: "#a855f7" }}
    activity={activity}
    onSubmit={async (message) => {
        setActivity((a) => [...a, {
            id: nextId(),
            at: Date.now(),
            kind: "message",
            source: "You",
            text: message,
        }]);
        const reply = await sendToAgent(message);
        // …append the reply when it arrives
    }}
/>`,
        },
        {
            name: "Busy state",
            description: "Disable the composer while a request is in flight.",
            render: () => (
                <div className="w-full max-w-md">
                    <AgentPanel
                        agent={{ name: "Researcher", color: "#a855f7" }}
                        activity={sampleActivity}
                        onSubmit={() => {}}
                        busy
                    />
                </div>
            ),
            code: `<AgentPanel
    agent={{ name: "Researcher" }}
    activity={activity}
    onSubmit={handleSubmit}
    busy={inFlight}
/>`,
        },
        {
            name: "Read-only (no composer)",
            description: "Skip `onSubmit` to render an audit-log style view.",
            render: () => (
                <div className="w-full max-w-md">
                    <AgentPanel agent={{ name: "Researcher", color: "#a855f7" }} activity={sampleActivity} />
                </div>
            ),
            code: `<AgentPanel
    agent={{ name: "Researcher" }}
    activity={activity}
    // omit onSubmit — hides the composer
/>`,
        },
    ],
    props: [
        { name: "agent", type: `{ name?: string; color?: string }`, default: "—", description: "Agent identity shown in the header." },
        { name: "activity", type: `AgentActivity[]`, default: "—", description: "Activity stream. Most recent at the end — `{ id, at, kind, source, text, detail? }`." },
        { name: "onSubmit", type: `(message: string) => void`, default: "—", description: "Called when the user submits the composer. Omit to hide the composer." },
        { name: "busy", type: `boolean`, default: `false`, description: "Disable the composer while a request is in flight." },
        { name: "actions", type: `ReactNode`, default: "—", description: "Right-rail header actions (e.g. a clear-activity or settings button)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>AgentActivity kinds:</strong> <code>tool</code> for MCP tool invocations,{" "}
            <code>message</code> for chat, <code>info</code> for status, <code>error</code> for
            failures. The component formats each kind appropriately.
        </p>
    ),
};
