Most component-library docs stop at "here's a button." This section is the other half: how you assemble the primitives into a real application — the shell, the navigation, the motion, the responsive behavior — and how you do all of it so that **humans and agents inhabit the same surface**. That last part is what makes building with Fancy different, and it runs through every page here.

If you've read [Human+ UX](/docs/human-plus-ux), this is where the philosophy becomes practice.

## The stack we build on

Fancy UI doesn't prescribe a backend, but the showcase you're reading — and these tutorials — assume the canonical **Fancy Core** stack:

- **Laravel** for the server, routing, auth, and data.
- **Inertia.js** ([`@particle-academy/fancy-inertia`](/docs/page-transitions)) as the React adapter — pages are server-routed, rendered client-side, no API layer to hand-write.
- **React 19 + Tailwind v4** ([`@particle-academy/react-fancy`](/packages/react-fancy)) for the components and design tokens.
- **`@particle-academy/fancy-query`** for server-state (TanStack Query + Inertia hydration + Echo invalidation) when you need live data.

You can use react-fancy in any React app. But the integration tutorials below lean on Inertia, because the seams between server-routed pages and a component kit — layouts, transitions, forms, SSR — are exactly where most teams lose time, and where `fancy-inertia` earns its place.

## The inner loop

The packages are independent npm/Packagist releases, so the development loop is the same one any external consumer runs:

```bash
# iterate on a single package in isolation
cd react-fancy && npm run dev

# pull a released change into your app
npm update @particle-academy/react-fancy
# or, for the copy-source path:
npx @particle-academy/fancy-ui add card
```

There are no source aliases — what you build locally is byte-for-byte what ships. See [Installation](/docs/installation) for both consumption models.

## What's in this section

| Tutorial | What you'll build |
|---|---|
| [Layouts & app shell](/docs/layouts) | A persistent shell — navbar, sidebar, footer — that survives navigation, plus multi-screen apps with `fancy-screens`. |
| [Page transitions](/docs/page-transitions) | Animated navigation with `fancy-inertia`'s enter/exit crossfade, a live transition picker, and reduced-motion support. |
| [Mobile & responsive](/docs/mobile) | Tailwind v4 breakpoints, a collapsing mobile nav, touch targets, and SSR-safe rendering of client-only components. |
| [Designing for Human+](/docs/designing-human-plus) | The **design** discipline: presence, trust-but-verify, and affordances for surfaces two kinds of operators share. |
| [Developing for Human+](/docs/developing-human-plus) | The **engineering** discipline: controlled state, stable handles, bridges, and activity events — the component contract, in code. |

## A note on order

Read [Layouts](/docs/layouts) first — everything else assumes you have a shell. [Page transitions](/docs/page-transitions) and [Mobile](/docs/mobile) are independent after that. The two **Human+** pages are the capstone: they're not optional polish, they're the reason the suite exists. Every tutorial here ends by pointing back at them, because a layout, a transition, or a responsive breakpoint that an agent can't perceive or operate is only half-built.
