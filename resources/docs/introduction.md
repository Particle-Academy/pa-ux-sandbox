Fancy is an ecosystem of **64 small, independent packages** from **Particle Academy** — 47 TypeScript and 16 PHP — for building React and Laravel applications. It is not a component library with extras bolted on: roughly half of it is **headless**, and renders nothing at all. Spreadsheet, deck and document writers. A Stripe catalog and feature gating. Workflow engines. Git. Analytics. A CMS.

The organising idea is that you should be able to **build the app, not the plumbing** — reach for the piece you need, own it outright, and never take the other 63 unless you want them. Every package ships on its own, via npm or Packagist.

**Most server capabilities ship as a matched PHP *and* Node pair**, so the same feature works behind the same UI whichever backend you run: `holy-sheet`/`holy-sheet-js`, `laravel-catalog`/`fancy-catalog-js`, `fancy-flow`/`fancy-flow-php`, and so on. Pick the one matching your runtime; the contract is identical.

Where a package **does** own a UI, it's held to **[Human+ UX](/docs/human-plus-ux)**: the surface has to be a great primitive for humans to author with *and* one an embedded agent can drive directly over MCP — never via DOM scraping. That's a headline capability of the interactive half, not an entry fee the headless half could ever pay.

## Why not just a component library?

There's no shortage of React component libraries, and most fall into three camps:

- **Heavy frameworks** (MUI, Ant Design, Chakra). Beautiful, accessible, opinionated — and big. Their abstractions resist customization and their APIs predate agents.
- **Headless primitives** (Radix, Headless UI). Strong accessibility floor, zero opinion on styling. You theme everything yourself.
- **Copy-the-source registries** (shadcn/ui). You own the code and customize freely — but the registry was designed for humans typing CLI commands, not agents that need to drive the UI at runtime.

Fancy's components sit closest to the third camp — Tailwind-first, terse typed APIs, stable handles, controlled state, vendorable source. But the reason the suite exists is that **the component was never the hard part**. The hard part is the xlsx export, the pricing table wired to Stripe, the feature gate, the workflow runner, the docx your agent has to produce — the work that gets rewritten at every company and belongs to nobody. That's the other half of this ecosystem.

## What's in the box

The catalogue is organised into **families**. A family is one capability, usually spanning a UI package, a PHP implementation and a Node one. Every package, with install commands and live demos, is on the [Packages](/packages) page.

| Family | What it gives you |
|---|---|
| **Fancy Core** | The stack every Fancy app starts from — React primitives (`react-fancy`), the Inertia bridge, server-state. |
| **Fancy Flow** | Workflow graphs humans and agents author together — a headless topological engine plus an optional editor, with a PHP runtime twin. |
| **Fancy Git** | Git as a first-class, agent-driveable surface — headless engine, normalized GitHub/GitLab/Bitbucket contracts, UI. |
| **Fancy 3D** | Engine-agnostic 3D — JSON-friendly `Scene` types and a pluggable `<Canvas>`, with Babylon and three.js adapters. |
| **Fancy Term** | A controlled, themeable `<Terminal>` over xterm.js, plus the headless Node PTY host. |
| **Fancy CMS** | The Stages document model — a PHP host and page renderer, with a WYSIWYG editor. |
| **Holy Sheet** | Headless xlsx writer/reader with a formula engine. |
| **Dark Slide** | Headless pptx deck writer/reader. |
| **Last Word** | Headless docx writer/reader on one JSON document model. |
| **Fancy Catalog** | Headless Stripe catalog — products, prices, plans, checkout. |
| **Fancy Features** | Headless feature management — gates, registry, config and metered resources. |
| **Fancy Heuristics** | End-user (not search-engine) optimization — human *and* agent interaction analytics. |
| **Fancy MLM** | Multi-level referral engine — unilevel, binary and matrix trees. |
| **Fancy X-Files** | The well-known and agent-facing files from one declarative registry — `robots.txt`, `llms.txt`, sitemaps. |

Beyond the families sit the interactive surfaces — whiteboard, artboard, sheets, slides, code editor, diff, charts, screens, maps, terminal UIs — and the infrastructure that makes them composable: `agent-integrations` (the MCP server and per-package bridges), `fancy-inertia`, `fancy-query`, `fancy-seo`, `fancy-pwa`, plus tooling (`fancy-cli`, `docs-mcp`, and the Claude Code and Codex plugins).

## Two ways to consume any component

We deliberately ship **both** distribution models so you can pick the one that matches your team's relationship with the code.

1. **`npm install` + import.** The default fast path. `npm install @particle-academy/react-fancy`, then `import { Card } from "@particle-academy/react-fancy"`. You get updates by bumping the package. You don't own the source.
2. **`npx fancy-cli@latest add`.** The shadcn-style vendoring path. The CLI fetches the component source from our [hosted registry](/docs/registry) and writes the files into your codebase under `src/components/fancy/{slug}/`. You own the source. You can fork freely. Updates are explicit, never automatic.

Both flows are documented under [Installation](/docs/installation). The full registry contract lives at [/docs/registry](/docs/registry).

## Point your agent at it

The registry is an MCP server, so an agent can discover and install from it rather than guessing from memory. There's a plugin for [Claude Code](https://github.com/Particle-Academy/fancy-ui-plugin) and one for [Codex](https://github.com/Particle-Academy/fancy-ui-codex-plugin); any other MCP client can add the hosted endpoint at `https://ui.particle.academy/mcp` directly — streamable HTTP, no API key. See [MCP](/docs/mcp).

## The architectural floor

For the parts of the suite that own a UI, take this: **the surface must remain authorable AND inhabitable**. Authorable for the humans who design and code with it; inhabitable for the agents who'll drive it at runtime. The whitepaper makes the case in full at [Human+ UX](/docs/human-plus-ux).
