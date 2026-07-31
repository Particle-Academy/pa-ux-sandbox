# ui_effect

`@particle-academy/ui_effect` — change how a **live surface** looks, from a workflow.

One of the nodes in [`fancy-flow-nodes`](../../README.md). `fancy-cli` **copies** it into your
project — source you can read, edit and diff, not a dependency in `node_modules`:

```bash
npx fancy-cli@latest add node @particle-academy/ui_effect
```

```ts
import { uiEffectKind } from "@/components/fancy/flow-nodes/ui-effect/ui/kind";
import { registerNodeKind } from "@particle-academy/fancy-flow/engine";

registerNodeKind(uiEffectKind);
```

In a browser that is the entire setup.

---

## What it does

One node, six operations, and a duration.

| Operation | `value` | `name` | What it does |
|---|---|---|---|
| `add-class` | class list | — | Adds classes. Idempotent. |
| `remove-class` | class list | — | Removes classes. Idempotent. |
| `toggle-class` | class list | — | Toggles. **Not** idempotent — see *Retries*. |
| `replace-class` | new class | class to replace | Swaps one for another. |
| `set-var` | value | `--custom-property` | Sets a CSS variable. **This is a theme change.** |
| `set-style` | value | CSS property | Sets an inline style. |

`durationMs` reverts the effect afterwards. That is deliberately the only animation concept in the package: a pulse is `add-class` + `1200`. Six ops plus a timer beat a fixed menu of presets nobody can extend.

**Reverting puts things back the way they were** — not the way you'd guess. `add-class` removes only the classes it actually added; `set-var` restores the previous value rather than deleting the property. An effect that leaves the page in a state nobody asked for is worse than one that never ran.

### Examples

```jsonc
// Light up a card for 1.2 seconds.
{ "target": "deal-card", "op": "add-class", "value": "ff-fx-glow", "durationMs": 1200 }

// Re-theme the whole page.
{ "target": "page", "op": "set-var", "name": "--fa-accent", "value": "#a855f7" }

// Flip to dark.
{ "target": "page", "op": "replace-class", "name": "theme-light", "value": "theme-dark" }
```

## Targeting

`target` is a **stable handle**, or `page` for the document root.

Handles, not selectors, are the contract — the [Fancy component contract](https://ui.particle.academy/docs/human-plus-ux) is explicit that agents never guess DOM. The bundled DOM host resolves in this order:

1. `page` / `:root` / `document` → `document.documentElement`
2. `[data-fancy-id="<handle>"]`
3. the string as a CSS selector — last, and only as an escape hatch

**A target that matches nothing throws.** It would be easy to no-op, and that is exactly the trap: the run would report success having styled nothing.

## Hosts

The node never touches the DOM itself. It resolves an *intent* and hands it to a host — the same "shuttle, not an engine" arrangement fancy-flow uses for LLM clients. That is what lets the identical graph run in three places:

```ts
import { registerUiEffectHost } from "@/components/fancy/flow-nodes/ui-effect/js/host";
import { createDomUiEffectHost } from "@/components/fancy/flow-nodes/ui-effect/js/dom";

// Browser: automatic. Register explicitly only to pass options.
registerUiEffectHost(createDomUiEffectHost({ resolve: (h) => myHandleRegistry.get(h) }));

// Queue worker with a browser attached over a relay.
registerUiEffectHost({ apply: (effect) => relay.send("ui_effect", effect) });

// Test: record and assert.
const applied = [];
registerUiEffectHost({ apply: (e) => applied.push(e) });
```

**With no host and no document, the node fails.** Deliberately. The tempting implementation shrugs when there is no DOM — and then a workflow that "pulses the card" runs on a worker, styles nothing, and reports `ok: true`. Nothing throws, nothing is logged, and the run list says success.

## Effect classes (optional)

```ts
import "@/components/fancy/flow-nodes/ui-effect/ui/effects.css";
```

Gives you `ff-fx-glow`, `ff-fx-pulse`, `ff-fx-flash`, `ff-fx-shake`, tinted by `--ff-fx-color`. Nothing in the node depends on this file — your own class beats any of them. Every animation respects `prefers-reduced-motion`, keeping the signal and dropping the motion.

## Retries

The manifest declares `sideEffects: "unsafe-to-replay"`, because durable runs retry and `toggle-class` flips back on a second attempt.

The other five ops **are** idempotent. If your graph only adds, removes, replaces or sets, replaying it is safe — the declaration covers the kind as a whole, which is the honest thing for a host reading the manifest to see.

## Requirements

- `@particle-academy/fancy-flow` >= 0.30.0 (peer)
- TypeScript runtime only for now. The manifest declares `runtimes: { ts }` and nothing else, so a PHP host sees that before installing rather than discovering it when a run fails.

## License

MIT © Particle Academy

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
import { uiEffectRunnableKind } from "@/components/fancy/flow-nodes/ui-effect/js/kind";

registerNodeKind(uiEffectRunnableKind);
```

`js/kind.ts` is the surface **with** the executor attached. `ui/kind.ts` is the
surface **without** one — import that only when something else executes the node.
