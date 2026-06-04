/**
 * Seeded CMS document for the **full Home page** — the sandbox-as-CMS demo.
 * Read-only: edits in EditMode are in-memory, never persisted.
 *
 * Two strata, mirroring the registry:
 *  - The **hero** is modelled fine-grained (section › grid › left › eyebrow /
 *    heading / lede / cta / meta + card) so its text is inline-editable and its
 *    nodes are individually animatable.
 *  - The six downstream sections are single **island nodes** (`section-*`) that
 *    re-render the exact exported Home components — interactive / data-driven, so
 *    correctly islands, and pixel-identical by construction.
 *
 * The chrome reuses the live stylesheet via `className` passthrough; the lede is
 * an editable native text node; bespoke inline hero bits are islands (see
 * ../cms/registry.tsx).
 */
import type { PageDoc } from "@particle-academy/fancy-cms-ui";
import { PACKAGE_CODE, VENDOR_CODE, MCP_CODE } from "../Pages/Home";
import { HERO_CODE_HTML } from "./registry";

const HERO_STATUS_HTML =
  '<div style="padding:12px 14px;border-top:1px solid var(--border-1);display:flex;align-items:center;gap:10px;font-size:12px;background:var(--bg-1)">' +
  '<span style="width:6px;height:6px;border-radius:999px;background:var(--emerald-500);box-shadow:0 0 0 3px color-mix(in oklch, var(--emerald-500) 22%, transparent)"></span>' +
  '<span style="font-family:var(--font-mono);color:var(--fg-3)">agent · fancy-ui.mcp</span>' +
  '<span style="color:var(--fg-2);flex:1;text-align:right;font-family:var(--font-mono)">artboard_add_piece ✓</span></div>';

const qsCard = (num: string, alt: boolean, title: string, sub: string, code: string) =>
  `<div class="qs-head"><span class="qs-num${alt ? " qs-num-alt" : ""}">${num}</span><div><div class="qs-title">${title}</div><div class="qs-sub">${sub}</div></div></div><div class="codeblock">${code}</div>`;

/** A top-level island section: one bare `[data-cms]` wrapper around a Home section. */
function islandSection(id: string, type: string, order: string) {
  return { id, type, parent: null as string | null, order, props: {}, island: true, style: { base: {} } };
}

