Several Fancy packages don't reinvent a hard problem — they **wrap a best-in-class third-party library** and give it a Fancy face. A wrapper exists because the underlying library is excellent at its job but raw to consume in a Human+ React app: verbose lifecycle, no controlled state, a bundle you pay for whether you use it or not, and a DOM an embedded agent can only scrape.

Every Fancy wrapper follows the same four rules, so they all feel the same once you've learned one:

1. **The engine is a peer dependency, never bundled.** You install the engine yourself (`echarts`, `three`, `@xterm/xterm`, …) and control its exact version. The wrapper ships *zero* third-party runtime weight, and apps that don't use the surface tree-shake it away. (`fancy-flow` is the deliberate exception — it bundles and *hides* React Flow behind its own authoring API.)
2. **One terse, typed, controlled React surface.** A single component with `value`/`onChange` (or `option`, `output`, …) replaces the imperative `init`/`update`/`dispose` dance. Sensible defaults, dark-mode aware, themed from the same Tailwind tokens as the rest of the suite.
3. **Bridgeable for embedded agents.** Each surface carries stable handles and an `agent-integrations` MCP bridge (`chart_*`, `flow_*`, `scene_*`, `terminal_*`, …) so an agent reads and drives it through the component contract — never Playwright, never DOM scraping. See [Developing for Human+](/docs/developing-human-plus).
4. **The full power of the wrapped library stays reachable.** Nothing is hidden behind a lossy abstraction — the raw `option` object, the underlying engine instance, the `.xterm` escape hatch are all there. When you outgrow the terse surface, the wrapped library's own docs (linked below, each opens in a new tab) take over.

The per-package detail pages have the full Why / What / How plus copy-paste examples; this page is the map.

## fancy-echarts → Apache ECharts

A typed React wrapper around <a href="https://echarts.apache.org/" target="_blank" rel="noopener noreferrer">Apache ECharts</a>. Every chart type from one `<EChart>` component, lazy module registration for tree-shaking, four built-in themes, automatic dark mode, and an `onEvents` map for interactions. The full ECharts `option` object passes through unchanged, so anything in the <a href="https://echarts.apache.org/en/option.html" target="_blank" rel="noopener noreferrer">ECharts option reference</a> works verbatim. `<EChart3D>` (via the optional `echarts-gl` peer) covers globe/surface/3D series.

- **Package page →** [fancy-echarts](/packages/fancy-echarts)
- **Browse every chart type →** <a href="https://echarts.apache.org/examples/en/index.html" target="_blank" rel="noopener noreferrer">ECharts examples gallery</a>

## fancy-flow → React Flow

A batteries-included workflow editor *and* topological runner built on <a href="https://reactflow.dev/" target="_blank" rel="noopener noreferrer">React Flow</a> — which it **bundles and hides** behind a `defineNode` + `<NodePort>` authoring API, so you never import `@xyflow/react` directly. 27 built-in node kinds (triggers, `branch` / `switch_case` / `merge` / `for_each`, `http` + `api_request`, `transform`, `wait`, `user_input` / `human_approval`, `subflow`, `llm_call` / `llm_router`, …), a real `runFlow` / `useFlowRun` runtime with per-node status events, and a JSON-serializable `FlowGraph`. It's a **shuttle, not an engine** for AI: core declares a `registerLlmClient` contract and never imports a provider SDK — opt-in adapters ride on the `./llm/vercel-ai` and `./llm/prism` subpaths.

- **Package page →** [fancy-flow](/packages/fancy-flow)
- **Concepts (handles, connections, viewport) →** <a href="https://reactflow.dev/learn" target="_blank" rel="noopener noreferrer">React Flow concepts guide</a>
- **Drop to the engine →** <a href="https://reactflow.dev/api-reference" target="_blank" rel="noopener noreferrer">React Flow API reference</a>

## fancy-3d-babylon → Babylon.js

The <a href="https://www.babylonjs.com/" target="_blank" rel="noopener noreferrer">Babylon.js</a> WebGL adapter for the engine-agnostic `fancy-3d` core. `babylonEngine` mounts onto `fancy-3d`'s `<Canvas>`; `<Stage>` and `<Monitor>` render **live, interactive React** projected onto 3D planes (not rasterized textures); layout helpers (`placeOnGrid`, `placeOnArc`, `placeOnWall`, …) map a scene's 2D node positions into 3D space. `@babylonjs/core` is a peer dep, lazy-required only when a scene mounts.

