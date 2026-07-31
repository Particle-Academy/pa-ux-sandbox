import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";

import { gitIssueOpenKind } from "../../../../resources/flow-nodes/git-issue-open/ui/kind";
import { gitIssueOpenExecutor } from "../../../../resources/flow-nodes/git-issue-open/js/executor";
import { registerGitHost as registerOpenHost } from "../../../../resources/flow-nodes/git-issue-open/js/provider";

import { gitIssueGetKind } from "../../../../resources/flow-nodes/git-issue-get/ui/kind";
import { gitIssueGetExecutor } from "../../../../resources/flow-nodes/git-issue-get/js/executor";
import { registerGitHost as registerGetHost } from "../../../../resources/flow-nodes/git-issue-get/js/provider";

import { gitIssueListKind } from "../../../../resources/flow-nodes/git-issue-list/ui/kind";
import { gitIssueListExecutor } from "../../../../resources/flow-nodes/git-issue-list/js/executor";
import { registerGitHost as registerListHost } from "../../../../resources/flow-nodes/git-issue-list/js/provider";

import { gitIssueUpdateKind } from "../../../../resources/flow-nodes/git-issue-update/ui/kind";
import { gitIssueUpdateExecutor } from "../../../../resources/flow-nodes/git-issue-update/js/executor";
import { registerGitHost as registerUpdateHost } from "../../../../resources/flow-nodes/git-issue-update/js/provider";

import { gitIssueCommentKind } from "../../../../resources/flow-nodes/git-issue-comment/ui/kind";
import { gitIssueCommentExecutor } from "../../../../resources/flow-nodes/git-issue-comment/js/executor";
import { registerGitHost as registerCommentHost } from "../../../../resources/flow-nodes/git-issue-comment/js/provider";

/**
 * The issue nodes, against their golden fixtures.
 *
 * Issue tracking is an OPTIONAL provider capability, so the case that matters
 * most here is the one that is easy to skip: what these do on a host whose
 * provider has no tracker. Silently succeeding there would be the worst
 * outcome — a workflow that files nothing and reports done.
 */

const issue = (over: Record<string, unknown> = {}) => ({
  id: "1",
  number: 7,
  title: "Broken",
  state: "open",
  webUrl: "https://example.test/issues/7",
  author: "ada",
  labels: ["bug"],
  assignees: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...over,
});

/** A provider WITH issue support. Answers are chosen by the fixture's config. */
const issueProvider = {
  kind: "github",
  identify: () => null,
  repository: async () => ({ provider: "github", owner: "a", name: "b" }),

  listIssues: async (_ref: unknown, query: any) =>
    query?.state === "closed" ? { items: [] } : { items: [issue()] },
  getIssue: async (_ref: unknown, number: number) =>
    issue({ number, state: number === 99 ? "closed" : "open" }),
  createIssue: async (_ref: unknown, input: any) => issue({ title: input.title }),
  updateIssue: async (_ref: unknown, number: number, input: any) => issue({ number, ...input }),
  commentOnIssue: async () => ({ id: "c1", webUrl: "https://example.test/issues/7#c1" }),
};

/** A provider WITHOUT issue support — a perfectly valid GitProvider. */
const noTracker = {
  kind: "selfhosted",
  identify: () => null,
  repository: async () => ({ provider: "selfhosted", owner: "a", name: "b" }),
};

const host = (provider: unknown) => ({
  registry: { get: (kind: string) => (kind === "github" || kind === "selfhosted" ? provider : undefined) },
});

const NODES = [
  { dir: "git-issue-open", kind: gitIssueOpenKind, executor: gitIssueOpenExecutor, register: registerOpenHost },
  { dir: "git-issue-get", kind: gitIssueGetKind, executor: gitIssueGetExecutor, register: registerGetHost },
  { dir: "git-issue-list", kind: gitIssueListKind, executor: gitIssueListExecutor, register: registerListHost },
  { dir: "git-issue-update", kind: gitIssueUpdateKind, executor: gitIssueUpdateExecutor, register: registerUpdateHost },
  { dir: "git-issue-comment", kind: gitIssueCommentKind, executor: gitIssueCommentExecutor, register: registerCommentHost },
];

for (const node of NODES) registerNodeKind(node.kind);

describe.each(NODES)("$dir", ({ dir, kind, executor, register }) => {
  const release: Array<() => void> = [];

  beforeAll(() => release.push(register(host(issueProvider))));
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
    const declared = new Set((kind.outputs as Array<{ id: string }>).map((p) => p.id));
    for (const testCase of file.cases) {
      for (const port of testCase.expect.ports ?? []) {
        expect(declared, `${testCase.name} → ${port}`).toContain(port);
      }
    }
  });

  it("names both packages it needs, with an npm AND a Composer route", () => {
    // The issue methods only exist from fancy-git 0.2, and only the GitHub
    // adapter implements them. A node that did not say so would install fine
    // and fail at run time on the version a consumer already had.
    const deps = manifest.fancyDependencies ?? [];
    expect(deps.map((d: any) => d.package)).toEqual(["fancy-git", "fancy-git-github"]);
    for (const dep of deps) {
      expect(dep.npm).toBeDefined();
      expect(dep.composer).toBeDefined();
    }
  });

  it("passes every golden fixture", async () => {
    const result = await runFixtures(file, executor);
    expect(result.failures, JSON.stringify(result.failures, null, 2)).toEqual([]);
  });
});

/**
 * The capability check. `IssueProvider` is separate from `GitProvider` precisely
 * because plenty of hosts have no tracker — so every one of these nodes has to
 * say so plainly instead of calling a method that is not there.
 */
describe("a provider with no issue tracker", () => {
  const release: Array<() => void> = [];

  beforeAll(() => {
    for (const node of NODES) release.push(node.register(host(noTracker)));
  });
  afterAll(() => release.forEach((fn) => fn()));

  it.each(NODES)("$dir fails loudly rather than silently doing nothing", async ({ executor }) => {
    await expect(
      executor({
        node: { id: "n1", data: { config: { owner: "a", repo: "b", provider: "selfhosted", number: 7, title: "x", body: "y" } } },
        emit: () => {},
      } as never),
    ).rejects.toThrow(/does not track issues/);
  });
});
