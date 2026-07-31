// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";
import { uiEffectKind } from "../../../../resources/flow-nodes/ui-effect/ui/kind";
import { uiEffectExecutor } from "../../../../resources/flow-nodes/ui-effect/js/executor";
import { registerUiEffectHost } from "../../../../resources/flow-nodes/ui-effect/js/host";
import type { UiEffect } from "../../../../resources/flow-nodes/ui-effect/js/types";

/**
 * The manifest's golden fixtures, run against the real executor.
 *
 * The node's own behaviour is what these pin: which port fires, what value goes
 * downstream, and which misconfigurations are rejected outright rather than
 * quietly doing nothing. Applying the effect is the host's job, so the host
 * here just records — the DOM one is exercised for real in `dom.test.ts`.
 */

registerNodeKind(uiEffectKind);

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "resources/flow-nodes/ui-effect/fancy-flow.node.json"), "utf8"),
) as { kind: string; fixtures: string };

const file = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")), "utf8")) as FixtureFile;

describe("golden fixtures", () => {
  const applied: UiEffect[] = [];
  let release = () => {};

  // Registered in beforeAll, not in the describe body: the body runs during
  // COLLECTION, so registering-and-releasing there leaves no host installed by
  // the time a case runs — and jsdom's document means the DOM host silently
  // takes over and fails on targets no fixture ever put in the page.
  beforeAll(() => {
    release = registerUiEffectHost({ apply: (effect) => void applied.push(effect) });
  });

  afterAll(() => release());

  it("declares fixtures for the kind the manifest claims", () => {
    expect(file.kind).toBe(manifest.kind);
  });

  it("passes every case", async () => {
    const result = await runFixtures(file, uiEffectExecutor);

    // Name the failures. "3 of 9 failed" sends you fixture-hunting; the case
    // names and messages are the whole diagnostic.
    expect(result.failures.map((f) => `${f.case}: ${f.message}`)).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(file.cases.length);
  });

  it("reached the host for every case that should have applied something", () => {
    // The cases that expect an error must NOT have reached the host — a node
    // that validates after applying has already changed the page.
    const applying = file.cases.filter((c) => !("error" in (c.expect ?? {})));
    expect(applied.length).toBe(applying.length);
  });
});
