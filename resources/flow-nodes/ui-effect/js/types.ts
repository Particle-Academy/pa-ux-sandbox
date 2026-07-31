/**
 * What a `ui_effect` node asks a host to do, and the seam that does it.
 *
 * The node never touches the DOM. It resolves an *intent* — target, operation,
 * value — and hands it to a host-registered {@link UiEffectHost}. That is the
 * same "shuttle, not an engine" arrangement fancy-flow uses for LLM clients,
 * and it is what lets the identical graph run in a browser (apply directly), on
 * a queue worker (forward over a relay to whichever browser is attached), or in
 * a test (record and assert).
 */

/** Everything a host needs to carry out one effect. */
export type UiEffect = {
  /**
   * What to affect: a **stable handle** the host published, or `page` for the
   * document root.
   *
   * Handles, not selectors, are the contract — the Fancy component contract is
   * explicit that agents never guess DOM. The bundled DOM host resolves a
   * handle to `[data-fancy-id="…"]` first and only falls back to treating the
   * string as a selector, so a host with a real handle registry stays authoritative.
   */
  target: string;
  op: UiEffectOp;
  /**
   * The class list, CSS value, or custom-property value — what `op` is setting.
   * Unused by `remove-class` when `name` already identifies the class.
   */
  value: string;
  /**
   * The second identifier some ops need: the custom property for `set-var`
   * (`--fa-accent`), the CSS property for `set-style` (`box-shadow`), or the
   * class being replaced by `replace-class`.
   */
  name?: string;
  /**
   * Revert this effect after N milliseconds. `0` (the default) means permanent.
   *
   * This is what makes a pulse or a flash fall out of the same four ops rather
   * than needing their own: add a class, revert it in 1200ms.
   */
  durationMs?: number;
};

export type UiEffectOp =
  /** Add class(es) in `value`. Idempotent. */
  | "add-class"
  /** Remove class(es) in `value`. Idempotent. */
  | "remove-class"
  /** Toggle class(es) in `value`. **Not** idempotent — see the README on retries. */
  | "toggle-class"
  /** Swap `name` for `value`. Idempotent once applied. */
  | "replace-class"
  /** Set custom property `name` to `value` (theme changes live here). */
  | "set-var"
  /** Set inline style property `name` to `value`. */
  | "set-style";

/**
 * The host capability.
 *
 * Deliberately one method. A narrow contract is one a host satisfies in a few
 * lines over anything — the DOM, a relay frame, a React store, a test spy — and
 * it keeps the node honest about what it is: a message, not a mutation.
 */
export type UiEffectHost = {
  /**
   * Carry out the effect.
   *
   * Throw if it cannot be carried out. Do NOT swallow a missing target: a run
   * that reports success having styled nothing is the failure this node's whole
   * design is arranged against.
   */
  apply: (effect: UiEffect) => void | Promise<void>;
  /**
   * Resolve a stable handle to whatever this host styles. Optional — a host
   * with its own registry implements it; the DOM host's default is
   * `[data-fancy-id]` then a selector fallback.
   */
  resolve?: (handle: string) => unknown;
};
