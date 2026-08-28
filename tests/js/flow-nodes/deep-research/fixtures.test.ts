import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";
import { deepResearchKind } from "../../../../resources/flow-nodes/deep-research/ui/kind";
import { deepResearchExecutor } from "../../../../resources/flow-nodes/deep-research/js/executor";
import { registerDeepResearchHost } from "../../../../resources/flow-nodes/deep-research/js/host";
import type { DeepResearchRequest } from "../../../../resources/flow-nodes/deep-research/js/types";

registerNodeKind(deepResearchKind);

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes/deep-research/fancy-flow.node.json"), "utf8"));
const fixtures = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")), "utf8")) as FixtureFile;

describe("deep research golden fixtures", () => {
  const requests: DeepResearchRequest[] = [];
  let release = () => {};

  beforeAll(() => {
    release = registerDeepResearchHost({
      research: async (request) => {
        requests.push(request);
        return {
          answer: `Researched: ${request.query}`,
          citations: [{ url: "https://example.test/source", title: "Primary source", excerpt: "Evidence" }],
          provider: "perplexity",
          model: "sonar-deep-research",
          usage: { inputTokens: 12, outputTokens: 34 },
        };
      },
    });
  });

  afterAll(() => release());

  it("runs the shared contract fixtures", async () => {
    const result = await runFixtures(fixtures, deepResearchExecutor);
    expect(result.failures.map((failure) => `${failure.case}: ${failure.message}`)).toEqual([]);
  });

  it("passes provider-neutral controls and input context to the host", () => {
    expect(requests[0]).toMatchObject({ query: "How do durable workflows recover?", depth: "deep", maxSources: 8 });
    expect(requests[0]?.context).toEqual({ topic: "workflow engines" });
  });
});
