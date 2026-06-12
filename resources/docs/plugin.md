The **Fancy UI plugin** is a [Claude Code](https://docs.claude.com/en/docs/claude-code) plugin that wires Claude into the Fancy UI kit in one step. It bundles the hosted **registry MCP server** plus **five skills**, so Claude can browse, install, and *build with* the suite conversationally — without you hand-editing an `.mcp.json` or pasting in install commands.

It's the fastest on-ramp for Claude Code users. (Building an app where an agent *operates* the running UI is a different surface — the runtime bridges in `agent-integrations`. The [MCP servers](/docs/mcp) page draws that line.)

## Install

From inside Claude Code:

```text
/plugin marketplace add Particle-Academy/fancy-ui-plugin
/plugin install fancy-ui@fancy-ui
```

Approve the `fancy-ui` MCP server when prompted, then run `/mcp` to confirm it's connected. That's it — Claude can now find and install any Fancy UI component, and the skills below activate automatically when they're relevant.

- **Source:** <a href="https://github.com/Particle-Academy/fancy-ui-plugin" target="_blank" rel="noopener noreferrer">Particle-Academy/fancy-ui-plugin</a>
- **Marketplace name:** `fancy-ui` · **Plugin:** `fancy-ui@fancy-ui`

## What you get

### The registry MCP server

The plugin registers the hosted registry endpoint at `https://ui.particle.academy/mcp` (streamable HTTP, `"type": "http"`) with the correct transport. It exposes four tools so Claude works from the **live registry** instead of guessing component names or install commands:

| Tool | Input | Output |
|---|---|---|
| `list-components` | (none) | The full registry index. |
| `search-components` | `{ query }` | Components matching a UI concept ("calendar", "data grid", "modal"). |
| `get-component` | `{ name }` | The full registry-item bundle (source + metadata) for one component. |
| `install-instructions` | `{ name }` | A short recipe: `npm install` command, `npx fancy-cli add` command, and import line. |

This is the same **Install-MCP** documented on the [MCP servers](/docs/mcp) page — the plugin is just the no-config way to add it.

### Five skills

Skills are activated automatically by Claude when the conversation matches; you can also invoke them explicitly.

| Skill | When it fires | What it does |
|---|---|---|
| `fancy-ui:components` | Finding, choosing, installing, or composing a UI primitive | Drives the registry MCP — never invents slugs, confirms against the live registry, then installs via npm or the CLI. |
| `fancy-ui:building-apps` | Building a *whole* app, not dropping in one component | The map of the suite — the **Fancy Core** stack (react-fancy + fancy-inertia + fancy-query), which package to reach for, suite-wide best practices. |
| `fancy-ui:human-plus` | Making a running app agent-inhabitable | Wiring `agent-integrations` MCP bridges (`registerWhiteboardBridge`, `registerSheetsBridge`, …), presence, and the [component contract](/docs/developing-human-plus). |
| `fancy-ui:ssr` | Server-side rendering + hydration with Inertia | `FancyClientOnly`, what can't SSR, `window is not defined`, and hydration-mismatch gotchas — built on `fancy-inertia`. |
| `fancy-ui:realtime` | Adding live updates / Echo / presence | The Fancy way — **broadcast → invalidate → refetch** via `fancy-query` + Laravel Echo, plus `useFancyStream` for streaming chat. |

## Why a plugin instead of a raw `.mcp.json`?

A per-project `.mcp.json` is easy to misconfigure — a missing `"type": "http"` on a remote server silently fails to connect, and project-scoped configs aren't always picked up. The plugin registers the server correctly **and travels with the install**, across every project, so you set it up once. It also carries the skills, which a bare MCP config can't.

## Manual MCP config (without the plugin)

If you'd rather not use the plugin — or you're on a different MCP-capable IDE (Cursor, VS Code) — add the server by hand. The `"type": "http"` line is **required**; a remote streamable-HTTP server won't connect without it.

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

You get the registry tools this way, but **not** the five skills — those ship only with the plugin. Per-IDE config file locations are on the [MCP servers](/docs/mcp) page.

## Links

- **Plugin repo →** <a href="https://github.com/Particle-Academy/fancy-ui-plugin" target="_blank" rel="noopener noreferrer">Particle-Academy/fancy-ui-plugin</a>
- **Claude Code plugins →** <a href="https://docs.claude.com/en/docs/claude-code/plugins" target="_blank" rel="noopener noreferrer">docs.claude.com — plugins</a>
- **The two MCP surfaces →** [MCP servers](/docs/mcp)
- **Registry contract →** [Registry](/docs/registry)
