import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";

import { gitPrOpenKind } from "../../../../resources/flow-nodes/git-pr-open/ui/kind";
import { gitPrOpenExecutor } from "../../../../resources/flow-nodes/git-pr-open/js/executor";
import { registerGitHost } from "../../../../resources/flow-nodes/git-pr-open/js/provider";

import { gitPrListKind } from "../../../../resources/flow-nodes/git-pr-list/ui/kind";
import { gitPrListExecutor } from "../../../../resources/flow-nodes/git-pr-list/js/executor";
import { registerGitHost as registerListHost } from "../../../../resources/flow-nodes/git-pr-list/js/provider";

import { gitPrGetKind } from "../../../../resources/flow-nodes/git-pr-get/ui/kind";
import { gitPrGetExecutor } from "../../../../resources/flow-nodes/git-pr-get/js/executor";
import { registerGitHost as registerGetHost } from "../../../../resources/flow-nodes/git-pr-get/js/provider";

import { gitPrChecksKind } from "../../../../resources/flow-nodes/git-pr-checks/ui/kind";
import { gitPrChecksExecutor } from "../../../../resources/flow-nodes/git-pr-checks/js/executor";
import { registerGitHost as registerChecksHost } from "../../../../resources/flow-nodes/git-pr-checks/js/provider";

import { gitRepoKind } from "../../../../resources/flow-nodes/git-repo/ui/kind";
import { gitRepoExecutor } from "../../../../resources/flow-nodes/git-repo/js/executor";
import { registerGitHost as registerRepoHost } from "../../../../resources/flow-nodes/git-repo/js/provider";

import { gitPrCompareKind } from "../../../../resources/flow-nodes/git-pr-compare/ui/kind";
import { gitPrCompareExecutor } from "../../../../resources/flow-nodes/git-pr-compare/js/executor";
import { registerGitHost as registerCompareHost } from "../../../../resources/flow-nodes/git-pr-compare/js/provider";

/**
 * The PR-lifecycle nodes, against their golden fixtures.
 *
 * The provider is a deterministic fake rather than a mock of `fancy-git-js`:
 * these nodes are shuttles — they resolve config, call one provider method, and
 * route on the answer — so what is worth pinning is the routing and the
 * validation, not whether we can restate the provider's own interface.
 *
 * Each node's `provider.ts` is a separate module with its own registry, because
 * a vendored node is self-contained. So each host is registered separately;
 * sharing one would test a structure the consumer does not get.
 */

/** A provider whose answers are chosen by the fixture's config. */
const fakeProvider = {
  kind: "github",
  identify: () => null,
  repository: async () => ({
    provider: "github",
    owner: "a",
    name: "b",
    defaultBranch: "main",
    visibility: "public",
    webUrl: "https://example.test/a/b",
  }),

  createReview: async (_ref: unknown, input: any) => ({
    id: "1",
    number: 41,
    title: input.title,
    state: "open",
    webUrl: "https://example.test/pr/41",
    sourceBranch: input.sourceBranch,
    targetBranch: input.targetBranch,
    author: "fixture",
  }),

  listReviews: async (_ref: unknown, query: any) =>
    query?.state === "merged"
      ? { items: [] }
      : { items: [{ id: "1", number: 41, title: "t", state: "open", webUrl: "u", sourceBranch: "x", targetBranch: "main", author: "f" }] },

  getReview: async (_ref: unknown, number: number) => ({
    id: String(number),
    number,
    state: "open",
    title: "t",
    webUrl: `https://example.test/pr/${number}`,
    sourceBranch: "x",
    targetBranch: "main",
    author: "f",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }),

  checks: async (_ref: unknown, revision: string) =>
    ({
      "all-green": [{ id: "1", name: "ci", state: "success" }],
      "one-red": [{ id: "1", name: "ci", state: "success" }, { id: "2", name: "e2e", state: "failed" }],
      "still-running": [{ id: "1", name: "ci", state: "success" }, { id: "2", name: "e2e", state: "running" }],
      "no-ci": [],
    })[revision] ?? [],

  compare: async (_ref: unknown, _base: string, head: string) =>
    head === "identical"
      ? { aheadBy: 0, behindBy: 0, commits: [] }
      : { aheadBy: 3, behindBy: 0, commits: [] },
};

const host = { registry: { get: (kind: string) => (kind === "github" ? fakeProvider : undefined) } };

const NODES = [
  { dir: "git-pr-open", kind: gitPrOpenKind, executor: gitPrOpenExecutor, register: registerGitHost },
  { dir: "git-pr-list", kind: gitPrListKind, executor: gitPrListExecutor, register: registerListHost },
  { dir: "git-pr-get", kind: gitPrGetKind, executor: gitPrGetExecutor, register: registerGetHost },
  { dir: "git-pr-checks", kind: gitPrChecksKind, executor: gitPrChecksExecutor, register: registerChecksHost },
  { dir: "git-pr-compare", kind: gitPrCompareKind, executor: gitPrCompareExecutor, register: registerCompareHost },
  { dir: "git-repo", kind: gitRepoKind, executor: gitRepoExecutor, register: registerRepoHost },
];

for (const node of NODES) registerNodeKind(node.kind);

describe.each(NODES)("$dir", ({ dir, kind, executor, register }) => {
  const release: Array<() => void> = [];

  // beforeAll, not the describe body: the body runs during collection, so a
  // host registered there is gone by the time a case runs.
  beforeAll(() => release.push(register(host)));
  afterAll(() => release.forEach((fn) => fn()));

  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), "resources/flow-nodes", dir, "fancy-flow.node.json"), "utf8"),
  );
  const file = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")), "utf8")) as FixtureFile;

  it("declares the kind it registers", () => {
    expect(manifest.kind).toBe(kind.name);
    expect(manifest.aliases).toEqual(kind.aliases);
  });

  it("declares every port its fixtures route to", () => {
    // A fixture expecting a port the kind never declares would pass here and
    // fail in an editor, where the edge cannot be drawn.
    const declared = new Set((kind.outputs as Array<{ id: string }>).map((p) => p.id));
    for (const testCase of file.cases) {
      for (const port of testCase.expect.ports ?? []) {
        expect(declared, `${testCase.name} → ${port}`).toContain(port);
      }
    }
  });

  it("passes every golden fixture", async () => {
    const result = await runFixtures(file, executor);

    expect(result.failures.map((f) => `${f.case}: ${f.message}`)).toEqual([]);
    expect(result.passed).toBe(file.cases.length);
  });
});

describe("the provider seam", () => {
  it("refuses to run with no host registered", async () => {
    // These nodes carry no credentials. A node that shrugs here is a green run
    // that never opened the pull request someone was waiting for.
    const release = registerGitHost(host);
    release();

    const ctx = {
      node: { id: "pr", data: { config: { owner: "a", repo: "b", title: "t", sourceBranch: "x" } } },
      inputs: {},
      emit: () => {},
    } as any;

    await expect(gitPrOpenExecutor(ctx)).rejects.toThrow(/no Git host registered/);
  });

  it("refuses when the configured provider was never registered", async () => {
    const release = registerGitHost({ registry: { get: () => undefined } });

    const ctx = {
      node: { id: "pr", data: { config: { provider: "gitlab", owner: "a", repo: "b", title: "t", sourceBranch: "x" } } },
      inputs: {},
      emit: () => {},
    } as any;

    await expect(gitPrOpenExecutor(ctx)).rejects.toThrow(/no "gitlab" provider is registered/);
    release();
  });
});
