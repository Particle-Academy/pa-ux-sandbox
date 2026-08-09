import type { PageDoc } from "@particle-academy/fancy-cms-ui";

/**
 * `/starter-kits/{slug}/cms` — the SECOND surface authored through the CMS, and
 * the one that actually tests the document model.
 *
 * `home-seed.ts` proves the CMS can HOST a page: six of its seven roots are
 * whole-section islands that re-render the exact components `Pages/Home.tsx`
 * already exports. That is pixel-perfect by construction and says almost nothing
 * about whether the Stages model can express a page, because the model is only
 * carrying wrappers.
 *
 * This page inverts that ratio deliberately. Everything except the live kit
 * preview is a real CMS primitive — `heading`, `text`, `richtext`, `card`,
 * `frame` — and every kit-specific value arrives through a `{ $bind }` rather
 * than being written into the document. So the same document renders all eight
 * starter kits, and the only island is the one thing that genuinely is one: an
 * interactive React demo.
 *
 * It is also structurally unlike Home — a detail page with a shallow tree and
 * bound leaves, rather than a long scroll of independent sections — which is the
 * point of picking a second surface at all. A model validated only against the
 * page it was designed for has not been validated.
 *
 * ## Shape
 *
 * There is no `sections[]`. Top-level order is the roots' fractional `order`
 * keys, like every other sibling group — the change that landed in
 * `fancy-cms-ui` 0.5.0. This document was authored in the new shape, so it never
 * needs migrating; `home-seed.ts` is the one that came through the migration.
 */
export const starterKitDoc: PageDoc = {
  id: "starter-kit",
  seq: 0,
  meta: { title: "Starter Kit", slug: "/starter-kits", scrollMode: "smooth" },
  theme: { name: "default" },
  breakpoints: ["base", "md", "lg"],
  nodes: {
    // ── Header: title, badge, blurb, provenance link ────────────────────────
    header: {
      id: "header",
      type: "frame",
      parent: null,
      order: "a",
      className: "mt-3 mb-6 min-w-0",
      props: {},
      style: { base: {} },
    },
    crumbs: {
      id: "crumbs",
      type: "richtext",
      parent: "header",
      order: "a",
      className: "mb-3 text-sm text-zinc-500",
      props: { html: { $bind: "crumbsHtml" } },
      style: { base: {} },
    },
    "title-row": {
      id: "title-row",
      type: "richtext",
      parent: "header",
      order: "b",
      className: "flex flex-wrap items-center gap-2",
      props: { html: { $bind: "titleHtml" } },
      style: { base: {} },
    },
    blurb: {
      id: "blurb",
      type: "text",
      parent: "header",
      order: "c",
      className: "mt-2 max-w-3xl text-zinc-600 dark:text-zinc-300",
      props: { content: { $bind: "kit.blurb" } },
      style: { base: {} },
    },
    download: {
      id: "download",
      type: "richtext",
      parent: "header",
      order: "e",
      className: "mt-4",
      props: { html: { $bind: "downloadHtml" } },
      style: { base: {} },
    },
    "built-with": {
      id: "built-with",
      type: "richtext",
      parent: "header",
      order: "d",
      className: "mt-2 font-mono text-xs text-zinc-500",
      props: { html: { $bind: "builtWithHtml" } },
      style: { base: {} },
    },

    // ── Install card ────────────────────────────────────────────────────────
    install: {
      id: "install",
      type: "card",
      parent: null,
      order: "b",
      className: "mb-6",
      props: {},
      style: { base: {} },
    },
    "install-label": {
      id: "install-label",
      type: "text",
      parent: "install",
      order: "a",
      className: "text-xs font-semibold uppercase tracking-wider text-zinc-500",
      props: { content: "Get it locally" },
      style: { base: {} },
    },
    // The one-liner is a `code` primitive rather than an island: it is text, and
    // the CMS already renders code. Only the copy BUTTON needs behaviour, and it
    // lives in the island below.
    "install-cmd": {
      id: "install-cmd",
      type: "code",
      parent: "install",
      order: "b",
      className: "mt-1",
      props: { content: { $bind: "installCommand" } },
      style: { base: {} },
    },
    "install-copy": {
      id: "install-copy",
      type: "kit-copy-button",
      parent: "install",
      order: "c",
      island: true,
      props: {},
      style: { base: {} },
    },
    "install-note": {
      id: "install-note",
      type: "richtext",
      parent: "install",
      order: "d",
      className: "mt-2 text-xs text-zinc-500",
      props: { html: { $bind: "installNoteHtml" } },
      style: { base: {} },
    },

    // ── The live kit preview — genuinely interactive, correctly an island ────
    demo: {
      id: "demo",
      type: "kit-demo",
      parent: null,
      order: "c",
      island: true,
      props: {},
      style: { base: {} },
    },
  },
};
