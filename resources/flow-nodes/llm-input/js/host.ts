import type { LlmFormHost } from "./types";

/**
 * The registered host, if any.
 *
 * A module-level singleton, matching how fancy-flow core registers its own
 * capabilities (`registerLlmClient`) and how the `ui_effect` node registers
 * its host. Same shape, same explicitness, same one-line registration.
 */
let host: LlmFormHost | null = null;

/** Install the host that generates forms. Returns an unregister function. */
export function registerLlmFormHost(next: LlmFormHost): () => void {
  host = next;

  return () => {
    if (host === next) host = null;
  };
}

export function getLlmFormHost(): LlmFormHost | null {
  return host;
}
