# @particle-academy/llm_input

Ask a model to write the form this step pauses on.

One of the nodes in [`fancy-flow-nodes`](../../README.md). `fancy-cli` **copies** it into your
project — source you can read, edit and diff, not a dependency in `node_modules`:

```bash
npx fancy-cli@latest add node @particle-academy/llm_input
```

## Why this and not `user_input`

Core already ships `user_input`, which pauses on a form somebody wrote at design time. **That is
the right node whenever the questions are known in advance, and usually they are.** Reach for this
one only when they are not:

- a triage step whose questions depend on the ticket that came in
- an onboarding form shaped by what the run already discovered
- a follow-up that asks only for what is still missing

If you can write the fields down, write them down. A generated form costs a model call and can
come back wrong; a static one cannot.

## Config

`purpose` (required) · `title` · `requiredKeys` · `maxFields` (default 8) · `includeContext`
(default on) · `provider` · `model` · `credential`

`purpose` is written **for the model**, not for the person filling the form in — it is what decides
which questions get asked.

`requiredKeys` is the contract with whatever reads the answers. Without it a downstream node
reading `values.email` breaks silently because the model chose `emailAddress`, and the run still
looks fine.

## Ports

`out` — the submitted values, on resume.

## The pause

The node pauses with **the same detail shape `user_input` emits** — `{ title, fields }`, plus
`generated: true`. A host that already renders a paused run renders this one with nothing new
wired: a generated form is a form, not a new kind of wait. The extra flag is there so a UI can say
the questions were written by a model rather than implying a person wrote them.

## Wiring

The node carries no provider SDK, the same "shuttle, not an engine" arrangement fancy-flow uses for
LLM clients. Register a host once, at boot:

```ts
import { registerLlmFormHost } from "@/components/fancy/flow-nodes/llm-input/js/host";

registerLlmFormHost({
  generate: async (request) => ({
    fields: await myModel.json(FORM_SCHEMA, request),
  }),
});
```

```php
// Laravel
$this->app->bind(LlmFormHost::class, fn () => new PrismFormHost());
```

**With no host bound the node fails.** Deliberately — a run parked on an empty form is
indistinguishable from one waiting for a person who never comes, and on a queue worker there is
nobody watching to notice.

## What it refuses

A model returns plausible JSON, not correct JSON. Every one of these is rejected **before** the run
parks, while there is still a run to fail — not discovered after somebody has already filled the
form in:

- an empty form, or one over `maxFields`
- a field with no key (its value would be unreachable) or no label
- two fields sharing a key — one silently overwrites the other on submit
- a `select` with no options, which renders as an empty dropdown
- a form missing anything in `requiredKeys`

All of them are reported at once. An author fixing a prompt wants the whole list.

## Retries

`sideEffects: "idempotent"` — regenerating asks the same question again. It does cost another model
call, so scope the retry policy if that matters.

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
import { llmInputRunnableKind } from "@/components/fancy/flow-nodes/llm-input/js/kind";

registerNodeKind(llmInputRunnableKind);
```

`js/kind.ts` is the surface **with** the executor attached. `ui/kind.ts` is the
surface **without** one — import that only when something else executes the node.