- **Package page →** [fancy-3d-babylon](/packages/fancy-3d-babylon)
- **Engine docs →** <a href="https://doc.babylonjs.com/" target="_blank" rel="noopener noreferrer">Babylon.js documentation</a>

## fancy-3d-three → three.js

The <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">three.js</a> adapter — a **mirror** of the Babylon adapter against the same `CanvasEngine` interface, so the *same* `Scene` JSON renders through three.js and you can swap engines without rewriting your scene. Same `threeEngine` / `<Stage>` / `<Monitor>` / layout-helper surface; `three` is a peer dep.

- **Package page →** [fancy-3d-three](/packages/fancy-3d-three)
- **Engine docs →** <a href="https://threejs.org/docs/" target="_blank" rel="noopener noreferrer">three.js documentation</a>
- **Inspiration →** <a href="https://threejs.org/examples/" target="_blank" rel="noopener noreferrer">three.js examples</a>

## fancy-term → xterm.js

A controlled, themeable React `<Terminal>` over <a href="https://xtermjs.org/" target="_blank" rel="noopener noreferrer">xterm.js</a>. Output is a controlled buffer (stream command output straight from React state), `onData` forwards keystrokes, a `TerminalHandle` ref exposes `write`/`clear`/`getBuffer()`/`.xterm`, and a `ShellSwitcher` flips between cmd / PowerShell / bash. `@xterm/xterm` + `@xterm/addon-fit` are peers; an `agent-integrations` bridge exposes `terminal_read` / `terminal_write` / `terminal_run` with a trust-but-verify `pendingMode`.

- **Package page →** [fancy-term](/packages/fancy-term)
- **Engine docs & addons →** <a href="https://xtermjs.org/docs/" target="_blank" rel="noopener noreferrer">xterm.js API docs</a>

## fancy-query → TanStack Query

A thin wrapper over <a href="https://tanstack.com/query/latest" target="_blank" rel="noopener noreferrer">TanStack Query</a> that adds the two bridges it can't know about: **Inertia page-prop hydration** (`useInertiaHydration` — imported from `@particle-academy/fancy-query/inertia` since v0.5.0, so non-Inertia apps never touch the optional `@inertiajs/react` peer — so the first render is seeded with no fetch) and **Laravel Echo invalidation** (`useFancyEchoInvalidation`, mapping broadcasts to cache keys). `useFancyMutation` invalidates the keys it touched; `useFancyStream` patches the cache in place for token/SSE streams (the Realtime Chat starter kit). All of TanStack Query, React, `@inertiajs/react`, and Echo are peers.

- **Package page →** [fancy-query](/packages/fancy-query)
- **Engine docs →** <a href="https://tanstack.com/query/latest/docs/framework/react/overview" target="_blank" rel="noopener noreferrer">TanStack Query React docs</a>

## fancy-inertia → Inertia.js

The bridge between <a href="https://inertiajs.com/" target="_blank" rel="noopener noreferrer">Inertia.js</a> and the Fancy UI suite for Laravel hosts: `<FancyAppRoot>` mounts app-shell providers above the Inertia outlet, `useFancyForm()` wires Inertia's `useForm()` into react-fancy inputs with server-validation errors, `<FancyClientOnly>` is the skip-SSR boundary, and `<FancyPageTransition>` adds CSS-driven enter/exit crossfades keyed on the Inertia page. See the [Page transitions](/docs/page-transitions) tutorial.

- **Package page →** [fancy-inertia](/packages/fancy-inertia)
- **Engine docs →** <a href="https://inertiajs.com/" target="_blank" rel="noopener noreferrer">Inertia.js documentation</a>

---

> **Not listed here?** Packages like `fancy-sheets`, `fancy-code`, `fancy-diff`, `fancy-whiteboard`, `fancy-artboard`, and `react-fancy` are **in-house engines** — their diff/formula/tokenizer/canvas logic is written from scratch with zero third-party runtime dependencies, so there's no wrapped library to link out to. The agentic-document writers (`holy-sheet`, `dark-slide`) are likewise their own OOXML engines. The wrappers above are the packages where Fancy stands on the shoulders of a giant — and tells you exactly which giant.
