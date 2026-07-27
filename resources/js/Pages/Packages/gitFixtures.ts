import type {
    Branch as FancyGitBranch,
    Commit as FancyGitCommit,
    Review as FancyGitReview,
    WorkingTreeStatus as FancyGitWorkingTreeStatus,
} from "@particle-academy/fancy-git";

/**
 * One fixture repository, shared by the listing tiles and the full demos.
 *
 * Shared deliberately. The tiles used to be hand-drawn HTML mock-ups of what
 * each component "looks like" — a div pretending to be a diff, a span pretending
 * to be a badge — which drifts from the component the moment either changes, and
 * nothing notices. Worse in this kit than most: the tiles were mock-ups OF
 * components whose entire selling point is that they are real, controlled and
 * agent-drivable, so the grid was quietly advertising the opposite of the pitch.
 *
 * Every fancy-git-ui component is fully controlled and provider-neutral: it
 * renders what you pass and emits intents, holding no Git state of its own. So
 * "a tile has no repository to read" was never true — a tile hands it the same
 * fixture a demo does. That is the whole reason these live in one file.
 */
export const GIT_STATUS: FancyGitWorkingTreeStatus = {
    branch: "feature/trigger-cohorts",
    upstream: "origin/feature/trigger-cohorts",
    ahead: 3,
    behind: 0,
    clean: false,
    files: [
        { path: "src/runtime/run-cohort.ts", index: "added", worktree: null },
        { path: "src/runtime/run-flow.ts", index: null, worktree: "modified" },
        { path: "tests/run-cohort.test.ts", index: null, worktree: "untracked" },
        { path: "CHANGELOG.md", index: null, worktree: "modified" },
    ],
};

export const GIT_COMMITS: FancyGitCommit[] = [
    { id: "a1b2c3d4e5f6", shortId: "a1b2c3d", parents: ["9f8e7d6"], authorName: "Ada", authorEmail: "ada@example.test", authoredAt: "2026-07-26T09:12:00Z", subject: "feat(runtime): runCohort — the runs one trigger fires" },
    { id: "9f8e7d6c5b4a", shortId: "9f8e7d6", parents: ["4c5b6a7"], authorName: "Ada", authorEmail: "ada@example.test", authoredAt: "2026-07-25T16:40:00Z", subject: "fix(engine): a skipped branch no longer clobbers a merge point" },
    { id: "4c5b6a7d8e9f", shortId: "4c5b6a7", parents: [], authorName: "Grace", authorEmail: "grace@example.test", authoredAt: "2026-07-24T11:05:00Z", subject: "chore: bump postcss to 8.5.23" },
];

export const GIT_BRANCHES: FancyGitBranch[] = [
    { name: "main", current: false, remote: false, target: "4c5b6a7", upstream: "origin/main" },
    { name: "feature/trigger-cohorts", current: true, remote: false, target: "a1b2c3d", upstream: "origin/feature/trigger-cohorts" },
    { name: "fix/merge-point", current: false, remote: false, target: "9f8e7d6" },
    { name: "origin/main", current: false, remote: true, target: "4c5b6a7" },
];

export const GIT_REVIEWS: FancyGitReview[] = [
    { id: "41", number: 41, title: "Add trigger cohorts", state: "open", webUrl: "#", sourceBranch: "feature/trigger-cohorts", targetBranch: "main", author: "ada" },
    { id: "38", number: 38, title: "Fix the merge point", state: "merged", webUrl: "#", sourceBranch: "fix/merge-point", targetBranch: "main", author: "ada" },
    { id: "37", number: 37, title: "Bump postcss", state: "draft", webUrl: "#", sourceBranch: "chore/postcss", targetBranch: "main", author: "grace" },
];

export const GIT_TREE = [
    { id: "1", name: "runtime", path: "src/runtime", kind: "directory" as const },
    { id: "2", name: "registry", path: "src/registry", kind: "directory" as const },
    { id: "3", name: "engine.ts", path: "src/engine.ts", kind: "file" as const, size: 4210 },
    { id: "4", name: "index.ts", path: "src/index.ts", kind: "file" as const, size: 9877 },
    { id: "5", name: "types.ts", path: "src/types.ts", kind: "file" as const, size: 3120, status: "modified" },
];

/**
 * The real 0.27.1 merge-point fix, as the unified diff git actually emits.
 *
 * A patch string rather than a hand-built object tree, because that is what
 * `fancy-git`'s `Diff.patch` carries and what `<DiffViewer>` takes since 0.2.0.
 * The old fixture was a shape only this demo produced, which is exactly what
 * made the component hard to adopt: a consumer had to write a parser to get
 * from git's output to it.
 */
export const GIT_DIFF = `diff --git a/src/runtime/run-flow.ts b/src/runtime/run-flow.ts
--- a/src/runtime/run-flow.ts
+++ b/src/runtime/run-flow.ts
@@ -212,7 +212,8 @@ collectInputs
   for (const edge of incoming) {
-    inputs[portId] = portValues.get(key);
+    if (!portValues.has(key)) continue;
+    inputs[portId] = portValues.get(key);
   }
`;
