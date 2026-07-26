# Human+ UX

**An architectural framework for UI built to be inhabited by both humans and agents.**

Particle Academy · Fancy UI · 2026

---

## Premise

Most "AI-enabled" applications today follow one of two patterns. They either:

1. **Wrap the app in an agent** — the agent watches the user's screen, drives the mouse and keyboard, reasons over screenshots. Tools like Playwright, Computer Use, and browser-control SDKs sit *outside* the app and puppet it. The app is treated as a black box the agent must interpret.

2. **Wrap an agent in the app** — a chat sidebar, a "ask AI" button, a single inline prompt. The agent answers questions about the app but cannot meaningfully change its state without going back through a human.

Both patterns leave value on the table. The first is brittle, slow, and expensive — a screen-scraping agent is one DOM change away from breaking, one screenshot tax away from being uneconomic, and it never composes well with the human who is also trying to use the app. The second is conservative: it admits the agent into the room but won't give it a seat at the table.

**Human+ UX** is the alternative. It is the position that a modern application is a *shared environment* whose first-class participants are humans *and* agents — both reading from and writing to the same user interface, in real time, with no special privilege for either, trading control fluidly throughout a task.

Fancy UI's interactive surfaces are built to that standard. The suite itself is broader — 64 packages, roughly half of them headless — but wherever it owns a UI, this is the bar that UI is held to.

---

## The two design constraints

Every component in Fancy UI must satisfy two constraints. Not one. Both. If either is missing, the component does not belong in the library.

### Constraint 1 — Authoring surface

Humans and agents can rapidly compose beautiful, well-functioning applications using the component.

Concretely: terse props, JSON-friendly inputs, sensible defaults, good TypeScript types. The component is small to learn, easy to type-check, hard to misuse. An LLM that has read its prop signature once can use it correctly.

Why this matters for *agents* (and not just humans): a Human+ application is often partly authored by an agent. A user says "give me a dashboard with last week's revenue and a list of churn-risk customers" and the agent emits JSX. If the component's API is intricate, the agent burns context window remembering it; if it requires bespoke React children for things that could be plain data, the agent can't emit it as structured output. Terse, data-first APIs let agents author UI as fluently as they author prose.

### Constraint 2 — Inhabited surface

The running application embeds agents as first-class environment participants. Agents can read and write component state directly, via MCP bridges and stable handles, **not** via DOM screen-scraping, vision models, or Playwright-style puppeting.

This is the constraint most UI libraries ignore. Once a component is rendered, it should be ready for an agent to *live inside the app* — to know what's on screen, to manipulate it precisely, to leave a trace another participant can observe, and to do all of this without external tooling.

Concretely: the component's state is controllable from outside, its interactive elements have stable identities, every mutation is observable, and there exists a bridge — a registration function that exposes the component's verbs as MCP tools — that an agent can call.

The component is the agent's affordance. The agent is not on the outside trying to drive it; the agent is on the inside, where the user is, working with the same tools.

---

## Why this is better than DOM puppeting

The status-quo answer to "let an agent operate a UI" is to put a browser-control library between the agent and the app. There are reasons people pick this:

- It works on apps the agent's author doesn't control.
- It's a single integration that covers many apps.
- It looks like the universal solution.

It is also expensive, brittle, slow, and adversarial. Concretely:

| Concern | DOM puppeting (Playwright, Computer Use) | Human+ UX |
|---|---|---|
| **Latency** | Each action ≈ a screenshot + a vision pass + a click | Each action ≈ a JSON-RPC call; sub-100ms |
| **Cost** | Every interaction pays vision-model tokens | Tools are typed; no vision needed in the hot path |
| **Robustness** | Breaks on CSS changes, language switches, A/B tests | API contract is explicit; refactors fail loudly at types |
| **Composability with the human** | Agent and human compete for the cursor | Both participate; presence + undo make turns visible |
| **Trust** | Black-box screenshots; the human cannot audit what the agent "saw" | Every tool call is logged and undoable |
| **Authorization** | Agent has whatever the human has, on every page | Bridges scope what the agent can do per surface |
| **Stack** | A second runtime (a browser) inside or beside the app | The app itself |

Human+ UX trades universality for fidelity. The Human+ agent only works in apps built with the Human+ contract — but inside such an app, it works orders of magnitude better.

The bet Fancy UI is making is that the value of *first-class agent inhabitation in your own product* exceeds the value of *low-fidelity third-party agent operation*.

