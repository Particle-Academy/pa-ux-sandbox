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

        'react-fancy/button' => [
            'why' => 'Buttons accrete props until they handle icons, emojis, avatars, badges, sort order, behavioral states (active / checked / warn / alert), and shape variants — and most apps end up with five different button components that almost agree on the API. <code>Button</code> (formerly <code>Action</code>) bundles every reasonable button affordance behind one consistent prop surface.',
            'what' => 'A single typed button with standalone <code>color</code>, behavioral <code>active</code>/<code>checked</code>/<code>warn</code>/<code>alert</code> states, icon placement (left / right / top / bottom), Heroicon + emoji + avatar + badge support, and a <code>sort</code> prop that reorders adornments. <code>variant="circle"</code> turns any of it into a perfect circle for icon-only toolbars.',
            'how' => '<code>&lt;Button color="violet" icon="check"&gt;Save&lt;/Button&gt;</code> covers 80% of cases. For a pulsing notification button: <code>&lt;Button alert badge="3" icon="bell"&gt;Inbox&lt;/Button&gt;</code>. Agents can drive selection state with <code>active</code> + <code>onClick</code> — no DOM scraping required.',
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

        'react-fancy/marquee' => [
            'why' => 'Auto-scrolling ticker strips — client logos, capability words, telemetry lines — are a signature of kinetic design, and every hand-rolled one carries the same footguns: a manually duplicated item list for the seamless wrap, mask-fade CSS, keyframe math that changes pace with content width, and (almost always forgotten) <code>aria-hidden</code> + the <code>prefers-reduced-motion</code> gate. The Kinetic style in the Inspiration Gallery specified its marquees as hand-rolled, so every project that adopted the look re-implemented the same ~40 lines. That boilerplate — and its accessibility traps — belongs in the kit, solved once.',
            'what' => '<code>Marquee</code> is an edge-to-edge auto-scrolling strip with JSON-friendly <code>items</code> (or children), <code>speed</code> in px/s — the content is measured so perceived pace stays constant regardless of width (or pass an exact <code>duration</code>) — <code>direction="left|right"</code> for opposing pairs, <code>pauseOnHover</code>, a controlled <code>paused</code> prop, plus <code>gap</code>, a <code>separator</code> node, masked <code>fade</code> edges, and an <code>angle</code> tilt for the torn off-axis band look. Short content auto-repeats until the strip fills, so the wrap is always seamless. It&apos;s decorative by default (<code>aria-hidden</code>, duplicate loop copies always hidden) and renders a static row under <code>prefers-reduced-motion</code>. Stable <code>data-react-fancy-marquee-*</code> handles on the root, track, and every item.',
            'how' => '<code>&lt;Marquee items={clients} separator={&lt;span&gt;✸&lt;/span&gt;} /&gt;</code> is the whole job — typography and color inherit from <code>className</code>, so the Kinetic gallery&apos;s clients marquee is literally one element: <code>direction="right" fade="8%"</code> plus your big-type classes (the interactive demo below is that exact recreation). Stack two strips with opposite <code>direction</code> for the opposing-pair effect, and expose a non-decorative strip to assistive tech with <code>decorative={false}</code> + an <code>aria-label</code>.',
        ],

        'react-fancy/file-browser' => [
            'why' => 'Directory pickers and file trees usually assume a local filesystem — the moment the tree lives on a REMOTE machine (a dev box, a build server, a fancy-term-host session) most components force you to eager-load the whole tree over the wire, hand-roll loading and error states per folder, and scrape the DOM to know what an agent selected. Genie needed to let a user (or an agent) browse a remote host and pick a directory, and nothing in the kit — or most kits — did it without owning the transport.',
            'what' => '<code>FileBrowser</code> is a compound browse-and-pick surface (<code>PathBar</code> / <code>Toolbar</code> / <code>Tree</code> / <code>Node</code>) that never touches a filesystem: you feed it an async <code>provider.loadChildren(path)</code> (lazy per-folder, per-node loading + error/retry, stale responses discarded — never an eager walk) and/or a JSON-friendly <code>snapshot</code> tree you update as chunks stream in from the other machine. <code>select="file|directory|both"</code> (+<code>multiple</code>), fully controlled selection / path / expansion / sort / filter, an editable path input + click trail, ARIA tree keyboard nav, and a stable <code>data-path</code> handle on every row.',
            'how' => 'Pass <code>provider={{ loadChildren }}</code> over whatever transport you have (HTTP, relay, MCP tool) and hold <code>value</code> + <code>onChange</code> for the picked path — <code>select="directory"</code> makes it a directory picker in one prop. For streamed remote snapshots, keep the tree in state and pass it as <code>snapshot</code>, merging chunks as they arrive; hybrid mode lets the provider lazily fill anything the snapshot left unknown. An agent-facing <code>registerFilesBridge</code> ships in <code>@particle-academy/agent-integrations</code> as a follow-up.',
        ],

        'fancy-flow/flow-editor' => [
            'why' => 'Visual workflow editors are useful in three places (no-code builders, agent toolchains, internal automations) and most teams either lift React Flow and re-style it or build something fragile from scratch. The result is editor surfaces that look great in screenshots and break the moment anyone tries to actually run a workflow.',
            'what' => '<code>FlowEditor</code> is a controlled workflow canvas on top of React Flow, with six built-in node kits, a topological executor, and a Human+ UX bridge so agents can read and mutate the graph via MCP — without DOM scraping or Playwright.',
            'how' => 'Hold the flow in state with <code>useFlowState</code>, render <code>&lt;FlowEditor&gt;</code>, and call <code>useFlowRun</code> to execute. Wire the flow bridge from <code>@particle-academy/agent-integrations/bridges/flow</code> if you want an embedded agent to author or modify the graph.',
        ],

        'fancy-flow/run-flow' => [
            'why' => 'A workflow a human (or agent) authors in the editor is worthless if it can only run inside a browser tab. You want the <em>same</em> graph to execute on a server, a queue worker, a CLI, or an edge function — without dragging React, <code>@xyflow/react</code>, or any DOM into your backend bundle.',
            'what' => '<code>runFlow</code> is the pure topological engine, exported from the <strong>zero-React</strong> <code>@particle-academy/fancy-flow/engine</code> subpath. It walks a <code>FlowGraph</code> against an <code>ExecutorRegistry</code> (one async function per node kind), resolves inputs across connected ports, short-circuits decision branches (<code>{ branch: "true" }</code>), detects cycles, and streams typed <code>RunEvent</code>s. It&apos;s the exact same engine <code>useFlowRun</code> drives in the editor.',
            'how' => 'Import from the headless entry and run: <code>import { runFlow } from "@particle-academy/fancy-flow/engine"</code>, then <code>const result = await runFlow(graph, executors, onEvent)</code>. Provide executors keyed by node kind (or a <code>"*"</code> wildcard); inspect <code>result.ok</code> / <code>result.outputs</code> / <code>result.error</code>.',
        ],

        'fancy-flow/flow-runner-ux' => [
            'why' => 'The flip side of running a flow is letting the flow <em>drive your app</em> — pop a toast, navigate, open a modal, pause for a human approval. Wiring that ad-hoc per node turns into a tangle, and there&apos;s no shared notion of "an autonomous thing just did X" that presence / logging / undo can hook into.',
            'what' => '<code>FlowRunnerUx</code> is the headless <em>flow-driven UX</em> bridge — the counterpart to agent-integrations. The host registers named UX <code>effects</code>; <code>useFlowRunnerUx</code> turns each into a flow executor (kind <code>ux_&lt;effect&gt;</code>), registers a matching palette node, and broadcasts an <code>AutoActivity</code> event (<code>source:"flow"</code>) per dispatch on the shared <code>@particle-academy/fancy-auto-common</code> bus that agent-integrations also uses. Human-in-the-loop is free: an effect that returns a Promise pauses the run until the user resolves it.',
            'how' => 'From the <code>/ux</code> subpath: <code>const ux = useFlowRunnerUx({ effects: { toast: ({ message }) =&gt; toast({ title: message }) } })</code>, then <code>&lt;FlowEditor initial={graph} executors={ux.executors} /&gt;</code>. Call <code>ux.registerKinds()</code> once to add the effect nodes to the palette.',
        ],

        'fancy-diff/fancy-diff' => [
            'why' => 'Reviewing a change is the moment a human stays in the loop — and in a Human+ app the change usually comes from an <em>agent</em>: it drafts an edit, the human reads it side by side and accepts or rejects it hunk by hunk. Every team rebuilds this surface (a diff view, a per-hunk gutter, an accept/reject toggle, a merged result) and most either ship a read-only diff with no acceptance, or wire acceptance to opaque DOM the agent can&apos;t drive. <code>FancyDiff</code> is the trust-but-verify review surface both a human and an embedded agent operate through the same controlled state.',
            'what' => '<code>FancyDiff</code> is a controlled, client-side side-by-side (or inline) diff viewer with per-hunk acceptance and a live merged document. <strong>Acceptance is controlled</strong> — <code>value</code> is a <code>Record&lt;hunkId, "accepted" | "rejected" | "pending"&gt;</code> map, with <code>onChange</code>; <code>onResult</code> / <code>getMergedResult()</code> fold the diff + acceptance into the merged text (accepted <code>add</code> included, accepted <code>remove</code> dropped, accepted <code>replace</code> takes the after-lines, anything pending/rejected keeps the original). The <code>source</code> is a JSON-friendly discriminated union with <strong>three datasources</strong>: <code>{ before, after }</code> (the in-house zero-dep LCS engine computes the hunks), <code>{ unified }</code> (parse a git unified diff), or <code>{ diff }</code> (a pre-built structured <code>Diff</code>). <code>mode</code> is <code>"split" | "inline"</code>. Render-prop slots (<code>renderHunk</code> / <code>renderToolbar</code> / <code>renderGutter</code>) wrap rather than replace, and every hunk carries a stable <code>data-fancy-diff-hunk</code> handle so an agent reads/writes acceptance by id — never the DOM. <strong>Caveat:</strong> a git unified diff carries only the changed hunks plus a little context, so parsed files are flagged <code>partial</code> and <code>getMergedResult()</code> over them reconstructs only the lines in the diff window — feed full <code>{ before, after }</code> documents when you need a fully merged file.',
            'how' => 'Hold the acceptance map in state and render: <code>&lt;FancyDiff source={{ before, after }} value={value} onChange={setValue} onResult={(r) =&gt; setMerged(r.text)} /&gt;</code>. Import <code>@particle-academy/fancy-diff/styles.css</code> once. For a git diff, swap the source: <code>source={{ unified }} mode="inline"</code>. Pull the merged document imperatively via a ref: <code>const { text } = ref.current.getMergedResult()</code>. With <code>pendingMode</code>, accept/reject become <em>proposals</em> (<code>onProposal</code>) so an agent stages a merge a human confirms; a sketched MCP bridge maps <code>diff_accept_hunk</code> / <code>diff_reject_hunk</code> onto the same <code>value</code>/<code>onChange</code> loop.',
        ],

        'fancy-pixel/pixel' => [
            'why' => 'A site built with Fancy UI wants to <em>prove</em> it — that&apos;s how it earns a listing in the public Showcase, and how the suite&apos;s reach stays visible. <code>FancyPixel</code> is the embeddable badge that does the proving: it renders into an <strong>open Shadow DOM</strong> so the host page&apos;s CSS can&apos;t hide it (visibility is part of verification), and it stamps the same <code>data-fancy-badge</code> marker the Showcase scanner already detects. The same chip is the <strong>data pipe</strong>: point it at a host&apos;s <code>endpoint</code> and one embed both verifies the site <em>and</em> streams its interaction analytics — clicks, scroll, focus heatmaps — to that host, keyed by <code>siteKey</code>. That is how external sites feed a hosting project (the Showcase + the coming Analytics Suite); a project measuring <em>itself</em> uses <code>fancy-heuristics</code> directly. And because it&apos;s Human+, it&apos;s <em>inhabitable</em> — the badge exposes a stable <code>data-fancy-pixel</code> handle and dispatches a <code>fancy-pixel:shown</code> event, so an embedded agent reads its presence and state without scraping the DOM.',
            'what' => '<code>FancyPixel</code> is an embeddable verification badge + liveness/collection beacon with <strong>three styles × two placement modes</strong>: <code>style</code> ∈ <code>badge</code> ("Powered by Fancy UI" wordmark + glyph) / <code>mark</code> (glyph only) / <code>beacon</code> (a pulsing dot), and <code>mode</code> ∈ <code>placed</code> (inline at a <code>target</code> selector/element) / <code>floating</code> (<code>position: fixed</code> in a screen corner). It renders into an <strong>open Shadow DOM</strong> — host CSS cannot hide it — and every style emits the <code>data-fancy-badge</code> marker the Showcase scanner detects plus a stable <code>data-fancy-pixel</code> handle. An <code>IntersectionObserver</code> confirms it is genuinely on-screen (not <code>display:none</code>, off-screen, or 0-size) and dispatches a <code>fancy-pixel:shown</code> <code>CustomEvent</code> on first visibility. The API is a single call — <code>mountPixel({ style, mode, target?, siteKey, endpoint?, href? })</code> returning a <code>{ host, visible, destroy() }</code> handle — or a one-line <code>&lt;script&gt;</code> tag that auto-inits from its own <code>data-*</code> attributes. <strong>One endpoint, full pipe (opt-in):</strong> set <code>endpoint</code> and the single embed does three things — renders the badge, POSTs the verification/liveness ping to <code>${endpoint}/pixel</code>, and starts a bundled <code>fancy-heuristics-js</code> collector that streams interaction events (clicks, scroll, pointer heatmap, dwell — humans <em>and</em> agents) to <code>${endpoint}/collect</code>, keyed by <code>siteKey</code>. Pass <code>collect: false</code> / <code>data-collect="false"</code> for badge + liveness only; omit <code>endpoint</code> and no network request is ever made. The collector is inlined into the global build, so the one external-site <code>&lt;script&gt;</code> is self-contained — no third-party runtime dependencies.',
            'how' => 'Drop the one-line embed — no build step: <code>&lt;script src="…/fancy-pixel.global.min.js" data-style="badge" data-mode="floating" data-site="YOUR_KEY" data-endpoint="https://your-host/heuristics"&gt;&lt;/script&gt;</code>. Or mount it programmatically: <code>import { mountPixel } from "@particle-academy/fancy-pixel"; const pixel = mountPixel({ style: "badge", mode: "floating", siteKey: "YOUR_KEY", endpoint: "https://your-host/heuristics" });</code> — then <code>pixel.destroy()</code> to tear it down. For an inline placement, pass <code>mode: "placed"</code> + a <code>target</code> selector or element. <strong>Leave <code>endpoint</code> off</strong> and it&apos;s a pure visual badge with no network traffic; set it and the one embed renders the badge <em>and</em> streams the site&apos;s interaction analytics to the host (add <code>data-collect="false"</code> for badge + liveness only). Observe presence with <code>document.addEventListener("fancy-pixel:shown", …)</code> or read the <code>data-fancy-pixel</code> handle directly.',
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

        'fancy-code/markdown-editor' => [
            'why' => 'Apps keep hand-rolling a <code>&lt;textarea&gt;</code> for markdown — losing tokenization, sizing-token alignment, and a preview. <code>MarkdownEditor</code> is the markdown-aware sibling of <code>CodeEditor</code>: a real editor + an optional live preview, with no new runtime dependency.',
            'what' => 'A <code>CodeEditor</code> on the registered <code>markdown</code> language (headings, emphasis, code, links, blockquote, list-marker highlighting) beside an optional preview pane. Controlled via <code>value</code> + <code>onValueChange</code>; the preview renders with a tiny dependency-free <code>renderMarkdown</code> (HTML-escaped input, safe by default) you can swap for a full CommonMark lib via <code>renderPreview</code>.',
            'how' => 'Render <code>&lt;MarkdownEditor value onValueChange mode="split" /&gt;</code> — <code>mode</code> ∈ <code>split</code> / <code>edit</code> / <code>preview</code>. Import the package stylesheet for the preview prose. <code>renderMarkdown</code> + <code>tokenizeMarkdown</code> are exported for custom hosts.',
        ],

        'fancy-term/terminal' => [
            'why' => 'A terminal is where humans and agents do <em>real</em> work — run a command, watch the output, decide what&apos;s next. Most apps embed <code>xterm.js</code> raw: an uncontrolled DOM widget an embedded agent can only read by scraping pixels and only drive by faking keystrokes. <code>Terminal</code> makes it a proper Human+ surface — controlled, themeable, and bridgeable — with the trust-but-verify loop a terminal demands (an agent <em>proposes</em> a command, a human confirms before it runs).',
            'what' => 'A React <code>&lt;Terminal&gt;</code> wrapping <code>xterm.js</code>. <strong>Controlled output</strong> — <code>output</code> delta-appends as it grows (stream from React state, e.g. fancy-query&apos;s <code>useFancyStream</code>); <code>onData</code> forwards keystrokes. A stable <code>data-fancy-terminal</code> handle + a ref exposing <code>TerminalHandle</code> (<code>write</code> / <code>clear</code> / <code>reset</code> / <code>fit</code> / <code>focus</code> / <code>getBuffer()</code> / <code>getSelection()</code> / <code>.xterm</code>). Hooks: <code>useTerminal</code>, <code>useTerminalFit</code> (0×0-guarded), <code>useTerminalSession</code> (streamed PTY backend). <code>xterm</code> + <code>@xterm/addon-fit</code> are peers; a Fancy dark theme is the default.',
            'how' => 'Install <code>@particle-academy/fancy-term @xterm/xterm @xterm/addon-fit</code> + import <code>@xterm/xterm/css/xterm.css</code>. Give the parent a height: <code>&lt;div style={{height:360}}&gt;&lt;Terminal output={out} onData={send} /&gt;&lt;/div&gt;</code>. Make it inhabitable with <code>registerTerminalBridge(server, { adapter })</code> (agent-integrations) — <code>terminal_read</code> / <code>terminal_write</code> / <code>terminal_run</code>, with <code>pendingMode</code> staging destructive commands for human confirmation.',
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

        'fancy-mlm-ui/downline-tree' => [
            'why' => 'Referral programs live or die on members understanding their network, but genealogy UIs are usually bespoke: one tree for unilevel, another for binary spillover, each hand-wired to a backend. And the moment an agent should read or drive the view, a bespoke tree means DOM scraping.',
            'what' => '<code>DownlineTree</code> is a controlled genealogy surface: a flat, JSON-friendly member list in (each row carrying BOTH <code>sponsorId</code> and <code>placementId</code>), a collapsible tree out. The <code>edge</code> prop picks which pointer draws the shape &mdash; <code>"sponsor"</code> (unilevel) or <code>"placement"</code> (binary / matrix) &mdash; so one dataset renders every downline type. Controlled selection, tier Badges via <code>tierColor</code>, dimmed inactive members, stable <code>data-mlm-node</code> handles.',
            'how' => 'Feed it the member rows your <code>particle-academy/fancy-mlm</code> (or <code>@particle-academy/fancy-mlm</code>) backend already stores, set <code>edge</code> from your plan&apos;s tree type, and wire <code>selectedId</code> + <code>onSelect</code>. The sandbox&apos;s /referrals page is exactly this over the live engine.',
        ],

        'fancy-mlm-ui/commission-statement' => [
            'why' => 'A referral payout the member can&apos;t audit is a support ticket. Ad-hoc earnings tables get the totals wrong the first time a clawback appears &mdash; reversed rows keep counting, trust evaporates.',
            'what' => '<code>CommissionStatement</code> is a controlled ledger over the engine&apos;s <code>RewardComputation</code> rows: level, recipient, tier, amount, and a <code>status</code> per row (paid / pending / held / reversed). Reversed rows strike through and are excluded from the folded paid total automatically. Rows carry stable <code>data-mlm-commission-row</code> handles.',
            'how' => 'Map your reward log (the sandbox uses fun-lab&apos;s EventLog with <code>source=mlm</code>) into <code>rows</code>, pass a <code>formatAmount</code> for your currency/points, done. New rewards prepend &mdash; the component recomputes the total from the controlled value.',
        ],

        'fancy-mlm-ui/rank-progress' => [
            'why' => 'Tier systems only motivate when the next tier feels reachable &mdash; members need to see exactly how far diamond is, in whatever unit the plan measures (team size, volume, active legs). Hand-rolled progress bars drift out of sync with the real qualification rules.',
            'what' => '<code>RankProgress</code> renders the current tier Badge, the next tier, and a progress bar of <code>value</code> against <code>target</code> with the remaining gap spelled out. At the top tier (no <code>nextTier</code>) it switches presentation. The bar exposes a stable <code>data-mlm-rank-pct</code> handle.',
            'how' => 'Compute <code>value</code>/<code>target</code> from your plan&apos;s thresholds (the sandbox derives them from downline size via <code>MlmProgram::rankProgress()</code>) and pass <code>tier</code>/<code>nextTier</code>/<code>unit</code>. Purely presentational &mdash; no internal state to fight.',
        ],

        'fancy-x-files-ui/robots-editor' => [
            'why' => 'robots.txt is tiny and high-stakes: one mis-ordered Allow leaks an admin path to a single bot group, and no one notices until it&apos;s indexed. Hand-editing the file (or hand-rolling a form) has no guardrail for that class of mistake.',
            'what' => '<code>RobotsEditor</code> is a controlled rule builder &mdash; per-group User-agent / Allow / Disallow / Crawl-delay plus sitemap URLs &mdash; with the <code>protect()</code> safety rail: protected paths are pinned Disallow for EVERY group, rendered as red chips, stripped from Allow lists, and flagged by <code>validateRobots</code> if they ever sneak back.',
            'how' => 'Hold the <code>RobotsModel</code> in state, render the editor beside <code>&lt;XFilePreview kind="robots"&gt;</code>, and persist the model to your backend (<code>particle-academy/fancy-x-files</code> renders the identical file server-side). List private paths in <code>protectedPaths</code> and the rail does the rest.',
        ],

        'fancy-x-files-ui/security-txt-editor' => [
            'why' => 'RFC 9116 security.txt has two hard rules teams routinely break: Contact is mandatory and Expires must be in the future. An expired file is worse than none &mdash; researchers assume the channel is dead.',
            'what' => '<code>SecurityTxtEditor</code> edits the full RFC surface (Contact list, Expires date input, Encryption / Acknowledgments / Preferred-Languages / Canonical / Policy / Hiring) with <code>validateSecurityTxt</code> surfacing violations inline as you type.',
            'how' => 'Controlled <code>value</code> + <code>onChange</code> over a <code>SecurityTxtModel</code>; pair with <code>&lt;XFilePreview kind="securityTxt"&gt;</code> and serve the rendered text at <code>/.well-known/security.txt</code> via the fancy-x-files backend.',
        ],

        'fancy-x-files-ui/llms-txt-editor' => [
            'why' => 'llms.txt is your site&apos;s curated map for AI assistants &mdash; leave it to chance and LLMs summarize your marketing page instead of your docs. Writing the Markdown by hand drifts as sections move.',
            'what' => '<code>LlmsTxtEditor</code> edits the llms.txt structure directly: title, blockquote summary, free-form details, and repeatable link sections (title / URL / notes per link). The paired preview renders the exact Markdown document.',
            'how' => 'Controlled model in state, editor + preview side by side, persist on save. The fancy-x-files backend serves it at <code>/llms.txt</code>; agents get the same JSON model over MCP if you expose it.',
        ],

        'fancy-x-files-ui/humans-txt-editor' => [
            'why' => 'humans.txt is the one well-known file that&apos;s pure credit &mdash; who built the thing. It goes stale because editing a text file on a server is friction nobody prioritizes.',
            'what' => '<code>HumansTxtEditor</code> edits team entries (role / name / contact), the Site colophon section, and thanks &mdash; a two-minute admin surface instead of an SSH session.',
            'how' => 'Controlled <code>HumansTxtModel</code> + <code>onChange</code>, preview beside it, persist. Served at <code>/humans.txt</code> by the backend package.',
        ],

        'fancy-x-files-ui/sitemap-editor' => [
            'why' => 'For small sites a generated sitemap is overkill and a hand-written one rots. What&apos;s missing is a middle path: a form that guarantees valid XML with sane changefreq / priority values.',
            'what' => '<code>SitemapEditor</code> edits a flat URL set &mdash; loc, lastmod, changefreq, priority per entry &mdash; with <code>validateSitemap</code> catching malformed locs and out-of-range priorities before they ship.',
            'how' => 'Controlled <code>SitemapModel</code>, preview beside it, persist. For dynamic routes keep generating server-side; this editor is for the curated set (the sandbox admin combines both).',
        ],

        'fancy-x-files-ui/agents-editor' => [
            'why' => 'robots.txt governs crawlers; nothing governs ACTING agents &mdash; the assistants that click, fill, and buy on your site. An explicit register beats guessing which bots you meant to allow.',
            'what' => '<code>AgentsEditor</code> edits the /AGENTS register: per-agent id, display name, homepage, allow/deny policy, and a permitted-scope line, plus a policy contact. The preview shows the JSON register agents fetch.',
            'how' => 'Controlled <code>AgentsModel</code>, preview beside it, persist via the backend. Pairs naturally with agent-integrations &mdash; the register says who may connect; the bridges say what they can do.',
        ],

        'fancy-x-files-ui/x-file-preview' => [
            'why' => 'A form that edits a file you can&apos;t see is a trust gap &mdash; the whole point of these files is their exact on-disk bytes.',
            'what' => '<code>XFilePreview</code> renders the REAL text/XML for any kind + model, using the same render logic as the fancy-x-files PHP / Node packages &mdash; what you see is what ships. Filename header comes from <code>X_FILE_META</code>.',
            'how' => 'Drop it next to any editor with the same model: <code>&lt;XFilePreview kind="robots" model={model} /&gt;</code>. Read-only; no state of its own.',
        ],

        'fancy-x-files-ui/x-files-manager' => [
            'why' => 'Six well-known files means six editors, six previews, six routes &mdash; unless something composes them. Admins want one screen: tabs, edit, see the file, save.',
            'what' => '<code>XFilesManager</code> is the compound surface: a tab per file kind, each wiring its editor beside its live preview over ONE aggregate <code>XFilesModel</code> (<code>value</code> + <code>onChange</code>). Absent kinds get an Add affordance; <code>kinds</code> / <code>activeKind</code> restrict and control the tabs.',
            'how' => 'Hold the aggregate model, render <code>&lt;XFilesManager value onChange /&gt;</code>, persist on save &mdash; the sandbox&apos;s /admin/well-known-files page is exactly this component over the fancy-x-files backend.',
        ],

        'fancy-cms-ui/cms-editor' => [
            'why' => 'Page builders usually fuse the edit surface, the document format, and the renderer into one proprietary blob &mdash; so content is trapped, and the moment an agent should co-author a page you&apos;re reverse-engineering contentEditable DOM. The Stages model splits those concerns, but it needs an editing surface that speaks ops, not innerHTML.',
            'what' => '<code>Editor</code> is the three-pane WYSIWYG over a Stages <code>PageDoc</code>: a layers tree (drag to reorder/reparent), a live canvas with selection overlay and drag-to-move, and a contextual inspector, plus undo/redo. Uncontrolled-with-notify (<code>defaultValue</code> + <code>onChange</code>) &mdash; every mutation from any pane is ONE <code>PageOp</code> through the pure <code>reduce()</code> spine, so human drags, agent tool calls, undo, and future collab all share a single code path.',
            'how' => 'Load your document, render <code>&lt;Editor defaultValue={doc} onChange={persist} /&gt;</code>, and store the emitted <code>PageDoc</code> JSON. Publishing is rendering that same JSON with <code>CmsPage</code> (React) or the <code>particle-academy/fancy-cms</code> PHP renderer &mdash; there is no export step; the doc IS the format.',
        ],

        'fancy-cms-ui/cms-page' => [
            'why' => 'A CMS that stores HTML strings can&apos;t re-render responsively, can&apos;t bind live data, and can&apos;t be edited structurally by an agent. Storing a node tree only pays off if rendering it is deterministic &mdash; same doc, same bytes, on every runtime that hosts it.',
            'what' => '<code>CmsPage</code> renders a <code>PageDoc</code>: sections in order, nodes through an extensible element registry (heading / text / button / image / stack / grid / &hellip;), with the compiled document CSS injected via <code>&lt;style data-cms-styles&gt;</code>. The emitter is deterministic and the <code>particle-academy/fancy-cms</code> PHP package mirrors it byte-for-byte. Any node prop can be a <code>{ $bind: "path" }</code> binding resolved against the <code>data</code> context, including repeaters over bound arrays.',
            'how' => 'Fetch the doc JSON your Editor saved, render <code>&lt;CmsPage doc={doc} data={pageData} /&gt;</code>. Pass a custom <code>registry</code> to add or restyle element types; set <code>includeStyles={false}</code> when the host has already injected the styles (e.g. server-rendered by fancy-cms with React hydrating the islands).',
        ],

        'fancy-cms-ui/cms-region' => [
            'why' => 'Whole-page CMS is the easy case; real apps want ONE editable band inside an otherwise hand-coded screen &mdash; a promo strip, a help panel, a hero. Re-rendering the full document for that (or iframing a page) is the wrong altitude.',
            'what' => '<code>CmsRegion</code> renders a single subtree of a <code>PageDoc</code>: pass <code>root</code> (any node id) and it renders that node plus its descendants with the same element registry and injected styles as <code>CmsPage</code>. Stable node ids make every region individually addressable &mdash; by your code and by agents.',
            'how' => 'Keep one doc for a surface group, then drop <code>&lt;CmsRegion doc={doc} root="promo-band" /&gt;</code> wherever the region belongs. Same <code>registry</code> / <code>includeStyles</code> knobs as <code>CmsPage</code>; an edit made in the Editor shows up everywhere the subtree is mounted.',
        ],
    ];

    /**
     * Generated Why/What/How entries, loaded once from a JSON sidecar and
     * cached for the request. Hand-curated {@see ENTRIES} always win on a key
     * collision — the generated file only fills the gaps.
     *
     * @var array<string, array{why: string, what: string, how: string}>|null
     */
    private static ?array $generated = null;

    /** @return array{why: string, what: string, how: string}|null */
    public static function find(string $packageSlug, string $componentSlug): ?array
    {
        $key = "$packageSlug/$componentSlug";

        return self::ENTRIES[$key] ?? self::generated()[$key] ?? null;
    }

    /**
     * Lazily load + cache the generated entries from the JSON sidecar.
     *
     * @return array<string, array{why: string, what: string, how: string}>
     */
    private static function generated(): array
    {
        if (self::$generated !== null) {
            return self::$generated;
        }

        $path = resource_path('data/component-context.json');
        if (! is_file($path)) {
            return self::$generated = [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return self::$generated = is_array($decoded) ? $decoded : [];
    }
}
