import { initialState, type DocsState, type Pane } from "./model.js";

/**
 * Sanitise state that arrived from the browser.
 *
 * The server holds no session, so navigation state round-trips through the
 * client — which means it is UNTRUSTED on the way back in. A caller could send
 * anything: a pane that is not a pane, a NaN index, a megabyte search string.
 *
 * None of it can reach a shell or a query here (the reducer only navigates an
 * in-memory catalogue), so the risk is a crash or a wasted render, not an
 * injection. Still, coerce every field to a sane value and cap the search
 * length, so a malformed post degrades to the home screen rather than throwing.
 */

const PANES: Pane[] = ["home", "family", "detail"];
const MAX_SEARCH = 100;

function intOr(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

export function sanitizeState(input: unknown): DocsState {
  if (typeof input !== "object" || input === null) return initialState;
  const s = input as Record<string, unknown>;

  const pane: Pane = PANES.includes(s.pane as Pane) ? (s.pane as Pane) : "home";
  const search = typeof s.search === "string" ? s.search.slice(0, MAX_SEARCH) : "";

  return {
    pane,
    familyIndex: intOr(s.familyIndex, 0),
    componentIndex: intOr(s.componentIndex, 0),
    detailOffset: intOr(s.detailOffset, 0),
    search,
    searching: s.searching === true,
  };
}

/** Clamp a requested terminal size to something renderable. */
export function sanitizeSize(cols: unknown, rows: unknown): { cols: number; rows: number } {
  const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.trunc(n))) : fallback;
  };
  return { cols: clamp(cols, 20, 400, 100), rows: clamp(rows, 8, 200, 32) };
}
