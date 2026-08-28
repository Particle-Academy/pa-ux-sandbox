import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const DEEP_RESEARCH_KIND = "@particle-academy/deep_research";

export const deepResearchKind: NodeKindDefinition = {
  name: DEEP_RESEARCH_KIND,
  aliases: ["deep_research"],
  sideEffects: "idempotent",
  category: "ai",
  label: "Deep Research",
  description: "Run a long-form, cited research task through the host's research provider.",
  icon: "⌕",
  accent: "#06b6d4",
  inputs: [{ id: "in", label: "context" }],
  outputs: [{ id: "out", label: "research" }],
  outputShape: [
    { path: "answer", type: "string", description: "The synthesized research report." },
    { path: "citations", type: "array", description: "Normalized sources cited by the report." },
    { path: "provider", type: "string", description: "Provider that completed the task." },
    { path: "model", type: "string", description: "Model that completed the task." },
    { path: "usage", type: "object", description: "Provider-normalized usage metadata, when available." },
  ],
  configSchema: [
    { key: "query", label: "Research question", type: "textarea", rows: 4, required: true, placeholder: "What should be investigated and synthesized?" },
    { key: "instructions", label: "Instructions", type: "textarea", rows: 3, placeholder: "Prioritize primary sources and explain disagreements." },
    { key: "depth", label: "Depth", type: "select", default: "deep", options: [
      { value: "quick", label: "Quick" }, { value: "standard", label: "Standard" }, { value: "deep", label: "Deep" }
    ] },
    { key: "maxSources", label: "Maximum sources", type: "number", default: 8 },
    { key: "includeContext", label: "Include incoming context", type: "switch", default: true },
    { key: "provider", label: "Provider", type: "text", placeholder: "perplexity" },
    { key: "model", label: "Model", type: "text", placeholder: "sonar-deep-research" },
    { key: "credential", label: "Credential reference", type: "text", description: "Resolved by the host; never store a raw API key here." },
  ],
  defaultConfig: { depth: "deep", maxSources: 8, includeContext: true },
};
