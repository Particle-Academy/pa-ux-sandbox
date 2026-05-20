import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const microMcpServerDoc: ComponentDoc = {
    intro: (
        <p>
            An in-page Model Context Protocol server. Hosts MCP tools that an external agent
            (Claude, Cursor, Claude Code) can call via JSON-RPC over any transport. The bridges
            in this package register their tools on a <code>MicroMcpServer</code> — that's how
            an agent talks to a whiteboard, a flow, a sheet, a form.
        </p>
    ),
    examples: [
        {
            name: "Bootstrap a server",
            description: "Create a server, register some tools, and attach a transport.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Pair with one of the shipped bridges (whiteboard, flow, sheets, code, …) or register your own tools.
                </Text>
            ),
            code: `import { MicroMcpServer, MCP_PROTOCOL_VERSION } from "@particle-academy/agent-integrations";

const server = new MicroMcpServer({
    info: { name: "my-app", version: "0.1.0" },
    capabilities: { tools: { listChanged: true } },
    instructions: "Use whiteboard_* tools to draw, sheet_* to compute, …",
});

// Register a tool
server.registerTool({
    name: "echo",
    description: "Echo the given message back.",
    inputSchema: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
    },
}, async ({ message }) => ({
    content: [{ type: "text", text: \`You said: \${message}\` }],
}));

// Attach a transport (window relay, WebSocket, in-memory pipe, …)
const dispose = server.attach(myTransport);`,
        },
        {
            name: "Pair with a Fancy bridge",
            description: "The shipped bridges install their own tool sets — drop them on the same server.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    See <code>registerWhiteboardBridge</code>, <code>registerFlowBridge</code>, <code>registerFormBridge</code>, etc. — each takes the server + an adapter.
                </Text>
            ),
            code: `import { MicroMcpServer, registerWhiteboardBridge } from "@particle-academy/agent-integrations";

const server = new MicroMcpServer({ info: { name: "my-app", version: "0.1.0" } });

registerWhiteboardBridge(server, {
    adapter: {
        getItems: () => myStore.getState().items,
        addItem: (item) => myStore.getState().addItem(item),
        updateItem: (id, patch) => myStore.getState().update(id, patch),
        removeItem: (id) => myStore.getState().remove(id),
        screenId: "whiteboard",
    },
});`,
        },
    ],
    props: [
        { name: "info", type: `ServerInfo`, default: "—", description: "Server identity — `{ name, version }`. Surfaces in the agent's `initialize` response." },
        { name: "capabilities", type: `ServerCapabilities`, default: `{ tools: { listChanged: true } }`, description: "MCP capability flags." },
        { name: "instructions", type: `string`, default: "—", description: "Free-text instructions surfaced to clients during `initialize`. A great place to tell the agent what your app is and which tools to use first." },
        { name: ".registerTool()", type: `(tool, handler) => void`, default: "—", description: "Register a tool. Inherited from `ToolRegistry`." },
        { name: ".attach()", type: `(transport) => () => void`, default: "—", description: "Attach a transport. Returns a dispose function." },
        { name: ".detach()", type: `(transport) => void`, default: "—", description: "Detach a specific transport." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Transport-agnostic:</strong> the server speaks JSON-RPC; bring your own
            transport. The package ships a window-relay implementation and an in-memory pipe
            for tests.
        </p>
    ),
};
