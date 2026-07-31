# @particle-academy/git_repo

Hosted repository metadata — default branch, visibility, URLs.

One of the **hosted-provider** nodes in [`fancy-flow-nodes`](../../README.md),
alongside the `git_pr_*` family. They wrap
[`@particle-academy/fancy-git`](https://github.com/Particle-Academy/fancy-git-js) /
[`particle-academy/fancy-git`](https://github.com/Particle-Academy/fancy-git-php),
whose provider contract is **neutral across GitHub, GitLab and Bitbucket** — so
the same graph runs against any of them.

```bash
npx fancy-cli@latest add node @particle-academy/git_repo
```

## Why it exists

Every `git_pr_*` node takes a target branch, and hardcoding `"main"` in a graph
is how a workflow silently targets the wrong branch on a repository that uses
`master`, `develop` or `trunk`. Nothing fails; the pull request just opens
against a branch nobody merges.

This is the node that answers it, so a graph can **read** the default branch
instead of assuming it:

```
git_repo ──▶ git_pr_open (targetBranch = {{ $.defaultBranch }})
```

## Host wiring

Declares the **`gitProvider`** capability — the same registry the `git_pr_*`
nodes use, so a graph that already opens pull requests needs no extra setup.

```ts
import { registerGitHost } from "@/components/fancy/flow-nodes/git-repo/js/provider";
import { ProviderRegistry } from "@particle-academy/fancy-git";
import { githubProvider } from "@particle-academy/fancy-git-github";

registerGitHost({
  registry: new ProviderRegistry().register(githubProvider({ token: env.GITHUB_TOKEN })),
});
```

Read-only and `idempotent` — safe to replay.

## Register it

**Copying a node is not installing it.** Until the host registers the kind, these
files are source in a directory: no palette entry, and a graph naming the kind
fails at run time.

**On a PHP host**

```bash
composer dump-autoload          # the executor is PSR-4 under your node namespace
php artisan flow:discover       # reads #[FlowNode] and registers the kind
```

Then bind this node's `*Host` class (it sits beside the executor) in a service
provider. The React kind under your components directory is for the **editor**
and deliberately carries no executor — PHP runs the node, the browser draws it.

**On a TypeScript host**

```ts
import { gitRepoRunnableKind } from "@/components/fancy/flow-nodes/git-repo/js/kind";

registerNodeKind(gitRepoRunnableKind);
```

`js/kind.ts` is the surface **with** the executor attached. `ui/kind.ts` is the
surface **without** one — import that only when something else executes the node.
