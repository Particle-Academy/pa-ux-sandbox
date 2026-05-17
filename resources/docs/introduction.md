Fancy UI is a constellation of open-source packages from **Particle Academy** for building React and Laravel applications where humans and AI agents share the same UI. Every component is designed against two constraints: it has to be a great primitive for humans to author with, **and** a great primitive for embedded agents to drive directly through MCP — not via DOM scraping or Playwright.

We call this **Human+ UX**. It's the architectural baseline for the entire stack. The deep dive lives at [Human+ UX](/docs/human-plus-ux).

## Why another component library?

There is no shortage of React component libraries. Most fall into one of three camps:

- **Heavy frameworks** (MUI, Ant Design, Chakra). Beautiful, accessible, opinionated — and big. Their abstractions resist customization and their APIs were designed before agents were a thing.
- **Headless primitives** (Radix, Headless UI). Strong accessibility floor, zero opinion on styling. You pay the cost of theming every component yourself.
- **Copy-the-source registries** (shadcn/ui). You own the code, you customize freely — but the registry was designed for humans typing CLI commands, not for embedded agents that need to drive the UI at runtime.

Fancy UI is shaped differently. The components are Tailwind-first (so theming is conventional). The APIs are terse and typed (so an LLM that sees a prop signature once can use it correctly). Every stateful primitive has a stable handle, controlled state, and a bridge that lets an MCP-driven agent operate it as a first-class participant in the UI — not as a target to be screen-scraped.

## What's in the box

Eleven packages, organized by surface:

- **`@particle-academy/react-fancy`** — ~50 Tailwind v4 React primitives. The foundation everything else builds on. *Action, Card, Tabs, Dropdown, Modal, Sidebar, Navbar, Calendar, Table, Toast, …*
- **`@particle-academy/fancy-flow`** — Visual workflow editor + topological executor.
- **`@particle-academy/fancy-whiteboard`** — Transport-agnostic collaborative board with built-in presence.
- **`@particle-academy/fancy-sheets`** — Full spreadsheet (formulas, multi-sheet workbooks, clipboard, CSV).
- **`@particle-academy/fancy-code`** — Lightweight embedded code editor (no Monaco, no CodeMirror).
- **`@particle-academy/fancy-echarts`** — Typed wrapper around Apache ECharts + four diagram presets.
- **`@particle-academy/fancy-screens`** — Multi-screen application shell with cross-screen presence.
- **`@particle-academy/fancy-3d`** — Engine-pluggable 3D bridge across DOM and Babylon.
- **`@particle-academy/agent-integrations`** — MCP server, presence layer, share relay, per-package bridges.
- **`@particle-academy/fancy-inertia`** — Inertia.js + React adapter; the chrome you're reading this site through.
- **`particle-academy/holy-sheet`** — PHP xlsx writer for agent-authored documents.

## Two ways to consume any component

We deliberately ship **both** distribution models so you can pick the one that matches your team's relationship with the code.

1. **`npm install` + import.** The default fast path. `npm install @particle-academy/react-fancy`, then `import { Card } from "@particle-academy/react-fancy"`. You get updates by bumping the package. You don't own the source.
2. **`npx fancy-ui add`.** The shadcn-style vendoring path. The CLI fetches the component source from our [hosted registry](/docs/registry) and writes the files into your codebase under `src/components/fancy/{slug}/`. You own the source. You can fork freely. Updates are explicit, never automatic.

Both flows are documented under [Installation](/docs/installation). The full registry contract lives at [/docs/registry](/docs/registry).

## The architectural floor

If you take nothing else from this site, take this: **every component you build on top of Fancy UI must remain authorable AND inhabitable**. Authorable for the humans who design and code with it; inhabitable for the agents who'll drive it at runtime. The whitepaper makes the case in full at [Human+ UX](/docs/human-plus-ux).
