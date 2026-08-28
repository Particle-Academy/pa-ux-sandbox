import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { getDeepResearchHost } from "./host";
import type { ResearchDepth } from "./types";

export const deepResearchExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const query = String(config.query ?? "").trim();
  if (!query) throw new Error("deep_research: needs a `query` to investigate.");

  const host = getDeepResearchHost();
  if (!host) throw new Error("deep_research: no research host registered. Call registerDeepResearchHost() with a provider adapter.");

  const maxSources = Number(config.maxSources ?? 8);
  if (!Number.isInteger(maxSources) || maxSources < 1) throw new Error("deep_research: `maxSources` must be a positive integer.");

  ctx.emit({ type: "log", level: "info", nodeId: ctx.node.id, message: `Researching: ${query}` });
  const result = await host.research({
    query,
    instructions: optionalString(config.instructions),
    context: config.includeContext === false ? undefined : (ctx.inputs as any)?.in,
    depth: String(config.depth ?? "deep") as ResearchDepth,
    maxSources,
    provider: optionalString(config.provider),
    model: optionalString(config.model),
    credential: optionalString(config.credential),
  });

  const answer = String(result?.answer ?? "").trim();
  if (!answer) throw new Error("deep_research: the host returned no answer.");
  const citations = Array.isArray(result.citations) ? result.citations.filter((citation) => citation && typeof citation.url === "string" && citation.url.trim() !== "") : [];
  return { ...result, answer, citations };
};

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const resolved = String(value).trim();
  return resolved || undefined;
}
