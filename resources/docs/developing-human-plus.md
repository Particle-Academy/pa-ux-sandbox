[Designing for Human+](/docs/designing-human-plus) is the *why* and the *what*. This is the *how* — the contract every stateful Fancy UI component meets, expressed in code, and the steps to make a surface of your own inhabitable by an agent.

## The component contract

A purely visual component (a label, a divider) owes one thing: it's pleasant to author with. Anything **stateful or interactive** owes six:

1. **Controlled state.** `value` + `onChange`. No internal-only state for anything an agent might read or write. If the only way to know a component's state is to look at it, an agent can't.
2. **Stable handles.** Every interactive element has a stable identity — an `id`, a `data-*` attribute, or a selector prop. Agents never guess DOM.
3. **JSON-friendly inputs.** Agent-emittable props: arrays of objects, primitives, simple discriminated unions. Avoid forcing React children for things an agent must populate.
4. **A bridgeable surface.** A `register<Surface>Bridge(server, { adapter })` exists (or could be sketched in one sitting) exposing MCP tools.
5. **Observable activity.** Mutations broadcast an `AgentActivity` event, so presence, undo, and coaching compose for free.
6. **Trust-but-verify hooks.** Destructive or human-visible actions support a `pendingMode` — agents propose, humans confirm.

The first three make a component **authorable**. The last three make it **inhabitable**. You need both.

## Start controlled

Everything flows from controlled state. A toggle an agent can drive is one whose truth lives in props:

```tsx
// ❌ inhabitable by no one
function Switch() {
  const [on, setOn] = useState(false);
  return <button onClick={() => setOn(!on)} />;
}

// ✅ value + onChange — readable and writable by a human OR an agent
function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <button data-fancy-switch aria-pressed={value} onClick={() => onChange(!value)} />;
}
```

The `data-fancy-switch` handle and the `value` prop are what a bridge reads and writes — never the rendered pixels.

## Write a bridge

A bridge is the MCP face of a surface. It never touches the DOM; it reads and writes through a host-provided **adapter**, so it works with any host that can supply the getters/setters. The pattern, from `@particle-academy/agent-integrations`:

```ts
import { registerTerminalBridge } from "@particle-academy/agent-integrations";

const bridge = registerTerminalBridge(server, {
  adapter: {
    getBuffer: () => term.current.getBuffer(),   // read
    write: (data) => term.current.write(data),   // mutate
    setShell: (id) => term.current.setShell(id),  // mutate
    listShells: () => shells,
  },
  pendingMode: true,             // stage destructive writes for confirmation
  onPending: (cmd) => showConfirm(cmd),
});
```

That call registers `terminal_read`, `terminal_write`, `terminal_run`, `terminal_set_shell`, … as MCP tools. An agent now operates the terminal through the *same handle a human's keystrokes flow through* — no scraping.

Writing your own follows a fixed shape (see the [MCP guide](/docs/mcp) and the existing bridges for `whiteboard`, `flow`, `sheets`, `code`, `charts`, `slides`, `screens`, `terminal`):

```ts
export function registerThingBridge(server, { adapter, agent, pendingMode }) {
  ensureUndoToolsRegistered(server);        // installs agent_undo / agent_redo / agent_history
  const reg = (name, schema, handler, isMutation, resolveTarget) => { /* … */ };

  reg("thing_read", { /* … */ }, () => textResult(adapter.get()), false);
  reg("thing_set",  { /* … */ }, (a) => { adapter.set(a.value); ... }, true, resolveTarget);

  return { id: "thing", title: "Thing", dispose() { /* … */ } };
}
```

Two rules carry most of the weight:

- **Wrap mutations with activity.** `wrapToolWithActivity` makes every write broadcast an `AgentActivity` event with the actor and the target element. That single event powers presence highlighting, the undo stack, and audit — you get them for free by emitting it.
- **Read tools take no resolver; mutation tools do.** The `resolveTarget` tells the presence layer *which element* an action touched, so the UI can light it up.

## Stage, don't execute: `pendingMode`

For anything irreversible or human-visible, turn on `pendingMode`. Mutations then don't run — they **stage**, return a pending id, and fire `onPending`. A human confirms via a `*_confirm` tool or a host button; the bridge executes only then.

```ts
// pendingMode on → terminal_run("rm -rf build") returns:
//   "Staged run (id t1) — awaiting human confirmation"
// then bridge.confirm("t1") actually runs it.
```

This is the trust-but-verify loop from the [design guide](/docs/designing-human-plus), made literal. Design the staged state well; wire it here.

## Wire the bridge through your build

A bridge that isn't exported is invisible. For a package, that's four edits (this trips everyone up once):

1. Re-export `registerThingBridge` + its adapter/option types from `src/index.ts`.
2. Add the entry to `tsup.config.ts` (both `entry` and the DTS `entry`); mark optional peers `external`.
3. Add the `./bridges/thing` subpath to `package.json` `exports` (+ the peer dep).
4. Bump and ship. Skipping any one lands the bridge in source but uninstallable.

## Presence and undo, for free

Because every mutation is a symmetric `AgentActivity` event, the cross-cutting layers compose without per-component work:

- **Presence:** mount `<ScreensActivityBridge>` once near the root and `fancy-screens` lights up the element an agent is touching.
- **Undo:** `agent_undo` / `agent_redo` / `agent_history` are installed by `ensureUndoToolsRegistered` — a human can undo an agent's edit and an agent can undo a human's, through one stack.

## The test that matters

Don't ask "does it look right?" Ask: **can an agent operate this without seeing it?** Stand up the bridge, drive the surface over MCP, and confirm you can read its state and change it through handles alone — no Playwright, no coordinates. If you can, it's Human+. If you can't, it's a screen-scrape target wearing a nice theme.

Start from the [MCP guide](/docs/mcp) to connect an agent to a running surface, and the [Agent Playground](/agent-playground) to drive one live.
