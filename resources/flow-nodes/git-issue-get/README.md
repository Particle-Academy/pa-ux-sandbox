# @particle-academy/git_issue_get

Read one issue — body, state, labels, assignees.

One of the **issue** nodes in [fancy-flow-nodes](../../README.md). They act on a
hosted provider's issue tracker through
[@particle-academy/fancy-git](https://github.com/Particle-Academy/fancy-git-js) /
[particle-academy/fancy-git](https://github.com/Particle-Academy/fancy-git-php).

```bash
npx fancy-cli@latest add node @particle-academy/git_issue_get
```

## Issue tracking is an optional capability

`IssueProvider` is a **separate contract** from `GitProvider`, because a
self-hosted remote with no tracker is a perfectly good provider. This node
narrows the provider before using it and **fails loudly** on a host that has no
tracker, rather than silently doing nothing.

Today **only the GitHub adapter implements it** — `fancy-git-github` >= 0.2.
GitLab and Bitbucket do not yet, and the check reports that honestly.

## Host wiring

Declares the **`gitProvider`** capability — the same registry the `git_pr_*` nodes
use, so a graph that already opens pull requests needs no extra setup.

```ts
import { registerGitHost } from "@/components/fancy/flow-nodes/git-issue-get/js/provider";
import { ProviderRegistry } from "@particle-academy/fancy-git";
import { githubProvider } from "@particle-academy/fancy-git-github";

registerGitHost({
  registry: new ProviderRegistry().register(githubProvider({ token: env.GITHUB_TOKEN })),
});
```

## Register it

**Copying a node is not installing it.** Until the host registers the kind, these
files are source in a directory.

**On a PHP host**

```bash
composer dump-autoload
php artisan flow:discover
```

Then bind this node's `GitHost` class in a service provider.

**On a TypeScript host**

```ts
import { gitIssueGetRunnableKind } from "@/components/fancy/flow-nodes/git-issue-get/js/kind";

registerNodeKind(gitIssueGetRunnableKind);
```

Replay: `idempotent`.
