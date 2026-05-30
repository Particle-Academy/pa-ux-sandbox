Fancy UI ships **two** different MCP servers and they solve different problems. Don't conflate them.

| Server | Lives in | What it does |
|---|---|---|
| **Install-MCP** | `https://ui.particle.academy/mcp` (hosted) | Lets agents browse, search, and install Fancy UI components into a codebase. The "DX for agents" surface. |
| **Runtime bridges** | `@particle-academy/agent-integrations` (in your app) | Lets agents *operate* a running app — drive whiteboards, sheets, code editors, scenes — via stable handles, not screen-scraping. The "UX for agents" surface. |

If you're an IDE user installing components, you want the **Install-MCP**. If you're a developer building an app that an agent will inhabit, you want the **runtime bridges**.

## Install-MCP — for IDE agents

The Install-MCP server is a hosted streamable-HTTP MCP endpoint that any MCP-capable IDE can connect to. It exposes four tools:

| Tool | Input | Output |
|---|---|---|
| `list-components` | (none) | The full registry index. |
| `search-components` | `{ query: string }` | Matching components (substring across name + title + description). |
| `get-component` | `{ name: string }` | The full registry-item bundle for that component. |
| `install-instructions` | `{ name: string }` | A short text recipe: the npm command + CLI command + import line. |

> **Status:** Live at [`https://ui.particle.academy/mcp`](https://ui.particle.academy/mcp) — streamable HTTP MCP. Add it to your IDE today using the plugin (Claude Code) or the config snippets below.

### Quickest: the Claude Code plugin

Claude Code users can skip manual config. Install the **Fancy UI plugin** — it registers this MCP server with the correct transport and bundles two skills (`fancy-ui:components` for finding/installing components, `fancy-ui:human-plus` for building agent-inhabitable apps):

```text
/plugin marketplace add Particle-Academy/fancy-ui-plugin
/plugin install fancy-ui@fancy-ui
```

Approve the `fancy-ui` MCP server when prompted, then run `/mcp` to confirm it's connected. Source: [Particle-Academy/fancy-ui-plugin](https://github.com/Particle-Academy/fancy-ui-plugin).

### Configuring your IDE manually

Prefer to wire it up by hand (or on Cursor / VS Code)? Different IDEs read MCP server config from different files. The `"type": "http"` line is **required** — a remote streamable-HTTP server won't connect without it.

**Claude Code** — add to `.mcp.json` at your repo root (or just use the plugin above):

```json
{
  "mcpServers": {
    "fancy-ui": {
      "type": "http",
      "url": "https://ui.particle.academy/mcp"
    }
  }
}
```

**Cursor** — `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "fancy-ui": {
      "type": "http",
      "url": "https://ui.particle.academy/mcp"
    }
  }
}
```

**VS Code (GitHub Copilot)** — `.vscode/mcp.json`:

```json
{
  "servers": {
    "fancy-ui": {
      "type": "http",
      "url": "https://ui.particle.academy/mcp"
    }
  }
}
```

### Example interactions

Once connected, you ask in natural language:

> "Show me all Fancy UI components related to navigation."

The agent calls `search-components({ query: "navigation" })` and reports `navbar`, `breadcrumbs`, `sidebar`, `mobile-menu`, `tree-nav`.

> "Add the navbar and sidebar to this project."

The agent calls `get-component` for each, fetches the bundles, and writes the files (or invokes `fancy-ui add` on your behalf).

> "What does the Card component depend on?"

The agent calls `get-component({ name: "card" })` and reports its `dependencies` + `registryDependencies`.

## Runtime bridges — for inhabited apps

The runtime bridges are an entirely different surface. They live in the **app you're building**, not in the IDE. They let an embedded agent — one inhabiting the app at runtime — drive UI surfaces directly.

```tsx
import { MicroMcpServer } from "@particle-academy/agent-integrations";
import { registerWhiteboardBridge } from "@particle-academy/agent-integrations/bridges/whiteboard";

const server = new MicroMcpServer({ name: "my-app" });
registerWhiteboardBridge(server, { adapter });
// Now an agent can drive whatever <Board> is rendered via `whiteboard_*` tools.
```

The bridges that exist today:

| Bridge | Tool prefix | Surface |
|---|---|---|
| `whiteboard` | `whiteboard_*` | fancy-whiteboard `<Board>` |
| `flow` | `flow_*` | fancy-flow `<FlowEditor>` |
| `form` | `form_*` | any controlled react-fancy form |
| `sheets` | `sheet_*` | fancy-sheets `<SheetWorkbook>` |
| `code` | `code_*` | fancy-code `<CodeEditor>` |
| `charts` | `chart_*` | fancy-echarts `<EChart>` |
| `scene` | `scene_*` | fancy-3d Scene primitives |

There's also a cross-cutting undo system that lives outside any single bridge:

- `agent_undo` — pop the last action.
- `agent_redo` — replay it.
- `agent_history` — list recent actions.

Bridges broadcast `AgentActivity` events so the presence layer (`<ScreenSystem>` from fancy-screens) can render cursors, focus rings, and the activity stream automatically.

For a deep dive into how bridges work — adapter shape, undo entries, presence integration — see the [Human+ UX whitepaper](/docs/human-plus-ux).

## Why two servers?

Different concerns.

The **install-MCP** speaks to one client: an IDE agent helping you set up a project. It only ever reads our registry; it makes no changes to a running application. There's exactly one of them, and we host it for everyone.

The **runtime bridges** speak to many clients: one per app, sometimes one per browser tab. Each one is grounded in that specific app's state, with adapters that read and mutate that app's components. They live inside the app because that's where the state is.

A useful mental model: install-MCP is **about** components, runtime bridges are **of** components.

## Hosting your own install-MCP

The Fancy UI install-MCP is hosted, but the protocol is open. If you ship your own [registry](/docs/registry), you can point an MCP server (any one — the reference impl is small) at it. The tools and shape stay the same.
