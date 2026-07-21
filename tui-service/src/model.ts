import type { Catalogue, CatalogueComponent, Family } from "./catalogue.js";

/**
 * The docs TUI's pure navigation model.
 *
 * `reduce(catalogue, state, key)` is the whole interaction: no React, no Ink, no
 * network. The server runs it, renders the resulting state, and hands both back
 * to the browser — which stores the state and returns it with the next key.
 * Keeping it pure is what lets the browser be a dumb terminal and the server
 * hold no session.
 *
 * Three panes, matching how the /packages page reads top-down:
 *   home   — the Hero + the family constellation, grouped by theme
 *   family — one family's components, previewable ones marked and first
 *   detail — one component: its facts, and a live terminal preview if it has one
 */

export type Pane = "home" | "family" | "detail";

export type DocsState = {
  pane: Pane;
  /** Index into the flat family list (home + family panes). */
  familyIndex: number;
  /** Index into the selected family's components (family + detail panes). */
  componentIndex: number;
  /** Scroll offset within the detail view. */
  detailOffset: number;
  /** Active search query, applied on the home pane across all components. */
  search: string;
  /** Whether keystrokes are being typed into the search box. */
  searching: boolean;
};

export const initialState: DocsState = {
  pane: "home",
  familyIndex: 0,
  componentIndex: 0,
  detailOffset: 0,
  search: "",
  searching: false,
};

export type Key =
  | { type: "up" } | { type: "down" } | { type: "left" } | { type: "right" }
  | { type: "enter" } | { type: "escape" } | { type: "backspace" }
  | { type: "pageUp" } | { type: "pageDown" }
  | { type: "char"; value: string };

/** A side effect the browser performs; the reducer never performs it itself. */
export type Effect = { type: "open"; url: string } | { type: "quit" };

export type Reduction = { state: DocsState; effects: Effect[] };

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, Math.max(0, max)));

/** Families narrowed by the active search (matches component name/title). */
export function visibleFamilies(cat: Catalogue, state: DocsState): Family[] {
  const q = state.search.trim().toLowerCase();
  if (!q) return cat.families;

  return cat.families
    .map((family) => ({
      ...family,
      components: family.components.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.title ?? "").toLowerCase().includes(q),
      ),
    }))
    .filter((family) => family.components.length > 0);
}

export function selectedFamily(cat: Catalogue, state: DocsState): Family | null {
  return visibleFamilies(cat, state)[state.familyIndex] ?? null;
}

export function selectedComponent(cat: Catalogue, state: DocsState): CatalogueComponent | null {
  const family = selectedFamily(cat, state);
  return family?.components[state.componentIndex] ?? null;
}

/**
 * Advance the browser. Returns the next state plus any effects the browser
 * should run (open a URL, quit back to the HTML view).
 */
export function reduce(cat: Catalogue, state: DocsState, key: Key): Reduction {
  const none = (next: DocsState): Reduction => ({ state: next, effects: [] });

  // Search mode swallows most keys so typing "q" does not quit mid-query.
  if (state.searching) {
    if (key.type === "escape") return none({ ...state, searching: false, search: "", familyIndex: 0 });
    if (key.type === "enter") return none({ ...state, searching: false });
    if (key.type === "backspace") return none({ ...state, search: state.search.slice(0, -1), familyIndex: 0 });
    if (key.type === "char") return none({ ...state, search: state.search + key.value, familyIndex: 0 });
    return none(state);
  }

  if (key.type === "char") {
    switch (key.value) {
      case "q": return { state, effects: [{ type: "quit" }] };
      case "/": return none({ ...state, searching: true, search: "", familyIndex: 0 });
      case "j": return reduce(cat, state, { type: "down" });
      case "k": return reduce(cat, state, { type: "up" });
      case "o": {
        const component = selectedComponent(cat, state);
        const url = component ? componentHref(component) : null;
        return url ? { state, effects: [{ type: "open", url }] } : none(state);
      }
      default: return none(state);
    }
  }

  const families = visibleFamilies(cat, state);
  const family = families[state.familyIndex] ?? null;

  switch (key.type) {
    case "up":
      if (state.pane === "detail") return none({ ...state, detailOffset: Math.max(0, state.detailOffset - 1) });
      if (state.pane === "family") return none({ ...state, componentIndex: clamp(state.componentIndex - 1, (family?.components.length ?? 1) - 1) });
      return none({ ...state, familyIndex: clamp(state.familyIndex - 1, families.length - 1) });

    case "down":
      if (state.pane === "detail") return none({ ...state, detailOffset: state.detailOffset + 1 });
      if (state.pane === "family") return none({ ...state, componentIndex: clamp(state.componentIndex + 1, (family?.components.length ?? 1) - 1) });
      return none({ ...state, familyIndex: clamp(state.familyIndex + 1, families.length - 1) });

    case "pageUp":
      return none({ ...state, detailOffset: Math.max(0, state.detailOffset - 10) });
    case "pageDown":
      return none({ ...state, detailOffset: state.detailOffset + 10 });

    case "right":
    case "enter":
      if (state.pane === "home") return none({ ...state, pane: "family", componentIndex: 0 });
      if (state.pane === "family") return none({ ...state, pane: "detail", detailOffset: 0 });
      return none(state);

    case "left":
    case "escape":
      if (state.pane === "detail") return none({ ...state, pane: "family" });
      if (state.pane === "family") return none({ ...state, pane: "home", search: "", componentIndex: 0 });
      // Escape at the root leaves the TUI — the way out of a full-screen app.
      return { state, effects: [{ type: "quit" }] };

    default:
      return none(state);
  }
}

/**
 * Web docs URL for a component, or null when it has no page.
 *
 * Only ~half the registry has a `/packages/{family}/{name}` page. Rather than
 * construct a link that 404s, this points at the family page, which always
 * exists — the same resolve-to-a-real-route rule the old TUI followed.
 */
export function componentHref(component: CatalogueComponent): string | null {
  return component.family ? `/packages/family/${component.family}` : null;
}
