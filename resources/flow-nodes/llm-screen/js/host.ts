import type { LlmScreenHost } from "./types";

/**
 * The registered host, if any.
 *
 * A module-level singleton, matching how fancy-flow core registers its own
 * capabilities (`registerLlmClient`) and how the `ui_effect` node registers its
 * host. Same shape, same explicitness, same one-line registration.
 */
let host: LlmScreenHost | null = null;

/** Install the host that generates and presents screens. Returns an unregister function. */
export function registerLlmScreenHost(next: LlmScreenHost): () => void {
  host = next;

  return () => {
    if (host === next) host = null;
  };
}

export function getLlmScreenHost(): LlmScreenHost | null {
  return host;
}
