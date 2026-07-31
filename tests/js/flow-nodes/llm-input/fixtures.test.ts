import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";
import { llmInputKind } from "../../../../resources/flow-nodes/llm-input/ui/kind";
import { llmInputExecutor } from "../../../../resources/flow-nodes/llm-input/js/executor";
import { registerLlmFormHost } from "../../../../resources/flow-nodes/llm-input/js/host";
import type { LlmFormRequest, LlmFormResult } from "../../../../resources/flow-nodes/llm-input/js/types";

/**
 * The manifest's golden fixtures, run against the real executor.
 *
 * What these pin is the node's contract with everything around it: that the
 * pause detail is the same shape the builtin `user_input` emits (so a host
 * renders a generated form with nothing new wired), and that every way a model
 * can return plausible-but-unusable JSON is rejected BEFORE the run parks — not
 * discovered after a person has already filled the form in.
 */

registerNodeKind(llmInputKind);

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "resources/flow-nodes/llm-input/fancy-flow.node.json"), "utf8"),
) as { kind: string; fixtures: string };

const file = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")), "utf8")) as FixtureFile;

/**
 * A host that answers from the purpose string.
 *
 * Keyed on the purpose rather than a call counter so the cases stay independent
 * — a counter makes every case depend on the order of the ones before it, and
 * reordering the file then breaks tests that have nothing to do with the change.
 */
const REPLIES: Record<string, LlmFormResult> = {
  "return nothing": { fields: [] },
  "return duplicates": {
    fields: [
      { key: "reason", label: "Why", type: "text" },
      { key: "reason", label: "Why again", type: "text" },
    ],
  },
  "return three": {
    fields: [
      { key: "a", label: "A", type: "text" },
      { key: "b", label: "B", type: "text" },
      { key: "c", label: "C", type: "text" },
    ],
  },
};

const DEFAULT: LlmFormResult = {
  title: "Refund details",
  fields: [
    { key: "reason", label: "Why the refund", type: "textarea", required: true },
    { key: "amount", label: "Amount", type: "number" },
  ],
};

describe("golden fixtures", () => {
  const asked: LlmFormRequest[] = [];
  let release = () => {};

  // Registered in beforeAll, not in the describe body: the body runs during
  // COLLECTION, so registering there leaves no host installed by the time a
  // case runs — and the executor would then fail every case with "no form host".
  beforeAll(() => {
    release = registerLlmFormHost({
      generate: (request) => {
        asked.push(request);

        return REPLIES[request.purpose] ?? DEFAULT;
      },
    });
  });

  afterAll(() => release());

  it("declares fixtures for the kind the manifest claims", () => {
    expect(file.kind).toBe(manifest.kind);
  });

  it("passes every case", async () => {
    const result = await runFixtures(file, llmInputExecutor);

    // Name the failures. "3 of 8 failed" sends you fixture-hunting; the case
    // names and messages are the whole diagnostic.
    expect(result.failures.map((f) => `${f.case}: ${f.message}`)).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(file.cases.length);
  });

  it("never reached the model for a case rejected on config alone", () => {
    // The missing-purpose case must fail before spending a token. A node that
    // validates after the call bills the consumer for its own bug.
    expect(asked.some((r) => r.purpose === "")).toBe(false);
  });
});