---

## The component contract

Every Fancy UI component meets the following. This list is the contract: a component that fails any item is not a Fancy UI component.

### Controlled state

The component exposes its meaningful state via `value` + `onChange`, or analogous controlled props. Nothing the agent might want to read or write is locked inside the component's internal `useState`.

```tsx
// Good — agent can read the grid; setting agentGrid drives the UI
<TimeGrid value={grid} onChange={setGrid} rows={DAYS} cols={HOURS} />

// Bad — internal state, agent can only observe via screenshots
<TimeGrid defaultValue={defaultGrid} onChange={trackChange} />
```

### Stable handles

Interactive elements have stable identities. The component does not require the agent to guess at DOM structure or rely on text labels. Stable handles take the form of `id` props, `data-*` attributes, or a selector function:

```tsx
<TriageStack
  items={proposals}
  itemId={(p) => p.proposalId}      // explicit, stable
  onAccept={(p) => commit(p)}
/>
```

The bridge can address any element by the same id the agent sees, with no fuzzy matching.

### JSON-friendly inputs

Props the agent might emit are plain data: arrays of objects, primitives, simple discriminated unions. The component does not force React children where structured data would serve:

```tsx
// Good — agent can emit this as a JSON object literal
<MilestoneEmpty
  icon="✓"
  title="Inbox zero."
  stats={[{ label: "Next digest", value: "tomorrow, 9 AM" }]}
  primaryAction={{ label: "Tune", onClick: tune }}
/>

// Worse — agent must emit JSX, can't be expressed as data
<MilestoneEmpty>
  <Icon>✓</Icon>
  <Title>Inbox zero.</Title>
  <Stat label="Next digest">tomorrow, 9 AM</Stat>
</MilestoneEmpty>
```

### Bridgeable surface

For any non-trivial component, a registration function exists (or can be sketched in one sitting) that exposes the component's verbs as MCP tools. By convention these live under `agent-integrations/src/bridges/<surface>.ts`:

```ts
import { registerGroupedTrayBridge } from "@particle-academy/agent-integrations/bridges/grouped-tray";

registerGroupedTrayBridge(server, {
  adapter: {
    list:    () => state.items,
    dismiss: (id) => setState((s) => removeById(s, id)),
    snooze:  (id, until) => setState((s) => snoozeById(s, id, until)),
    muteGroup: (key) => setState((s) => mute(s, key)),
  },
  agent: { id: "claude", name: "Claude" },
});
```

The bridge is where the component meets MCP. If the component is so internal that you cannot imagine what tools its bridge would register, the component is not done.

### Observable activity

Every mutation broadcasts an `AgentActivity` event so presence, undo, and coaching layers can compose without each component re-implementing them. A bridge that wraps a mutation tool in `wrapToolWithActivity(...)` gets this for free.

The reward for paying this small tax: as soon as a component is bridged, it automatically plays well with `<AgentPanel>`, `<AgentCursor>`, `<AgentActivityHighlight>`, the cross-screen activity dock, the per-agent undo stack, and any future Human+ infrastructure.

### Trust-but-verify hooks

For actions that are destructive, send things to humans, or move money, the component supports a *staged-write* mode. The agent's call produces a proposal; the human's approval converts the proposal into a committed effect. The same component renders both states without the consumer having to fork.

This is the difference between *"the bot replied to my customer with nonsense"* and *"the bot drafted three replies, I picked one in 4 seconds."* It is also the legal substrate of human-supervised AI.

---

## What this enables

When every component in the stack meets the contract, the application as a whole acquires properties that are otherwise expensive to build:

### Presence

Humans and agents see each other on the same surface. The presence layer is a single React provider; every bridged component reports activity, every screen aggregates it, every `<Screen>` div picks up an `agent-focused-element` class automatically.

### Undo

Per-agent undo stacks compose across the whole app. The agent ran a tool, the human disagreed, one keystroke reverses it. Because activity is observable and bridges are typed, undo is a generic infrastructure, not a per-feature implementation.

### Sharing

A user pastes a session URL into Claude Code and instantly hands their running browser session to an external agent process. The relay broker is a Node daemon; the wire protocol is documented; the browser remains the source of truth. No screen-share, no special permissions, no second runtime.

### Auditability

Every agent action is a typed MCP tool call. There is no opaque vision step in the middle. The product, the customer, and the regulator can all read exactly what the agent did and why.

