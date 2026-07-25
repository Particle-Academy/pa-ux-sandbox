Fancy is a suite of open-source packages from **Particle Academy** for building React and Laravel applications where humans and AI agents share the same UI. It comes in two families: **UI packages** — the component libraries and interactive surfaces people and agents work in — and **Service & Tool packages** — the headless infrastructure (MCP bridges, server-state, agentic document writers, analytics, a CMS, a CLI) that powers them. It is a full stack for Human+ apps, not just a component kit.

We call the design philosophy **Human+ UX**: every UI primitive has to be a great primitive for humans to author with **and** a great primitive for embedded agents to drive directly through MCP — never via DOM scraping or Playwright — and every service exists to make that possible. It's the architectural baseline for the entire stack. The deep dive lives at [Human+ UX](/docs/human-plus-ux).

## Why another component library?

There is no shortage of React component libraries. Most fall into one of three camps:

- **Heavy frameworks** (MUI, Ant Design, Chakra). Beautiful, accessible, opinionated — and big. Their abstractions resist customization and their APIs were designed before agents were a thing.
- **Headless primitives** (Radix, Headless UI). Strong accessibility floor, zero opinion on styling. You pay the cost of theming every component yourself.
- **Copy-the-source registries** (shadcn/ui). You own the code, you customize freely — but the registry was designed for humans typing CLI commands, not for embedded agents that need to drive the UI at runtime.

Fancy UI is shaped differently. The components are Tailwind-first (so theming is conventional). The APIs are terse and typed (so an LLM that sees a prop signature once can use it correctly). Every stateful primitive has a stable handle, controlled state, and a bridge that lets an MCP-driven agent operate it as a first-class participant in the UI — not as a target to be screen-scraped.

## What's in the box

Fancy is **two families of package**. **UI packages** are the surfaces humans and agents share; **Service & Tool packages** are the headless infrastructure that makes those surfaces composable, inhabitable, and shippable. This is the map — every package, with install commands and live demos, lives on the [Packages](/packages) page.

### UI packages

The component libraries and interactive surfaces. Each is controlled (`value` + `onChange`), JSON-friendly, and agent-bridgeable.

- **`react-fancy`** — ~70 Tailwind v4 React primitives; the foundation everything else builds on. *Button, Card, Tabs, Dropdown, Modal, Sidebar, Navbar, Calendar, Table, Toast, …*
- **`fancy-whiteboard`** — transport-agnostic collaborative board with built-in presence.
- **`fancy-artboard`** — Figma-style pan/zoom design canvas (board + pieces + notes).
- **`fancy-flow`** — visual workflow editor + topological runner, built on React Flow.
- **`fancy-sheets`** — full spreadsheet: formulas, multi-sheet workbooks, clipboard, CSV.
- **`fancy-slides`** — presentation editor + web viewer (Google-Slides-style decks).
- **`fancy-code`** — lightweight embedded code editor (no Monaco, no CodeMirror).
- **`fancy-term`** — controlled, themeable `<Terminal>` over xterm.js, with shell switching.
- **`fancy-diff`** — side-by-side document diff with per-hunk accept/reject.
- **`fancy-echarts`** — typed React wrapper around Apache ECharts.
- **`fancy-screens`** — multi-screen application shell with cross-screen agent presence.
- **`fancy-3d`** — engine-agnostic 3D core, with `fancy-3d-babylon` and `fancy-3d-three` WebGL adapters.

### Service & Tool packages

No UI of their own — but they're what turns a pile of components into a Human+ *application*.

- **Agents & MCP** — `agent-integrations` (MCP server + per-package bridges + presence + share relay), `fancy-auto-common` (shared AgentActivity / undo primitives), `docs-mcp` (docs MCP server), `mcp-relay-client` (single-file MCP client in bash / Python / TS / Go).
- **App integration & data** — `fancy-inertia` (Inertia ↔ React adapter, page transitions, schema-driven pages), `fancy-query` (server-state: TanStack Query + Inertia hydration + Echo invalidation).
- **Analytics** — `fancy-pixel` (embeddable verification badge + interaction beacon), `fancy-heuristics` + `fancy-heuristics-js` (human-vs-agent interaction analytics).
- **Agentic documents** — `holy-sheet` (PHP xlsx writer) + `holy-sheet-js`, `dark-slide` (PHP pptx writer/reader) + `dark-slide-js`.
- **Laravel infrastructure** — `laravel-catalog` (Stripe catalog), `laravel-fms` (feature management), `laravel-fun-lab` (gamification).
- **Tooling** — `fancy-cli` (the `npx fancy-cli` source-vendoring CLI).

PHP packages ship via Packagist; everything else via npm. The full per-package detail is on [Packages](/packages).

## Two ways to consume any component

We deliberately ship **both** distribution models so you can pick the one that matches your team's relationship with the code.

1. **`npm install` + import.** The default fast path. `npm install @particle-academy/react-fancy`, then `import { Card } from "@particle-academy/react-fancy"`. You get updates by bumping the package. You don't own the source.
2. **`npx fancy-cli add`.** The shadcn-style vendoring path. The CLI fetches the component source from our [hosted registry](/docs/registry) and writes the files into your codebase under `src/components/fancy/{slug}/`. You own the source. You can fork freely. Updates are explicit, never automatic.

Both flows are documented under [Installation](/docs/installation). The full registry contract lives at [/docs/registry](/docs/registry).

## The architectural floor

If you take nothing else from this site, take this: **every component you build on top of Fancy UI must remain authorable AND inhabitable**. Authorable for the humans who design and code with it; inhabitable for the agents who'll drive it at runtime. The whitepaper makes the case in full at [Human+ UX](/docs/human-plus-ux).
