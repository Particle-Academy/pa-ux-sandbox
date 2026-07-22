/**
 * Sanitise the terminal size that arrived from the browser.
 *
 * The service holds no session's worth of trust in its inputs: the size
 * round-trips through the client and is UNTRUSTED on the way back in. None of it
 * can reach a shell or a query here, so the risk is a crash or a wasted render,
 * not an injection — but clamp it anyway so a malformed post degrades cleanly.
 */

/** Clamp a requested terminal size to something renderable. */
export function sanitizeSize(cols: unknown, rows: unknown): { cols: number; rows: number } {
  const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.trunc(n))) : fallback;
  };
  return { cols: clamp(cols, 20, 400, 100), rows: clamp(rows, 8, 200, 32) };
}
