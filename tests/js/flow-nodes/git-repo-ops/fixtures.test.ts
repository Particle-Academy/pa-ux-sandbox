import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";

import { gitStatusKind } from "../../../../resources/flow-nodes/git-status/ui/kind";
import { gitStatusExecutor } from "../../../../resources/flow-nodes/git-status/js/executor";
import { registerGitRepoHost as registerStatusHost } from "../../../../resources/flow-nodes/git-status/js/repo";

import { gitLogKind } from "../../../../resources/flow-nodes/git-log/ui/kind";
import { gitLogExecutor } from "../../../../resources/flow-nodes/git-log/js/executor";
import { registerGitRepoHost as registerLogHost } from "../../../../resources/flow-nodes/git-log/js/repo";

import { gitBranchesKind } from "../../../../resources/flow-nodes/git-branches/ui/kind";
import { gitBranchesExecutor } from "../../../../resources/flow-nodes/git-branches/js/executor";
import { registerGitRepoHost as registerBranchesHost } from "../../../../resources/flow-nodes/git-branches/js/repo";

import { gitDiffKind } from "../../../../resources/flow-nodes/git-diff/ui/kind";
import { gitDiffExecutor } from "../../../../resources/flow-nodes/git-diff/js/executor";
import { registerGitRepoHost as registerDiffHost } from "../../../../resources/flow-nodes/git-diff/js/repo";

import { gitCheckoutKind } from "../../../../resources/flow-nodes/git-checkout/ui/kind";
import { gitCheckoutExecutor } from "../../../../resources/flow-nodes/git-checkout/js/executor";
import { registerGitRepoHost as registerCheckoutHost } from "../../../../resources/flow-nodes/git-checkout/js/repo";

import { gitPushKind } from "../../../../resources/flow-nodes/git-push/ui/kind";
import { gitPushExecutor } from "../../../../resources/flow-nodes/git-push/js/executor";
import { registerGitRepoHost as registerPushHost } from "../../../../resources/flow-nodes/git-push/js/repo";

import { gitPullKind } from "../../../../resources/flow-nodes/git-pull/ui/kind";
import { gitPullExecutor } from "../../../../resources/flow-nodes/git-pull/js/executor";
import { registerGitRepoHost as registerPullHost } from "../../../../resources/flow-nodes/git-pull/js/repo";

/**
 * The local working-copy nodes, against their golden fixtures.
 *
 * The working copy is a deterministic fake rather than a real checkout: these
 * nodes are shuttles — resolve config, call one method, route on the answer — so
 * what is worth pinning is the routing, the validation, and that a `propose`
 * NEVER performs the operation. Whether `git push` works is fancy-git's test,
 * not this one.
 *
 * Answers are chosen by the fixture's `repo` name, never by a call counter. A
 * counter makes every case depend on the ones before it, so reordering the file
 * breaks tests that have nothing to do with the change.
 */

/** Records anything that would have mutated, so `propose` can be proven inert. */
const performed: string[] = [];

function workingCopy(name: string) {
  const dirty = name === "app";

  return {
    info: async () => ({ directory: name }),
    status: async () =>
      dirty
        ? { branch: "main", upstream: "origin/main", ahead: 1, behind: 0, files: [{ path: "a.ts" }], clean: false }
        : { branch: "main", upstream: "origin/main", ahead: 0, behind: 0, files: [], clean: true },
    log: async () => (name === "empty" ? [] : [{ id: "abc", shortId: "abc", subject: "first", parents: [] }]),
    branches: async () => [
      { name: "main", current: true, remote: false, target: "abc" },
      { name: "feature", current: false, remote: false, target: "def" },
      { name: "origin/main", current: false, remote: true, target: "abc" },
    ],
    diff: async () => (dirty ? { files: [{ path: "a.ts" }], patch: "@@" } : { files: [], patch: "" }),
    checkout: async (target: string, options?: { propose?: boolean }) => {
      if (options?.propose) return { kind: "checkout", target };
      performed.push(`checkout:${target}`);
      return undefined;
    },
    push: async (remote?: string, branch?: string, options?: { propose?: boolean }) => {
      if (options?.propose) return { kind: "push", remote, branch };
      performed.push(`push:${remote}`);
      return undefined;
    },
    pull: async (remote?: string, branch?: string, options?: { propose?: boolean }) => {
      if (options?.propose) return { kind: "pull", remote, branch };
      performed.push(`pull:${remote ?? "origin"}`);
      return undefined;
    },
  };
}

