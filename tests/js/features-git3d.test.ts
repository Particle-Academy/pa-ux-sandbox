import { describe, expect, it } from "vitest";
import { MicroMcpServer, attachInProcess, registerGitBridge } from "@particle-academy/agent-integrations";
import { GIT_BRANCHES, GIT_COMMITS, GIT_REVIEWS, GIT_STATUS } from "../../resources/js/Pages/Packages/gitFixtures";
import { applyGitProposal, stagedPaths, summarize, type RepoState } from "../../resources/js/Pages/Features/Git/gitModel";
import { SEED_SCENE, hasWebGL, moveNode, resolveEngine, setChartVariant, setKpiValue, toWorld } from "../../resources/js/Pages/Features/ThreeD/sceneModel";

/**
 * The pure halves of the /features/git and /features/3d demos. The pages only
 * render what these return, so a wrong answer here is a wrong demo.
 */

const SEED: RepoState = { status: GIT_STATUS, commits: GIT_COMMITS, branches: GIT_BRANCHES, reviews: GIT_REVIEWS };

describe("Git demo model", () => {
    it("stages a worktree change into the index without mutating the seed", () => {
        const { state } = applyGitProposal(SEED, { operation: "stage", arguments: { paths: ["tests/run-cohort.test.ts"] } });
        expect(stagedPaths(state)).toContain("tests/run-cohort.test.ts");
        expect(stagedPaths(SEED)).not.toContain("tests/run-cohort.test.ts");
    });

    it("commits only what is staged, moves the branch and counts it ahead", () => {
        const { state } = applyGitProposal(SEED, { operation: "commit", arguments: { message: "feat: x" } }, new Date("2026-10-26T00:00:00Z"));
        expect(state.commits).toHaveLength(SEED.commits.length + 1);
        expect(state.commits[0].subject).toBe("feat: x");
        expect(state.commits[0].parents).toEqual([SEED.commits[0].shortId]);
        expect(stagedPaths(state)).toEqual([]);
        // The unstaged edits survive the commit.
        expect(state.status.files.map((f) => f.path)).toEqual(["src/runtime/run-flow.ts", "tests/run-cohort.test.ts", "CHANGELOG.md"]);
        expect(state.status.ahead).toBe((SEED.status.ahead ?? 0) + 1);
        expect(state.branches.find((b) => b.name === "feature/trigger-cohorts")?.target).toBe(state.commits[0].shortId);
    });

    it("refuses what could never apply", () => {
        const nothingStaged = applyGitProposal(SEED, { operation: "unstage", arguments: { paths: ["src/runtime/run-cohort.ts"] } }).state;
        expect(() => applyGitProposal(nothingStaged, { operation: "commit", arguments: { message: "x" } })).toThrow("Nothing is staged");
        expect(() => applyGitProposal(SEED, { operation: "checkout", arguments: { target: "origin/main" } })).toThrow("No local branch");
        expect(() => applyGitProposal(SEED, { operation: "stage", arguments: { paths: ["nope.ts"] } })).toThrow("No change at nope.ts");
    });

    it("checks out a local branch and opens a review with the next number", () => {
        const checkedOut = applyGitProposal(SEED, { operation: "checkout", arguments: { target: "main" } }).state;
        expect(checkedOut.branches.filter((b) => b.current).map((b) => b.name)).toEqual(["main"]);
        const opened = applyGitProposal(SEED, { operation: "review_create", arguments: { title: "T", sourceBranch: "a", targetBranch: "main", draft: true } }).state;
        expect(opened.reviews[0]).toMatchObject({ number: 42, state: "draft", title: "T" });
    });

    it("never pretends to reach a remote", () => {
        const { state, note } = applyGitProposal(SEED, { operation: "push", arguments: {} });
        expect(state).toBe(SEED);
        expect(note).toContain("nothing ran");
    });

    it("summarizes in fancy-git's own propose-mode wording", () => {
        expect(summarize("stage", { paths: ["a", "b"] })).toBe("Stage 2 path(s)");
        expect(summarize("commit", { message: "m" })).toBe("Commit staged changes: m");
        expect(summarize("checkout", { target: "main" })).toBe("Check out main");
    });
});

