# @particle-academy/llm_screen

Let a model build the interface this step shows.

One of the nodes in [`fancy-flow-nodes`](../../README.md). `fancy-cli` **copies** it into your
project — source you can read, edit and diff, not a dependency in `node_modules`:

```bash
npx fancy-cli@latest add node @particle-academy/llm_screen
```

## What it is for

[`fancy-screens`](https://ui.particle.academy/packages/fancy-screens) already renders a JSON page
description: `<Screen schema={…}>` maps each `type` through a component registry the host fills,
spreads `props`, and recurses `children`. That surface was built for exactly this and had no
workflow node reaching it.

So `llm_input` covers the case where a step needs **answers**. This covers the case where a step
needs to **show** something whose shape depends on what the run found — a deploy summary, a
comparison, a dashboard over whatever came back.

The node's own contribution is the two things fancy-screens cannot do from where it sits: telling
the model which components actually exist, and refusing a schema that names one that does not.

## Fancy packages

| | | |
|---|---|---|
| `fancy-screens` | required | renders the generated schema |
| `react-fancy` | optional | the component palette a generated screen usually draws from |

Declared in the manifest, so `fancy-cli` prints the install routes when you add the node.
**Unversioned, deliberately** — the suite ships additively and a pin here would hold you on an old
surface for a constraint nobody revisits.

## Config

`purpose` (required) · `screenId` (required) · `title` · `includeContext` (default on) · `present`
(default on) · `provider` · `model` · `credential`

`screenId` is required rather than defaulted: fancy-screens keys its registry — and its store
prefixes — on exactly this string, so a guessed id collides with whatever already holds it.

`present: false` returns the schema as data without putting it in front of anyone — for storing it,
diffing it, or handing it to a later step.

## Ports

`out` — `{ screenId, title, schema }`.

## Wiring

Generating the schema and knowing which components exist are the same knowledge, so they are one
host. Split across two registrations they drift, and the drift renders as a placeholder.

```ts
import { listSchemaComponents } from "@particle-academy/fancy-screens";
import { registerLlmScreenHost } from "@/components/fancy/flow-nodes/llm-screen/js/host";

registerLlmScreenHost({
  components: () => listSchemaComponents(),
  generate: (request) => myModel.json(SCREEN_SCHEMA, request),
  present: (screen) => screenStore.setState({ schema: screen.schema }),
});
```

On PHP, fancy-screens is a JavaScript package, so the component list comes from wherever the app
records what it registered — a config array, a built manifest, an endpoint. The node does not care
where; it only refuses to emit a name that is not on the list.

## What it refuses

fancy-screens renders an unregistered component name as a visible orange placeholder. That is the
right call for a developer typing a schema by hand and **the wrong outcome for a workflow**: the run
completes, reports success, and what arrives on someone's screen is an error message. So the node
fails the run instead, before anything is presented:

- a component the host never registered — reported **once per name**, not once per occurrence, plus
  a line naming what *is* registered, since the fix is usually the registry rather than the prompt
- a tree nested past 12 levels, which a model that loses its place will produce
- an element with no `type`, non-object `props`, or non-array `children`

## Retries

`sideEffects: "idempotent"` — regenerating produces another screen for the same purpose. It costs
another model call, so scope the retry policy if that matters.

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
import { llmScreenRunnableKind } from "@/components/fancy/flow-nodes/llm-screen/js/kind";

registerNodeKind(llmScreenRunnableKind);
```

`js/kind.ts` is the surface **with** the executor attached. `ui/kind.ts` is the
surface **without** one — import that only when something else executes the node.
