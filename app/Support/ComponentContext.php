<?php

namespace App\Support;

/**
 * Editorial Why / What / How for each component page. Hand-curated entries
 * live in {@see ENTRIES}; everything else falls back to a generic "content
 * pending" stanza so the page section is never empty.
 *
 * Why  — the problem this primitive solves; the pain you'd hit without it.
 * What — the shape of the solution (controlled state, MCP bridge, etc.).
 * How  — the smallest possible "wire it up" recipe.
 *
 * Keyed by "{package-slug}/{component-slug}".
 */
class ComponentContext
{
    /** @var array<string, array{why: string, what: string, how: string}> */
    private const ENTRIES = [
        'react-fancy/card' => [
            'why' => 'Every dashboard, settings panel, and inbox row needs a container that establishes visual hierarchy without redoing border, shadow, padding, and dark-mode tokens from scratch. Inline divs accumulate Tailwind class-soup, drift from page to page, and break the moment a designer touches the theme.',
            'what' => '<code>Card</code> is a controlled-by-default Tailwind v4 surface with three variants (outlined, elevated, flat), four padding sizes, and named subcomponents — <code>Card.Header</code>, <code>Card.Body</code>, <code>Card.Footer</code> — so layouts stay declarative. Every variant respects the theme&apos;s zinc + dark-mode tokens automatically.',
            'how' => 'Import from <code>@particle-academy/react-fancy</code>, drop in <code>&lt;Card variant="elevated"&gt;</code>, and place <code>Card.Header</code> / <code>Card.Body</code> / <code>Card.Footer</code> inside. For agent-driven layouts: pass content as children — no special hooks needed, the surface is fully static.',
        ],

        'react-fancy/action' => [
            'why' => 'Buttons accrete props until they handle icons, emojis, avatars, badges, sort order, behavioral states (active / checked / warn / alert), and shape variants — and most apps end up with five different button components that almost agree on the API. <code>Action</code> bundles every reasonable button affordance behind one consistent prop surface.',
            'what' => 'A single typed button with standalone <code>color</code>, behavioral <code>active</code>/<code>checked</code>/<code>warn</code>/<code>alert</code> states, icon placement (left / right / top / bottom), Heroicon + emoji + avatar + badge support, and a <code>sort</code> prop that reorders adornments. <code>variant="circle"</code> turns any of it into a perfect circle for icon-only toolbars.',
            'how' => '<code>&lt;Action color="violet" icon="check"&gt;Save&lt;/Action&gt;</code> covers 80% of cases. For a pulsing notification button: <code>&lt;Action alert badge="3" icon="bell"&gt;Inbox&lt;/Action&gt;</code>. Agents can drive selection state with <code>active</code> + <code>onClick</code> — no DOM scraping required.',
        ],

        'react-fancy/tabs' => [
            'why' => 'Roll-your-own tab components forget keyboard nav, ARIA roles, and the controlled / uncontrolled split — so every app re-invents focus-trap and re-debugs the same screen-reader bug. The other libraries that ship tabs lock you into render-prop APIs that look weird next to the rest of your codebase.',
            'what' => '<code>Tabs</code> is a controlled compound component with <code>Tabs.List</code>, <code>Tabs.Tab</code>, <code>Tabs.Panels</code>, and <code>Tabs.Panel</code> children. Supports <code>defaultTab</code> (uncontrolled) and <code>activeTab</code> + <code>onTabChange</code> (controlled). Stable <code>value</code> props on each tab make it agent-bridgeable.',
            'how' => 'Wrap your tabs in <code>&lt;Tabs defaultTab="overview"&gt;</code>, declare <code>&lt;Tabs.Tab value="overview"&gt;</code> entries inside <code>Tabs.List</code>, and matching <code>&lt;Tabs.Panel value="overview"&gt;</code> entries inside <code>Tabs.Panels</code>. To let an MCP agent switch tabs, hoist state and pass <code>activeTab</code> + <code>onTabChange</code>.',
        ],

        'react-fancy/dropdown' => [
            'why' => 'Native <code>&lt;select&gt;</code> is unstyleable; popover-based dropdowns are a portal + focus-trap + click-outside puzzle that every team solves slightly wrong. You almost always end up rewriting it the third time you need a slightly fancier menu (icons, badges, dividers, submenus).',
            'what' => 'Composable menu surface with <code>Dropdown.Trigger</code> + <code>Dropdown.Menu</code> + <code>Dropdown.Item</code>. Handles portal mounting, click-outside, escape, focus return, and roving tabindex. Items take icons, badges, and disabled states; agents can bind to item handlers via stable <code>id</code> props.',
            'how' => 'Drop a <code>&lt;Dropdown&gt;</code> wrapper, mark the open affordance with <code>Dropdown.Trigger</code>, and list <code>Dropdown.Item</code> children with <code>onSelect</code> handlers. For multi-select or persistent menus, use the controlled <code>open</code> + <code>onOpenChange</code> form.',
        ],

        'react-fancy/modal' => [
            'why' => 'Modal dialogs are the highest-stakes UX surface — wrong focus management, scroll lock, escape behavior, or stacking and you break accessibility AND lose users. Every accessible modal you build from scratch costs days, and shadcn-style copy-paste is the only way you actually own the markup.',
            'what' => 'A controlled modal with built-in focus trap, scroll lock, escape-to-close, and predictable backdrop behavior. Subcomponents (<code>Modal.Header</code>, <code>Modal.Body</code>, <code>Modal.Footer</code>) compose the same way the rest of the library does, so visual rhythm is consistent.',
            'how' => 'Hold <code>open</code> in state; pass it plus <code>onOpenChange</code>. Place header / body / footer children inside. For destructive confirmations, gate the action button with the <code>pendingMode</code> pattern (Human+ UX trust-but-verify): the agent proposes, the user confirms.',
        ],

        'react-fancy/sidebar' => [
            'why' => 'Sidebars look simple until you add collapse state, mobile drawer behavior, nested groups, badges, active-route highlighting, and an agent that wants to navigate. By the time you bolt on persistence and a11y, you&apos;ve written 400 lines of code for "a list of links."',
            'what' => 'Compound layout primitive with <code>Sidebar.Group</code> and <code>Sidebar.Item</code> children. Items take icons, badges, and active state; groups expand and collapse. Stable handles on each item make agent navigation (via the MCP bridge) deterministic.',
            'how' => 'Drop <code>&lt;Sidebar&gt;</code> in your layout shell, list <code>Sidebar.Item</code> entries inside one or more <code>Sidebar.Group</code> sections, and wire the <code>active</code> prop to the current route. The Inertia + react-fancy app shell already does this; copy the pattern from the showcase.',
        ],

        'react-fancy/navbar' => [
            'why' => 'Every site needs a top chrome with a logo, primary nav, search, theme toggle, and a user menu — and every team rebuilds it. Skip the rebuild; ship a navbar that already understands dropdowns, brands, and responsive collapse to a <code>MobileMenu</code>.',
            'what' => 'Composable top-of-page chrome with <code>Navbar.Brand</code>, <code>Navbar.Item</code>, <code>Navbar.Actions</code>, and an integrated theme-toggle slot. Sticky positioning baked in; dark-mode aware; pairs with <code>MobileMenu.Flyout</code> for sub-md breakpoints.',
            'how' => 'Place <code>&lt;Navbar&gt;</code> at the top of your layout, drop <code>Navbar.Brand</code> on the left with logo + name, list <code>Navbar.Item</code> entries for nav, and put theme + user actions inside <code>Navbar.Actions</code>. The showcase chrome itself uses this exact pattern.',
        ],

        'fancy-flow/flow-editor' => [
            'why' => 'Visual workflow editors are useful in three places (no-code builders, agent toolchains, internal automations) and most teams either lift React Flow and re-style it or build something fragile from scratch. The result is editor surfaces that look great in screenshots and break the moment anyone tries to actually run a workflow.',
            'what' => '<code>FlowEditor</code> is a controlled workflow canvas on top of React Flow, with six built-in node kits, a topological executor, and a Human+ UX bridge so agents can read and mutate the graph via MCP — without DOM scraping or Playwright.',
            'how' => 'Hold the flow in state with <code>useFlowState</code>, render <code>&lt;FlowEditor&gt;</code>, and call <code>useFlowRun</code> to execute. Wire the flow bridge from <code>@particle-academy/agent-integrations/bridges/flow</code> if you want an embedded agent to author or modify the graph.',
        ],

        'fancy-whiteboard/board' => [
            'why' => 'Collaborative boards are the canonical Human+ UX surface — a shared canvas where humans sketch, paste, and arrange, and where agents need to drop tiles, draw connectors, and move things around. Every existing whiteboard library either has zero agent affordances or assumes a specific transport.',
            'what' => '<code>Board</code> is a controlled, transport-agnostic canvas: sticky notes, freeform pen, connectors, shapes, presence cursors, undo. Every item has a stable id; mutations broadcast <code>AgentActivity</code> events for the presence layer to render.',
            'how' => 'Hold <code>value</code> in state, pass <code>onChange</code>, render <code>&lt;Board&gt;</code>. For agent operability, register the whiteboard bridge with <code>registerWhiteboardBridge(server, { adapter })</code> from <code>agent-integrations</code> — the agent gets <code>whiteboard_*</code> tools and the canvas exposes presence in return.',
        ],

        'fancy-artboard/artboard' => [
            'why' => 'Design review, A/B exploration, and agent-drafted screens all want the same surface: an infinite canvas where variants sit side by side and a human can pan, zoom, focus, and rearrange. Roll-your-own versions either lock you to a specific transport, hard-code DOM positions agents can&apos;t target, or skip the controlled-state contract entirely — so an embedded agent can&apos;t propose a frame without screen-scraping.',
            'what' => '<code>ArtBoard</code> is a fully controlled pan/zoom canvas: <code>value</code>/<code>onChange</code> drive an <code>ArtBoardValue</code> (sections of pieces), <code>viewport</code>/<code>onViewportChange</code> drive the camera, <code>focus</code>/<code>onFocusChange</code> drive the full-screen overlay. Every frame carries <code>data-fa-piece</code> and every section <code>data-fa-section</code> for stable agent handles; <code>pending</code> pieces render a trust-but-verify "proposed" ring. Authorable two ways — JSON value or <code>&lt;ArtBoard.Section&gt;</code>/<code>&lt;ArtPiece&gt;</code> children.',
            'how' => 'Hold an <code>ArtBoardValue</code> in state, render <code>&lt;ArtBoard value onChange style={{ height }}&gt;</code>, and import <code>@particle-academy/fancy-artboard/styles.css</code> once. Drop <code>&lt;ArtBoard.Section&gt;</code> + <code>&lt;ArtPiece&gt;</code> children for JSX authoring, or pass <code>value</code> for JSON-driven boards. A sibling MCP bridge targets the <code>ArtBoardValue</code> contract for agent operability.',
        ],

        'fancy-artboard/art-piece' => [
            'why' => 'A design board is only as useful as the frames on it — and those frames need to hold three different things: exported image mockups, live HTML app shells, and real React components. Most canvases force everything through one rendering path (usually an image), so live mockups go stale and agent-authored frames can&apos;t be real UI.',
            'what' => '<code>ArtPiece</code> is an authoring marker for one frame. Its <code>content</code> is a JSON-friendly discriminated union — <code>{kind:"image"}</code>, <code>{kind:"html"}</code>, or <code>{kind:"node"}</code> (your JSX children, resolved by <code>id</code>). All three render inline so they scale crisply under the world transform. A stable <code>id</code> is the agent handle; <code>pending</code> marks an agent-staged frame.',
            'how' => 'Inside an <code>&lt;ArtBoard.Section&gt;</code>, drop <code>&lt;ArtPiece id="a" content={{ kind: "image", src }} /&gt;</code> for a mockup, <code>content={{ kind: "html", html }}</code> for a live shell, or pass JSX <code>children</code> for a <code>kind:"node"</code> piece. Set <code>pending</code> for agent proposals. Each piece&apos;s kebab menu exports PNG/HTML self-contained.',
        ],

        'fancy-artboard/artboard-section' => [
            'why' => 'Variants need grouping — "Onboarding A/B/C" should read as one labeled row, not a soup of loose frames. Without a section primitive every board re-implements titled lanes, inline rename, and a stable group id for agents to address.',
            'what' => '<code>ArtBoard.Section</code> groups pieces into a titled, horizontally-scrolling row. It&apos;s an authoring marker (renders nothing itself — the board compiles it into the value) with an inline-editable <code>title</code>, optional <code>subtitle</code>, and a stable <code>id</code> exposed as <code>data-fa-section</code> so an agent can target the group directly.',
            'how' => 'Wrap <code>&lt;ArtPiece&gt;</code> children in <code>&lt;ArtBoard.Section id="hero" title="Hero variants" subtitle="A/B/C"&gt;</code>. When the board is driven by <code>value</code>, sections come from <code>ArtBoardValue.sections</code> instead and the children are ignored.',
        ],

        'fancy-artboard/artboard-note' => [
            'why' => 'Review feedback and agent suggestions want to live <em>on</em> the canvas, next to the frame they comment on — not in a side panel that loses spatial context. A floating, rotatable sticky note is the natural affordance, but bolting one onto a pan/zoom world (position, rotation, editable text) is fiddly to get right.',
            'what' => 'An absolutely-positioned react-fancy <code>StickyNote</code> placed in the canvas world. The wrapper owns <code>top</code>/<code>left</code>/<code>right</code>/<code>bottom</code> + <code>rotate</code> + <code>color</code>; the paper and text are react-fancy&apos;s primitive. Controlled text via <code>value</code>/<code>onChange</code> (with <code>editable</code>), or static <code>children</code> that override the text.',
            'how' => 'Drop <code>&lt;ArtBoard.Note top={40} left={60} rotate={-3} value={note} onChange={setNote} editable /&gt;</code> inside an <code>&lt;ArtBoard&gt;</code> for an editable note, or pass <code>children</code> for static content. Choose a <code>color</code> from the StickyNote presets or any CSS color.',
        ],

        'fancy-sheets/sheet-workbook' => [
            'why' => 'Embedded spreadsheets always come with one of two failure modes: heavyweight (AG Grid Enterprise pricing, license keys) or toy (no formulas, no clipboard, no multi-sheet). Fancy Sheets sits in the middle: a full workbook that an agent can drive.',
            'what' => '<code>SheetWorkbook</code> is a multi-sheet, formula-aware, clipboard-friendly spreadsheet with CSV import/export. Controlled by a workbook value object; agents drive it through <code>sheet_*</code> MCP tools (set cell, append row, name range, etc.).',
            'how' => 'Build a workbook with <code>createEmptyWorkbook()</code>, hold it in state, render <code>&lt;SheetWorkbook value onChange&gt;</code>. For agent operability, register the sheets bridge — and for xlsx export, hand the workbook to Holy Sheet (the PHP writer).',
        ],

        'fancy-code/code-editor' => [
            'why' => 'Monaco is 5MB. CodeMirror v6 is great but ramp-up is real. Most embedded code surfaces (config files, inline scripts, agent-authored snippets) don&apos;t need an IDE — they need an editor that&apos;s lightweight, controlled, and bridgeable.',
            'what' => '<code>CodeEditor</code> is a custom editor (no Monaco, no CodeMirror) with syntax-highlight presets, controlled value, and a <code>code_*</code> bridge so agents can read selections and apply edits without screen-scraping.',
            'how' => 'Render <code>&lt;CodeEditor value language="ts" onChange&gt;</code>. For agent control, attach the code bridge — agents get <code>code_get</code>, <code>code_replace</code>, <code>code_insert_at_line</code>, etc.',
        ],

        'fancy-echarts/echart' => [
            'why' => 'Chart libraries either ship one type at a time (recharts), wrap a vendor in render-props that fight React (Victory), or hand you a 600-line option object (Apache ECharts raw). You want the ECharts depth with the React ergonomics.',
            'what' => 'Typed React wrapper around Apache ECharts plus four ergonomic diagram presets (data, flow, mind, org). One <code>option</code> prop, full ECharts capability, theme-aware, agent-bridgeable.',
            'how' => 'Build an ECharts <code>option</code> object, pass it to <code>&lt;EChart&gt;</code>. For diagrams, use the preset components — they take simpler data shapes (nodes + edges or hierarchical trees) and produce a polished ECharts diagram underneath.',
        ],

        'agent-integrations/micro-mcp-server' => [
            'why' => 'An MCP server is the right shape for "let an LLM drive my UI" but spinning up Anthropic&apos;s SDK in a browser tab is overkill — and you don&apos;t want every package owning its own framing of MCP. <code>MicroMcpServer</code> is the in-page server every Fancy UI bridge plugs into.',
            'what' => 'A 200-line in-page MCP server with <code>register(tool)</code>, JSON-RPC framing, and an SSE transport. Every <code>register*Bridge</code> in agent-integrations takes one of these and adds its surface-specific tools.',
            'how' => 'Instantiate with <code>new MicroMcpServer({ name })</code>, hand it to the bridges you want (<code>registerWhiteboardBridge(server, ...)</code>), and attach the transport — local for an embedded agent, or via <code>ShareControls</code> for a relayed external agent.',
        ],

        'holy-sheet/agent' => [
            'why' => 'Generating real xlsx files from PHP usually means shelling out to phpoffice/phpspreadsheet — a 50MB library with its own DSL — or producing crappy CSV. For agent-authored documents (an LLM writes a report, your app writes the xlsx), you want a small writer that round-trips.',
            'what' => 'A schema-first xlsx writer for PHP 8.2+ with three methods: <code>write($schema, $path)</code>, <code>describe($path)</code>, <code>lint($schema)</code>. Round-trip safe — <code>describe()</code> returns the same shape <code>write()</code> consumed. Zero third-party deps; only requires ext-zip.',
            'how' => 'Build a schema array (sheets / rows / headers), call <code>Agent::write($schema, $path)</code>. To inspect an existing xlsx, call <code>Agent::describe($path)</code> — same shape back. Optional Laravel adapter mounts it on a facade.',
        ],

        'fancy-inertia/fancy-app-root' => [
            'why' => 'Inertia + React + Fancy UI needs the same boilerplate at every app root — Toast.Provider, fancy-screens&apos; ScreenSystem, ECharts module registration. <code>FancyAppRoot</code> bundles it so a new app is two lines, not twenty.',
            'what' => 'A single wrapper component that mounts every cross-cutting provider Fancy UI expects, in the right order, with sensible defaults. Flags (<code>withScreens</code>, <code>withECharts</code>) let you opt out of pieces you don&apos;t need. Providers mount synchronously on first render &mdash; no lazy-import dance.',
            'how' => 'In your Inertia bootstrap, wrap <code>&lt;App ...&gt;</code> with <code>&lt;FancyAppRoot&gt;</code> inside <code>createRoot().render()</code>. That&apos;s the whole integration &mdash; every other Fancy UI primitive now works without further wiring.',
        ],
    ];

    /** @return array{why: string, what: string, how: string}|null */
    public static function find(string $packageSlug, string $componentSlug): ?array
    {
        return self::ENTRIES["$packageSlug/$componentSlug"] ?? null;
    }
}
