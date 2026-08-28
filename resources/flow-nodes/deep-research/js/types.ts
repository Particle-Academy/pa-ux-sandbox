export type ResearchDepth = "quick" | "standard" | "deep";

export type DeepResearchRequest = {
  query: string;
  instructions?: string;
  context?: unknown;
  depth?: ResearchDepth;
  maxSources?: number;
  provider?: string;
  model?: string;
  credential?: string;
};

export type ResearchCitation = { url: string; title?: string; excerpt?: string; publishedAt?: string };

export type DeepResearchResult = {
  answer: string;
  citations: ResearchCitation[];
  provider?: string;
  model?: string;
  usage?: Record<string, number>;
  metadata?: Record<string, unknown>;
};

/** Provider-neutral seam. A Prism/Perplexity adapter can implement this without becoming a node dependency. */
export type DeepResearchHost = {
  research: (request: DeepResearchRequest) => Promise<DeepResearchResult> | DeepResearchResult;
};
