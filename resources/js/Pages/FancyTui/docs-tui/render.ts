/**
 * Fancy Docs TUI — the pure renderer.
 *
 * `render(cat, state, frames, size)` turns the model's state into one full
 * screen of ANSI. No React, no xterm, no DOM: the React layer only pipes the
 * string into `<Terminal output={...} />` and pipes keystrokes back.
 *
 * Every frame is exactly `size.rows` lines and its LAST line is padded to the
 * full width, which matters more than it looks: `<Terminal>` diffs `output`
 * against the previous value and appends when the new string EXTENDS the old
 * one. A constant-width trailer guarantees no frame is ever a prefix of
 * another, so every repaint is a clean reset + rewrite rather than an append.
 */

import { CLEAR, bold, clip, cyan, dim, green, grey, inverse, pad, violet, width, wrap, yellow } from "./ansi";
import { TUI_PACKAGE, type Catalogue, type CapturedFrame, type DocsState, type RegistryItem, selectedComponent, visibleComponents } from "./model";

export type Size = { cols: number; rows: number };

/** The width fancy-tui captures its showcase frames at. */
export const FRAME_COLUMNS = 68;

const HEADER_ROWS = 2;
const FOOTER_ROWS = 2;
/** Below this the two-pane browser collapses to a single column. */
const NARROW_COLS = 62;

const LEGEND = "↑↓ move   → enter   ← back   / search   o open   q quit";

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Index captured frames by every name they might be known as. Frame slugs are
 * kebab-case fancy-tui component names (`status-bar`); registry names carry a
 * `tui-` prefix (`tui-status-bar`), so both spellings are keyed.
 */
export function buildFrameIndex(frames: CapturedFrame[]): Map<string, CapturedFrame> {
  const index = new Map<string, CapturedFrame>();
  for (const frame of frames) {
    for (const alias of [frame.slug, frame.name, `tui-${frame.slug}`]) {
      const key = normalise(alias);
      if (key && !index.has(key)) {
        index.set(key, frame);
      }
    }
  }
  return index;
}

/** The captured frame for a registry item, if fancy-tui ships one. */
export function findFrame(index: Map<string, CapturedFrame>, item: RegistryItem | null): CapturedFrame | null {
  if (!item || item.package !== TUI_PACKAGE) {
    return null;
  }
  for (const alias of [item.name, item.name.replace(/^tui-/, ""), item.title ?? ""]) {
    const found = index.get(normalise(alias));
    if (found) {
      return found;
    }
  }
  return null;
}

/** Scroll a list so `index` stays inside a `size`-row window. */
export function windowFor(index: number, total: number, size: number): { start: number; end: number } {
  if (size <= 0 || total <= 0) {
    return { start: 0, end: 0 };
  }
  const start = Math.max(0, Math.min(index - Math.floor(size / 2), total - size));
  return { start: Math.max(0, start), end: Math.min(total, Math.max(0, start) + size) };
}

/** The screen shown while the catalogue is still being fetched (or failed). */
export function renderLoading(size: Size, error?: string | null): string {
  const lines = [
    "",
    `  ${violet(bold("Fancy Docs TUI"))}`,
    "",
    error
      ? `  ${yellow("Could not load the registry:")} ${error}`
      : `  ${dim("Loading the Fancy registry…")}`,
    "",
    `  ${dim("q  quit")}`,
  ];
  return frameOf(lines, size);
}

export function render(
  cat: Catalogue,
  state: DocsState,
  frames: Map<string, CapturedFrame>,
  size: Size,
): string {
  const cols = Math.max(20, size.cols);
  const bodyRows = Math.max(1, size.rows - HEADER_ROWS - FOOTER_ROWS);

  const body =
    state.pane === "detail"
      ? renderDetail(cat, state, frames, cols, bodyRows)
      : renderBrowser(cat, state, cols, bodyRows);

  return frameOf([...renderHeader(cat, cols), ...body, ...renderFooter(state)], size);
}

