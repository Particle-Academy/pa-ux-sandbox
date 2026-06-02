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
    "sec-components": islandSection("sec-components", "section-components", "d"),
    "sec-philosophy": islandSection("sec-philosophy", "section-philosophy", "e"),
    "sec-quickstart": islandSection("sec-quickstart", "section-quickstart", "f"),
    "sec-explore": islandSection("sec-explore", "section-explore", "g"),
  },
};

/** Back-compat alias (the demo previously seeded only the hero). */
export const homeHeroDoc = homeDoc;