### Coachable defaults

A `<ClassifierChip>` whose `onReclassify` writes back to the agent gives the user a continuously-improving classifier with no separate training UI. The override is the training signal.

---

## What this does not do

Human+ UX is not the right shape for every problem. It deliberately leaves four things off the table:

1. **Universal third-party app control.** If the goal is *"let an agent operate any web app, including apps you don't own"*, Human+ UX is not for that. DOM puppeting is. Fancy UI is the position you take when *you own the app*.

2. **Replacement for accessibility.** Stable handles + observable activity overlap with ARIA but do not replace it. A Human+ app should still pass an accessibility audit; the contract makes that easier, not optional.

3. **Replacement for authorization.** Bridges scope what an agent can do per surface, but authentication, RBAC, and audit-logging still live in the backend. The contract is about *legibility*, not *trust*.

4. **A pretext for skipping good UI.** A component that is bridgeable but ugly is not done. The first constraint — that humans and agents can build *beautiful* applications — is not optional. Fancy UI's name is not ironic.

---

## How Fancy UI implements it

Fancy UI is a suite of small, independently released packages — 64 of them, 47
TypeScript and 16 PHP, each its own repository, pinned together by the envelope
rather than living in a monorepo. Roughly half are headless: server capabilities,
engines and tooling that render nothing. The table below covers the *interactive*
packages — the ones that own a UI surface, and so the ones the contract applies
to:

| Package | Surface | Why it's Human+-shaped |
|---|---|---|
| **react-fancy** | Primitives — buttons, forms, lists, prompt input, code blocks | Every primitive is controlled; sensible `id`/`data-*` defaults |
| **fancy-whiteboard** | Free-form canvas with stickies, shapes, drawings | Items are addressable by `id`; bridge exposes CRUD tools |
| **fancy-flow** | Node-graph editor for workflows | Nodes and edges are JSON; bridge can author or rewire them |
| **fancy-sheets** | Spreadsheet with formulas | Cells addressable by A1 notation; bridge speaks the same vocabulary |
| **fancy-code** | Code editor surface | Cursor + selection are controlled; bridge can read/insert/replace |
| **fancy-echarts** | Charts | Data and config are JSON; bridge can swap series, axes, marks |
| **fancy-screens** | Multi-screen application shell | Every screen reports `agentActivity`; cross-screen presence is free |
| **fancy-3d** | 3D scene authoring (Babylon adapter, DOM adapter) | Scenes are JSON; agents author rich 3D apps the same way they author HTML |
| **agent-integrations** | The Human+ runtime — MicroMcpServer, bridges, presence, sharing | The glue that turns the above into a participatory environment |

The dependency direction is one-way: surface packages depend on nothing agent-aware; `agent-integrations` depends on the surface packages and provides the bridges. This means *you can use any Fancy UI surface package without adopting the Human+ stack* — but the day you want to, the bridge is already written.

---

## How to evaluate whether something is Human+-ready

A short checklist. If any answer is "no", the component, demo, or package is not yet ready to ship as Fancy UI.

1. Can the agent *read* the component's relevant state without taking a screenshot? *(Controlled state.)*
2. Can the agent address any interactive element by a stable id the user can also see in the DOM? *(Stable handles.)*
3. Can the agent emit the component's props as a plain JSON object? *(JSON-friendly inputs.)*
4. Is there a bridge — or could you sketch one in 15 minutes — that wraps the component's verbs as MCP tools? *(Bridgeable surface.)*
5. When the component mutates, does it (or its bridge) broadcast an activity event? *(Observable activity.)*
6. If the component's action is destructive or visible to a third party, is there a staged-write affordance? *(Trust-but-verify.)*
7. Is the component, used alone by a human, *still beautiful and ergonomic*? *(The first constraint.)*

Seven yeses. Anything less, and we're not yet doing Human+ UX.

---

## What's next

We are building Fancy UI in public on the [`Particle-Academy/pa-ux-sandbox`](https://github.com/Particle-Academy/pa-ux-sandbox) repository. Every package ships independently to npm or Packagist; the sandbox itself is the integration environment. The `dreaming` branch is the speculative scratchpad where new primitives are proposed before they earn their place in a package.

If you want to build an app where agents and humans share the same UI, we'd like to hear what you're building. Open an issue, or reach out at [particle.academy](https://particle.academy).

— Particle Academy
