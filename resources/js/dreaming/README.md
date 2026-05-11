# Dreaming

Speculative UI components for the Fancy UI Human+ suite. Everything in
this tree lives on the `dreaming` branch and is meant to graduate to a
real package once it proves out.

## Layout

```
dreaming.tsx                 # mount + router
dreaming/
  Layout.tsx                 # sidebar + outlet
  Sidebar.tsx                # reads DREAMS from manifest.ts
  manifest.ts                # list of every dreamt component
  pages/
    Playground.tsx           # agent lobby + shared whiteboard
    Lobby.tsx                # cards for every dreamt component
    <SlugPascal>Demo.tsx     # one file per dreamt component
```

Route: `/dreaming` → Playground. `/dreaming/lobby` → component lobby.
`/dreaming/<slug>` → the dreamed page.

## How the dreaming loop adds a component

1. Pick a one-line problem to solve that fits the Human+ goal (humans
   and agents trading control fluidly over rich UI).
2. Append a `Dream` entry to `manifest.ts`:
   ```ts
   { slug: "agent-mood-ring", title: "Agent Mood Ring",
     blurb: "Halo around each agent showing confidence + intent.",
     pkg: "agent-integrations", dreamedAt: "2026-05-12" }
   ```
3. Create `pages/AgentMoodRingDemo.tsx` exporting
   `export function AgentMoodRingDemo()` (PascalCase of slug + `Demo`).
4. Commit on `dreaming` branch and push. Don't merge to main until the
   dream is ready to promote into a real package.

## Promoting a dream

When a dreamt component graduates: implement it in the right submodule
package, ship a release, replace the dreaming demo with a thin wrapper
around the real component (or delete it and add a normal entry under
`react-demos/`).
