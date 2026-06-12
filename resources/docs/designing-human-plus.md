Most UI design assumes one kind of operator: a human with eyes, a pointer, and intent. **Human+ UX** assumes two — a human *and* an agent — sharing the same surface and trading control fluidly. That second operator doesn't see your pixels or move your cursor; it reads and writes state through MCP. Designing for both at once changes what a good interface is. This page is the design discipline; [Developing for Human+](/docs/developing-human-plus) is the code.

> The full argument lives in the [Human+ UX whitepaper](/docs/human-plus-ux). This page is the practical design playbook.

## The shift in one sentence

You are no longer designing a surface for a person to operate — you are designing a surface that a person **and** an agent operate together, and the design's job is to make their hand-offs legible, safe, and reversible.

## Four design principles

### 1. Make presence visible

When two operators share a surface, each needs to know what the other is doing. A cursor isn't enough — an agent has no cursor. Design for **presence**: who is here (human, agent, which agent), and *what are they touching right now*.

- Highlight the element an agent is currently operating (a glow, a colored outline, an avatar pip).
- Show a short activity line — "Agent is editing the budget formula" — not just a spinner.
- In multi-screen apps, surface presence *across* screens so a human in one view knows an agent is at work in another. `fancy-screens` carries this per-screen via `agentActivity`.

Presence turns "the app did something" into "*that* agent did *that* thing, *there*." That legibility is the whole game.

### 2. Trust, but verify — design the pending state

The most important screen in a Human+ app is the one where an agent has **proposed** a change and a human hasn't accepted it yet. Destructive or human-visible actions should never just *happen* when an agent requests them — they should **stage**.

Design that staged state as a first-class thing, not an afterthought:

- Render the proposal **inline, in context** — a ghosted edit, a highlighted diff, a pending row — so the human sees exactly what will change where.
- Offer **accept / reject** at the granularity of the change (per-hunk, per-field, per-row), not one blanket "OK."
- Make rejection as easy and blameless as acceptance. The human is the editor, not a rubber stamp.

`fancy-diff` is built entirely around this loop (accept/reject per hunk with a live merged result); the bridges expose a `pendingMode` so any surface can stage agent writes for confirmation.

### 3. Agents act on affordances, not pixels

Design your interface so its meaningful actions are **named things**, not visual artifacts an agent has to reverse-engineer. If a capability only exists as "the third button from the left," an agent can't reliably find it. If it exists as a stable, labeled affordance, both operators reach for the same handle.

Practically, when you design a component, ask: *what are the verbs?* A spreadsheet's verbs are paint-cell, insert-row, set-formula. A terminal's are run, write, switch-shell. Name them. Those names become both the human's menu items and the agent's MCP tools — the same vocabulary, one surface.

### 4. Observable activity composes everything

Every meaningful mutation should announce itself — "this element changed, by this actor, to this value." Design assuming that signal exists, because it's what lets presence, undo, coaching, and audit all compose for free. A change a human makes and a change an agent makes should be *the same kind of event*, distinguishable only by actor. When the two are symmetric, the human can undo the agent's work and the agent can build on the human's, without special cases.

## A design checklist

Before a surface is "Human+ ready," walk it twice — once as a human, once as an agent:

- **As a human:** Can I see when an agent is here and what it's doing? When it proposes a change, can I see exactly what and accept/reject precisely? Can I undo its work as easily as my own?
- **As an agent:** Is every action I need a named affordance, not a pixel I have to find? Can I read the current state without scraping? When I write, does the human get a chance to confirm anything irreversible?

If both walks succeed, the surface is shared, not just automated.

## Anti-patterns

- **The silent autopilot.** An agent that changes things with no presence, no proposal, no trace. Fast, terrifying, and impossible to trust. Always design the seam where control changes hands.
- **The screen-scrape target.** A surface with no stable handles, where the only way an agent can act is by simulating clicks on coordinates. Brittle the moment the layout shifts. Design affordances, not targets.
- **Asymmetric undo.** A human change that's reversible but an agent change that isn't (or vice versa). If the two actors aren't symmetric, the shared surface fractures.

## From design to code

These principles aren't aspirational — the suite encodes them as a concrete contract every stateful component meets: controlled state, stable handles, JSON-friendly inputs, a bridgeable surface, activity events, and pending hooks. That's the engineering side, in [Developing for Human+](/docs/developing-human-plus).
