# @particle-academy/git_log

Read commits from a working copy, branching on whether any matched.

One of the **local working-copy** nodes in [`fancy-flow-nodes`](../../README.md).
They drive [`@particle-academy/fancy-git`](https://github.com/Particle-Academy/fancy-git-js) /
[`particle-academy/fancy-git`](https://github.com/Particle-Academy/fancy-git-php)
against a checkout on disk — distinct from the `git_pr_*` nodes, which talk to a
hosted provider over its API.

```bash
npx fancy-cli@latest add node @particle-academy/git_log
```

## Host wiring

This node declares the **`gitRepository`** capability. Register a host once,
before the first run:

```ts
import { registerGitRepoHost } from "@/components/fancy/flow-nodes/git-log/js/repo";
import { GitRepository } from "@particle-academy/fancy-git";

registerGitRepoHost({
  resolve: (name) => new GitRepository(workspacePathFor(name)),
});
```

`repo` in the node config is a **name the host resolves, never a path**. A graph
that carried a filesystem path would let its author point a node anywhere the
worker can reach; the host decides what a name maps to, and returning `null`
refuses outright.

## Ports

| Port | When |
|---|---|
| `found` | at least one commit matched |
| `none` | the range is empty |

`none` is a real answer, not an error: "has anything landed since the tag" is a
routing question, and an empty array on a single port is a check somebody forgets
downstream.

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
import { gitLogRunnableKind } from "@/components/fancy/flow-nodes/git-log/js/kind";

registerNodeKind(gitLogRunnableKind);
```

`js/kind.ts` is the surface **with** the executor attached. `ui/kind.ts` is the
surface **without** one — import that only when something else executes the node.
