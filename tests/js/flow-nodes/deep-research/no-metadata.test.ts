import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { deepResearchKind } from "../../../../resources/flow-nodes/deep-research/ui/kind";
import { deepResearchExecutor } from "../../../../resources/flow-nodes/deep-research/js/executor";
import { registerDeepResearchHost } from "../../../../resources/flow-nodes/deep-research/js/host";
import type { DeepResearchRequest } from "../../../../resources/flow-nodes/deep-research/js/types";

// Perplexity's Agent API dropped `metadata`, and prism 0.141.0 rejects it before
// the call (Particle-Academy/prism#103). The node must not offer it, and a saved
// graph that still carries it must run without sending it.
describe("deep research never sends `metadata`", () => {
  let release = () => {};
  afterEach(() => release());

  it("offers no `metadata` field in the authoring schema", () => {
    const keys = (deepResearchKind.configSchema ?? []).map((field: any) => field.key);
    expect(keys).not.toContain("metadata");
    expect(keys).toEqual(["query", "instructions", "depth", "maxSources", "includeContext", "provider", "model", "credential"]);
    const manifest = readFileSync(resolve(process.cwd(), "resources/flow-nodes/deep-research/fancy-flow.node.json"), "utf8");
    expect(JSON.parse(manifest).configSchema).toBeUndefined();
  });

  it("runs a legacy graph carrying `metadata` and never forwards it", async () => {
    const requests: DeepResearchRequest[] = [];
    release = registerDeepResearchHost({
      research: (request) => {
        requests.push(request);
        return { answer: "ok", citations: [] };
      },
    });

    const ctx: any = {
      node: { id: "research", data: { config: { query: "Legacy graph", metadata: { source: "saved-graph" } } } },
      inputs: {},
      emit: () => {},
    };
    const result: any = await deepResearchExecutor(ctx);

    expect(result.answer).toBe("ok");
    expect(requests).toHaveLength(1);
    expect(requests[0]).not.toHaveProperty("metadata");
  });
});