/** Pad/truncate to exactly `rows` lines and terminate with a full-width line. */
function frameOf(lines: string[], size: Size): string {
  const rows = Math.max(3, size.rows);
  const cols = Math.max(20, size.cols);
  const out = lines.slice(0, rows).map((line) => clip(line, cols));
  while (out.length < rows) {
    out.push("");
  }
  // Full-width final line: keeps a shorter frame from being a strict prefix of
  // a longer one, so `<Terminal>` always repaints instead of appending.
  out[rows - 1] = pad(out[rows - 1], cols);
  return CLEAR + out.join("\r\n");
}

function renderHeader(cat: Catalogue, cols: number): string[] {
  const total = [...cat.byPackage.values()].reduce((sum, list) => sum + list.length, 0);
  const left = ` ${violet(bold("Fancy Docs TUI"))} ${dim("· the registry, by keyboard")}`;
  const right = `${cyan(String(total))} components ${dim("in")} ${cyan(String(cat.packages.length))} packages `;
  const gap = Math.max(1, cols - width(left) - width(right));

  return [left + " ".repeat(gap) + right, grey("─".repeat(cols))];
}

function renderFooter(state: DocsState): string[] {
  const status = state.searching
    ? `${yellow("/")}${state.search}${inverse(" ")}`
    : state.search
      ? dim(`filter: ${state.search}   (esc clears)`)
      : dim(paneHint(state.pane));

  return [` ${status}`, ` ${dim(LEGEND)}`];
}

function paneHint(pane: DocsState["pane"]): string {
  if (pane === "packages") return "Pick a package, then → to browse its components.";
  if (pane === "components") return "→ opens the component; o opens its web docs.";
  return "↑↓ / PgUp / PgDn scrolls   ← back to the list";
}

function renderBrowser(cat: Catalogue, state: DocsState, cols: number, rows: number): string[] {
  const components = visibleComponents(cat, state);
  const narrow = cols < NARROW_COLS;
  const leftWidth = narrow ? cols - 2 : Math.max(18, Math.min(34, Math.round(cols * 0.32)));
  const rightWidth = cols - leftWidth - 5;

  const showPackages = !narrow || state.pane === "packages";
  const showComponents = !narrow || state.pane === "components";

  const packageRows = showPackages ? packageLines(cat, state, leftWidth, rows) : [];
  const componentRows = showComponents
    ? componentLines(components, state, narrow ? leftWidth : rightWidth, rows)
    : [];

  if (narrow) {
    return (showPackages ? packageRows : componentRows).map((line) => ` ${line}`);
  }

  const lines: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    const left = pad(packageRows[row] ?? "", leftWidth);
    const right = componentRows[row] ?? "";
    lines.push(` ${left} ${grey("│")} ${right}`);
  }
  return lines;
}

function packageLines(cat: Catalogue, state: DocsState, size: number, rows: number): string[] {
  const active = state.pane === "packages";
  const head = active ? cyan(bold("PACKAGES")) : dim("PACKAGES");
  const listRows = Math.max(1, rows - 2);
  const { start, end } = windowFor(state.packageIndex, cat.packages.length, listRows);

  const lines = [head, ""];
  for (let i = start; i < end; i += 1) {
    const pkg = cat.packages[i];
    const count = String(pkg.count);
    const label = pad(clip(pkg.name, size - count.length - 4), size - count.length - 3);
    // Rows are built two columns narrow to leave room for the "▸ " gutter.
    const row = `${label}${dim(count)} `;
    lines.push(i === state.packageIndex ? selection(row, size - 2, active) : `  ${row}`);
  }
  if (end < cat.packages.length) {
    lines[lines.length - 1] = dim(`  … ${cat.packages.length - end} more`);
  }
  return lines;
}

function componentLines(items: RegistryItem[], state: DocsState, size: number, rows: number): string[] {
  const active = state.pane === "components";
  const pkgLabel = active ? cyan(bold("COMPONENTS")) : dim("COMPONENTS");
  const listRows = Math.max(1, rows - 2);
  const lines = [pkgLabel, ""];

  if (items.length === 0) {
    lines.push(dim(state.search ? `  nothing matches “${state.search}”` : "  (no components)"));
    return lines;
  }

  const { start, end } = windowFor(state.componentIndex, items.length, listRows);
  for (let i = start; i < end; i += 1) {
    const item = items[i];
    const title = item.title || item.name;
    const row = pad(`${title} ${dim(item.name)}`, size - 2);
    lines.push(i === state.componentIndex ? selection(row, size - 2, active) : `  ${row}`);
  }
  if (end < items.length) {
    lines[lines.length - 1] = dim(`  … ${items.length - end} more`);
  }
  return lines;
}