export const homeDoc: PageDoc = {
  id: "home",
  seq: 0,
  meta: { title: "Home", slug: "/", scrollMode: "smooth" },
  theme: { name: "default" },
  breakpoints: ["base", "md", "lg"],
  sections: ["hero", "sec-packages", "sec-human-plus", "sec-components", "sec-philosophy", "sec-quickstart", "sec-explore"],
  nodes: {
    // ── Hero (fine-grained, editable + animatable) ──────────────────────────
    hero: { id: "hero", type: "section", parent: null, order: "a", className: "hero", props: {}, style: { base: {} } },
    grid: { id: "grid", type: "frame", parent: "hero", order: "a", className: "container hero-grid", props: {}, style: { base: {} } },
    left: { id: "left", type: "frame", parent: "grid", order: "a", props: {}, style: { base: {} } },

    eyebrow: { id: "eyebrow", type: "richtext", parent: "left", order: "a", className: "eyebrow-row", props: { html: '<span class="dot"></span><span>v0.2 · Particle Academy</span>' }, style: { base: {} } },
    heading: { id: "heading", type: "richtext", parent: "left", order: "b", className: "display", props: { html: 'Components for the surfaces where <span class="gradient-text">humans and agents work together</span>.' }, style: { base: {} } },
    lede: {
      id: "lede",
      type: "text",
      parent: "left",
      order: "c",
      className: "lede",
      props: {
        content:
          "Fancy UI is a constellation of small React and PHP packages built on one premise: agents are first-class participants in the products they help build. Every interactive surface ships an MCP bridge, so an embedded agent drives it through stable handles — never DOM scraping, never Playwright.",
      },
      style: { base: {} },
    },
    cta: { id: "cta", type: "richtext", parent: "left", order: "d", className: "hero-cta", props: { html: '<a class="btn btn-primary" href="/docs">Install the kit</a><a class="btn btn-ghost" href="/agent-playground">See Human+ in action</a>' }, style: { base: {} } },
    meta: { id: "meta", type: "richtext", parent: "left", order: "e", className: "hero-meta", props: { html: '<span class="meta-item">12 UI packages</span><span class="meta-item">MIT licensed</span><span class="meta-item"><code>tailwindcss &gt;= 4</code></span><span class="meta-item">React 19 · PHP 8.4</span>' }, style: { base: {} } },

    card: { id: "card", type: "device", parent: "grid", order: "b", className: "hero-card", props: { variant: "browser", url: "resources/js/Pages/DesignReview.tsx", meta: "UTF-8 · TSX" }, style: { base: {} } },
    "card-code": { id: "card-code", type: "richtext", parent: "card", order: "a", className: "codeblock", props: { html: HERO_CODE_HTML }, style: { base: {} } },
    "card-status": { id: "card-status", type: "richtext", parent: "card", order: "b", props: { html: HERO_STATUS_HTML }, style: { base: {} } },

    // ── Downstream sections (whole-section islands) ─────────────────────────
    // ── Packages (de-hardcoded → CMS Elements: a repeater bound to `packages`
    //    + a companions repeater bound to `companions`) ───────────────────────
    "sec-packages": { id: "sec-packages", type: "section", parent: null as string | null, order: "b", className: "section", props: {}, style: { base: {} } },
    "pk-container": { id: "pk-container", type: "frame", parent: "sec-packages", order: "a", className: "container", props: {}, style: { base: {} } },
    "pk-eyebrow": { id: "pk-eyebrow", type: "richtext", parent: "pk-container", order: "a", className: "eyebrow-row", props: { html: "<span>The family</span>" }, style: { base: {} } },
    "pk-title": { id: "pk-title", type: "heading", parent: "pk-container", order: "b", className: "section-title", props: { content: { $bind: "packagesTitle" } }, style: { base: {} } },
    "pk-sub": { id: "pk-sub", type: "text", parent: "pk-container", order: "c", className: "section-sub", props: { content: "Fancy UI is not a monolith. Each layer ships independently to npm and composes with the rest. Pick the ones you need — most apps reach for two or three." }, style: { base: {} } },
    "pk-rep": { id: "pk-rep", type: "repeater", parent: "pk-container", order: "d", className: "pkg-grid", props: { items: { $bind: "packages" } }, style: { base: {} } },
    "pk-card": { id: "pk-card", type: "frame", parent: "pk-rep", order: "a", className: "pkg-card", props: {}, style: { base: {} } },
    "pk-head": { id: "pk-head", type: "frame", parent: "pk-card", order: "a", className: "pkg-head", props: {}, style: { base: {} } },
    "pk-glyph": { id: "pk-glyph", type: "text", parent: "pk-head", order: "a", className: "pkg-glyph", props: { content: { $bind: "item.glyph" } }, style: { base: {} } },
    "pk-name": { id: "pk-name", type: "text", parent: "pk-head", order: "b", className: "pkg-name", props: { content: { $bind: "item.name" } }, style: { base: {} } },
    "pk-ver": { id: "pk-ver", type: "text", parent: "pk-head", order: "c", className: "pkg-ver", props: { content: { $bind: "item.verLabel" } }, style: { base: {} } },
    "pk-desc": { id: "pk-desc", type: "text", parent: "pk-card", order: "b", className: "pkg-desc", props: { content: { $bind: "item.tagline" } }, style: { base: {} } },
    "pk-tags": { id: "pk-tags", type: "frame", parent: "pk-card", order: "c", className: "pkg-tags", props: {}, style: { base: {} } },
    "pk-tag1": { id: "pk-tag1", type: "text", parent: "pk-tags", order: "a", className: "pkg-tag", props: { content: { $bind: "item.langLabel" } }, style: { base: {} } },
    "pk-tag2": { id: "pk-tag2", type: "text", parent: "pk-tags", order: "b", className: "pkg-tag", props: { content: { $bind: "item.kind" } }, style: { base: {} } },
    "pk-companions": { id: "pk-companions", type: "frame", parent: "pk-container", order: "e", className: "companions", props: {}, style: { base: {} } },
    "pk-comp-label": { id: "pk-comp-label", type: "text", parent: "pk-companions", order: "a", className: "companions-label", props: { content: "+ Composer companions" }, style: { base: {} } },
    "pk-comp-note": { id: "pk-comp-note", type: "text", parent: "pk-companions", order: "b", className: "companions-note", props: { content: "PHP packages — the agentic document writers and the sandbox's own Laravel infra:" }, style: { base: {} } },
    "pk-comp-rep": { id: "pk-comp-rep", type: "repeater", parent: "pk-companions", order: "c", props: { items: { $bind: "companions" } }, style: { base: {} } },
    "pk-comp-item": { id: "pk-comp-item", type: "link", parent: "pk-comp-rep", order: "a", className: "companion-item", props: { content: { $bind: "item.composer" }, href: { $bind: "item.url" } }, style: { base: {} } },
    "sec-human-plus": islandSection("sec-human-plus", "section-human-plus", "c"),
    // The components preview is the one box that stays React (live demos) — but
    // now via the generic `jsx` Element (escape hatch), not a bespoke island.
    "sec-components": { id: "sec-components", type: "jsx", parent: null as string | null, order: "d", props: { island: "components-preview" }, style: { base: {} } },
    // ── Philosophy (de-hardcoded → CMS Elements; cards are richtext so the
    //    tag-targeted CSS `.philos h4 / p / .pill` matches exactly) ───────────
    "sec-philosophy": { id: "sec-philosophy", type: "section", parent: null as string | null, order: "e", className: "section", props: {}, style: { base: {} } },
    "ph-container": { id: "ph-container", type: "frame", parent: "sec-philosophy", order: "a", className: "container", props: {}, style: { base: {} } },
    "ph-eyebrow": { id: "ph-eyebrow", type: "richtext", parent: "ph-container", order: "a", className: "eyebrow-row", props: { html: "<span>The Human+ contract</span>" }, style: { base: {} } },
    "ph-title": { id: "ph-title", type: "heading", parent: "ph-container", order: "b", className: "section-title", props: { content: "Three rules every component lives by." }, style: { base: {} } },
    "ph-sub": { id: "ph-sub", type: "text", parent: "ph-container", order: "c", className: "section-sub", props: { content: "Purely visual primitives owe only a great authoring surface. Anything stateful or interactive owes both — authorable and inhabitable." }, style: { base: {} } },
    "ph-grid": { id: "ph-grid", type: "frame", parent: "ph-container", order: "d", className: "philos-grid", props: {}, style: { base: {} } },
    "ph-c1": { id: "ph-c1", type: "richtext", parent: "ph-grid", order: "a", className: "philos", props: { html: '<span class="num">01</span><h4>Controlled, not captive</h4><p>Anything an agent might read or write lives in value + onChange — no internal-only state. State is the contract; the UI just renders it.</p><div class="pill-row"><span class="pill">value</span><span class="pill">onChange</span><span class="pill">json-friendly</span></div>' }, style: { base: {} } },
    "ph-c2": { id: "ph-c2", type: "richtext", parent: "ph-grid", order: "b", className: "philos", props: { html: '<span class="num">02</span><h4>Agents are participants</h4><p>Every interactive surface exposes a register&lt;Surface&gt;Bridge that maps stable handles to MCP tools. Agents drive the component itself, not a DOM scrape of it.</p><div class="pill-row"><span class="pill">mcp</span><span class="pill">stable handles</span><span class="pill">presence</span></div>' }, style: { base: {} } },
    "ph-c3": { id: "ph-c3", type: "richtext", parent: "ph-grid", order: "c", className: "philos", props: { html: '<span class="num">03</span><h4>Transport-agnostic</h4><p>The kit ships zero networking. Your app wires the realtime + relay layer; mutations broadcast AgentActivity so presence, undo, and coaching compose for free.</p><div class="pill-row"><span class="pill">relay</span><span class="pill">AgentActivity</span><span class="pill">undo</span></div>' }, style: { base: {} } },
    // ── Quick start (de-hardcoded → CMS Elements; code blocks are richtext
    //    reusing the exported highlight HTML so they stay pixel-identical) ─────
    "sec-quickstart": { id: "sec-quickstart", type: "section", parent: null as string | null, order: "f", className: "section", props: {}, style: { base: {} } },
    "qs-container": { id: "qs-container", type: "frame", parent: "sec-quickstart", order: "a", className: "container", props: {}, style: { base: {} } },
    "qs-eyebrow": { id: "qs-eyebrow", type: "richtext", parent: "qs-container", order: "a", className: "eyebrow-row", props: { html: "<span>Quick start</span>" }, style: { base: {} } },
    "qs-title": { id: "qs-title", type: "heading", parent: "qs-container", order: "b", className: "section-title", props: { content: "Two ways to add a component." }, style: { base: {} } },
    "qs-sub": { id: "qs-sub", type: "richtext", parent: "qs-container", order: "c", className: "section-sub", props: { html: 'Install the npm package and import it, or vendor the source with <code>npx fancy-ui add</code> and own the code. PHP packages install with <code>composer require</code>. Either way, point your coding agent at our hosted registry MCP — <code>ui.particle.academy/mcp</code> — and it\'ll search the registry and return the exact install commands.' }, style: { base: {} } },
    "qs-grid": { id: "qs-grid", type: "frame", parent: "qs-container", order: "d", className: "qs-grid", props: {}, style: { base: {} } },
    "qs-card1": { id: "qs-card1", type: "richtext", parent: "qs-grid", order: "a", className: "qs-card", props: { html: qsCard("1", false, "Install the package", "npm / pnpm / yarn — version-pinned.", PACKAGE_CODE) }, style: { base: {} } },
    "qs-card2": { id: "qs-card2", type: "richtext", parent: "qs-grid", order: "b", className: "qs-card", props: { html: qsCard("2", true, "Vendor the source", "Copy it in — yours to read and edit.", VENDOR_CODE) }, style: { base: {} } },
    "qs-mcp": { id: "qs-mcp", type: "richtext", parent: "qs-container", order: "e", className: "qs-mcp", props: { html: `<div class="qs-mcp-copy"><div class="qs-mcp-title"><span class="qs-mcp-dot"></span> Or let your agent do it</div><p>On <strong>Claude Code</strong>, install the <a href="https://github.com/Particle-Academy/fancy-ui-plugin" target="_blank" rel="noopener noreferrer">Fancy UI plugin</a> — one command wires up the hosted registry MCP <em>and</em> bundles skills for finding components and building Human+ UX apps. Other IDEs (Cursor, VS Code) drop the raw server into their config. Your agent then calls <code>list-components</code>, <code>search-components</code>, and <code>install-instructions</code> against the live registry — no guessing from memory.</p></div><div class="codeblock">${MCP_CODE}</div>` }, style: { base: {} } },
    "qs-cta": { id: "qs-cta", type: "richtext", parent: "qs-container", order: "f", props: { html: '<a class="btn btn-primary" href="/docs">Read the docs</a> <a class="btn btn-ghost" href="/agent-playground">Try it in the Playground</a> <a class="btn btn-ghost" href="https://github.com/Particle-Academy" target="_blank" rel="noopener noreferrer">View on GitHub</a>' }, style: { base: { gap: { value: 10, unit: "px" } } } },
    // ── Explore (de-hardcoded → CMS Elements + a repeater bound to `explore`) ─
    "sec-explore": { id: "sec-explore", type: "section", parent: null as string | null, order: "g", className: "section", props: {}, style: { base: {} } },
    "ex-container": { id: "ex-container", type: "frame", parent: "sec-explore", order: "a", className: "container", props: {}, style: { base: {} } },
    "ex-eyebrow": { id: "ex-eyebrow", type: "frame", parent: "ex-container", order: "a", className: "eyebrow-row", props: {}, style: { base: {} } },
    "ex-eyebrow-t": { id: "ex-eyebrow-t", type: "text", parent: "ex-eyebrow", order: "a", props: { content: "Explore the site" }, style: { base: {} } },
    "ex-title": { id: "ex-title", type: "heading", parent: "ex-container", order: "b", className: "section-title", props: { content: "More to poke at." }, style: { base: {} } },
    "ex-rep": { id: "ex-rep", type: "repeater", parent: "ex-container", order: "c", className: "pkg-grid", props: { items: { $bind: "explore" } }, style: { base: { gap: { value: 16, unit: "px" } } } },
    "ex-card": { id: "ex-card", type: "frame", parent: "ex-rep", order: "a", className: "pkg-card", props: {}, style: { base: {} } },
    "ex-card-head": { id: "ex-card-head", type: "frame", parent: "ex-card", order: "a", className: "pkg-head", props: {}, style: { base: {} } },
    "ex-card-name": { id: "ex-card-name", type: "text", parent: "ex-card-head", order: "a", className: "pkg-name", props: { content: { $bind: "item.title" } }, style: { base: {} } },
    "ex-card-ver": { id: "ex-card-ver", type: "text", parent: "ex-card-head", order: "b", className: "pkg-ver", props: { content: { $bind: "item.tag" } }, style: { base: {} } },
    "ex-card-desc": { id: "ex-card-desc", type: "text", parent: "ex-card", order: "b", className: "pkg-desc", props: { content: { $bind: "item.body" } }, style: { base: {} } },
  },
};

/** Back-compat alias (the demo previously seeded only the hero). */
export const homeHeroDoc = homeDoc;
