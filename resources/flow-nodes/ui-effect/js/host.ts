import type { UiEffectHost } from "./types";

/**
 * The registered host, if any.
 *
 * A module-level singleton, matching how fancy-flow core registers its own
 * capabilities (`registerLlmClient`). A package cannot extend core's capability
 * union, so it owns its own — same shape, same explicitness, same one-line
 * registration.
 */
let host: UiEffectHost | null = null;

/**
 * Install the host that carries out UI effects. Returns an unregister function.
 *
 * ```ts
 * // A browser app — one line, and every ui_effect node works.
 * registerUiEffectHost(createDomUiEffectHost());
 *
 * // A queue worker with a browser attached over a relay.
 * registerUiEffectHost({ apply: (effect) => relay.send("ui_effect", effect) });
 * ```
 */
export function registerUiEffectHost(next: UiEffectHost): () => void {
  host = next;

  return () => {
    if (host === next) host = null;
  };
}

export function getUiEffectHost(): UiEffectHost | null {
  return host;
}
