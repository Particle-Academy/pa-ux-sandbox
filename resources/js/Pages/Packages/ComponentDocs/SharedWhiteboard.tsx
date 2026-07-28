import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const sharedWhiteboardDoc: ComponentDoc = {
    intro: (
        <p>
            Batteries-included composite: a <code>fancy-whiteboard</code> <code>Board</code>{" "}
            with sticky notes, shapes, connectors, and drawings; an in-process MCP server
            with the whiteboard bridge pre-installed; a presence layer for human and agent
            cursors; and share controls that publish a session URL to your relay endpoint.
            Drop one in to get a working agent-driveable whiteboard.
        </p>
    ),
    examples: [
        {
            name: "Local-only (no sharing)",
            description: "Skip the relay setup — the board still works locally with an in-process MCP server.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pass <code>shareBaseUrl=&#123;null&#125;</code> to disable network sharing.
                </Text>
            ),
            code: `import { SharedWhiteboard } from "@particle-academy/agent-integrations";

<SharedWhiteboard
    agent={{ id: "researcher", name: "Researcher", color: "#a855f7" }}
    shareBaseUrl={null}
/>`,
        },
        {
            name: "Shared with a relay",
            description: "Point at a host-implemented relay endpoint (see docs/relay-protocol.md).",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Once sharing is live, agents on the other side connect via the published URL and start driving the board through the bridge.
                </Text>
            ),
            code: `<SharedWhiteboard
    agent={{ id: "researcher", name: "Researcher", color: "#a855f7" }}
    shareBaseUrl="https://my-app.test/agent-relay"
    initialNotes={[
        {
            id: "n1",
            kind: "sticky",
            x: 60, y: 60, width: 160, height: 100,
            text: "Brainstorm here",
            color: "#fef3c7",
        },
    ]}
/>`,
        },
        {
            name: "Custom relay registration",
            description: "Override how new sessions are registered with the broker.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Useful when the broker needs auth headers, or to record the session ID in your app's store.
                </Text>
            ),
            code: `<SharedWhiteboard
    agent={agent}
    shareBaseUrl="/agent-relay"
    onRegisterSession={async ({ session, token }) => {
        await fetch("/agent-relay/register", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
            body: JSON.stringify({ session, token }),
        });
    }}
/>`,
        },
    ],
    props: [
        { name: "initialNotes", type: `StickyNoteItem[]`, default: `[]`, description: "Initial sticky notes." },
        { name: "initialShapes", type: `ShapeItem[]`, default: `[]`, description: "Initial shapes." },
        { name: "initialConnectors", type: `ConnectorItem[]`, default: `[]`, description: "Initial connectors." },
        { name: "initialStrokes", type: `Stroke[]`, default: `[]`, description: "Initial freeform pen strokes." },
        { name: "initialViewport", type: `Viewport`, default: "—", description: "Initial pan/zoom state." },
        { name: "agent", type: `{ id, name?, color? }`, default: "—", description: "Agent identity shown in the panel + cursor." },
        { name: "shareBaseUrl", type: `string | null`, default: "—", description: "Where the relay HTTP endpoints live. Pass `null` to disable sharing." },
        { name: "onRegisterSession", type: `(descriptor) => Promise<void>`, default: "POSTs JSON to `${shareBaseUrl}/register`", description: "Custom session registration handler." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Relay protocol:</strong> see{" "}
            <code>agent-integrations/docs/relay-protocol.md</code> for the wire format. The
            same relay carries arbitrary MCP frames now — the name <em>whiteboard</em>-share
            is historical.
        </p>
    ),
};
