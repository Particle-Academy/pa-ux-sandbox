There are **two Fancy UI plugins** — one for [Claude Code](https://docs.claude.com/en/docs/claude-code) and one for [Codex](https://developers.openai.com/codex) — and they do the same job: wire your agent into the Fancy UI kit in one step. Each bundles the hosted **registry MCP server** plus the **Fancy skills**, so the agent can browse, install, and *build with* the suite conversationally — without you hand-editing an `.mcp.json` or pasting in install commands.

It's the fastest on-ramp on either harness. (Building an app where an agent *operates* the running UI is a different surface — the runtime bridges in `agent-integrations`. The [MCP servers](/docs/mcp) page draws that line.)

## Install

**Claude Code** — from inside a session:

```text
/plugin marketplace add Particle-Academy/fancy-ui-plugin
/plugin install fancy-ui@fancy-ui
```

**Codex** — from your shell:

```bash
codex plugin marketplace add Particle-Academy/fancy-ui-codex-plugin
codex plugin add fancy-ui@fancy-ui
```

Approve the `fancy-ui` MCP server when prompted, then run `/mcp` to confirm it's connected. That's it — the agent can now find and install any Fancy UI component, and the skills below activate automatically when they're relevant.

- **Claude Code source:** <a href="https://github.com/Particle-Academy/fancy-ui-plugin" target="_blank" rel="noopener noreferrer">Particle-Academy/fancy-ui-plugin</a>
- **Codex source:** <a href="https://github.com/Particle-Academy/fancy-ui-codex-plugin" target="_blank" rel="noopener noreferrer">Particle-Academy/fancy-ui-codex-plugin</a>
- **Marketplace name:** `fancy-ui` · **Plugin:** `fancy-ui@fancy-ui` (both)

## What you get

### The registry MCP server

Each plugin registers the hosted registry endpoint at `https://ui.particle.academy/mcp` (streamable HTTP, `"type": "http"`, no API key) with the correct transport. It exposes fourteen tools so the agent works from the **live registry** instead of guessing component names or install commands — the core four being:

| Tool | Input | Output |
|---|---|---|
| `list-components` | (none) | The full registry index. |
| `search-components` | `{ query }` | Components matching a UI concept ("calendar", "data grid", "modal"). |
| `get-component` | `{ name }` | The full registry-item bundle (source + metadata) for one component. |
| `install-instructions` | `{ name }` | A short recipe: `npm install` command, `npx fancy-cli@latest add` command, and import line. |

Plus `start-project` (pick a stack for a new app), the Inspiration Gallery blueprint tools, the fancy-flow workflow-node marketplace tools, and the Showcase registration tools. The full list is on the [MCP servers](/docs/mcp) page — this is the same **Install-MCP**; the plugin is just the no-config way to add it.

### The skills

Skills are activated automatically when the conversation matches; you can also invoke them explicitly.

| Skill | When it fires | What it does |
|---|---|---|
| `fancy-ui:components` | Finding, choosing, installing, or composing a UI primitive | Drives the registry MCP — never invents slugs, confirms against the live registry, then installs via npm or the CLI. |
| `fancy-ui:building-apps` | Building a *whole* app, not dropping in one component | The map of the suite — the **Fancy Core** stack (react-fancy + fancy-inertia + fancy-query), which package to reach for, suite-wide best practices. |
| `fancy-ui:design` | Choosing a visual direction, before building anything | Browses the [Inspiration Gallery](/inspiration) blueprints and turns one (or a blend) into concrete tokens, layout, and a component palette. |
| `fancy-ui:human-plus` | Making a running app agent-inhabitable | Wiring `agent-integrations` MCP bridges (`registerWhiteboardBridge`, `registerSheetsBridge`, …), presence, and the [component contract](/docs/developing-human-plus). |
| `fancy-ui:realtime` | Adding live updates / Echo / presence | The Fancy way — **broadcast → invalidate → refetch** via `fancy-query` + Laravel Echo, plus `useFancyStream` for streaming chat. |
| `fancy-ui:seo` | Making the app crawlable + shareable | Per-page meta, Open Graph, JSON-LD, sitemap / robots / llms.txt via `fancy-inertia/seo` + `fancy-seo`. |
| `fancy-ui:ssr` | Server-side rendering + hydration with Inertia | `FancyClientOnly`, what can't SSR, `window is not defined`, and hydration-mismatch gotchas — built on `fancy-inertia`. |
| `fancy-ui:update-fancy` | Upgrading a project to the latest Fancy releases | Bumps every `@particle-academy/*` npm + Composer dep, reviews the changes, adapts to breaking ones. |
| `fancy-ui:tui` | Building a terminal app *(Claude Code only today)* | `fancy-tui` + Ink 7 layouts, scrollback-safe chat/logs, and Human+ MCP event delivery. |

## Why a plugin instead of a raw `.mcp.json`?

A per-project `.mcp.json` is easy to misconfigure — a missing `"type": "http"` on a remote server silently fails to connect, and project-scoped configs aren't always picked up. The plugin registers the server correctly **and** travels with the install, across every project, so you set it up once. It also carries the skills, which a bare MCP config can't.

## Manual MCP config (without a plugin)

On any other MCP client — Cursor, VS Code, or your own — add the server by hand. The `"type": "http"` line is **required**; a remote streamable-HTTP server won't connect without it. There is no API key.

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

You get the registry tools this way, but **not** the skills — those ship only with a plugin. Per-client config file locations are on the [MCP servers](/docs/mcp) page.

## Links

- **Claude Code plugin →** <a href="https://github.com/Particle-Academy/fancy-ui-plugin" target="_blank" rel="noopener noreferrer">Particle-Academy/fancy-ui-plugin</a>
- **Codex plugin →** <a href="https://github.com/Particle-Academy/fancy-ui-codex-plugin" target="_blank" rel="noopener noreferrer">Particle-Academy/fancy-ui-codex-plugin</a>
- **Claude Code plugins docs →** <a href="https://docs.claude.com/en/docs/claude-code/plugins" target="_blank" rel="noopener noreferrer">docs.claude.com — plugins</a>
- **The two MCP surfaces →** [MCP servers](/docs/mcp)
- **Registry contract →** [Registry](/docs/registry)
