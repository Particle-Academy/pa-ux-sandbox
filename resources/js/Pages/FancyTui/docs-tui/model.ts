/**
 * Fancy Docs TUI — the pure model.
 *
 * A human-browseable version of the Fancy registry MCP: the same catalogue the
 * MCP exposes to agents (`list_components` / `get_component` / search), driven
 * by a keyboard instead of tool calls.
 *
 * Kept free of React and xterm so the whole thing is testable as
 * `(state, key) -> state` and `state -> ANSI string`. The terminal component is
 * only a display and a keystroke source.
 */

export type RegistryItem = {
  name: string;
  title?: string;
  description?: string;
  package: string;
  type?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{ path: string }>;
  /**
   * The item's web docs URL, resolved SERVER-side against the routes that
   * actually exist — the component's own page, else its package page, else
   * null. Never construct this client-side: only ~half the registry has a
   * `/packages/{pkg}/{name}` page and the rest 404.
   */
  href?: string | null;
};

/** A captured Ink frame, from fancy-tui's `npm run showcase`. */
export type CapturedFrame = { slug: string; name: string; group: string; source: string; frame: string };

export type Pane = "packages" | "components" | "detail";

export type DocsState = {
  pane: Pane;
  packageIndex: number;
  componentIndex: number;
  /** Scroll offset within the detail view. */
  detailOffset: number;
  search: string;
  searching: boolean;
  /** Set when the user asks to open a component's web page. */
  pendingOpen: string | null;
};

export const initialState: DocsState = {
  pane: "packages",
  packageIndex: 0,
  componentIndex: 0,
  detailOffset: 0,
  search: "",
  searching: false,
  pendingOpen: null,
};

/** The package whose components render INSIDE the terminal. */
export const TUI_PACKAGE = "fancy-tui";

export type Catalogue = {
  packages: Array<{ name: string; count: number }>;
  byPackage: Map<string, RegistryItem[]>;
};

/** Group the flat registry into the two-pane shape, packages by size then name. */
export function buildCatalogue(items: RegistryItem[]): Catalogue {
  const byPackage = new Map<string, RegistryItem[]>();
  for (const item of items) {
    const list = byPackage.get(item.package) ?? [];
    list.push(item);
    byPackage.set(item.package, list);
  }
  for (const list of byPackage.values()) list.sort((a, b) => a.name.localeCompare(b.name));

  const packages = [...byPackage.entries()]
    .map(([name, list]) => ({ name, count: list.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { packages, byPackage };
}

/** Components of the selected package, narrowed by the active search. */
export function visibleComponents(cat: Catalogue, state: DocsState): RegistryItem[] {
  const pkg = cat.packages[state.packageIndex];
  const list = pkg ? (cat.byPackage.get(pkg.name) ?? []) : [];
  const q = state.search.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (i) => i.name.toLowerCase().includes(q) || (i.title ?? "").toLowerCase().includes(q),
  );
}

export function selectedComponent(cat: Catalogue, state: DocsState): RegistryItem | null {
  return visibleComponents(cat, state)[state.componentIndex] ?? null;
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, Math.max(0, max)));

/** Decoded keystroke. The terminal hands us raw bytes; this is the vocabulary. */
export type Key =
  | { type: "up" } | { type: "down" } | { type: "left" } | { type: "right" }
  | { type: "enter" } | { type: "escape" } | { type: "backspace" }
  | { type: "pageUp" } | { type: "pageDown" }
  | { type: "char"; value: string };

/** Translate raw xterm input into a key. */
export function decodeKey(data: string): Key | null {
  switch (data) {
    case "\x1b[A": return { type: "up" };
    case "\x1b[B": return { type: "down" };
    case "\x1b[C": return { type: "right" };
    case "\x1b[D": return { type: "left" };
    case "\x1b[5~": return { type: "pageUp" };
    case "\x1b[6~": return { type: "pageDown" };
    case "\r": case "\n": return { type: "enter" };
    case "\x1b": return { type: "escape" };
    case "\x7f": case "\b": return { type: "backspace" };
    default:
      // Printable single characters only — ignore stray escape sequences so an
      // unrecognised key never types garbage into the search box.
      if (data.length === 1 && data >= " " && data !== "\x7f") return { type: "char", value: data };
      return null;
  }
}

export type Reduction = { state: DocsState; quit?: boolean; open?: string };

/**
 * Advance the browser. Returns the next state plus any side effect the host
 * should perform (quit back to HTML, open a URL) rather than performing it —
 * keeps this function pure and testable.
 */
export function reduce(cat: Catalogue, state: DocsState, key: Key): Reduction {
  // Search mode swallows most keys so typing "q" doesn't quit mid-query.
  if (state.searching) {
    if (key.type === "escape") return { state: { ...state, searching: false, search: "" } };
    if (key.type === "enter") return { state: { ...state, searching: false, componentIndex: 0 } };
    if (key.type === "backspace") {
      return { state: { ...state, search: state.search.slice(0, -1), componentIndex: 0 } };
    }
    if (key.type === "char") {
      return { state: { ...state, search: state.search + key.value, componentIndex: 0 } };
    }
    return { state };
  }

  if (key.type === "char") {
    switch (key.value) {
      case "q": return { state, quit: true };
      case "/": return { state: { ...state, searching: true, search: "" } };
      case "j": return reduce(cat, state, { type: "down" });
      case "k": return reduce(cat, state, { type: "up" });
      case "o": {
        const item = selectedComponent(cat, state);
        const href = item ? componentHref(item) : null;
        return href ? { state, open: href } : { state };
      }
      default: return { state };
    }
  }

  const components = visibleComponents(cat, state);

  switch (key.type) {
    case "up":
      if (state.pane === "packages") {
        return { state: { ...state, packageIndex: clamp(state.packageIndex - 1, cat.packages.length - 1), componentIndex: 0 } };
      }
      if (state.pane === "components") {
        return { state: { ...state, componentIndex: clamp(state.componentIndex - 1, components.length - 1) } };
      }
      return { state: { ...state, detailOffset: Math.max(0, state.detailOffset - 1) } };

    case "down":
      if (state.pane === "packages") {
        return { state: { ...state, packageIndex: clamp(state.packageIndex + 1, cat.packages.length - 1), componentIndex: 0 } };
      }
      if (state.pane === "components") {
        return { state: { ...state, componentIndex: clamp(state.componentIndex + 1, components.length - 1) } };
      }
      return { state: { ...state, detailOffset: state.detailOffset + 1 } };

    case "pageUp":
      return { state: { ...state, detailOffset: Math.max(0, state.detailOffset - 10) } };
    case "pageDown":
      return { state: { ...state, detailOffset: state.detailOffset + 10 } };

    case "right":
    case "enter":
      if (state.pane === "packages") return { state: { ...state, pane: "components", componentIndex: 0 } };
      if (state.pane === "components") return { state: { ...state, pane: "detail", detailOffset: 0 } };
      return { state };

    case "left":
    case "escape":
      if (state.pane === "detail") return { state: { ...state, pane: "components" } };
      if (state.pane === "components") return { state: { ...state, pane: "packages", search: "" } };
      // Escape at the root leaves the TUI — the way out of a full-screen app.
      return { state, quit: true };

    default:
      return { state };
  }
}

/**
 * Web docs URL for a registry item, or null when it has no page. The server
 * resolves this against the real route table; we never invent one here.
 */
export function componentHref(item: RegistryItem): string | null {
  return item.href ?? null;
}
