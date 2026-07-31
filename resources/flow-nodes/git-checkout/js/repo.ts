/**
 * The seam between a workflow node and a LOCAL git working copy.
 *
 * Distinct from the `git_pr_*` nodes' seam on purpose. Those act on a hosted
 * provider (a REST API and a token); these drive `git` in a checkout on disk.
 * The two have different failure modes, different credentials and different
 * blast radius, so they declare different capabilities — a host that wants to
 * read pull requests should not have to hand over a working copy, and a host
 * that hands over a working copy is agreeing to something much larger.
 *
 * ```ts
 * import { registerGitRepoHost } from "@/components/fancy/flow-nodes/git-checkout/js/repo";
 * import { GitRepository } from "@particle-academy/fancy-git";
 *
 * registerGitRepoHost({
 *   resolve: (name) => new GitRepository(workspacePathFor(name)),
 * });
 * ```
 *
 * `resolve` takes the config's `repo` name rather than a path, so a graph never
 * carries a filesystem path an author could point anywhere. The host decides
 * what a name maps to; the node cannot reach outside what the host allows.
 *
 * This file is duplicated in each local-repo node. That is on purpose: a
 * vendored node is meant to be self-contained and editable in place, so a node
 * you copy in should not depend on another node you did not.
 */

/** The subset of `fancy-git`'s `GitRepository` these nodes use. */
export type GitWorkingCopy = {
  info(): Promise<unknown>;
  status(): Promise<unknown>;
  log(query?: { ref?: string; limit?: number; skip?: number }): Promise<unknown[]>;
  diff(query?: { from?: string; to?: string; staged?: boolean; paths?: string[] }): Promise<unknown>;
  branches(): Promise<unknown[]>;
  checkout(target: string, options?: { propose?: boolean }): Promise<unknown>;
  push(remote?: string, branch?: string, options?: { propose?: boolean }): Promise<unknown>;
  pull(remote?: string, branch?: string, options?: { propose?: boolean }): Promise<unknown>;
};

export type GitRepoHost = {
  /** Map a config `repo` name to a working copy. Return null to refuse. */
  resolve(repo: string | undefined): GitWorkingCopy | null;
};

let host: GitRepoHost | null = null;

/** Install the host. Returns an unregister function. */
export function registerGitRepoHost(next: GitRepoHost): () => void {
  host = next;

  return () => {
    if (host === next) host = null;
  };
}

export function getGitRepoHost(): GitRepoHost | null {
  return host;
}

/**
 * Resolve the working copy this node acts on.
 *
 * Fails loudly at every step. A node that cannot reach a repository must not
 * return "nothing to do" — on a queue worker that is a green run that never
 * pushed the branch someone was waiting for.
 */
export function resolveWorkingCopy(config: Record<string, unknown>): GitWorkingCopy {
  const current = getGitRepoHost();
  if (!current) {
    throw new Error(
      "git: no repository host registered. Call registerGitRepoHost({ resolve }) with a " +
        "fancy-git GitRepository factory — the node has no filesystem access of its own and must not invent any.",
    );
  }

  const repo = config.repo === undefined || config.repo === null ? undefined : String(config.repo);
  const workingCopy = current.resolve(repo);

  if (!workingCopy) {
    throw new Error(
      `git: the host refused to resolve repository ${repo ? `"${repo}"` : "(default)"}. ` +
        "Register it with the host, or correct the node's `repo`.",
    );
  }

  return workingCopy;
}
