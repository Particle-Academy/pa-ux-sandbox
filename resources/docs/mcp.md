Fancy UI ships **two** different MCP servers and they solve different problems. Don't conflate them.

| Server | Lives in | What it does |
|---|---|---|
| **Install-MCP** | `https://ui.particle.academy/mcp` (hosted) | Lets agents browse, search, and install Fancy UI components into a codebase. The "DX for agents" surface. |
| **Runtime bridges** | `@particle-academy/agent-integrations` (in your app) | Lets agents *operate* a running app — drive whiteboards, sheets, code editors, scenes — via stable handles, not screen-scraping. The "UX for agents" surface. |

If you're an IDE user installing components, you want the **Install-MCP**. If you're a developer building an app that an agent will inhabit, you want the **runtime bridges**.

## Install-MCP — for IDE agents

The Install-MCP server is a hosted streamable-HTTP MCP endpoint that any MCP-capable client can connect to. No API key. It exposes fourteen tools, in five groups:

| Tool | Input | Output |
|---|---|---|
| `start-project` | `{ backend? }` | Where to begin on a **new** project — the stack + server packages for a PHP, Node, or other backend. |
| `list-components` | (none) | The full registry index. |
| `search-components` | `{ query: string }` | Matching components (substring across name + title + description). |
| `get-component` | `{ name: string }` | The full registry-item bundle for that component. |
| `install-instructions` | `{ name: string }` | A short text recipe: the npm command + CLI command + import line. |
| `gallery-list-styles` | (none) | The [Inspiration Gallery](/inspiration) collections — design blueprints to pick a direction from. |
| `gallery-get-blueprint` | `{ style }` | One style's design recipe: tokens, layout, restyled-component palette. |
| `list-nodes` / `search-nodes` | (none) / `{ query }` | The **fancy-flow workflow-node marketplace** (third-party node packages). |
| `get-node` | `{ kind }` | One node's capabilities, whether it pauses for a human, whether it's replay-safe. |
| `node-install-instructions` | `{ kind }` | The per-runtime install command for a node package. |
| `register-showcase-project` | `{ … }` | Register a project you built for the public [Showcase](/showcase) (asks the human first). |
| `showcase-project-status` / `rescan-showcase-project` | `{ … }` | Verification status + re-scan. |

> **Status:** Live at [`https://ui.particle.academy/mcp`](https://ui.particle.academy/mcp) — streamable HTTP MCP, no API key. Add it with a plugin (Claude Code or Codex) or the config snippets below.

### Quickest: the plugin — Claude Code *or* Codex

There's a plugin for both, and either one registers this MCP server with the correct transport **and** bundles the Fancy skills (components, building-apps, design, human-plus, realtime, seo, ssr, update-fancy — plus `tui` on Claude Code). Full details on the [Agent plugins](/docs/plugin) page.

**Claude Code:**

```text
/plugin marketplace add Particle-Academy/fancy-ui-plugin
/plugin install fancy-ui@fancy-ui
```

**Codex:**

```bash
codex plugin marketplace add Particle-Academy/fancy-ui-codex-plugin
codex plugin add fancy-ui@fancy-ui
```

Approve the `fancy-ui` MCP server when prompted, then run `/mcp` to confirm it's connected. Sources: [fancy-ui-plugin](https://github.com/Particle-Academy/fancy-ui-plugin) · [fancy-ui-codex-plugin](https://github.com/Particle-Academy/fancy-ui-codex-plugin).

### Configuring your client manually

On Cursor, VS Code, or any other MCP client — or if you'd rather wire it up by hand — different clients read MCP server config from different files. The `"type": "http"` line is **required**; a remote streamable-HTTP server won't connect without it.

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

The agent calls `get-component` for each, fetches the bundles, and writes the files (or invokes `npx fancy-cli@latest add` on your behalf).

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

The twenty bridges that exist today:

| Bridge | Tool prefix | Surface |
|---|---|---|
| `whiteboard` | `whiteboard_*` | fancy-whiteboard `<Board>` |
| `artboard` | `artboard_*` | fancy-artboard `<ArtBoard>` |
| `flow` | `flow_*` | fancy-flow `<FlowEditor>` |
| `forms` | `form_*` | any controlled react-fancy form |
| `sheets` | `sheet_*` | fancy-sheets `<SheetWorkbook>` |
| `code` | `code_*` | fancy-code `<CodeEditor>` |
| `charts` | `chart_*` | fancy-echarts `<EChart>` |
| `scene` | `scene_*` | fancy-3d Scene primitives |
| `screens` | `screens_*` | fancy-screens `<Screen>` registry |
| `slides` | `deck_*` / `slide_*` / `element_*` | fancy-slides `<DeckEditor>` / `<SlideViewer>` |
| `terminal` | `terminal_*` | fancy-term `<Terminal>` (read, write, run, switch shell) |
| `tui` | `tui_*` | fancy-tui Ink surfaces (push + inbox delivery) |
| `map` | `map_*` | fancy-map `<Map>` — pan, drop pins, fit bounds, follow a track |
| `files` | `files_*` | file browser / viewer surfaces |
| `doc` | `get_node` / `set_props` / … | the shared `fancy-doc-commons` document model |
| `cms` | `set_style` / `set_layout` / … | fancy-cms-ui page documents |
| `git` | `git_*` | fancy-git-ui — status, log, diff, proposal-first mutations |
| `navigation` | `page_*` | site-wide co-browse — read, focus, and navigate the app itself |
| `catalog` | `catalog_*` | laravel-catalog / fancy-catalog products + prices |
| `features` | `features_*` | laravel-fms / fancy-features flags + quotas |

There's also a cross-cutting undo system that lives outside any single bridge:

- `agent_undo` — pop the last action.
- `agent_redo` — replay it.
- `agent_history` — list recent actions.

Bridges broadcast `AgentActivity` events so the presence layer (`<ScreenSystem>` from fancy-screens) can render cursors, focus rings, and the activity stream automatically.

For a deep dive into how bridges work — adapter shape, undo entries, presence integration — see the [Human+ UX whitepaper](/docs/human-plus-ux).

## Why two servers?

Different concerns.

The **install-MCP** speaks to one client: a coding agent helping you set up a project. It reads our registry, the gallery, and the workflow-node marketplace, and (with the human's permission and an agent key) registers a finished project in the public Showcase. It never touches a running application. There's exactly one of them, and we host it for everyone.

The **runtime bridges** speak to many clients: one per app, sometimes one per browser tab. Each one is grounded in that specific app's state, with adapters that read and mutate that app's components. They live inside the app because that's where the state is.

A useful mental model: install-MCP is **about** components, runtime bridges are **of** components.

## Hosting your own install-MCP

The Fancy UI install-MCP is hosted, but the protocol is open. If you ship your own [registry](/docs/registry), you can point an MCP server (any one — the reference impl is small) at it. The tools and shape stay the same.
