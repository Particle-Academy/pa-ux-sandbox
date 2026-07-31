import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";
import { llmScreenKind } from "../../../../resources/flow-nodes/llm-screen/ui/kind";
import { llmScreenExecutor } from "../../../../resources/flow-nodes/llm-screen/js/executor";
import { registerLlmScreenHost } from "../../../../resources/flow-nodes/llm-screen/js/host";
import { checkSchema } from "../../../../resources/flow-nodes/llm-screen/js/schema";
import type { LlmScreenResult, ScreenSchema } from "../../../../resources/flow-nodes/llm-screen/js/types";

/**
 * The manifest's golden fixtures, run against the real executor.
 *
 * The case that earns this file is the unknown-component one. fancy-screens
 * renders an unregistered name as a visible placeholder — right for a developer
 * typing a schema, wrong for a workflow, where it means an error message is
 * delivered to a person while the run reports success. These fixtures pin that
 * it is a failed run instead.
 */

registerNodeKind(llmScreenKind);

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "resources/flow-nodes/llm-screen/fancy-flow.node.json"), "utf8"),
) as { kind: string; fixtures: string };

const file = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")), "utf8")) as FixtureFile;

const COMPONENTS = ["Card", "Text", "Stack"];

const nest = (depth: number): ScreenSchema =>
  depth === 0 ? { type: "Text", children: ["deep"] } : { type: "Stack", children: [nest(depth - 1)] };

/**
 * A host that answers from the purpose string.
 *
 * Keyed on purpose rather than a call counter so cases stay independent — a
 * counter makes every case depend on the order of the ones before it.
 */
const REPLIES: Record<string, LlmScreenResult> = {
  "use an unknown component": {
    schema: { type: "Card", children: [{ type: "DataGrid" }, { type: "DataGrid" }] },
  },
  "nest forever": { schema: nest(20) },
  "return junk": { schema: { children: [] } as unknown as ScreenSchema },
};

const DEFAULT: LlmScreenResult = {
  title: "Generated",
  schema: {
    type: "Card",
    props: { title: "Deploy summary" },
    children: [{ type: "Text", children: ["3 services moved."] }],
  },
};

describe("golden fixtures", () => {
  const presented: { screenId: string }[] = [];
  let release = () => {};

  // Registered in beforeAll, not in the describe body: the body runs during
  // COLLECTION, so registering there leaves no host installed by the time a
  // case runs, and every case fails with "no screen host".
  beforeAll(() => {
    release = registerLlmScreenHost({
      components: () => COMPONENTS,
      generate: (request) => REPLIES[request.purpose] ?? DEFAULT,
      present: (screen) => void presented.push({ screenId: screen.screenId }),
    });
  });

  afterAll(() => release());

  it("declares fixtures for the kind the manifest claims", () => {
    expect(file.kind).toBe(manifest.kind);
  });

  it("passes every case", async () => {
    const result = await runFixtures(file, llmScreenExecutor);

    // Name the failures. "3 of 9 failed" sends you fixture-hunting; the case
    // names and messages are the whole diagnostic.
    expect(result.failures.map((f) => `${f.case}: ${f.message}`)).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(file.cases.length);
  });

  it("presented only the screens that passed the check", () => {
    // A node that validates after presenting has already put the placeholder
    // on someone's screen — the exact outcome the check exists to prevent.
    const valid = file.cases.filter((c) => !("error" in (c.expect ?? {})));
    expect(presented.length).toBe(valid.length);
  });

  it("reports an unknown component once, not once per occurrence", () => {
    // The fixture's schema uses `DataGrid` twice. A model that gets a name
    // wrong usually uses it a dozen times, and a dozen identical lines buries
    // every other problem in the list.
    const problems = REPLIES["use an unknown component"].schema.children ?? [];
    expect(problems).toHaveLength(2);

    // Two occurrences, one report — plus the "registered components are" line.
    const reported = checkSchema(REPLIES["use an unknown component"].schema, COMPONENTS);
    expect(reported.filter((p) => p.includes('unknown component "DataGrid"'))).toHaveLength(1);
  });
});
