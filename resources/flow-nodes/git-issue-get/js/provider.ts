/**
 * The seam between a workflow node and a hosted Git provider.
 *
 * `@particle-academy/fancy-git` models providers as a `ProviderRegistry` **instance** — it has
 * no module singleton, deliberately, because a host may serve several
 * installations with different credentials. So a node cannot reach for a
 * provider; the host has to hand one over, the same arrangement fancy-flow uses
 * for LLM clients.
 *
 * ```ts
 * import { registerGitHost } from "@/components/fancy/flow-nodes/git-pr-open/js/provider";
 * import { ProviderRegistry } from "@particle-academy/fancy-git";
 * import { githubProvider } from "@particle-academy/fancy-git-github";
 *
 * registerGitHost({
 *   registry: new ProviderRegistry().register(githubProvider({ token: env.GITHUB_TOKEN })),
 * });
 * ```
 *
 * This file is duplicated in each git-pr-* node. That is on purpose: a vendored
 * node is meant to be self-contained and editable in place, so a node you copy
 * in should not depend on another node you did not.
 */

/** What the node needs from the host, narrowed to almost nothing. */
export type GitHost = {
  /** A `ProviderRegistry` from `@particle-academy/fancy-git`. */
  registry: {
    get(kind: string): unknown;
  };
  /** Default repository, so a node's config can omit it. */
  defaultRepo?: { provider?: string; owner?: string; name?: string; baseUrl?: string };
};

let host: GitHost | null = null;

/** Install the host's provider registry. Returns an unregister function. */
export function registerGitHost(next: GitHost): () => void {
  host = next;

  return () => {
    if (host === next) host = null;
  };
}

export function getGitHost(): GitHost | null {
  return host;
}

/** A repository, as `@particle-academy/fancy-git` identifies one. */
export type RepoRef = { provider: string; owner: string; name: string; baseUrl?: string };

/**
 * Resolve the provider and repository a node should act on.
 *
 * Fails loudly at every step. A node that cannot reach a provider must not
 * return "nothing to do" — on a queue worker that is a green run that never
 * opened the pull request anyone was waiting for.
 */
export function resolveTarget(config: Record<string, unknown>): { provider: any; ref: RepoRef } {
  const current = getGitHost();
  if (!current) {
    throw new Error(
      "git_pr: no Git host registered. Call registerGitHost({ registry }) with a @particle-academy/fancy-git " +
        "ProviderRegistry — the node has no credentials of its own and must not invent any.",
    );
  }

  const ref: RepoRef = {
    provider: String(config.provider ?? current.defaultRepo?.provider ?? "github"),
    owner: String(config.owner ?? current.defaultRepo?.owner ?? ""),
    name: String(config.repo ?? current.defaultRepo?.name ?? ""),
  };
  const baseUrl = config.baseUrl ?? current.defaultRepo?.baseUrl;
  if (baseUrl) ref.baseUrl = String(baseUrl);

  if (!ref.owner || !ref.name) {
    throw new Error("git_pr: needs `owner` and `repo` — on the node, or as the host's defaultRepo.");
  }

  const provider = current.registry.get(ref.provider);
  if (!provider) {
    throw new Error(
      `git_pr: no "${ref.provider}" provider is registered. Register one on the ProviderRegistry ` +
        "you pass to registerGitHost.",
    );
  }

  return { provider, ref };
}

/**
 * Narrow a provider to one that tracks issues.
 *
 * Issue tracking is an OPTIONAL capability on fancy-git: a self-hosted remote
 * with no tracker is a perfectly good provider. Checking here turns "this host
 * has no issue tracker" into a clear failure at the node, instead of an
 * undefined-is-not-a-function three frames down.
 */
export function requireIssues(provider: any): any {
  if (typeof provider?.createIssue !== "function") {
    throw new Error(
      'git_issue: the "' +
        (provider?.kind ?? "configured") +
        '" provider does not track issues. Issue support is an optional capability — ' +
        "register an adapter that implements IssueProvider (@particle-academy/fancy-git-github does).",
    );
  }

  return provider;
}
