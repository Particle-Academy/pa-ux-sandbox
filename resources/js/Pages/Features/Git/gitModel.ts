import type { Branch, Commit, Review, WorkingTreeStatus } from "@particle-academy/fancy-git";

/**
 * The Git demo's repository, held as plain data and changed only by applying a
 * proposal. Pure on purpose: the page, the in-page MCP bridge and the tests all
 * go through `applyGitProposal`, so "what the agent proposed" and "what
 * happened when someone confirmed it" cannot drift apart.
 *
 * Nothing here shells out or touches a network. In an app the same proposals
 * go to `repository.stage(paths, { pendingMode: "propose" })` and friends.
 */

export type RepoState = {
    status: WorkingTreeStatus;
    commits: Commit[];
    branches: Branch[];
    reviews: Review[];
};

/** The bridge's `GitProposal`, plus who asked and a stable id for the queue. */
export type QueuedProposal = {
    id: string;
    by: "agent" | "you";
    operation: string;
    arguments: Record<string, unknown>;
    summary: string;
};

export type ApplyResult = { state: RepoState; note: string };

/**
 * The one-line summary for a proposal. The local operations use the exact
 * wording `@particle-academy/fancy-git`'s `GitRepository` returns in propose
 * mode; review_create has no local equivalent, so it says what it would open.
 */
export function summarize(operation: string, args: Record<string, unknown>): string {
    const paths = Array.isArray(args.paths) ? (args.paths as unknown[]).map(String) : [];
    switch (operation) {
        case "stage":
            return `Stage ${paths.length} path(s)`;
        case "unstage":
            return `Unstage ${paths.length} path(s)`;
        case "commit":
            return `Commit staged changes: ${String(args.message ?? "")}`;
        case "checkout":
            return `Check out ${String(args.target ?? "")}`;
        case "fetch":
            return `Fetch ${String(args.remote ?? "origin")}`;
        case "pull":
            return "Pull remote changes";
        case "push":
            return `Push to ${String(args.remote ?? "origin")}`;
        case "review_create":
            return `Open a review: ${String(args.title ?? "")} (${String(args.sourceBranch ?? "")} into ${String(args.targetBranch ?? "")})`;
        default:
            return operation;
    }
}

/**
 * Throws when a proposal could never apply, so the bridge answers the agent
 * with an error instead of queueing something a person would have to reject.
 */
export function validateProposal(state: RepoState, operation: string, args: Record<string, unknown>): void {
    if (operation === "stage" || operation === "unstage") {
        const paths = Array.isArray(args.paths) ? (args.paths as unknown[]).map(String) : [];
        if (paths.length === 0) throw new Error(`${operation} needs at least one path.`);
        const known = new Set(state.status.files.map((f) => f.path));
        const unknown = paths.filter((p) => !known.has(p));
        if (unknown.length > 0) throw new Error(`No change at ${unknown.join(", ")}.`);
    }
    if (operation === "commit") {
        if (String(args.message ?? "").trim() === "") throw new Error("A commit needs a message.");
        if (stagedPaths(state).length === 0) throw new Error("Nothing is staged.");
    }
    if (operation === "checkout") {
        const target = String(args.target ?? "");
        if (!state.branches.some((b) => !b.remote && b.name === target)) throw new Error(`No local branch named ${target}.`);
    }
    if (operation === "review_create") {
        if (String(args.title ?? "").trim() === "") throw new Error("A review needs a title.");
    }
}

export function stagedPaths(state: RepoState): string[] {
    return state.status.files.filter((f) => f.index !== null).map((f) => f.path);
}

export function currentBranch(state: RepoState): string {
    return state.branches.find((b) => b.current && !b.remote)?.name ?? state.status.branch ?? "HEAD";
}

/** A short, deterministic hex id, so a commit made in the demo looks and sorts like one. */
export function shortHash(input: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    let h2 = h ^ 0x5bd1e995;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
    return (h.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 12);
}

/**
 * Apply one proposal to the repository. Returns the next state and a note for
 * the activity log. Never mutates its input.
 */
export function applyGitProposal(state: RepoState, proposal: Pick<QueuedProposal, "operation" | "arguments">, now: Date = new Date()): ApplyResult {
    const args = proposal.arguments;
    validateProposal(state, proposal.operation, args);

    switch (proposal.operation) {
        case "stage":
        case "unstage": {
            const paths = (args.paths as unknown[]).map(String);
            const toIndex = proposal.operation === "stage";
            const files = state.status.files.map((f) =>
                paths.includes(f.path)
                    ? toIndex
                        ? { ...f, index: f.worktree ?? f.index, worktree: null }
                        : { ...f, worktree: f.index ?? f.worktree, index: null }
                    : f,
            );
            return {
                state: { ...state, status: { ...state.status, files, clean: files.length === 0 } },
                note: `${toIndex ? "Staged" : "Unstaged"} ${paths.join(", ")}`,
            };
        }
        case "commit": {
            const message = String(args.message).trim();
            const head = state.commits[0];
            const id = shortHash(`${message}|${head?.id ?? ""}|${state.commits.length}`);
            const commit: Commit = {
                id,
                shortId: id.slice(0, 7),
                parents: head ? [head.shortId] : [],
                authorName: "You",
                authorEmail: "you@example.test",
                authoredAt: now.toISOString(),
                subject: message.split("\n")[0],
            };
            // Staged changes leave the working tree; a file with unstaged edits
            // on top keeps them.
            const files = state.status.files
                .map((f) => (f.index !== null ? { ...f, index: null } : f))
                .filter((f) => f.index !== null || f.worktree !== null);
            const branch = currentBranch(state);
            return {
                state: {
                    ...state,
                    commits: [commit, ...state.commits],
                    branches: state.branches.map((b) => (b.name === branch && !b.remote ? { ...b, target: commit.shortId } : b)),
                    status: { ...state.status, files, clean: files.length === 0, ahead: (state.status.ahead ?? 0) + 1 },
                },
                note: `Committed ${commit.shortId} on ${branch}`,
            };
        }
        case "checkout": {
            const target = String(args.target);
            const branch = state.branches.find((b) => b.name === target);
            return {
                state: {
                    ...state,
                    branches: state.branches.map((b) => ({ ...b, current: !b.remote && b.name === target })),
                    status: { ...state.status, branch: target, upstream: branch?.upstream ?? null },
                },
                note: `Checked out ${target}`,
            };
        }
        case "review_create": {
            const number = Math.max(0, ...state.reviews.map((r) => r.number)) + 1;
            const review: Review = {
                id: String(number),
                number,
                title: String(args.title).trim(),
                state: args.draft === true ? "draft" : "open",
                webUrl: "#",
                sourceBranch: String(args.sourceBranch ?? currentBranch(state)),
                targetBranch: String(args.targetBranch ?? "main"),
                author: "you",
            };
            return { state: { ...state, reviews: [review, ...state.reviews] }, note: `Opened #${number}` };
        }
        case "fetch":
        case "pull":
        case "push":
            // There is no remote behind this demo, and pretending there is would
            // be the one dishonest thing on the page.
            return { state, note: `${proposal.operation} needs a remote; this demo has none, so nothing ran` };
        default:
            throw new Error(`Unknown operation: ${proposal.operation}`);
    }
}
