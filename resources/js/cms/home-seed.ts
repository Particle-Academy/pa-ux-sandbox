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

    eyebrow: { id: "eyebrow", type: "hero-eyebrow", parent: "left", order: "a", className: "eyebrow-row", props: {}, style: { base: {} } },
    heading: { id: "heading", type: "hero-h1", parent: "left", order: "b", className: "display", props: {}, style: { base: {} } },
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
    cta: { id: "cta", type: "hero-cta", parent: "left", order: "d", className: "hero-cta", props: {}, style: { base: {} } },
    meta: { id: "meta", type: "hero-meta", parent: "left", order: "e", className: "hero-meta", props: { packages: 12 }, style: { base: {} } },

    card: { id: "card", type: "hero-card", parent: "grid", order: "b", className: "hero-card", props: {}, style: { base: {} } },

    // ── Downstream sections (whole-section islands) ─────────────────────────
    "sec-packages": islandSection("sec-packages", "section-packages", "b"),
    "sec-human-plus": islandSection("sec-human-plus", "section-human-plus", "c"),
    // The components preview is the one box that stays React (live demos) — but
    // now via the generic `jsx` Element (escape hatch), not a bespoke island.
    "sec-components": { id: "sec-components", type: "jsx", parent: null as string | null, order: "d", props: { island: "components-preview" }, style: { base: {} } },
    "sec-philosophy": islandSection("sec-philosophy", "section-philosophy", "e"),
    "sec-quickstart": islandSection("sec-quickstart", "section-quickstart", "f"),
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