/** The selected row: inverted when its pane has focus, a marker when it doesn't. */
function selection(row: string, size: number, active: boolean): string {
  return active ? `${violet("▸")} ${inverse(pad(row, size))}` : `${dim("▸")} ${row}`;
}

function renderDetail(
  cat: Catalogue,
  state: DocsState,
  frames: Map<string, CapturedFrame>,
  cols: number,
  rows: number,
): string[] {
  const item = selectedComponent(cat, state);
  if (!item) {
    return [dim("  Nothing selected.")];
  }

  const inner = Math.max(10, cols - 4);
  const lines = detailLines(item, findFrame(frames, item), inner);
  const offset = Math.max(0, Math.min(state.detailOffset, Math.max(0, lines.length - rows)));
  const page = lines.slice(offset, offset + rows).map((line) => `  ${line}`);

  while (page.length < rows) {
    page.push("");
  }
  if (lines.length > rows) {
    const shown = Math.min(lines.length, offset + rows);
    page[rows - 1] = `  ${dim(`── ${shown}/${lines.length} lines ─ ↑↓ PgUp PgDn to scroll`)}`;
  }
  return page;
}

/** The full (unscrolled) detail body — exported so tests can read it directly. */
export function detailLines(item: RegistryItem, frame: CapturedFrame | null, inner: number): string[] {
  const lines: string[] = [];

  lines.push(violet(bold(item.title || item.name)));
  lines.push(`${cyan(item.package)} ${dim("·")} ${dim(item.name)} ${dim("·")} ${dim(item.type ?? "registry:ui")}`);
  lines.push("");

  if (item.description) {
    lines.push(...wrap(item.description, inner));
    lines.push("");
  }

  lines.push(...section("DEPENDENCIES", item.dependencies ?? [], inner));
  lines.push(...section("REGISTRY DEPS", item.registryDependencies ?? [], inner));

  const files = (item.files ?? []).map((file) => file.path);
  if (files.length) {
    lines.push(green(bold("FILES")));
    for (const path of files.slice(0, 24)) {
      lines.push(`  ${dim(path)}`);
    }
    if (files.length > 24) {
      lines.push(`  ${dim(`… and ${files.length - 24} more`)}`);
    }
    lines.push("");
  }

  if (frame) {
    // Not "live" — this is a recorded frame. The subtitle says so, but the
    // label shouldn't claim otherwise in the first place.
    lines.push(rule("rendered preview", inner));
    lines.push(dim(`captured from real Ink at ${FRAME_COLUMNS} columns`));
    lines.push("");
    lines.push(...frame.frame.split("\n"));
    lines.push("");
    if (frame.source) {
      lines.push(rule("source", inner));
      lines.push("");
      lines.push(...frame.source.split("\n").map((line) => dim(line)));
      lines.push("");
    }
  } else {
    lines.push(rule("preview", inner));
    lines.push("");
    if (item.package === TUI_PACKAGE) {
      lines.push(dim("No captured frame ships for this entry."));
    } else {
      lines.push(`${yellow("This component renders in a browser, not a terminal.")}`);
      lines.push("");
    }
    if (item.href) {
      lines.push(`${green(bold("  press o"))}  to open the web docs in a new tab`);
      lines.push(`  ${dim(item.href)}`);
    } else {
      lines.push(dim("  No web page for this entry yet."));
    }
    lines.push("");
  }

  return lines;
}

function section(label: string, values: string[], inner: number): string[] {
  if (!values.length) {
    return [];
  }
  return [green(bold(label)), ...wrap(values.join(", "), inner - 2).map((line) => `  ${line}`), ""];
}

function rule(label: string, inner: number): string {
  const text = `── ${label} `;
  return grey(text + "─".repeat(Math.max(0, inner - width(text))));
}
