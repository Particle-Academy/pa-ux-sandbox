import type { DeepResearchHost } from "./types";

let host: DeepResearchHost | null = null;

export function registerDeepResearchHost(next: DeepResearchHost): () => void {
  host = next;
  return () => { if (host === next) host = null; };
}

export function getDeepResearchHost(): DeepResearchHost | null { return host; }