describe("the git bridge the demo mounts", () => {
    it("registers the read and proposal tools, and refuses apply by default", async () => {
        const server = new MicroMcpServer({ info: { name: "t", version: "1" } });
        const proposed: string[] = [];
        registerGitBridge(server, {
            adapter: {
                status: async () => SEED.status,
                log: async () => SEED.commits,
                diff: async () => ({ patch: "" }),
                reviews: async () => ({ items: SEED.reviews }),
                propose: async (operation, args) => {
                    proposed.push(operation);
                    return { operation, arguments: args, summary: summarize(operation, args) };
                },
            },
        });
        const tx = attachInProcess(server);
        let id = 1;
        const rpc = (method: string, params: Record<string, unknown>) =>
            new Promise<any>((resolve) => {
                const my = id++;
                const off = tx.onServerMessage((m: any) => {
                    if (m.id !== my) return;
                    off();
                    resolve(m.result);
                });
                void tx.deliver({ jsonrpc: "2.0", id: my, method, params } as never);
            });

        const names = ((await rpc("tools/list", {})).tools as { name: string }[]).map((t) => t.name);
        expect(names).toEqual(expect.arrayContaining(["git_status", "git_log", "git_diff", "git_reviews_list", "git_stage", "git_unstage", "git_commit", "git_checkout", "git_fetch", "git_pull", "git_push", "git_review_create"]));

        const proposal = await rpc("tools/call", { name: "git_stage", arguments: { paths: ["a"] } });
        expect(proposal.content[0].text).toBe("Proposed: Stage 1 path(s)");

        const applied = await rpc("tools/call", { name: "git_stage", arguments: { paths: ["a"], apply: true } });
        expect(applied.isError).toBe(true);
        expect(applied.content[0].text).toContain("requires human confirmation");
    });
});

describe("3D demo model", () => {
    it("centres the scene on the origin at eye height, one unit per 110px", () => {
        const placed = toWorld(SEED_SCENE);
        const signups = placed.find((p) => p.id === "signups")!;
        expect(signups.x).toBeCloseTo(0, 3);
        expect(signups.width).toBeCloseTo(300 / 110, 3);
        const revenue = placed.find((p) => p.id === "revenue")!;
        const owner = placed.find((p) => p.id === "owner")!;
        expect(revenue.x).toBeCloseTo(-owner.x, 3);
        expect(revenue.y).toBeCloseTo(owner.y, 3);
        // Taller in 2D means lower in 3D: y is flipped.
        expect(moveNode(SEED_SCENE, "revenue", 0, 400).nodes[0].position.y).toBe(400);
        expect(toWorld(moveNode(SEED_SCENE, "revenue", 0, 400)).find((p) => p.id === "revenue")!.y).toBeLessThan(revenue.y);
    });

    it("edits widgets as data, leaving the seed alone", () => {
        const next = setChartVariant(setKpiValue(SEED_SCENE, "$51k"), "bar");
        expect(next.nodes.find((n) => n.id === "revenue")!.widget).toMatchObject({ value: "$51k" });
        expect(next.nodes.find((n) => n.id === "signups")!.widget).toMatchObject({ variant: "bar" });
        expect(SEED_SCENE.nodes[0].widget).toMatchObject({ value: "$48.2k" });
    });

    it("never runs a WebGL engine without WebGL", () => {
        expect(resolveEngine("babylon", false)).toBe("dom");
        expect(resolveEngine("three", false)).toBe("dom");
        expect(resolveEngine("three", true)).toBe("three");
        expect(resolveEngine("dom", true)).toBe("dom");
    });

    it("reports no WebGL when there is no document or no context", () => {
        expect(hasWebGL(undefined)).toBe(false);
        const noGl = { createElement: () => ({ getContext: () => null }) } as unknown as Document;
        expect(hasWebGL(noGl)).toBe(false);
        const throws = { createElement: () => ({ getContext: () => { throw new Error("blocked"); } }) } as unknown as Document;
        expect(hasWebGL(throws)).toBe(false);
        const gl = { createElement: () => ({ getContext: (k: string) => (k === "webgl" ? {} : null) }) } as unknown as Document;
        expect(hasWebGL(gl)).toBe(true);
    });
});
