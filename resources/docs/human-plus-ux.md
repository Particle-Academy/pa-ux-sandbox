**Human+ UX** is the architectural framework behind everything in Fancy UI. It's not a feature, it's a precondition: every component in the library must satisfy two design constraints, not one.

> **The full whitepaper** is at [`docs/human-plus-ux.md`](https://github.com/Particle-Academy/pa-ux-sandbox/blob/main/docs/human-plus-ux.md) in the sandbox repo. The summary below is the high-bandwidth version.

## The two constraints

1. **Authoring surface.** Humans and agents can rapidly compose beautiful, well-functioning applications using the component. Terse props, JSON-friendly inputs, sensible defaults, good types.
2. **Inhabited surface.** The running app embeds agents as first-class environment participants. Agents read and write component state via MCP bridges and stable handles — **not** via DOM screen-scraping, Playwright, or other puppeting tools. The component itself is the agent's affordance, not a target to be operated externally.

If a primitive only satisfies #1, it's a component library entry. If it satisfies both, it's a **Human+ UX primitive** — and that's the only kind Fancy UI ships.

## The component contract

Every stateful or interactive Fancy UI component must meet all of these:

- **Controlled state.** `value` + `onChange`. No internal-only state for anything an agent might want to read or write.
- **Stable handles.** Each interactive element gets a stable identity (`id`, `data-*`, or a selector function in props). Agents should never have to guess DOM structure.
- **JSON-friendly inputs.** Props that are agent-emittable: arrays of objects, primitives, simple discriminated unions. Avoid forcing React children for things the agent needs to populate.
- **Bridgeable surface.** For non-trivial components, a `register<Surface>Bridge(server, { adapter })` exists or could be sketched in one sitting. The bridge exposes MCP tools so agents can drive it. If you can't sketch this, the component isn't done.
- **Observable activity.** Mutations broadcast `AgentActivity` events so presence, undo, and coaching layers compose without each component re-implementing them.
- **Trust-but-verify hooks.** Destructive or human-visible actions support a `pendingMode` / staged-write affordance — agents propose, humans confirm.

Purely visual primitives (static labels, dividers, layout shells) only owe constraint #1. Anything stateful or interactive owes both.

## Why screen-scraping is the wrong floor

The dominant pattern in agent-driven UI today is **screen-scraping**: the agent runs Playwright or a vision model against a browser tab and operates the UI as if it were a human. This works, but it's the wrong floor for three reasons.

1. **It's fragile.** A copy change, a layout reflow, a translation swap — any of these break the agent. The agent is operating against rendered output, not state.
2. **It's lossy.** The agent only knows what's on screen. Form errors, validation rules, internal state — these are invisible until they surface visually.
3. **It's slow.** Round-tripping through a browser to read a cell value is hundreds of milliseconds. Reading the underlying state is microseconds.

Bridges solve all three: the agent talks to state, not pixels. MCP gives us the JSON-RPC framing. The component owns the state. The bridge is the contract.

## How a bridge works

Every bridge has the same shape:

```ts
type WhiteboardBridgeAdapter = {
  getBoard: () => Board;
  setBoard: (updater: (b: Board) => Board) => void;
  // ... plus per-surface getters/setters
};

export function registerWhiteboardBridge(
  server: MicroMcpServer,
  { adapter, agent }: { adapter: WhiteboardBridgeAdapter; agent?: AgentDescriptor },
) {
  server.register({
    name: "whiteboard_add_item",
    schema: z.object({ type: z.enum(["sticky", "shape", "connector"]), ... }),
    handler: async (input) => {
      const id = generateId();
      adapter.setBoard((b) => addItem(b, { id, ...input }));
      return { id };  // stable handle
    },
  });
  // ... more tools
}
```

The agent calls `whiteboard_add_item({ type: "sticky", text: "Q3 OKRs" })` and gets back `{ id: "sticky_abc123" }`. The board updates declaratively (no DOM mutation). The presence layer fires an `AgentActivity` event. The undo stack records the inverse action.

Everything that follows — multiple agents collaborating, an agent activity feed, the trust-but-verify "agent proposed" pending state, the cross-screen presence — falls out of this floor.

## Agents as page authors

The bridge pattern handles **driving** components. But Human+ UX also makes room for agents that **author** entire surfaces — emit a page description, ship it, render. This is the schema-driven mode in `fancy-screens`.

The contract is small. A schema is a tree of `{ type, props, children }`:

```ts
type ScreenSchema = {
  type: string;                                 // component registered via registerSchemaComponent
  props?: Record<string, unknown>;
  children?: Array<ScreenSchema | string>;
};
```

`type` is a component name; `props` get spread; `children` recurse. That's the whole grammar. It's intentionally LLM-friendly — arrays of objects, primitives, simple discriminated unions — so a model that emits JSON can target it cleanly.

### End-to-end: agent emits a page over Inertia

The cleanest Human+ realization of this is "an agent builds a page, the server ships it, the client renders it." With Laravel + Inertia:

**PHP** — the controller hands the agent the user context, gets back a schema, ships it as an Inertia prop:

```php
public function show(User $user)
{
    $schema = app(AgentPlanner::class)->buildPageFor($user);

    return Inertia::render('AgentPage', [
        'schema' => $schema,
    ]);
}
```

**The schema** the agent might emit:

```php
[
  'type' => 'Card',
  'props' => ['variant' => 'elevated'],
  'children' => [[
    'type' => 'Card.Body',
    'children' => [
      ['type' => 'Heading', 'props' => ['level' => 2], 'children' => ['Welcome back, '.$user->name]],
      ['type' => 'Text', 'children' => ['Three tasks need your attention today.']],
      ['type' => 'Button', 'props' => ['color' => 'violet'], 'children' => ['Review']],
    ],
  ]],
]
```

**React** — the page is one line:

```tsx
import { InertiaSchemaScreen } from "@particle-academy/fancy-inertia";

export default function AgentPage() {
  return <InertiaSchemaScreen />;
}
```

`InertiaSchemaScreen` reads `usePage().props.schema` and renders through `<Screen schema={...}>`. Every component the schema references must be in the schema registry — `registerFancyComponents()` (called once at app boot) wires up the common react-fancy ones automatically.

### Why this works where SDUI failed

Server-Driven UI (Lona, Bloks, RemoteUI, …) has a long history of failure when **designers or PMs** are the schema authors — the schema ends up more complex than the component would have been. The cost/benefit flips when the schema author is an **LLM**: JSON is a great codegen target, and the agent can re-emit the schema as context changes (a re-prompt is essentially a re-render).

The same surface that lets a designer "compose UI in JSON" (and fail) lets a model "compose UI in JSON" (and succeed). Same machinery, different author, very different outcome.

### Trust-but-verify on agent-authored pages

Pages emitted by an agent should still respect the contract. If the schema includes a destructive action, that Button's `pendingMode` should be on by default — the page lands rendered, the human reviews, the human confirms. The agent proposes the page; the page proposes its mutations; the human ratifies both. No part of this requires special UI — the existing `pendingMode` affordance covers it.

## Implications for designers and engineers

If you're designing or building on top of Fancy UI, the framework changes how you think about a few things:

- **Stop modeling "the user."** Model "the participant." Sometimes that participant is a human; sometimes it's an agent. The surface treats them the same.
- **Controlled state isn't optional.** Anything an agent might want to read or write needs to live in props, not internal state. This is a small habit shift with big payoff.
- **Stable identity matters everywhere.** Don't generate ids on render. Don't rely on DOM order. The agent needs a handle.
- **Embrace the staged-write pattern.** Destructive actions go through `pendingMode` — the agent proposes, the human confirms. This is how trust scales.

## Further reading

- The full whitepaper: [`docs/human-plus-ux.md`](https://github.com/Particle-Academy/pa-ux-sandbox/blob/main/docs/human-plus-ux.md)
- How a bridge is shaped end-to-end: [MCP servers](/docs/mcp)
- The schema grammar in detail: [fancy-screens SchemaMode](https://github.com/Particle-Academy/fancy-screens/blob/main/docs/SchemaMode.md)
- The runtime stack that backs the bridges: `@particle-academy/agent-integrations` (browse [/packages/agent-integrations](/packages/agent-integrations))