/** Refuses "nope" — the host declining is a case every node must handle. */
const host = { resolve: (repo: string | undefined) => (repo === "nope" ? null : workingCopy(repo ?? "app")) };

const NODES = [
  { dir: "git-status", kind: gitStatusKind, executor: gitStatusExecutor, register: registerStatusHost },
  { dir: "git-log", kind: gitLogKind, executor: gitLogExecutor, register: registerLogHost },
  { dir: "git-branches", kind: gitBranchesKind, executor: gitBranchesExecutor, register: registerBranchesHost },
  { dir: "git-diff", kind: gitDiffKind, executor: gitDiffExecutor, register: registerDiffHost },
  { dir: "git-checkout", kind: gitCheckoutKind, executor: gitCheckoutExecutor, register: registerCheckoutHost },
  { dir: "git-push", kind: gitPushKind, executor: gitPushExecutor, register: registerPushHost },
  { dir: "git-pull", kind: gitPullKind, executor: gitPullExecutor, register: registerPullHost },
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
    const declared = new Set((kind.outputs as Array<{ id: string }>).map((p) => p.id));
    for (const testCase of file.cases) {
      for (const port of testCase.expect.ports ?? []) {
        expect(declared, `${testCase.name} → ${port}`).toContain(port);
      }
    }
  });

  it("names a capability the host has to provide", () => {
    // A node that silently no-ops because nothing was registered is the failure
    // this whole repo is arranged against, so the manifest has to say what it
    // needs before an editor can grey it out.
    expect(Object.values(manifest.capabilities)).toContain("required");
  });

  it("passes every golden fixture", async () => {
    const result = await runFixtures(file, executor);
    expect(result.failures, JSON.stringify(result.failures, null, 2)).toEqual([]);
  });
});

/**
 * The trust-but-verify half of the contract. `propose` exists so an agent can
 * say what it WOULD do; a `propose` that quietly performed the operation anyway
 * would be worse than not having the flag, because the whole point is that a
 * human gets to look first.
 */
describe("propose never performs", () => {
  const release: Array<() => void> = [];

  beforeAll(() => {
    release.push(registerCheckoutHost(host), registerPushHost(host), registerPullHost(host));
  });
  afterAll(() => release.forEach((fn) => fn()));

  it.each([
    ["checkout", gitCheckoutExecutor, { repo: "app", target: "main", propose: true }],
    ["push", gitPushExecutor, { repo: "app", propose: true }],
    ["pull", gitPullExecutor, { repo: "app", propose: true }],
  ])("%s reaches the proposed port without touching the repository", async (_name, executor, config) => {
    performed.length = 0;

    const result = (await executor({
      node: { id: "n1", data: { config } },
      emit: () => {},
    } as never)) as { __port: string };

    expect(result.__port).toBe("proposed");
    expect(performed).toEqual([]);
  });

  it("performs when propose is off", async () => {
    performed.length = 0;

    await gitPushExecutor({ node: { id: "n1", data: { config: { repo: "app" } } }, emit: () => {} } as never);

    expect(performed).toEqual(["push:origin"]);
  });
});

/**
 * Every mutating node must declare itself unsafe to replay. Durable runs retry,
 * and a manifest that overstates its safety is worse than none — the host has no
 * other way to know it should scope the retry policy.
 */
describe("mutating nodes tell the truth about replay", () => {
  it.each(["git-checkout", "git-push", "git-pull"])("%s is unsafe-to-replay", (dir) => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "resources/flow-nodes", dir, "fancy-flow.node.json"), "utf8"),
    );
    expect(manifest.sideEffects).toBe("unsafe-to-replay");
  });

  it.each(["git-status", "git-log", "git-branches", "git-diff", "git-repo"])("%s is idempotent", (dir) => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "resources/flow-nodes", dir, "fancy-flow.node.json"), "utf8"),
    );
    expect(manifest.sideEffects).toBe("idempotent");
  });
});
